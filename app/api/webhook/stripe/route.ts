import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import configFile from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { getPostHogClient } from "@/libs/posthog-server";
import supabase from "@/libs/supabase";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});
// Live and test endpoints have different signing secrets — verify against
// whichever matches so both work on the same /api/webhook/stripe URL.
const webhookSecrets = [
  process.env.STRIPE_WEBHOOK_SECRET_PROD,
  process.env.STRIPE_WEBHOOK_SECRET,
].filter((s): s is string => !!s);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!signature) throw new Error("Stripe signature is missing");
    if (!webhookSecrets.length) throw new Error("No Stripe webhook secret is configured");

    let constructed: Stripe.Event | null = null;
    let lastErr: any;
    for (const secret of webhookSecrets) {
      try {
        constructed = stripe.webhooks.constructEvent(body, signature, secret);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!constructed) throw lastErr ?? new Error("Signature verification failed");
    event = constructed;
  } catch (err: any) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const stripeObject = event.data.object as Stripe.Checkout.Session;
        const checkoutSession = await findCheckoutSession(stripeObject.id);
        const customerId = checkoutSession?.customer as string;
        const priceId = checkoutSession?.line_items?.data[0]?.price?.id ?? null;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        if (!plan) break;

        const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;

        let user: any = null;

        if (userId) {
          const { data } = await supabase.from("users").select().eq("id", userId).single();
          user = data;
        } else if (customer.email) {
          const { data: existing } = await supabase
            .from("users")
            .select()
            .eq("email", customer.email)
            .maybeSingle();

          if (existing) {
            user = existing;
          } else {
            const { data: newUser } = await supabase
              .from("users")
              .insert({ email: customer.email, name: customer.name })
              .select()
              .single();
            user = newUser;
          }
        }

        if (!user) throw new Error("No user found");

        await supabase
          .from("users")
          .update({ price_id: priceId, customer_id: customerId, has_access: true })
          .eq("id", user.id);

        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: user.id,
          event: "subscription_completed",
          properties: {
            price_id: priceId,
            plan_name: plan.name,
            customer_id: customerId,
            email: customer.email,
          },
        });
        await posthog.shutdown();
        break;
      }

      case "checkout.session.expired":
        break;

      case "customer.subscription.updated":
        break;

      case "customer.subscription.deleted": {
        const stripeObject = event.data.object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(stripeObject.id);
        const { data: user } = await supabase
          .from("users")
          .select()
          .eq("customer_id", subscription.customer)
          .single();

        if (!user) break;

        const userPlan = configFile.stripe.plans.find((p) => p.priceId === user.price_id);
        if (userPlan?.mode === "payment") break;

        await supabase.from("users").update({ has_access: false }).eq("id", user.id);

        const posthogCancel = getPostHogClient();
        posthogCancel.capture({
          distinctId: user.id,
          event: "subscription_cancelled",
          properties: {
            customer_id: subscription.customer,
            price_id: stripeObject.items?.data[0]?.price?.id ?? null,
          },
        });
        await posthogCancel.shutdown();
        break;
      }

      case "invoice.paid": {
        const stripeObject = event.data.object as Stripe.Invoice;
        const priceId = stripeObject.lines.data[0]?.price?.id ?? null;
        const customerId = stripeObject.customer as string;
        const { data: user } = await supabase
          .from("users")
          .select()
          .eq("customer_id", customerId)
          .single();

        if (!user || user.price_id !== priceId) break;

        await supabase.from("users").update({ has_access: true }).eq("id", user.id);
        break;
      }

      case "invoice.payment_failed":
        break;

      default:
        break;
    }
  } catch (e: any) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}
