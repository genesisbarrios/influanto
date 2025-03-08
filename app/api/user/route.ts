import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing so formidable can handle it
  },
};

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'duwwnsyur',
  api_key: '929533944976281',
  api_secret: process.env.CLOUDINARY_API_SECRET, // Replace with your actual API secret
});

// Function to upload image to Cloudinary
async function uploadImageToCloudinary(imageBuffer: Buffer, fileName: string, userId: string): Promise<string> {
  try {
    if (!imageBuffer) {
      throw new Error("Invalid image buffer");
    }

    // Convert Buffer to a readable stream
    const bufferStream = new Readable();
    bufferStream.push(imageBuffer);
    bufferStream.push(null); // End the stream

    // Upload the image using stream
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: `user-${userId}-profile`, // Use the userId to create a unique public ID
          resource_type: 'auto', // Automatically detect the file type
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(imageBuffer);
    });

    console.log('Image uploaded to Cloudinary:', uploadResult);

    return uploadResult.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    console.error("Cloudinary image upload error:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  await connectMongo();
  const id = session.user.id;

  try {
    const formData = await req.formData();

    const user = await User.findOne({ _id: id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    let image;

    if (image) {
      image = formData.get("image") as File;

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload image to HubSpot
      const imageUrl = await uploadImageToCloudinary(buffer, `${user._id}-profile.jpg`, id);
      user.image = imageUrl;
    }

    // Update user fields from form data
    user.name = formData.get("name") as string || user.name;
    user.username = formData.get("username") as string || user.username;
    user.email = formData.get("email") as string || user.email;
    user.location = formData.get("location") as string || user.location;
    user.website = formData.get("website") as string || user.website;
    user.bio = formData.get("bio") as string || user.bio;
    user.instagram = formData.get("instagram") as string || user.instagram;
    user.twitter = formData.get("twitter") as string || user.twitter;
    user.facebook = formData.get("facebook") as string || user.facebook;
    user.linkedin = formData.get("linkedin") as string || user.linkedin;
    user.youtube = formData.get("youtube") as string || user.youtube;
    user.tiktok = formData.get("tiktok") as string || user.tiktok;
    user.github = formData.get("github") as string || user.github;
    user.patreon = formData.get("patreon") as string || user.patreon;
    user.substack = formData.get("substack") as string || user.substack;
    user.telegram = formData.get("telegram") as string || user.telegram;
    user.etsy = formData.get("etsy") as string || user.etsy;
    user.spotify = formData.get("spotify") as string || user.spotify;
    user.appleMusic = formData.get("appleMusic") as string || user.appleMusic;
    user.tidal = formData.get("tidal") as string || user.tidal;
    user.amazonMusic = formData.get("amazonMusic") as string || user.amazonMusic;
    user.soundcloud = formData.get("soundcloud") as string || user.soundcloud;
    user.deezer = formData.get("deezer") as string || user.deezer;
    user.pandora = formData.get("pandora") as string || user.pandora;
    user.youtubeMusic = formData.get("youtubeMusic") as string || user.youtubeMusic;
    user.bandcamp = formData.get("bandcamp") as string || user.bandcamp;
    user.soundxyz = formData.get("soundxyz") as string || user.soundxyz;

    await user.save();

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error("Error handling form data:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
