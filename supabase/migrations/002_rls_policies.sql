-- =====================================================================
-- AutoQuote — Migration 002: Row Level Security (RLS)
-- Garante isolamento multi-tenant: cada usuário só enxerga as próprias
-- linhas (auth.uid() = user_id) em todas as 3 tabelas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------
alter table public.user_settings enable row level security;

drop policy if exists "tenant_isolation" on public.user_settings;
create policy "tenant_isolation" on public.user_settings
    for all
    using      (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- robot_jobs
-- ---------------------------------------------------------------------
alter table public.robot_jobs enable row level security;

drop policy if exists "tenant_isolation" on public.robot_jobs;
create policy "tenant_isolation" on public.robot_jobs
    for all
    using      (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- eventos_coletados
-- ---------------------------------------------------------------------
alter table public.eventos_coletados enable row level security;

drop policy if exists "tenant_isolation" on public.eventos_coletados;
create policy "tenant_isolation" on public.eventos_coletados
    for all
    using      (auth.uid() = user_id)
    with check (auth.uid() = user_id);
