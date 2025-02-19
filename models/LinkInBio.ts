import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// LinkInBio SCHEMA
const linkInBioSchema = new mongoose.Schema(
  {
    userId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    backgroundColor:{
      type: String,
    },
    link1: {
      url: String,
      name: String,
    },
    link2: {
      url: String,
      name: String,
    },
    link3: {
      url: String,
      name: String,
    },
    link4: {
      url: String,
      name: String,
    },
    link5: {
      url: String,
      name: String,
    },
    link6: {
      url: String,
      name: String,
    },
    link7: {
      url: String,
      name: String,
    },
    link8: {
      url: String,
      name: String,
    },
    link9: {
      url: String,
      name: String,
    },
    link10: {
      url: String,
      name: String,
    },
    
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
linkInBioSchema.plugin(toJSON);

export default mongoose.models.LinkInBio || mongoose.model("LinkInBio", linkInBioSchema);
