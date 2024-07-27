// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import LinkInBio from "@/models/LinkInBio";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { useSession, signOut } from "next-auth/react";

export async function GET(req: NextRequest, {params}: {params: {id: string}}) {
  const session = await getServerSession(authOptions);
   if(session){
    await connectMongo();
    const id = session.user.id;
    console.log(id);

    try {
      const linkInBio = await LinkInBio.findOne({userId: id});
      console.log(linkInBio);

      if (!linkInBio) {
        return NextResponse.json(
          { error: "Links Not Found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { data: linkInBio},
        { status: 200 }
      );

    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      );
    }
   }else{
     return NextResponse.json(
       { error: "Please Sign In." },
       { status: 401 }
     );
   }
}