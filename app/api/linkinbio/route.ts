import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import LinkInBio from "@/models/LinkInBio";

export async function POST(req : { json: () => any; }) {
  const session = await getServerSession(authOptions);
 

  if (session) {
    await connectMongo();
    console.log('session user id')
    console.log(session.user.id);
    const id = session.user.id;

    const body = await req.json();

    try {
      const user = await LinkInBio.findOne({_id:id});
      console.log(session.user)
      console.log(body);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
        if(body.email != '' || body.email != null){
            user.email = body.email;
        }
        
        if(body.name != '' || body.name != null){
            user.name = body.name;
        }
        if(body.image != '' || body.image != null){
            user.image = body.image;
        }
        
      await user.save();

      return NextResponse.json({ data: user }, { status: 200 });
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
