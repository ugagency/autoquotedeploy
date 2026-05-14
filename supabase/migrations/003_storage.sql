-- =====================================================================
-- AutoQuote — Migration 003: Storage
-- Cria o bucket privado 'planilhas' e a política de acesso
-- onde cada tenant só lê/escreve dentro da própria pasta.
-- Estrutura esperada: planilhas/{user_id}/{filename}.xlsx
-- =====================================================================

-- ---------------------------------------------------------------------
-- Bucket privado 'planilhas'
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('planilhas', 'planilhas', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Política de isolamento: tenant só acessa objetos cuja primeira pasta
-- (storage.foldername(name))[1] seja igual ao seu próprio auth.uid().
-- ---------------------------------------------------------------------
drop policy if exists "tenant_storage" on storage.objects;
create policy "tenant_storage" on storage.objects
    for all
    using (
        bucket_id = 'planilhas'
        and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'planilhas'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
