import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// releasePage SCHEMA
const releasePageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name:{
      type: String,
      required: true,
      unique: true
    },
    image: {
      type: String,
    },
    description:{
      type: String,
    },
    video: {
      type: String,
    },
    links: [
      {
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        }
      }
    ],
    bgColor: {
      type: String,
    },
    textColor: {
      type: String,
    },
    linksColor: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
releasePageSchema.plugin(toJSON);

export default mongoose.models.ReleasePage || mongoose.model("ReleasePage", releasePageSchema);
