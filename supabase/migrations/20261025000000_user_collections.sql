-- Coleção de cada usuário (capturados, shinies, favoritos, caçadas e Pokémon do dia) para
-- sincronizar entre aparelhos. Uma linha por usuário com o mesmo formato do backup do app
-- (`BackupData` em src/utils/backup.ts): os conjuntos já vão como bitsets em base64, então a linha
-- inteira tem poucos KB e o app lê e grava tudo numa requisição.
--
-- `version` é controlada pelo servidor (trigger abaixo) e serve de trava otimista: o app só grava
-- `where version = <a que ele leu>`; se outro aparelho gravou antes, o update não acha a linha e o
-- app relê, mescla e tenta de novo.

create table public.user_collections (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint user_collections_data_is_object check (jsonb_typeof(data) = 'object'),
  -- Uma coleção completa tem ~30 KB; o limite só barra abuso.
  constraint user_collections_data_size check (octet_length(data::text) <= 131072)
);

comment on table public.user_collections is
  'Coleção do PokeInfo por usuário (formato BackupData do app), sincronizada entre aparelhos.';

-- Versão e data sempre do servidor: o cliente não consegue voltar a versão nem forjar a data.
create function public.user_collections_bump_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
  else
    new.user_id := old.user_id;
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_collections_bump_version
before insert or update on public.user_collections
for each row execute function public.user_collections_bump_version();

-- Row Level Security: cada usuário só enxerga e altera a própria linha. Sem política para `anon`.
-- `(select auth.uid())` é avaliado uma vez por consulta, não por linha.
alter table public.user_collections enable row level security;

revoke all on public.user_collections from anon, public;
grant select, insert, update, delete on public.user_collections to authenticated;

create policy "Ler a própria coleção" on public.user_collections
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Criar a própria coleção" on public.user_collections
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Atualizar a própria coleção" on public.user_collections
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Apagar a própria coleção" on public.user_collections
for delete to authenticated
using ((select auth.uid()) = user_id);

-- Excluir a conta pelo app (LGPD): apaga o usuário do Auth e, em cascata, a coleção. Roda como o
-- dono da função (precisa de acesso a auth.users), mas só apaga quem está chamando.
create function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
