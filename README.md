# PokéInfo

Pokédex em formato de **PWA** (Progressive Web App) para consultar informações sobre Pokémon:
tipos, número na Pokédex e, em breve, detalhes e cadeias de evolução. Feita para ser instalada
na tela inicial do iPhone e funcionar mesmo offline, consumindo dados da [PokéAPI](https://pokeapi.co/).

## Funcionalidades

- Listagem de todos os Pokémon com **scroll infinito** (lotes de 24).
- **Busca** por nome (parcial, ex.: `pika`) ou por número da Pokédex (ex.: `25`), refletida na URL (`?q=pika`).
- Cards no padrão **Material Design 3** com artwork oficial, número, nome e tipos traduzidos.
- Tema claro/escuro seguindo a preferência do sistema.
- **Offline**: índice e resumos ficam em cache local; artworks e respostas recentes ficam no service worker.
- Instalável no iOS/Android como app (manifest + service worker).

### Roadmap

- Página de detalhes do Pokémon (stats, habilidades, altura/peso).
- Cadeia de evolução e como evoluir.
- Favoritos.

## Tecnologias

| Camada | Ferramenta |
| --- | --- |
| Framework | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) e TypeScript |
| Build | [Vite 8](https://vite.dev/) |
| UI / Material Design | [Vuetify 4](https://vuetifyjs.com/) com ícones SVG de [`@mdi/js`](https://pictogrammers.com/library/mdi/) |
| Estado | [Pinia](https://pinia.vuejs.org/) |
| Rotas | [Vue Router](https://router.vuejs.org/) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox) |
| Dados | [PokéAPI v2](https://pokeapi.co/docs/v2) |
| Qualidade | ESLint, oxlint, Prettier, vue-tsc |
| Deploy | [Vercel](https://vercel.com/) |

## Arquitetura

Os componentes seguem **Atomic Design**; dados e regras ficam fora dos componentes, em
services, store e composables. Só a view (página) fala com o store; os demais componentes
recebem tudo por props e se comunicam por emits.

```
src/
  plugins/vuetify.ts          # tema (cores, ícones, defaults do Material)
  types/pokemon.ts            # tipos de domínio (PokemonSummary, PokemonType…)
  services/pokeapi/           # cliente HTTP, DTOs da PokéAPI e mapeamento para o domínio
  utils/                      # helpers puros (formatação, URLs de artwork, cores dos tipos, storage)
  stores/pokedex.ts           # Pinia: índice da Pokédex + cache de resumos (persistido)
  composables/
    usePokemonList.ts         # busca + lotes do scroll infinito
    useDebouncedRef.ts
  components/
    atoms/                    # TypeChip, PokemonArtwork, DexNumber
    molecules/                # PokemonCard, PokemonCardSkeleton, SearchField, EmptyState
    organisms/                # AppHeader, PokemonGrid (scroll infinito)
    templates/                # DefaultLayout (app bar + área de conteúdo)
  views/HomeView.vue          # página inicial: orquestra busca, lista e estados vazios/erro
```

### Fluxo de dados

1. A página carrega **uma vez** o índice completo da Pokédex (`/pokemon?limit=100000`, ~110 KB) e guarda `{ id, name }` de cada Pokémon.
2. A busca filtra esse índice localmente, sem novas requisições.
3. O scroll infinito pede os resumos do próximo lote (`/pokemon/{id}`) apenas para os que ainda não estão em cache, e guarda só um objeto enxuto (`id`, `name`, `types`).
4. O artwork é montado a partir do id, sem depender do JSON de detalhe.

### Estratégia de cache

O objetivo é funcionar offline sem inflar o armazenamento do usuário:

| Onde | O que | Limite |
| --- | --- | --- |
| `localStorage` | índice (`pokeinfo:index:v1`) e resumos enxutos (`pokeinfo:summaries:v1`) | ~200 KB para a Pokédex inteira |
| Service worker `pokeapi-index` | resposta do índice | 3 entradas, 7 dias |
| Service worker `pokeapi-detail` | respostas de detalhe da PokéAPI (~200 KB cada) | 60 entradas, 7 dias |
| Service worker `pokeapi-artwork` | artworks oficiais | 200 entradas, 30 dias |

## Como rodar

Requer Node.js 22.18+ ou 24.12+.

```sh
npm install
npm run dev        # servidor de desenvolvimento
npm run build      # type-check + build de produção em dist/
npm run preview    # serve o build localmente (necessário para testar o service worker)
npm run lint       # oxlint + eslint
npm run type-check # vue-tsc
npm run format     # prettier
```

## Instalar no iPhone

1. Abra a URL do deploy no **Safari**.
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**.
3. O app abre em tela cheia (`display: standalone`), com ícone e splash próprios.

## Deploy

O projeto está configurado para a Vercel (`vercel.json`): rewrites para SPA, `sw.js` sem cache
e o content-type correto para o `manifest.webmanifest`. Basta conectar o repositório.

## Créditos

Dados e imagens fornecidos pela [PokéAPI](https://pokeapi.co/). Pokémon é marca registrada da
Nintendo/Creatures Inc./GAME FREAK inc.; este projeto é um estudo sem fins comerciais.
