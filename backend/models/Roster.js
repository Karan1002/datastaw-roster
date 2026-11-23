
import mongoose from "mongoose";

const rosterSchema = new mongoose.Schema(
    {
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
        },
        assignments: [
            {
                employee: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Employee",
                    required: true,
                },
                date: {
                    type: Date,
                    required: true,
                },
                shift: {
                    type: String,
                    enum: ["Morning", "Evening", "Night", "Weekly Off"],
                    required: true,
                },
            },
        ],
    },
    { timestamps: true }
);

const Roster = mongoose.model("Roster", rosterSchema);

export default Roster;
