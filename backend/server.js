
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Employee from "./models/Employee.js";
import Team from "./models/Team.js";
import Leave from "./models/Leave.js";
import Roster from "./models/Roster.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas Connected Successfully!"))
    .catch((error) => console.log("MongoDB Connection Error:", error));

// Home API
app.get("/", (req, res) => {
    res.send("DataStraw Smart Roster API is running!");
});

// Add Employee API
app.post("/api/employees", async (req, res) => {
    try {
        const employee = await Employee.create(req.body);

        res.status(201).json({
            message: "Employee added successfully",
            employee,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

// Get All Employees API
app.get("/api/employees", async (req, res) => {
    try {
        const employees = await Employee.find();

        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});


// Update Employee API
app.put("/api/employees/:id", async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({
            message: "Employee updated successfully",
            employee,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete Employee API
app.delete("/api/employees/:id", async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Create Team API
app.post("/api/teams", async (req, res) => {
    try {
        const team = await Team.create(req.body);

        res.status(201).json({
            message: "Team created successfully",
            team,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Teams API
app.get("/api/teams", async (req, res) => {
    try {
        const teams = await Team.find().populate("employees");
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Team API
app.delete("/api/teams/:id", async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        res.json({ message: "Team deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Create Leave API
app.post("/api/leaves", async (req, res) => {
    try {
        const leave = await Leave.create(req.body);

        res.status(201).json({
            message: "Leave request created successfully",
            leave,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Leaves API
app.get("/api/leaves", async (req, res) => {
    try {
        const leaves = await Leave.find().populate("employee");
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.put("/api/leaves/:id", async (req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!leave) {
            return res.status(404).json({ message: "Leave not found" });
        }

        res.json({
            message: "Leave status updated successfully",
            leave,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete("/api/leaves/:id", async (req, res) => {
    try {
        const leave = await Leave.findByIdAndDelete(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: "Leave not found" });
        }

        res.json({ message: "Leave deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Generate Monthly Roster
app.post("/api/rosters/generate", async (req, res) => {
    try {
        const { month, year } = req.body;

        if (!month || !year || month < 1 || month > 12) {
            return res.status(400).json({
                message: "Valid month and year are required",
            });
        }

        const employees = await Employee.find({ status: "Active" });

        if (employees.length === 0) {
            return res.status(400).json({
                message: "Please add active employees first",
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const approvedLeaves = await Leave.find({
            status: "Approved",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
        });

        const shifts = ["Morning", "Evening", "Night"];
        const assignments = [];

        for (let day = 1; day <= endDate.getDate(); day++) {
            for (let i = 0; i < employees.length; i++) {
                const date = new Date(year, month - 1, day);

                const onLeave = approvedLeaves.some((leave) => {
                    return (
                        leave.employee.toString() === employees[i]._id.toString() &&
                        date >= new Date(leave.startDate) &&
                        date <= new Date(leave.endDate)
                    );
                });

                if (onLeave) continue;

                assignments.push({
                    employee: employees[i]._id,
                    date,
                    shift: shifts[(day + i) % 3],
                });
            }
        }

        const roster = await Roster.findOneAndUpdate(
            { month, year },
            { month, year, assignments },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({
            message: "Monthly roster generated successfully!",
            roster,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Monthly Roster
app.get("/api/rosters", async (req, res) => {
    try {
        const { month, year } = req.query;

        const roster = await Roster.findOne({ month, year })
            .populate("assignments.employee");

        res.json(roster || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
