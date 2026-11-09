# AGENTS.md

Contexto inicial para agentes de código. Detalhes completos (funcionalidades, cache, segurança,
deploy) estão no [README.md](README.md); aqui fica só o que é preciso para começar a trabalhar.

## O projeto

**PokeInfo** é uma Pokédex em formato de PWA (feita para ser instalada no iPhone e funcionar
offline). É uma SPA sem backend próprio: os dados vêm da [PokéAPI](https://pokeapi.co/) REST e de
arquivos gerados em build; a conta Google e a sincronização entre aparelhos (opcionais) usam o
Supabase direto do navegador. Deploy na Vercel.

## Stack

- **Vue 3** (Composition API + `<script setup>`) com **TypeScript**
- **Vite** (build) e **vite-plugin-pwa** (Workbox, service worker e caches de runtime)
- **Vuetify 4** (Material Design 3) com ícones SVG de **@mdi/js** (importar o ícone, não usar font)
- **Pinia** (estado), **Vue Router**, **vue-i18n** (pt-BR, en, es)
- **@supabase/supabase-js** (Auth Google + Postgres com RLS), carregado sob demanda
- **uqr** (QR code do backup)
- Qualidade: **Vitest**, **ESLint** + **oxlint**, **Prettier**, **vue-tsc**

## Comandos

```sh
npm run dev          # servidor de desenvolvimento
npm test             # vitest run
npm run type-check   # vue-tsc --build
npm run lint         # oxlint + eslint (com --fix)
npm run format       # prettier em src/
npm run build        # type-check + build de produção em dist/
npm run preview      # serve o build (necessário para testar o service worker)
```

O CI (`.github/workflows/ci.yml`) roda `npm audit`, oxlint, eslint, type-check, testes e build.
Antes de dar algo por pronto, rode pelo menos `npm run type-check`, `npm test` e `npm run lint`.

## Estrutura

```
src/
  components/     # Atomic Design: atoms/, molecules/, organisms/, templates/
  views/          # páginas (rotas); só elas acessam os stores
  composables/    # lógica reativa reutilizável (useXxx.ts)
  stores/         # Pinia
  services/
    pokeapi/      # cliente HTTP, DTOs e mapeamento PokéAPI -> domínio (*.service.ts)
    cloud/        # cliente Supabase e sincronização da coleção
  utils/          # funções puras (regras de negócio, formatação); maior parte dos testes
  data/           # dados estáticos escritos à mão (games.ts, typeChart.ts, routeOrder.ts...)
  data/generated/ # dados gerados por scripts/ (não editar à mão)
  locales/        # pt-BR.json (referência), en.json, es.json
  plugins/        # vuetify.ts, i18n.ts
  router/         # rotas (views carregadas sob demanda, exceto a Home)
  dev/            # ferramentas só do modo dev
build/            # plugins de build: CSP, purge de utilitários do Vuetify, pré-carga do idioma
scripts/          # geradores de dados (ver scripts/README.md) e notas de release
supabase/         # config e migrations (ver supabase/README.md)
```

## Convenções

- **Arquitetura**: componentes seguem Atomic Design. Dados e regras ficam fora dos componentes
  (services, stores, composables, utils). Só a view fala com o store; os demais componentes
  recebem tudo por props e se comunicam por emits.
- **Estilo**: Prettier sem ponto e vírgula, aspas simples, 100 colunas. Alias `@/` para `src/`.
- **Idiomas**: todo texto de interface passa pelo vue-i18n. `pt-BR.json` é a referência de tipos;
  `en.json` e `es.json` precisam ter exatamente as mesmas chaves (o type-check acusa). Frases são
  montadas na exibição, não guardadas traduzidas. Textos vindos da PokéAPI ficam em inglês (a API
  não tem pt-BR).
- **Testes**: Vitest em ambiente `node`, sem DOM nem plugins do Vite. Ficam em
  `src/**/__tests__/*.spec.ts` e cobrem principalmente funções puras de `utils/`, `data/` e stores.
- **localStorage**: sempre por `readStorage`/`writeStorage` (`src/utils/storage.ts`), com chaves
  versionadas no formato `pokeinfo:<nome>:v1`. Guardar o mínimo (ex.: capturados como bitset em
  base64); detalhes da PokéAPI ficam só em memória e no cache do service worker.
- **Dados estáticos**: a lista de jogos (`src/data/games.ts`) é estática; jogo novo precisa ser
  adicionado ali. O que vem de `src/data/generated/` é regerado pelos scripts de `scripts/`.
- **Segurança**: a CSP é gerada no build (`build/contentSecurityPolicy.ts`); uma origem nova (API,
  CDN) precisa entrar em `SOURCES`. Sem `v-html`, `eval` ou `new Function` (o ESLint barra).
  Caminhos da PokéAPI montados com parâmetros passam pelo `SAFE_PATH` do cliente.
- **Acessibilidade**: o app é mantido sem violações do axe; preserve rótulos, foco e semântica ao
  mexer em componentes (ex.: em cards clicáveis, preferir a ação esticada a `v-card @click`).
- **Variáveis de ambiente**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`
  (ver `.env.example`). Sem elas o app funciona só no aparelho.

## Git e versões

- Commits no padrão Conventional Commits, em português, com escopo da área:
  `feat(home): ...`, `fix(rotas): ...`, `perf: ...`, `chore: release vX.Y.Z`.
- Branches por tipo: `feat/...`, `fix/...`, `perf/...`, `a11y/...`.
- Toda mudança visível ao usuário entra no `CHANGELOG.md` (Keep a Changelog, em pt-BR), na seção
  `## [Não lançado]`. O processo de release está no README (seção "Versões").
