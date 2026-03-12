import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// LinkInBio SCHEMA
const linkInBioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true
    },
    bgColor: {
      type: String,
    },
    textColor: {
      type: String,
    },
    linksColor: {
      type: String,
    },
    cardBgColor: {
      type: String,
    },
    font: {
      type: String,
      default: "Inter, sans-serif",
    },
    bgImage: {
      type: String,
    },
    selectedProducts: {
      type: [String], // Fixed: Changed from [{ type: number }] to [String]
      default: [],
      validate: {
        validator: function(v:any) {
          return v.length <= 10; // Limit to 10 products
        },
        message: 'Cannot select more than 10 products'
      }
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
        },
        image: {
          type: String,
        },
        displayVideo: {
          type: Boolean,
          required: false,
        },
        autoPlay: {
          type: Boolean,
          required: false,
        },
        mute: {
          type: Boolean,
          required: false,
        },
      }
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
linkInBioSchema.plugin(toJSON);

export default mongoose.models.LinkInBio || mongoose.model("LinkInBio", linkInBioSchema);