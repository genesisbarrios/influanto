// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import LinkInBio from "@/models/LinkInBio";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";

export async function GET(req: { json: () => any; }) {
  const session = await getServerSession(authOptions);
 
  if (session) {
    await connectMongo();
    console.log('session user id')
    console.log(session.user.id);
    const id = session.user.id;

    try {
      const bio = await LinkInBio.findOne({userid:id});
      console.log(bio)

      if (!bio) {
        return NextResponse.json({ error: "bio not found" }, { status: 404 });
      }
      return NextResponse.json({ data: bio }, { status: 200 });

    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      );
    }
  } else {
    // Not Signed in
    NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
}
