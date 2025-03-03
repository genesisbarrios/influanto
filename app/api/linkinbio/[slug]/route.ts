import type { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/User";
import LinkInBio from "@/models/LinkInBio";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, {params}: {params: {slug: string}}) {
    await connectMongo();

    try {
        // Provide a fallback for `req.query` to ensure it's never undefined
        const slug  = params?.slug;
        console.log(slug);
        if (!slug) {
            return NextResponse.json(
                { error: "Slug Required." },
                { status: 400 }
              );
        }

        const user = await User.findOne({ username: slug });

        if (!user) {
            return NextResponse.json(
                { error: "Not Found." },
                { status: 404 }
              );
        }else{
            try{
                const linkInBio = await LinkInBio.findOne({ userId: user._id });
                return NextResponse.json(
                    { data: {user: user, linkInBio:linkInBio} },
                    { status: 200 }
                  );

            }catch(e){
                console.error(e);
                return NextResponse.json(
                    { error: "Something went wrong." },
                    { status: 500 }
                );
            }
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "Something went wrong." },
            { status: 500 }
          );
    }
}