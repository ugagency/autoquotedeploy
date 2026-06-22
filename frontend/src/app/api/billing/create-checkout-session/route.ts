// =====================================================================
// AutoQuote — Proxy /api/billing/create-checkout-session → FastAPI
// Injeta o Bearer token e o e-mail do usuário no header.
// =====================================================================
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: "BACKEND_URL não configurada" },
        { status: 500 }
      );
    }

    const resp = await fetch(`${backendUrl}/billing/create-checkout-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "X-User-Email": session.user.email ?? "",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/billing/create-checkout-session error:", err);
    return NextResponse.json({ error: "Falha ao contatar o backend" }, { status: 502 });
  }
}
