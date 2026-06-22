import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/utils/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

const PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Rota pública — sem sessão de usuário.
// Recebe { email } da landing page, cria customer + checkout session.
export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const email: string | undefined = body?.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const sb = createServiceClient();

    const { data: existing } = await sb
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id as string | undefined;

    // Verifica se o customer ainda existe no Stripe (pode ter sido criado em outro ambiente)
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = undefined;
        await sb.from("subscriptions").delete().eq("email", email);
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;

      await sb
        .from("subscriptions")
        .insert({ email, stripe_customer_id: customerId, status: "inactive" });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/`,
      allow_promotion_codes: true,
      customer_update: { name: "auto", address: "auto" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout-public] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
