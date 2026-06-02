import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import LinkInBio from "@/models/LinkInBio";
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
  console.log("🔍 Updating LinkInBio for user:", userId);
  console.log("🔍 Selected products received:", body.selectedProducts);

  try {
    // First, let's see what's currently in the database
    const existingDoc = await LinkInBio.findOne({ userId });
    console.log("🔍 Existing document:", existingDoc ? "Found" : "Not found");
    if (existingDoc) {
      console.log("🔍 Current selectedProducts in DB:", existingDoc.selectedProducts);
    }

    // Step 1: Update all the regular fields first
    const regularUpdateData = {
      $set: {
        userId,
        bgColor: body.bgColor,
        textColor: body.textColor,
        linksColor: body.linksColor,
        links: body.links,
        cardBgColor: body.cardBgColor,
        font: body.font,
        bgImage: body.bgImage,
        bgMode: body.bgMode,
        bgImageCustom: body.bgImageCustom,
        patternId: body.patternId,
        patternFg: body.patternFg,
        patternBg: body.patternBg,
        patternOpacity: body.patternOpacity,
      }
    };

    console.log("🔍 Updating regular fields...");
    const updatedDoc = await LinkInBio.findOneAndUpdate(
      { userId }, 
      regularUpdateData,
      { 
        upsert: true, 
        new: true,
        runValidators: false
      }
    );

    // Step 2: Force update selectedProducts using raw MongoDB collection
    const selectedProductsToSave = body.selectedProducts || [];
    console.log("🔍 Force updating selectedProducts using raw MongoDB:", selectedProductsToSave);
    
    const rawUpdateResult = await LinkInBio.collection.updateOne(
      { userId: updatedDoc.userId },
      { 
        $set: { 
          selectedProducts: selectedProductsToSave 
        } 
      }
    );
    
    console.log("🔍 Raw update result:", rawUpdateResult);

    // Step 3: Verify the update worked
    const rawDoc = await LinkInBio.collection.findOne({ userId: updatedDoc.userId });
    console.log("🔍 RAW MONGODB - selectedProducts after force update:", rawDoc?.selectedProducts);

    // Step 4: Get the final document through Mongoose
    const finalDoc = await LinkInBio.findOne({ userId });
    console.log("🔍 Final Mongoose document - selectedProducts:", finalDoc?.selectedProducts);
    
    return NextResponse.json({ data: finalDoc }, { status: 200 });
    
  } catch (error) {
    // Handle errors and log them
    console.error("❌ Error updating LinkInBio:", error);
    console.error("❌ Error stack:", error.stack);
    return NextResponse.json({ 
      error: "Something went wrong", 
      details: error.message 
    }, { status: 500 });
  }
}