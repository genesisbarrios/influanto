import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import LinkInBio from "@/models/LinkInBio";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await connectMongo();
  const userId = session.user.id;
  const body = await req.json();
  console.log("Updating LinkInBio for user:", userId, body);

  try {
    // Update or create a new entry
    const updatedLinkInBio = await LinkInBio.findOneAndUpdate(
      { _id: userId }, // Find by user ID
      {
        userId,
        ...(body.bgColor && { backgroundColor: body.bgColor }),
        ...(body.link1?.url && body.link1?.name && { link1: { url: body.link1.url, name: body.link1.name } }),
        ...(body.link2?.url && body.link2?.name && { link2: { url: body.link2.url, name: body.link2.name } }),
        ...(body.link3?.url && body.link3?.name && { link3: { url: body.link3.url, name: body.link3.name } }),
        ...(body.link4?.url && body.link4?.name && { link4: { url: body.link4.url, name: body.link4.name } }),
        ...(body.link5?.url && body.link5?.name && { link5: { url: body.link5.url, name: body.link5.name } }),
        ...(body.link6?.url && body.link6?.name && { link6: { url: body.link6.url, name: body.link6.name } }),
        ...(body.link7?.url && body.link7?.name && { link7: { url: body.link7.url, name: body.link7.name } }),
        ...(body.link8?.url && body.link8?.name && { link8: { url: body.link8.url, name: body.link8.name } }),
        ...(body.link9?.url && body.link9?.name && { link9: { url: body.link9.url, name: body.link9.name } }),
        ...(body.link10?.url && body.link10?.name && { link10: { url: body.link10.url, name: body.link10.name } }),
      },
      { new: true, upsert: true } // Return the updated doc, create if not exists
    );

    return NextResponse.json({ data: updatedLinkInBio }, { status: 200 });
  } catch (error) {
    console.error("Error updating LinkInBio:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
