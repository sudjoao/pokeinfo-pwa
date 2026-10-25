# Segurança

## Como relatar uma falha

Use o **relato privado** do GitHub: aba [Security > Report a vulnerability](https://github.com/sudjoao/pokeinfo-pwa/security/advisories/new).
Não abra issue pública para falhas que ainda não foram corrigidas. Resposta em até 7 dias.

Ajuda muito saber: o que dá para fazer, em qual tela ou URL, passos para reproduzir e o navegador.

## O que está no escopo

- O app em https://pokeinfo-pwa.vercel.app (web e PWA instalado) e este repositório.
- A conta e a sincronização: as regras de acesso (RLS) de `supabase/migrations`.

Fora do escopo: a PokéAPI, o wsrv.nl, o Supabase e o Google em si (relate a eles), ataques de
negação de serviço e relatórios automáticos sem prova de impacto.

## Como o app se protege

Resumo do que está no [README](README.md#segurança): Content Security Policy gerada no build,
cabeçalhos de segurança na Vercel, validação de tudo o que vem de fora do aparelho (backup, links,
conta e PokéAPI), login Google por PKCE e Row Level Security em todas as operações do banco.
Dependências conferidas no CI (`npm audit`, assinaturas do registro), CodeQL e Dependabot.
