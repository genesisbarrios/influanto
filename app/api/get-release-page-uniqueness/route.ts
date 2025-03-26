import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import ReleasePage from "@/models/ReleasePage";
import { getServerSession } from "next-auth/next";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { error: "Please Sign In." },
            { status: 401 }
        );
    }

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
        return NextResponse.json(
            { error: 'Invalid or missing "name" query parameter' },
            { status: 400 }
        );
    }

    try {
        // Query the database to check if the name exists
        const existingEntry = await ReleasePage.findOne({ name });

        const isUnique = !existingEntry;
        console.log(isUnique);
        return NextResponse.json(
            { isUnique },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error checking name uniqueness:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
