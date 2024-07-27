import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import LinkInBio from "@/models/LinkInBio";
import { NextRequest } from 'next/server';


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let linkInBio = null;

  if (session) {
    await connectMongo();
    console.log('session user id')
    console.log(session.user.id);
    const id = session.user.id;

    const body = await req.json();
    console.log(body);

    try {
      linkInBio = await LinkInBio.findOne({_id:id});
      if(linkInBio == null){
        linkInBio = new LinkInBio();
      }
      linkInBio.userId = id;
      if (body.link1 && body.link1.url && body.link1.name) {
        linkInBio.link1 = {url: body.link1.url.toString(), name: body.link1.name.toString()}
      }
      if (body.link2 && body.link2.url && body.link2.name) {
        linkInBio.link2 = {url: body.link2.url.toString(), name: body.link2.name.toString()}
      }
      if (body.link3 && body.link3.url && body.link3.name) {
        linkInBio.link3 = {url: body.link3.url.toString(), name: body.link3.name.toString()}
      }
      if (body.link4 && body.link4.url && body.link4.name) {
        linkInBio.link4 = {url: body.link4.url.toString(), name: body.link4.name.toString()}
      }
      if (body.link5 && body.link5.url && body.link5.name) {
        linkInBio.link5 = {url: body.link5.url.toString(), name: body.link5.name.toString()}
      }
      if (body.link6 && body.link6.url && body.link6.name) {
        linkInBio.link6 = {url: body.link6.url.toString(), name: body.link6.name.toString()}
      }
      
      await linkInBio.save();

      return NextResponse.json({ data: linkInBio }, { status: 200 });
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
