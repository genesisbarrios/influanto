import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import ReleasePage from "@/models/ReleasePage";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // If the user is not signed in, return an error
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Connect to MongoDB
  await connectMongo();
  const userId = session.user.id;

  // Parse the incoming JSON body
  const body = await req.json();
  console.log("Updating or creating ReleasePage for user:", userId, body);

  try {
    // Extract the id from the body if provided
    const { id, bgColor, textColor, linksColor, links, name, description, video, image } = body;

    // Prepare the update payload
    const updatePayload: any = {
      userId,
      ...(bgColor && { bgColor }),
      ...(textColor && { textColor }),
      ...(linksColor && { linksColor }),
      ...(name && { name }),
      ...(image && { image }),
      ...(description && { description }),
      ...(video && { video }),
      ...(Array.isArray(links) && { links }),
    };

    console.log("Update Payload:", updatePayload); // Debugging line to check the payload

    let releasePage;

    if (id) {
      // If an id is provided, attempt to find and update the existing document
      releasePage = await ReleasePage.findOneAndUpdate(
        { _id: id, userId },
        updatePayload,
        { new: true } // Return the updated document
      );
    }

    if (!releasePage) {
      // If no id is provided or the document doesn't exist, create a new one
      releasePage = new ReleasePage({
        userId,
        bgColor,
        textColor,
        linksColor,
        links,
        video,
        image,
        description,
        name
      });

      await releasePage.save();
    }

    return NextResponse.json({ data: releasePage }, { status: 200 });
  } catch (error) {
    // Handle errors and log them
    console.error("Error updating or creating ReleasePage:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
