import { createClient } from "@supabase/supabase-js";

// Cliente com service role key — ignora RLS.
// NUNCA importar em componentes client. Somente em API routes server-side.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
