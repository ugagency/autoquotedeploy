# Supabase — Setup do AutoQuote

Este diretório contém as migrations SQL que criam todo o backbone do AutoQuote
no Supabase: tabelas, RLS multi-tenant e bucket de Storage.

> **Importante:** o setup é feito direto pelo **SQL Editor do Dashboard**.
> Não usamos a Supabase CLI nesta sprint.

---

## 1. Criar o projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard) e clique em **New project**.
2. Preencha:
   - **Name:** `autoquote` (ou outro nome de sua preferência)
   - **Database Password:** gere uma senha forte e guarde em local seguro
   - **Region:** escolha a região mais próxima dos usuários (ex.: `South America (São Paulo)`)
   - **Pricing Plan:** Free é suficiente para começar
3. Aguarde ~2 minutos enquanto o Supabase provisiona o projeto.

---

## 2. Rodar as migrations no SQL Editor (na ordem)

No menu lateral do Dashboard, vá em **SQL Editor → New query** e execute os
arquivos abaixo **na ordem**, um por vez. Para cada um: cole o conteúdo,
clique em **Run** (ou `Ctrl+Enter`) e confirme que apareceu *Success*.

| Ordem | Arquivo | O que faz |
|-------|---------|-----------|
| 1 | [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql) | Cria as tabelas `user_settings`, `robot_jobs` e `eventos_coletados`, índices, UNIQUE e triggers de `updated_at`. |
| 2 | [`migrations/002_rls_policies.sql`](migrations/002_rls_policies.sql) | Habilita RLS nas 3 tabelas e cria a política `tenant_isolation` (`auth.uid() = user_id`). |
| 3 | [`migrations/003_storage.sql`](migrations/003_storage.sql) | Cria o bucket privado `planilhas` e a política que isola cada tenant em sua própria pasta. |

Validação rápida após rodar os 3:

- **Database → Tables**: devem aparecer `user_settings`, `robot_jobs`, `eventos_coletados` com o cadeado de RLS verde.
- **Storage → Buckets**: deve aparecer `planilhas` (private).
- **Authentication → Policies**: cada tabela deve ter uma policy `tenant_isolation`.

---

## 3. Desabilitar confirmação de email

O AutoQuote não tem auto-cadastro público — usuários são criados manualmente
pelo administrador. Para evitar o fluxo de e-mail de confirmação:

1. Vá em **Authentication → Providers → Email**.
2. Desmarque **Confirm email** (ou *Enable email confirmations*).
3. Clique em **Save**.

> Em **Authentication → URL Configuration**, deixe a *Site URL* apontando
> para o domínio do frontend (em dev: `http://localhost:3000`).

---

## 4. Criar o primeiro usuário manualmente

1. Vá em **Authentication → Users → Add user → Create new user**.
2. Preencha:
   - **Email:** ex. `admin@empresa.com`
   - **Password:** senha forte
   - **Auto Confirm User:** ✅ marcado (já que o e-mail de confirmação está desativado)
3. Clique em **Create user**.

Esse usuário poderá fazer login em `/login` no frontend e, em seguida, salvar
suas credenciais Vale pelo modal de configurações (gravando em `user_settings`).

---

## 5. Copiar as chaves para o `.env`

No Dashboard, abra **Project Settings → API**. Copie os valores e cole no
arquivo `.env` (use o [`.env.example`](../.env.example) da raiz como base):

| Campo no Dashboard | Variável no `.env` |
|---|---|
| Project URL | `SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL` |
| Project API keys → `anon` `public` | `SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project API keys → `service_role` (secret) | `SUPABASE_SERVICE_ROLE_KEY` *(somente backend)* |
| JWT Settings → JWT Secret | `SUPABASE_JWT_SECRET` *(somente backend)* |

> ⚠️ A **Service Role Key** e o **JWT Secret** **nunca** podem ir para o
> frontend nem para repositórios públicos. Eles ficam apenas no backend
> (Railway, variáveis de ambiente do serviço) e no `.env` local.

---

## 6. Pronto

Com os 3 SQLs rodados, a confirmação de email desligada, o primeiro usuário
criado e as chaves no `.env`, o Supabase está pronto para a Sprint 2
(backend FastAPI) e Sprint 3 (frontend Next.js).
