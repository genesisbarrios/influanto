import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const linkInBioVisitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    country: { type: String, default: "Unknown" },
    countryCode: { type: String, default: "" },
    city: { type: String, default: "" },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: "unknown",
    },
    browser: { type: String, default: "Other" },
    os: { type: String, default: "Other" },
    referrer: { type: String, default: "Direct" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

linkInBioVisitSchema.plugin(toJSON);

export default mongoose.models.LinkInBioVisit ||
  mongoose.model("LinkInBioVisit", linkInBioVisitSchema);
