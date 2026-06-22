import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

// GET /api/billing/session?session_id=cs_xxx
// Devolve apenas o email do customer — usado na success page para travar o campo.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id inválido" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email ?? null;

    if (!email) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch {
    return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 400 });
  }
}
