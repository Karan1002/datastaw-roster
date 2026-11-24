import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
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
      enum: [
        "Morning",
        "Evening",
        "Night",
        "Weekly Off",
        "Public Holiday",
        "Leave",
      ],
      required: true,
    },

    brand: {
      type: String,
      default: "",
    },

    process: {
      type: String,
      default: "",
    },

    pod: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    manuallyEdited: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const conflictSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "Coverage Gap",
    },

    date: Date,
    brand: String,
    process: String,

    message: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["Warning", "Critical"],
      default: "Warning",
    },
  },
  { _id: true }
);

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

    assignments: {
      type: [assignmentSchema],
      default: [],
    },

    conflicts: {
      type: [conflictSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["Generated", "Needs Review"],
      default: "Generated",
    },
  },
  { timestamps: true }
);

rosterSchema.index({ month: 1, year: 1 }, { unique: true });

const Roster = mongoose.model("Roster", rosterSchema);

export default Roster;