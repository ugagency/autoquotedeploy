// Next.js precisa do runtime Node.js para ler o body raw (req.text()).
// O Edge runtime não suporta Buffer/crypto — necessários para a assinatura Stripe.
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/utils/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook mal configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const sb = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object as Stripe.Checkout.Session;
      if (cs.mode !== "subscription") break;

      const customerId = cs.customer as string;
      const subscriptionId = cs.subscription as string;

      // Busca detalhes da subscription para pegar price_id e current_period_end
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = stripeSub.items.data[0]?.price.id ?? null;
      const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

      await sb
        .from("subscriptions")
        .update({
          stripe_subscription_id: subscriptionId,
          status: stripeSub.status,
          price_id: priceId,
          current_period_end: periodEnd,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

      await sb
        .from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: periodEnd,
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      await sb
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      await sb
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }

    default:
      // Evento não tratado — retorna 200 para Stripe não retentar
      break;
  }

  return NextResponse.json({ received: true });
}
