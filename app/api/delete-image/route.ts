import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: "duwwnsyur",
  api_key: "929533944976281",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok") {
      return NextResponse.json({ error: "Failed to delete image", details: result }, { status: 500 });
    }

    return NextResponse.json({ message: "Image deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
