# PokéInfo

Pokédex em formato de **PWA** (Progressive Web App) para consultar informações sobre Pokémon:
tipos, número na Pokédex, stats, habilidades e cadeias de evolução. Feita para ser instalada
na tela inicial do iPhone e funcionar mesmo offline, consumindo dados da [PokéAPI](https://pokeapi.co/).

## Funcionalidades

- Listagem de todos os Pokémon com **scroll infinito** (lotes de 24).
- **Busca** por nome (parcial, ex.: `pika`) ou por número da Pokédex (ex.: `25`), refletida na URL (`?q=pika`).
- **Pokédex por jogo**: escolha um jogo da série principal (de Red/Blue a Legends: Z-A) e veja a
  Pokédex regional dele na ordem do jogo, com o número regional em destaque e o nacional ao lado.
  Jogos com mais de uma Pokédex (Kalos, ilhas de Alola, DLCs de Galar e Paldea…) ganham chips para
  alternar entre elas. Nas regiões com formas regionais (Alola, Galar, Hisui, Paldea) o card já
  mostra a forma daquela região. A busca numérica passa a usar o número regional. Tudo fica na URL
  (`?game=sword-shield&dex=crown-tundra&q=snom`).
- Cards no padrão **Material Design 3** com artwork oficial, número, nome e tipos traduzidos.
- **Tela de detalhes** (`/pokemon/:id`, aceita número ou nome): artwork, categoria da espécie,
  descrição da Pokédex, altura/peso, gênero, grupos de ovo, habilidades (com a oculta marcada),
  stats base com barras, formas alternativas e navegação anterior/próximo.
- **Cadeia de evolução** com o "como evoluir" em português para todos os gatilhos da PokéAPI
  (nível, item, troca, amizade, local, hora do dia, golpe conhecido, stats, formas regionais…).
  O método padrão dos jogos atuais fica em destaque; métodos de jogos antigos ficam recolhidos.
- **Grito do Pokémon** ao abrir a tela de detalhes (com botão para repetir e para silenciar).
- Tema claro/escuro seguindo a preferência do sistema.
- **Offline**: índice e resumos ficam em cache local; artworks e respostas recentes ficam no service worker.
- Instalável no iOS/Android como app (manifest + service worker).

### Limitações conhecidas

- A PokéAPI não tem textos em português: descrição da Pokédex, categoria da espécie, nomes de
  habilidades, golpes e locais aparecem em inglês. Itens de evolução comuns são traduzidos no app.
- A lista de jogos é estática (`src/data/games.ts`): quando a PokéAPI incluir um jogo novo, é preciso
  adicioná-lo ali. Versões japonesas, Colosseum/XD (sem Pokédex) e jogos fora da série principal
  ficam de fora; DLCs aparecem como Pokédex do jogo base.
- Na Pokédex de Alola o app mostra a forma de Alola mesmo quando a forma de Kanto também é obtível.
- Os gritos vêm só em `.ogg` (Vorbis). Safari toca a partir do macOS 14.1 / iOS 17.4 (suporte
  completo no 18.4); em navegadores sem suporte o botão de som não aparece. No iOS o áudio só
  toca depois de um toque do usuário, por isso o grito é disparado no toque do card, e o botão
  lateral de silencioso do iPhone também silencia o app.
- O grito é baixado com `fetch` e tocado por blob, em vez de apontar o `<audio>` para a URL:
  o Safari pede mídia por faixas (`Range`) e o cache do service worker guardaria só a primeira
  resposta parcial, deixando o som mudo nas próximas visitas.

### Roadmap

- Fraquezas e resistências por tipo.
- Descrição das habilidades.
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
  data/games.ts               # jogos da série principal e as Pokédex regionais de cada um
  services/pokeapi/           # cliente HTTP, DTOs da PokéAPI e mapeamento para o domínio
    pokemon.service.ts        #   índice, resumo e detalhe do Pokémon
    pokedex.service.ts        #   entradas de uma Pokédex regional (número no jogo + espécie)
    species.service.ts        #   espécie (descrição, gênero, grupos de ovo, formas)
    evolution.service.ts      #   cadeia de evolução -> árvore com métodos descritos
  utils/
    pokemon.ts                # formatação, URLs de artwork e de grito, cores dos tipos, stats
    evolution.ts              # regras "como evoluir" em pt-BR (gatilhos + condições)
    games.ts                  # busca de jogo/dex, agrupamento por geração, formas regionais
    storage.ts
  stores/
    pokedex.ts                # Pinia: índice + cache de resumos (persistido) e Pokédex regionais (memória)
    pokemonDetail.ts          # Pinia: detalhes, espécies e cadeias (só em memória)
  composables/
    usePokemonList.ts         # busca + filtro por jogo + lotes do scroll infinito
    usePokemonDetail.ts       # carrega detalhe -> espécie -> cadeia, reage à rota
    useCry.ts                 # áudio único compartilhado, desbloqueado no gesto do usuário
    useDebouncedRef.ts
  components/
    atoms/                    # TypeChip, PokemonArtwork, DexNumber, StatBar, InfoTile, CryButton
    molecules/                # PokemonCard, SearchField, GameFilterChip, DexChips, EmptyState,
                              # PokemonHero, AboutGrid, AbilityList, StatsList, EvolutionStage,
                              # EvolutionMethod, VarietyChips
    organisms/                # AppHeader, PokemonGrid, GamePickerSheet, EvolutionChain,
                              # EvolutionBranch (recursivo)
    templates/                # DefaultLayout (home) e DetailLayout (voltar + ações)
  views/
    HomeView.vue              # página inicial (fica em KeepAlive para preservar o scroll)
    PokemonDetailView.vue     # página de detalhes
```

### Fluxo de dados

1. A página carrega **uma vez** o índice completo da Pokédex (`/pokemon?limit=100000`, ~110 KB) e guarda `{ id, name }` de cada Pokémon.
2. A busca filtra esse índice localmente, sem novas requisições.
   Com um jogo selecionado, a fonte da lista passa a ser a Pokédex regional (`/pokedex/{slug}`,
   uma requisição de 12 a 45 KB por dex), e as formas regionais são resolvidas a partir do
   próprio índice (ex.: `zorua` na dex de Hisui vira `zorua-hisui`).
3. O scroll infinito pede os resumos do próximo lote (`/pokemon/{id}`) apenas para os que ainda não estão em cache, e guarda só um objeto enxuto (`id`, `name`, `types`).
4. O artwork é montado a partir do id, sem depender do JSON de detalhe.
5. A tela de detalhes busca `/pokemon/{id}`, depois `/pokemon-species/{id}` e
   `/evolution-chain/{id}`; os tipos dos estágios da evolução vêm do cache de resumos.
   A URL do grito também é derivada do id, o que permite tocá-lo ainda no toque do card.

### Estratégia de cache

O objetivo é funcionar offline sem inflar o armazenamento do usuário:

| Onde | O que | Limite |
| --- | --- | --- |
| `localStorage` | índice (`pokeinfo:index:v1`) e resumos enxutos (`pokeinfo:summaries:v1`) | ~200 KB para a Pokédex inteira |
| Service worker `pokeapi-index` | resposta do índice | 3 entradas, 7 dias |
| Service worker `pokeapi-pokedex` | Pokédex regionais por jogo (12 a 45 KB) | 12 entradas, 30 dias |
| Service worker `pokeapi-species` | espécies e cadeias de evolução (~2 a 50 KB) | 100 entradas, 7 dias |
| Service worker `pokeapi-detail` | respostas de detalhe da PokéAPI (~300 KB cada) | 60 entradas, 7 dias |
| Service worker `pokeapi-artwork` | artworks oficiais | 200 entradas, 30 dias |
| Service worker `pokeapi-cries-v2` | gritos dos Pokémon (~7 KB cada) | 60 entradas, 30 dias |

Detalhes, espécies e cadeias ficam só em memória durante a sessão (store `pokemonDetail`),
assim como as entradas das Pokédex regionais (store `pokedex`); nada disso vai para o `localStorage`.

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
