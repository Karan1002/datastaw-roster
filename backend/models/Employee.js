import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    // Existing fields preserved for old records
    brand: {
      type: String,
      required: true,
      trim: true,
    },

    process: {
      type: String,
      required: true,
      trim: true,
    },

    // New multi-assignment support
    brands: {
      type: [String],
      default: [],
    },

    processes: {
      type: [String],
      default: [],
    },

    pod: {
      type: String,
      default: "",
    },

    pods: {
      type: [String],
      default: [],
    },

    role: {
      type: String,
      default: "Employee",
    },

    weeklyOffs: {
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
      default: ["Sunday"],
    },

    shiftPreferences: {
      type: [String],
      enum: ["Morning", "Evening", "Night"],
      default: [],
    },

    availability: {
      type: String,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Fill new arrays from old single-value fields when saving.
employeeSchema.pre("validate", function () {
  if (!this.brands?.length && this.brand) {
    this.brands = [this.brand];
  }

  if (!this.processes?.length && this.process) {
    this.processes = [this.process];
  }

  if (!this.pods?.length && this.pod) {
    this.pods = [this.pod];
  }

  if (this.brands?.length && !this.brand) {
    this.brand = this.brands[0];
  }

  if (this.processes?.length && !this.process) {
    this.process = this.processes[0];
  }
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;