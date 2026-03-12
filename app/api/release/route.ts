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
    const { id, bgColor, textColor, linksColor, links, name, description, video, image, selectedProducts, font } = body;
// Replace the updatePayload section with this:

// Prepare the update payload
const updatePayload: any = {
  userId,
  ...(bgColor && { bgColor }),
  ...(textColor && { textColor }),
  ...(linksColor && { linksColor }),
  ...(name && { name }),
  ...(image && { image }),
  ...(description && { description }),
  ...(font && { font: font }),
  ...(video && { video }),
  ...(Array.isArray(links) && { links }),
};
console.log("Update Payload:", updatePayload); // Debugging line to check the payload
console.log("Selected Products in payload:", updatePayload.selectedProducts); // Add this debug line

let releasePage;

if (id) {
  // If an id is provided, attempt to find and update the existing document
  releasePage = await ReleasePage.findOneAndUpdate(
    { _id: id },
    updatePayload,
    { new: true } // Return the updated document
  );
  
  console.log("Updated release page:", releasePage); // Add debug log
  
// Replace the raw update section with this native MongoDB approach:

if (releasePage && selectedProducts !== undefined) {
  console.log("🔄 Using native MongoDB driver...");
  console.log("- Selected Products:", selectedProducts);
  
  const { ObjectId } = require('mongodb');
  
  const result = await ReleasePage.collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { selectedProducts: selectedProducts || [] } }
  );
  
  console.log("✅ Native update result:", result);
  
  // Verify with native query
  const doc = await ReleasePage.collection.findOne({ _id: new ObjectId(id) });
  console.log("✅ Native query selectedProducts:", doc?.selectedProducts);
  
  // Return the document using Mongoose
  releasePage = await ReleasePage.findById(id).lean();
}

}

if (!releasePage) {
  // If no id is provided or the document doesn't exist, create a new one
  releasePage = new ReleasePage({
    userId,
    bgColor,
    textColor,
    linksColor,
    font,
    links,
    video,
    image,
    description,
    name,
    selectedProducts: selectedProducts || [] // Ensure it's always an array
  });

  await releasePage.save();
  console.log("Created new release page:", releasePage); // Add debug log
}

return NextResponse.json({ data: releasePage }, { status: 200 });
  } catch (error) {
    // Handle errors and log them
    console.error("Error updating or creating ReleasePage:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
