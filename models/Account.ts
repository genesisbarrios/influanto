import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// USER SCHEMA
const accountSchema = new mongoose.Schema(
  {
    id: {
        type: String,   
    },
    provider: {
        type: String,
        required: true,
    },
    providerAccountId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    expiresAt: {
        type: Date,
    },
    scope:{
        type: String,
    },
    id_token:{
        type:String
    }
  },
  {
    timestamps: true,

}
);

// add plugin that converts mongoose to json
accountSchema.plugin(toJSON);

export default mongoose.models.Account || mongoose.model("Account", accountSchema);
