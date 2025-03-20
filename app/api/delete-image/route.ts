import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic'; // Ensures dynamic behavior
// export const bodyParser = false; // Disables the body parser

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'duwwnsyur',
  api_key: '929533944976281',
  api_secret: process.env.CLOUDINARY_API_SECRET, // Replace with your actual API secret
});

export const methods = ['DELETE']; // Explicitly allow the DELETE method

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    // Log the publicId for debugging
    console.log("Deleting image with publicId:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    // Log the Cloudinary response for debugging
    console.log("Cloudinary response:", result);

    if (result.result !== "ok") {
      return NextResponse.json({ error: "Failed to delete image", details: result }, { status: 500 });
    }

    return NextResponse.json({ message: "Image deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting image:", error);

    // Return detailed error message for debugging
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
