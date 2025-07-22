import type { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/User";
import Codes from "@/models/Codes";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/libs/next-auth";
import { NextRequest } from 'next/server';
import connectMongo from "@/libs/mongoose";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
    await connectMongo();
    const session = await getServerSession(authOptions);

    if (session) {
        try {
            const id = session.user.id;
            console.log(id);

            const user = await User.findOne({ _id: id });

            if (!user) {
                return NextResponse.json(
                    { error: "User not found." },
                    { status: 404 }
                );
            } else {
                try {
                    // Extract the `link`, `name`, and `color` from the request body
                    const { link, name, color, dotStyle, cornerSquareStyle, cornerDotStyle, dotColor, cornerSquareColor, cornerDotColor, transparentBg, bgColor, size } = await req.json();

                    if (!link) {
                        return NextResponse.json(
                            { error: "Link is required." },
                            { status: 400 }
                        );
                    }

                    // Retrieve the Codes document associated with the user
                    let existingCodes = await Codes.findOne({ userId: user._id });

                    // If no codes exist for the user, initialize a new document
                    if (!existingCodes) {
                        existingCodes = new Codes({
                            userId: user._id,
                            codes: [],
                        });
                    }

                    // Push the new code to the `codes` array with color
                    existingCodes.codes.push({ name: name, url: link, color: color, dotStyle, cornerSquareStyle, cornerDotStyle, dotColor, cornerSquareColor, cornerDotColor, transparentBg, bgColor, size: size || 300 });

                    // Save the updated Codes document
                    await existingCodes.save();

                    // Return the updated codes list
                    return NextResponse.json(
                        {
                            data: { user: user, codes: existingCodes.codes },
                        },
                        { status: 200 }
                    );
                } catch (e) {
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
}
