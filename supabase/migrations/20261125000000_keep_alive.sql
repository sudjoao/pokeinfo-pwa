-- Consulta mínima para manter o projeto Free ativo (o Supabase pausa projetos com uma semana de
-- pouca atividade no banco). Chamada pelo workflow .github/workflows/keepalive.yml com a chave
-- publicável, sem sessão: não lê nem escreve nada além da hora do servidor.
create function public.keep_alive()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

comment on function public.keep_alive() is
  'Consulta vazia para gerar atividade no banco (keep-alive do plano Free).';

revoke execute on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
