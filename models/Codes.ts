import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const CodesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    codes: [
      {
        url: { type: String, required: true },
        name: { type: String },
        color: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Add plugin that converts mongoose documents to JSON
CodesSchema.plugin(toJSON);

export default mongoose.models.Codes || mongoose.model("Codes", CodesSchema);
