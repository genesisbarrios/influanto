// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import Codes from "@/models/Codes";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session) {
    await connectMongo();
    const id = session.user.id;
    console.log("User ID:", id);

    try {
      // Use find instead of findAll to retrieve the matching codes
      const codes = await Codes.find({ userId: id });
      console.log("Codes:", codes);

      if (!codes || codes.length === 0) {
        return NextResponse.json(
          { error: "Links Not Found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { data: codes },
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
