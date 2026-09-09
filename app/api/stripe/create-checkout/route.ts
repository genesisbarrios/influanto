import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { createCheckout, createCustomerPortal, findActiveSubscriptionByEmail } from "@/libs/stripe";
import supabase, { mapUser } from "@/libs/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.priceId) {
    return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
  } else if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json({ error: "Success and cancel URLs are required" }, { status: 400 });
  } else if (!body.mode) {
    return NextResponse.json(
      { error: "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)" },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const { data: userRow } = session?.user?.id
      ? await supabase.from("users").select().eq("id", session.user.id).single()
      : { data: null };

    const user = userRow ? mapUser(userRow) : null;
    const { priceId, mode, successUrl, cancelUrl } = body;

    // Guard against duplicate subscriptions: if this email already has an
    // active or trialing subscription anywhere in Stripe (even under a
    // different customer object than the one saved on our side), send them
    // to the billing portal instead of creating another paid subscription.
    if (mode === "subscription" && user?.email) {
      const existing = await findActiveSubscriptionByEmail(user.email);
      if (existing) {
        const portalUrl = await createCustomerPortal({
          customerId: existing.customerId,
          returnUrl: successUrl,
        });
        return NextResponse.json({ url: portalUrl, alreadySubscribed: true });
      }
    }

    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      clientReferenceId: user?.id?.toString(),
      user: user ? { customerId: user.customerId, email: user.email } : undefined,
    });

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
