import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await connectMongo();

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { walletAddress } = body;
    console.log(walletAddress)

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // Use $set to ensure the new field is added
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { walletAddress } },
      { new: true, runValidators: true } // return updated doc & validate schema
    );

    console.log(updatedUser);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedUser }, { status: 200 });
  } catch (err) {
    console.error("Error saving wallet address:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
