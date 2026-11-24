import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    brand: {
      type: String,
      default: "All",
    },

    process: {
      type: String,
      default: "All",
    },

    appliesTo: {
      type: String,
      enum: ["All", "Brand", "Process"],
      default: "All",
    },

    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1, brand: 1, process: 1 });

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;