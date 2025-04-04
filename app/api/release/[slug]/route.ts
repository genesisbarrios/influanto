import type { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/User";
import ReleasePage from "@/models/ReleasePage";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, {params}: {params: {slug: string}}) {
    await connectMongo();

    try {
        const slug = params?.slug;
        console.log(slug);
        if (!slug) {
            return NextResponse.json(
                { error: "Slug Required." },
                { status: 400 }
            );
        }

        try {
            const releasePage = await ReleasePage.findOne({ name: slug });

            if (!releasePage) {
                return NextResponse.json(
                    { error: "Release Page Not Found." },
                    { status: 404 }
                );
            }

            const user = await User.findById(releasePage.userId);

            if (!user) {
                return NextResponse.json(
                    { error: "User Not Found." },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { data: { releasePage: releasePage, user: user } },
                { status: 200 }
            );

        } catch (e) {
            console.error(e);
            return NextResponse.json(
                { error: "Something went wrong." },
                { status: 500 }
            );
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "Something went wrong." },
            { status: 500 }
        );
    }
}