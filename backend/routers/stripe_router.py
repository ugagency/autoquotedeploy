# =====================================================================
# AutoQuote — Billing / Stripe
#
# POST /billing/create-checkout-session  (auth obrigatório)
# POST /billing/create-portal-session    (auth obrigatório)
# POST /billing/webhook                  (sem auth — valida assinatura Stripe)
# =====================================================================
import os

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from auth import get_current_user
from db.supabase_client import get_supabase

router = APIRouter(prefix="/billing", tags=["billing"])

# Stripe é configurado via env var — placeholder até o usuário criar a conta
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

ACTIVE_STATUSES = {"active", "trialing"}


# ── helpers ────────────────────────────────────────────────────────────

def _get_or_create_customer(sb, user_id: str, user_email: str) -> str:
    """Retorna stripe_customer_id existente ou cria um novo."""
    row = (
        sb.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user_id)
        .maybeSingle()
        .execute()
    )
    if row.data and row.data.get("stripe_customer_id"):
        return row.data["stripe_customer_id"]

    customer = stripe.Customer.create(
        email=user_email,
        metadata={"user_id": user_id},
    )

    # Upsert: garante que a linha existe mesmo sem assinatura ainda
    sb.table("subscriptions").upsert(
        {"user_id": user_id, "stripe_customer_id": customer.id},
        on_conflict="user_id",
    ).execute()

    return customer.id


# ── endpoints ──────────────────────────────────────────────────────────

@router.post("/create-checkout-session")
def create_checkout_session(
    user_id: str = Depends(get_current_user),
    x_user_email: str | None = Header(default=None),
):
    """Cria uma Stripe Checkout Session e devolve a URL de pagamento."""
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe não configurado")

    sb = get_supabase()
    email = x_user_email or f"{user_id}@autoquote.app"
    customer_id = _get_or_create_customer(sb, user_id, email)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/billing/success",
        cancel_url=f"{FRONTEND_URL}/billing",
        allow_promotion_codes=True,
        subscription_data={"metadata": {"user_id": user_id}},
    )

    return {"url": session.url}


@router.post("/create-portal-session")
def create_portal_session(user_id: str = Depends(get_current_user)):
    """Abre o Customer Portal do Stripe para o usuário gerenciar o plano."""
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe não configurado")

    sb = get_supabase()
    row = (
        sb.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user_id)
        .maybeSingle()
        .execute()
    )
    if not row.data or not row.data.get("stripe_customer_id"):
        raise HTTPException(
            status_code=404,
            detail="Nenhuma assinatura encontrada para este usuário",
        )

    portal = stripe.billing_portal.Session.create(
        customer=row.data["stripe_customer_id"],
        return_url=f"{FRONTEND_URL}/billing",
    )

    return {"url": portal.url}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Recebe eventos do Stripe e mantém a tabela subscriptions sincronizada."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Assinatura Stripe inválida")

    sb = get_supabase()
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(sb, data)

    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        _handle_subscription_updated(sb, data)

    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(sb, data)

    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(sb, data)

    return {"received": True}


# ── handlers de evento ─────────────────────────────────────────────────

def _handle_checkout_completed(sb, session):
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    if not customer_id or not subscription_id:
        return

    sub = stripe.Subscription.retrieve(subscription_id)
    period_end = sub.get("current_period_end")

    sb.table("subscriptions").upsert(
        {
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "status": sub.get("status", "active"),
            "price_id": sub["items"]["data"][0]["price"]["id"] if sub.get("items") else None,
            "current_period_end": (
                _ts_to_iso(period_end) if period_end else None
            ),
        },
        on_conflict="stripe_customer_id",
    ).execute()


def _handle_subscription_updated(sb, sub):
    customer_id = sub.get("customer")
    period_end = sub.get("current_period_end")
    if not customer_id:
        return

    sb.table("subscriptions").update(
        {
            "stripe_subscription_id": sub.get("id"),
            "status": sub.get("status", "active"),
            "price_id": sub["items"]["data"][0]["price"]["id"] if sub.get("items") else None,
            "current_period_end": _ts_to_iso(period_end) if period_end else None,
        }
    ).eq("stripe_customer_id", customer_id).execute()


def _handle_subscription_deleted(sb, sub):
    customer_id = sub.get("customer")
    if not customer_id:
        return
    sb.table("subscriptions").update({"status": "canceled"}).eq(
        "stripe_customer_id", customer_id
    ).execute()


def _handle_payment_failed(sb, invoice):
    customer_id = invoice.get("customer")
    if not customer_id:
        return
    sb.table("subscriptions").update({"status": "past_due"}).eq(
        "stripe_customer_id", customer_id
    ).execute()


def _ts_to_iso(ts: int | None) -> str | None:
    if ts is None:
        return None
    from datetime import datetime, timezone
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
