import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// USER SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      lowercase:true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    displayEmail :{
      type: Boolean,
      default: false
    },
    image: {
      type: String,
    },
    location: {
      type: String,
    },
    instagram: {
      type: String,
      lowercase: true,
    },
    twitter: {
      type: String,
      lowercase: true,
    },
    discord: {
      type: String,
      lowercase: true,
    },
    telegram: {
      type: String,
      lowercase: true,
    },
    facebook: {
      type: String,
      lowercase: true,
    },
    linkedin: {
      type: String,
      lowercase: true,
    },
    youtube: {
      type: String,
      lowercase: true,
    },
    tiktok: {
      type: String,
      lowercase: true,
    },
    github: {
      type: String,
      lowercase: true,
    },
    spotify:{
      type: String,
      lowercase: true,
    },
    appleMusic:{
      type: String,
      lowercase: true,
    },
    tidal:{
      type: String,
      lowercase: true,
    },
    amazonMusic:{
      type: String,
      lowercase: true,
    },
    soundcloud:{
      type: String,
      lowercase: true,
    },
    deezer:{  
      type: String,
      lowercase: true,
    },
    pandora:{
      type: String,
      lowercase: true,
    },
    bandcamp:{
      type: String,
      lowercase: true,
    },
    youtubeMusic:{
      type: String,
      lowercase: true,
    },
    patreon:{
      type: String,
      lowercase: true,
    },
    substack:{
      type: String,
      lowercase: true,
    },
    website: {
      type: String,
    },
    bio: {
      type: String,
    },
    // Used in the Stripe webhook to identify the user in Stripe and later create Customer Portal or prefill user credit card details
    customerId: {
      type: String,
      validate(value: string) {
        return value.includes("cus_");
      },
    },
    // Used in the Stripe webhook. should match a plan in config.js file.
    priceId: {
      type: String,
      validate(value: string) {
        return value.includes("price_");
      },
    },
    // Used to determine if the user has access to the product—it's turn on/off by the Stripe webhook
    hasAccess: {
      type: Boolean,
      default: false,
    },
    //printify related fields
    printifyShopId: {
      type: String,
      default: null,
       required: false,
    },
    printifyConnected: {
      type: Boolean,
      default: false,
       required: false,
    },
    printifyStoreUrl: {
      type: String,
      default: null,
       required: false,
    },
    printifyStoreName: {
      type: String,
      default: null,
       required: false,
    },
    metaPixelId: {
      type: String,
      default: null,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);
