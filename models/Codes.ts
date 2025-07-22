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
        dotStyle: { type: String, enum: ['square', 'rounded', 'classy', 'classy-rounded', 'extra-rounded', 'dots'], default: 'rounded' },
        cornerSquareStyle: { type: String, enum: ['square', 'extra-rounded', 'dot'], default: 'extra-rounded' },
        cornerDotStyle: { type: String, enum: ['dot', 'square'], default: 'square' },
        transparentBg: { type: Boolean, default: false },
        bgColor: { type: String, default: '#ffffff' },
        size: { type: Number, default: 300 },
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
