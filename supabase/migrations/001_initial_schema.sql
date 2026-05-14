-- =====================================================================
-- AutoQuote — Migration 001: Schema inicial
-- Cria as tabelas user_settings, robot_jobs e eventos_coletados,
-- além de índices e triggers de updated_at.
-- =====================================================================

-- Extensão para gen_random_uuid() (geralmente já vem habilitada no Supabase)
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabela: user_settings
-- Armazena as credenciais Vale de cada tenant (1:1 com auth.users).
-- ---------------------------------------------------------------------
create table if not exists public.user_settings (
    id            uuid        primary key default gen_random_uuid(),
    user_id       uuid        not null unique references auth.users(id) on delete cascade,
    vale_email    text        not null,
    vale_password text        not null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tabela: robot_jobs
-- Histórico de execuções do robô (uma linha por disparo).
-- ---------------------------------------------------------------------
create table if not exists public.robot_jobs (
    id           uuid        primary key default gen_random_uuid(),
    user_id      uuid        not null references auth.users(id) on delete cascade,
    data_coleta  text        not null,
    status       text        not null default 'queued',
    progresso    int                  default 0,
    mensagem     text,
    filename     text,
    modo_coleta  text        not null default 'somente_novos',
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- Índice para listar/filtrar jobs por tenant + status
create index if not exists idx_robot_jobs_user_status
    on public.robot_jobs (user_id, status);

-- ---------------------------------------------------------------------
-- Tabela: eventos_coletados
-- Eventos de cotação extraídos do portal Vale.
-- ---------------------------------------------------------------------
create table if not exists public.eventos_coletados (
    id             uuid        primary key default gen_random_uuid(),
    user_id        uuid        not null references auth.users(id) on delete cascade,
    job_id         uuid        references public.robot_jobs(id) on delete set null,
    numero_evento  text        not null,
    uf             text,
    data_evento    text,
    descricao      text,
    quantidade     text,
    unidade        text,
    created_at     timestamptz not null default now(),
    -- Garante que cada tenant tenha cada numero_evento apenas uma vez
    constraint uq_eventos_user_numero unique (user_id, numero_evento)
);

-- Índice de apoio para o lookup de "já existe" no modo somente_novos
create index if not exists idx_eventos_user_numero
    on public.eventos_coletados (user_id, numero_evento);

-- ---------------------------------------------------------------------
-- Trigger: atualizar updated_at automaticamente
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
    before update on public.user_settings
    for each row
    execute function public.set_updated_at();

drop trigger if exists trg_robot_jobs_updated_at on public.robot_jobs;
create trigger trg_robot_jobs_updated_at
    before update on public.robot_jobs
    for each row
    execute function public.set_updated_at();
