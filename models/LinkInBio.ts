import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// LinkInBio SCHEMA
const linkInBioSchema = new mongoose.Schema(
  {
    userId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
    },
    location: {
      type: String,
    },
    logoImage: {
      type: String,
    },
    headerImage: {
      type: String,
    },
    socials: {
      type: Array,
    },
    streamingLinks: {
      type: Array,
    },
    links: {
      type: Array,
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
