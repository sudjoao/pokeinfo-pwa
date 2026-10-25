# Conta Google e sincronização (Supabase)

O login com o Google e a sincronização entre aparelhos usam o [Supabase](https://supabase.com/)
(Auth + Postgres). Não há servidor próprio: o app fala direto com a API do Supabase, e quem
garante que cada pessoa só acessa os próprios dados é a **Row Level Security** da tabela.

Sem as variáveis `VITE_SUPABASE_*`, o app funciona como antes (tudo só no aparelho) e o item
"Entrar com o Google" não aparece.

## Como funciona

- **Local-first**: capturados, shinies, favoritos, caçadas e o Pokémon do dia continuam sendo lidos e
  gravados no `localStorage`. A conta recebe uma cópia em segundo plano; o app nunca espera a rede.
- **Uma linha por usuário** em `public.user_collections`, com o mesmo formato do backup
  (`BackupData`, bitsets em base64): a coleção inteira tem poucos KB, então cada sincronização é
  uma leitura e, se algo mudou, uma escrita.
- **Mescla de 3 vias** (`src/utils/sync.ts`): o aparelho guarda a `base` (o que os dois lados tinham
  na última sincronização, em `pokeinfo:sync:v1`). Com ela dá para saber quem acrescentou e quem
  removeu cada marcação, e edições feitas sem internet no Mac e no iPhone entram todas.
- **Trava otimista**: a coluna `version` é incrementada por trigger no servidor. O app grava
  `where version = <a que leu>`; se outro aparelho gravou antes, relê, mescla e tenta de novo.
- **Quando sincroniza**: ao abrir o app com sessão salva, 2 s depois de cada marcação, ao voltar
  para o app (se a última sincronização tiver mais de 30 s), ao sair dele com algo pendente e quando
  a internet volta. Falhas tentam de novo em 15 s, 1 min e 5 min.
- **Primeiro login num aparelho** que já tem dados, com uma conta que também tem: o app pergunta se
  soma os dois, usa só a conta ou usa só o aparelho.
- **SDK sob demanda**: o `@supabase/supabase-js` (~55 KB gz) só é baixado por quem tem sessão salva
  ou toca em "Entrar".

### Segurança

- Login pelo fluxo **PKCE**: o código que volta do Google só vira sessão com o verificador guardado
  neste navegador; a tela `/auth/callback` faz a troca e tira o código da URL.
- RLS em todas as operações (`auth.uid() = user_id`), nada liberado para `anon`; `user_id`, `version`
  e `updated_at` não podem ser forjados (trigger); `data` precisa ser um objeto JSON de até 128 KB.
- O app valida tudo o que vem da conta (`parseBackupData`) antes de usar.
- O destino depois do login só aceita caminhos do próprio app (`safeNextPath`, sem redirecionamento
  aberto).
- **Excluir conta** (LGPD) chama `delete_account()`, que apaga só quem chama: o usuário do Auth e,
  em cascata, a coleção.
- A chave publicável vai no bundle por design; a `service_role`/secret **nunca** entra no app.

As regras foram testadas num Postgres local (inserir/ler/alterar linha de outro usuário, forjar
versão, trocar o dono da linha, payload grande, acesso anônimo, exclusão em cascata).

## Configuração (uma vez)

### 1. Projeto no Supabase

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard) (região
   **South America (São Paulo)** para menor latência).
2. Aplique a migration `migrations/20261025000000_user_collections.sql`:
   - pelo **SQL Editor** (colar o arquivo e rodar), ou
   - pela CLI: `npx supabase login`, `npx supabase link --project-ref <ref>` e `npx supabase db push`.
3. Em **Authentication > Sign In / Providers**, desligue **Email** e **Anonymous** (o app só usa o
   Google; deixar o e-mail ligado permitiria criar contas por senha pela API).

### 2. Cliente OAuth no Google Cloud

1. Em [console.cloud.google.com](https://console.cloud.google.com/), crie (ou escolha) um projeto.
2. **Google Auth Platform > Branding**: nome "PokeInfo", e-mail de suporte, logo opcional e, em
   domínios autorizados, o domínio do app na Vercel e `supabase.co`.
3. **Audience**: tipo **External** e **Publish app** (com só `openid`, `email` e `profile` não
   precisa de verificação do Google).
4. **Clients > Create client > Web application**:
   - *Authorized JavaScript origins*: `https://<seu-app>.vercel.app` e `http://localhost:5173`.
   - *Authorized redirect URIs*: `https://<ref>.supabase.co/auth/v1/callback` (o callback é do
     Supabase, não do app).
5. Copie o **Client ID** e o **Client secret**.

### 3. Ligar o Google no Supabase

1. **Authentication > Sign In / Providers > Google**: ative e cole o Client ID e o secret.
2. **Authentication > URL Configuration**:
   - *Site URL*: `https://<seu-app>.vercel.app`
   - *Redirect URLs*: `https://<seu-app>.vercel.app/auth/callback`,
     `http://localhost:5173/auth/callback` e `http://localhost:4173/auth/callback` (e, se quiser
     testar previews da Vercel, `https://*-<sua-conta>.vercel.app/auth/callback`).

### 4. Variáveis de ambiente

Em **Project Settings > API Keys** copie a URL do projeto e a **publishable key**
(`sb_publishable_...`; em projetos antigos, a `anon` key também funciona).

- **Vercel** (Settings > Environment Variables, Production e Preview): `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY`. Faça um novo deploy (o Vite embute as variáveis no build).
- **Local**: copie `.env.example` para `.env.local` e preencha.

## Desenvolvimento local

Com Docker, `npx supabase start` sobe Postgres, Auth e a API em `http://127.0.0.1:54321` já com a
migration aplicada (`config.toml` desliga Realtime, Storage e Analytics, que o app não usa).
`npx supabase status -o env` mostra a `API_URL` e a `PUBLISHABLE_KEY` para o `.env.local`.

O Google fica desligado localmente. Para testar o login de verdade, crie outro cliente OAuth com o
redirect `http://127.0.0.1:54321/auth/v1/callback`, exporte
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` e `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` e mude
`[auth.external.google] enabled` para `true`.

## Limitações

- No iPhone, o login precisa ser feito pelo app instalado e concluído na mesma janela: se o Google
  abrir no Safari (fora do app), o verificador PKCE não está lá e a tela de retorno mostra o erro.
- Não sincronizam (de propósito): tema, idioma, som, recentes e o recorde do quiz, que são do
  aparelho; o time continua só na URL.
- A sincronização não é em tempo real (sem websocket): o outro aparelho recebe as mudanças ao abrir
  o app ou voltar para ele.
