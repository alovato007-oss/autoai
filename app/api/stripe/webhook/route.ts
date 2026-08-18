import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Stripe webhook is not fully configured." }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const environment = event.livemode ? "production" : "test";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc("process_stripe_jarvis_event_v2", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_payload: event,
      p_environment: environment,
    });

    if (error) {
      console.error("JARVIS Stripe processing failed", {
        event_id: event.id,
        event_type: event.type,
        error: error.message,
      });
      return NextResponse.json({ error: "Stripe event processing failed." }, { status: 500 });
    }

    console.log("JARVIS Stripe event processed", data);
    return NextResponse.json({ received: true, result: data });
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook." },
      { status: 400 }
    );
  }
}
