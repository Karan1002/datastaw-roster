import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

teamSchema.pre("validate", function () {
  if (!this.brands?.length && this.brand) {
    this.brands = [this.brand];
  }

  if (!this.processes?.length && this.process) {
    this.processes = [this.process];
  }
});

const Team = mongoose.model("Team", teamSchema);

export default Team;