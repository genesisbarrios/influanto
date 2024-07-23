import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req: { json: () => any; }) {
  const session = await getServerSession(authOptions);
 
  if (session) {
    await connectMongo();
    console.log('session user id')
    console.log(session.user.id);
    const id = session.user.id;

    const body = await req.json();

    try {
      const user = await User.findOne({_id:id});
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
        if(body.location != '' || body.location != null){
          user.location = body.location;
        }
        if(body.bio != '' || body.bio != null){
          user.bio = body.bio;
        }
        if(body.website != '' || body.website != null){
          user.website = body.website;
        }
        if(body.instagram != '' || body.instagram != null){
          user.instagram = body.instagram;
        }
        if(body.twitter != '' || body.twitter != null){
          user.twitter = body.twitter;
        }
        if(body.facebook != '' || body.facebook != null){
          user.facebook = body.facebook;
        }
        if(body.linkedin != '' || body.linkedin != null){
          user.linkedin = body.linkedin;
        }
        if(body.youtube != '' || body.youtube != null){
          user.youtube = body.youtube;
        }
        if(body.tiktok != '' || body.tiktok != null){
          user.tiktok = body.tiktok;
        }
        if(body.telegram != '' || body.telegram != null){
          user.telegram = body.telegram
        }
        if(body.bandcamp != '' || body.bandcamp != null){
          user.bandcamp = body.bandcamp;
        }
        if(body.github != '' || body.github != null){
          user.github = body.github;
        }
        if(body.patreon != '' || body.patreon != null){
          user.patreon = body.patreon;
        }
        if(body.substack != '' || body.substack != null){
          user.substack = body.substack;
        }
        if(body.spotify != '' || body.spotify != null){
          user.spotify = body.spotify;
        }
        if(body.appleMusic != '' || body.appleMusic != null){
          user.appleMusic = body.appleMusic;
        }
        if(body.tidal != '' || body.tidal != null){
          user.tidal = body.tidal;
        }
        if(body.amazonMusic != '' || body.amazonMusic != null){
          user.amazonMusic = body.amazonMusic;
        }
        if(body.deezer != '' || body.deezer != null){
          user.deezer = body.deezer;
        }
        if(body.pandora != '' || body.pandora != null){
          user.pandora = body.pandora;
        }
        if(body.youtubeMusic != '' || body.youtubeMusic != null){
          user.youtubeMusic = body.youtubeMusic;
        }
        if(body.soundcloud != '' || body.soundcloud != null){
          user.soundcloud = body.soundcloud;
        }
        if(user.soundxyz != '' || body.soundxyz != null){
          user.soundxyz = body.soundxyz;
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
