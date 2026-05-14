// =====================================================================
// AutoQuote — Dashboard (rota raiz)
// Server Component. Verifica sessão e redireciona para /login se anônimo.
// =====================================================================
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Dashboard from "@/components/Dashboard";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <Dashboard userEmail={user.email ?? ""} userId={user.id} />;
}
