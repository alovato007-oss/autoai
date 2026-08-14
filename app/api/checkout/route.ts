import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const JARVIS_PRICE_ID = "price_1U4CwwIQUeDqIdTjRXCfZXlx";

export async function GET(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID || JARVIS_PRICE_ID;

  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured. Set STRIPE_SECRET_KEY." },
      { status: 500 }
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata: { product: "autoai_jarvis_growth", plan: "jarvis_growth_1500" },
      subscription_data: { metadata: { product: "autoai_jarvis_growth", plan: "jarvis_growth_1500" } },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Stripe checkout session." },
      { status: 500 }
    );
  }
}
