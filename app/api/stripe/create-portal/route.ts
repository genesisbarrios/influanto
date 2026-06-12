import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { createCustomerPortal } from "@/libs/stripe";
import supabase, { mapUser } from "@/libs/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data: userRow } = await supabase.from("users").select().eq("id", session.user.id).single();
    const user = userRow ? mapUser(userRow) : null;

    if (!user?.customerId) {
      return NextResponse.json(
        { error: "You don't have a billing account yet. Make a purchase first." },
        { status: 400 }
      );
    } else if (!body.returnUrl) {
      return NextResponse.json({ error: "Return URL is required" }, { status: 400 });
    }

    const stripePortalUrl = await createCustomerPortal({
      customerId: user.customerId,
      returnUrl: body.returnUrl,
    });

    return NextResponse.json({ url: stripePortalUrl });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
