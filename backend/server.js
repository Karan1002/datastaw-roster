
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Employee from "./models/Employee.js";
import Team from "./models/Team.js";

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



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
