
import dotenv from "dotenv";
import mongoose from "mongoose";
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import Employee from "./models/Employee.js";
import Team from "./models/Team.js";

dotenv.config();

const excelPath = fileURLToPath(
    new URL("./employees data.xlsx", import.meta.url)
);

async function main() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in backend/.env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected Successfully!");

        // Read Excel file
        const workbook = XLSX.readFile(excelPath);

        const employeeRows = XLSX.utils.sheet_to_json(
            workbook.Sheets["Employees"],
            { defval: "" }
        );

        const teamRows = XLSX.utils.sheet_to_json(
            workbook.Sheets["Teams"],
            { defval: "" }
        );

        if (!employeeRows.length || !teamRows.length) {
            throw new Error("Employees or Teams sheet is empty or missing.");
        }

        const employeeMap = new Map();

        // Import Employees
        for (const row of employeeRows) {
            const employeeId = String(row["Employee ID"]).trim();
            const name = String(row["Name"]).trim();
            const email = String(row["Email"]).trim().toLowerCase();

            if (!employeeId || !name || !email) {
                console.log("Skipping incomplete employee:", employeeId);
                continue;
            }

            const employee = await Employee.findOneAndUpdate(
                { employeeId },
                {
                    $set: {
                        employeeId,
                        name,
                        email,
                        phone: String(row["Phone"] || ""),
                        brand: String(row["Brand"] || ""),
                        process: String(row["Process"] || ""),
                        pod: String(row["Pod"] || ""),
                        role: String(row["Role"] || "Employee"),
                        status: "Active"
                    }
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            employeeMap.set(employeeId, employee);
            console.log("Employee imported:", employee.name);
        }

        // Import Teams
        for (const row of teamRows) {
            const teamName = String(row["Team Name"]).trim();
            const leaderId = String(
                row["Team Leader Employee ID"]
            ).trim();

            const leader = employeeMap.get(leaderId);

            if (!leader || !teamName) {
                console.log("Skipping team:", teamName);
                continue;
            }

            const members = employeeRows
                .filter(r => String(r["Team"]).trim() === teamName)
                .map(r => employeeMap.get(String(r["Employee ID"]).trim()))
                .filter(Boolean);

            await Team.findOneAndUpdate(
                { teamName },
                {
                    $set: {
                        teamName,
                        teamLeader: leader.name,
                        brand: String(row["Brand"]),
                        process: String(row["Process"]),
                        employees: members.map(emp => emp._id),
                        status: "Active"
                    }
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            console.log("Team imported:", teamName);
        }

        console.log("--------------------------------");
        console.log("IMPORT COMPLETED SUCCESSFULLY!");
        console.log("Employees:", employeeMap.size);
        console.log("Teams:", teamRows.length);
        console.log("--------------------------------");

    } catch (error) {
        console.error("IMPORT ERROR:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB Disconnected");
    }
}

main();
