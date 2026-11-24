import mongoose from "mongoose";

const rosterRuleSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
    },

    process: {
      type: String,
      required: true,
    },

    operatingDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },

    minimumStaff: {
      type: Number,
      default: 1,
      min: 0,
    },

    shifts: {
      type: [String],
      enum: ["Morning", "Evening", "Night"],
      default: ["Morning", "Evening", "Night"],
    },

    holidayPolicy: {
      type: String,
      enum: [
        "WorkAllDays",
        "ExcludePublicHolidays",
        "ExcludeSundaysAndHolidays",
      ],
      default: "ExcludeSundaysAndHolidays",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

rosterRuleSchema.index(
  { brand: 1, process: 1 },
  { unique: true }
);

const RosterRule = mongoose.model("RosterRule", rosterRuleSchema);

export default RosterRule;