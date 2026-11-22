
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
    {
        teamName: {
            type: String,
            required: true,
            unique: true,
        },

        teamLeader: {
            type: String,
            required: true,
        },

        brand: {
            type: String,
            required: true,
        },

        process: {
            type: String,
            required: true,
        },

        employees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Employee",
            },
        ],

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    { timestamps: true }
);

const Team = mongoose.model("Team", teamSchema);

export default Team;
