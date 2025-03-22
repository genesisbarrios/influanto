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
  console.log("Updating LinkInBio for user:", userId, body);

  try {
    // Ensure links are included in the request and are in the correct format
    const updatePayload: any = {
      userId,
      ...(body.bgColor && { bgColor: body.bgColor }), // Map bgColor to backgroundColor
      ...(body.textColor && { textColor: body.textColor }), // Map textColor to textColor
      ...(body.linksColor && { linksColor: body.linksColor }), // Map linksColor to linksColor
    };

    // Check if 'links' is an array and add it to the updatePayload
    if (Array.isArray(body.links)) {
      updatePayload.links = body.links;
    } else {
      console.log("No valid links provided or links are not in the correct format");
    }

    console.log("Update Payload:", updatePayload); // Debugging line to check the payload

    let newReleasePage = await ReleasePage.findOne({ userId });

    if (newReleasePage) {
      // Update the existing document
      newReleasePage.bgColor = body.bgColor;
      newReleasePage.textColor = body.textColor;
      newReleasePage.linksColor = body.linksColor;
      newReleasePage.links = body.links;
    
      await newReleasePage.save();
    } else {
      // Create a new document if none exists
      newReleasePage = new ReleasePage({
        userId,
        bgColor: body.bgColor,
        textColor: body.textColor,
        linksColor: body.linksColor,
        links: body.links,
      });
    
      await newReleasePage.save();
    }
    
    return NextResponse.json({ data:  newReleasePage }, { status: 200 });
    
  } catch (error) {
    // Handle errors and log them
    console.error("Error updating Release Page:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
