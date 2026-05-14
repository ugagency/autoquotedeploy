// =====================================================================
// AutoQuote — Proxy /api/run-robot → backend FastAPI no Railway
// Faz a ponte entre o frontend (cookies de sessão Supabase) e o backend
// (que espera um Bearer token JWT). Nunca expõe a Service Role Key.
// =====================================================================
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
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
        { error: "BACKEND_URL não configurada no servidor" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const resp = await fetch(`${backendUrl}/run-robot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const contentType = resp.headers.get("content-type") ?? "application/json";
    const text = await resp.text();

    return new NextResponse(text, {
      status: resp.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    console.error("/api/run-robot error:", err);
    return NextResponse.json(
      { error: "Falha ao contatar o backend" },
      { status: 502 }
    );
  }
}
