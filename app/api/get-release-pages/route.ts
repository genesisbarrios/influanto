// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import ReleasePage from "@/models/ReleasePage";
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
      const pages = await ReleasePage.find({ userId: id });
      console.log("Release Pages:", pages);

      if (pages == null || pages.length === 0) {
        return NextResponse.json(
          { error: "No Pages Created Yet.. Create Your First Release Page!", data: null },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { data: pages },
        { status: 200 }
      );
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Nothing Found.. Create Your First Release Page!", data: null },
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
