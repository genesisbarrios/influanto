import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import Codes from "@/models/Codes";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (session) {
    await connectMongo();
    const userId = session.user.id; // Assuming the session contains the user ID
    const { id } = await req.json();  // Get the QR code ID to delete
    console.log("User ID:", userId);
    console.log("QR Code ID to delete:", id);

    try {
      // Find the user by userId
      const usersCodes = await Codes.findOne({ userId: userId });

      if (!usersCodes) {
        return NextResponse.json(
          { error: "User not found." },
          { status: 404 }
        );
      }

      // Find the index of the QR code in the codes array
      const codeIndex = usersCodes.codes.findIndex((code: any) => code._id.toString() === id);

      if (codeIndex === -1) {
        return NextResponse.json(
          { error: "QR Code not found in user's codes array or you don't have permission to delete it." },
          { status: 404 }
        );
      }

      // Remove the QR code from the array
      usersCodes.codes.splice(codeIndex, 1);

      // Save the updated user document
      await usersCodes.save();

      return NextResponse.json(
        { message: "QR Code deleted successfully." },
        { status: 200 }
      );
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Please Sign In." },
      { status: 401 }
    );
  }
}
