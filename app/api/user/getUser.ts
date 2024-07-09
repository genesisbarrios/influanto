// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";

interface ResponseData {
  error?: string;
  success?: boolean;
  msg?: string;
  data?: any[];
}
const getUser = async () =>{
   const session = await getServerSession(authOptions);
    await connectMongo();
    
    const user = await User.findById({id: session.user.id});
    console.log(user);
    return user;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  // validate if it is a GET
  if (req.method !== "GET") {
    return res
      .status(200)
      .json({ error: "This API call only accepts GET methods" });
  }
  let Email = "";

  const queryVal = "";
  console.log(req.query);
  
  try{
      const user = await getUser();
      return res.status(200).json({ success: true, data: user });
  }catch(err: any){
    return res.status(400).json({ error: "Error on '/api/getUser': " + err })
  }
  
}