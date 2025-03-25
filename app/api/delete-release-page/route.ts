import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import ReleasePage from "@/models/ReleasePage";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (session) {
    await connectMongo();
    const userId = session.user.id; // Assuming the session contains the user ID
    const { id } = await req.json();  // Get the release page ID to delete
    console.log("User ID:", userId);
    console.log("Release Page ID to delete:", id);

    try {
      // Find the release page by id and userId
      const releasePage = await ReleasePage.findOneAndDelete({ _id: id, userId: userId });

      if (!releasePage) {
        return NextResponse.json(
          { error: "Release page not found or you don't have permission to delete it." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Release page deleted successfully." },
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
