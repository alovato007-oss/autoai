import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const price = process.env.STRIPE_PRICE_ID;
    if (!secret || !price) {
      return NextResponse.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Vercel." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const origin = new URL(request.url).origin;
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/get-started?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { product: "AutoAI Lead Employee" },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create checkout session" }, { status: 500 });
  }
}
