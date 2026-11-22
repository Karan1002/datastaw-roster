
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        phone: {
            type: String,
        },

        brand: {
            type: String,
            required: true,
        },

        process: {
            type: String,
            required: true,
        },

        pod: {
            type: String,
        },

        role: {
            type: String,
            default: "Employee",
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
