// =====================================================================
// AutoQuote — /analytics (Server Component)
// Valida sessão e delega ao client component <AnalyticsView />.
// =====================================================================
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AnalyticsView from "@/components/AnalyticsView";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AnalyticsView userEmail={user.email ?? ""} userId={user.id} />;
}
