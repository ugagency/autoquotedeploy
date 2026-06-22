// =====================================================================
// AutoQuote — POST /api/billing/create-checkout-session
// Para usuários já autenticados (página /billing).
// Chama Stripe diretamente — não passa pelo Railway.
// =====================================================================
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

const PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { user } = session;
  const sb = createServiceClient();

  // Busca ou cria customer Stripe
  const { data: sub } = await sb
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    await sb.from("subscriptions").upsert(
      { user_id: user.id, email: user.email, stripe_customer_id: customerId },
      { onConflict: "user_id" },
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/billing`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
