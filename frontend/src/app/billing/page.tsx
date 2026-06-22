// =====================================================================
// AutoQuote — /billing (server component com auth guard)
// =====================================================================
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BillingView from "./BillingView";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <BillingView
      userEmail={user.email ?? ""}
      userId={user.id}
      status={sub?.status ?? null}
      currentPeriodEnd={sub?.current_period_end ?? null}
    />
  );
}
