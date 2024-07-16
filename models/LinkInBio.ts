import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// LinkInBio SCHEMA
const linkInBioSchema = new mongoose.Schema(
  {
   
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
linkInBioSchema.plugin(toJSON);

export default mongoose.models.LinkInBio || mongoose.model("LinkInBio", linkInBioSchema);
