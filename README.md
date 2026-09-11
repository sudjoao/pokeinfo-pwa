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
  (`?game=sword-shield&dex=crown-tundra&q=snom`). Ao abrir um Pokémon a partir de um jogo, a tela
  de detalhes mostra o número regional e o anterior/próximo seguem a ordem da Pokédex daquele jogo.
- Cards no padrão **Material Design 3** com artwork oficial, número, nome e tipos traduzidos.
- **Tela de detalhes** (`/pokemon/:id`, aceita número ou nome): artwork, categoria da espécie,
  descrição da Pokédex, altura/peso, gênero, grupos de ovo, habilidades (com a oculta marcada),
  stats base com barras, formas alternativas e navegação anterior/próximo.
- **Cadeia de evolução** com o "como evoluir" em português para todos os gatilhos da PokéAPI
  (nível, item, troca, amizade, local, hora do dia, golpe conhecido, stats, formas regionais…).
  O método padrão dos jogos atuais fica em destaque; métodos de jogos antigos ficam recolhidos.
- **Grito do Pokémon** ao abrir a tela de detalhes (com botão para repetir e para silenciar).
- **Filtro por tipo**: chip "Tipo" abre um seletor com os 18 tipos; dá para escolher até dois
  (o Pokémon precisa ter os dois, ex.: Água/Terra). Combina com jogo, busca e captura e vai na URL
  (`?type=water,ground`). Não faz requisição: usa o mapa de tipos que já fica em cache.
- **Team builder** (`/team`): monte um time de até 6 Pokémon tocando nos cards da mesma listagem
  filtrada (jogo, Pokédex, tipo, busca, capturados), e veja na aba *Análise* as fraquezas do time,
  a tabela defensiva (quanto cada tipo de ataque causa em cada membro) e a cobertura ofensiva por
  STAB (tipos que o time acerta de forma super efetiva e os que ficam sem cobertura). O time não é
  salvo: fica só na URL (`/team?game=scarlet-violet&team=906,909,912`), o que sobrevive a recarregar
  e permite compartilhar o link. A tabela de tipos é a atual (6ª geração em diante) e fica em
  `src/data/typeChart.ts`.
- **Exclusivos de versão**: com um jogo de duas versões selecionado (Sword/Shield, Scarlet/Violet…),
  o card mostra um selo "Só Sword" quando a espécie só existe naquela versão, e a chip "Versão" abre
  um seletor com três grupos que cobrem a Pokédex inteira: "Sword e Shield", "Só Sword" e "Só Shield",
  cada um com a contagem da Pokédex atual. Dá para marcar um ou mais grupos; sem marcação aparecem
  todos (`?versions=both,sword`). A tela de detalhes mostra a mesma informação no hero. Funciona também no team builder. A lista é estática
  (`src/data/exclusives.ts`, gerada a partir da Bulbapedia), porque a PokéAPI não tem esse dado:
  os encontros por área são incompletos nas gerações 8 e 9 e não cobrem presentes, fósseis e evoluções.
- **Capturados por jogo**: com um jogo selecionado, cada card ganha uma Poké Bola para marcar o
  Pokémon como capturado naquele jogo (também no hero da tela de detalhes). Chips "Capturados" e
  "Faltam" filtram a lista e mostram a contagem da Pokédex atual; o filtro vai na URL (`?caught=0`).
  A marcação é por espécie, então as ilhas de Alola e as formas regionais compartilham o mesmo
  estado dentro de um jogo. Fica salva no aparelho em um bitset base64 (~170 bytes por jogo).
- **Idioma**: botão no cabeçalho alterna entre *Português* (interface em pt-BR, com os textos que só
  existem em inglês na PokéAPI mantidos assim) e *English* (tudo em inglês, inclusive tipos, stats,
  grupos de ovo e as frases de evolução). Começa no idioma do aparelho e a escolha fica salva.
- Tema claro/escuro seguindo a preferência do sistema.
- **Offline**: índice e mapa de tipos ficam em cache local; artworks e respostas recentes ficam no service worker.
- Instalável no iOS/Android como app (manifest + service worker).

### Limitações conhecidas

- A PokéAPI não tem textos em português: mesmo no modo *Português*, descrição da Pokédex, categoria
  da espécie, nomes de habilidades, golpes, itens e locais ficam em inglês (como nos jogos).
- A lista de jogos é estática (`src/data/games.ts`): quando a PokéAPI incluir um jogo novo, é preciso
  adicioná-lo ali. Versões japonesas, Colosseum/XD (sem Pokédex) e jogos fora da série principal
  ficam de fora; DLCs aparecem como Pokédex do jogo base.
- Na Pokédex de Alola o app mostra a forma de Alola mesmo quando a forma de Kanto também é obtível.
- As marcações de captura ficam só no aparelho (não há conta nem sincronização entre Mac e iPhone).
- Os exclusivos de versão são por espécie: uma espécie com uma forma em cada versão (Basculin,
  Tauros de Paldea, Kyurem…) não conta como exclusiva. Exclusivos das DLCs e da White Forest entram
  no jogo base, e Red/Blue segue a distribuição internacional. Jogos de versão única (Yellow,
  Emerald, Platinum, Legends) não têm o filtro.
- A análise do time usa a tabela de tipos atual e os tipos atuais de cada Pokémon mesmo em jogos
  antigos (ex.: Clefairy conta como Fada em Red/Blue). A cobertura ofensiva olha só os tipos do
  próprio Pokémon (STAB), não os golpes que ele aprende, e cada tipo defensor isolado.
- Os gritos vêm só em `.ogg` (Vorbis). Safari toca a partir do macOS 14.1 / iOS 17.4 (suporte
  completo no 18.4); em navegadores sem suporte o botão de som não aparece. No iOS o áudio só
  toca depois de um toque do usuário, por isso o grito é disparado no toque do card, e o botão
  lateral de silencioso do iPhone também silencia o app.
- O grito é baixado com `fetch` e tocado por blob, em vez de apontar o `<audio>` para a URL:
  o Safari pede mídia por faixas (`Range`) e o cache do service worker guardaria só a primeira
  resposta parcial, deixando o som mudo nas próximas visitas.

### Roadmap

- Fraquezas e resistências na tela de detalhes (a tabela já existe em `data/typeChart.ts`).
- Descrição das habilidades.
- Exportar/importar as marcações de captura (backup em JSON).
- Favoritos.

## Tecnologias

| Camada | Ferramenta |
| --- | --- |
| Framework | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) e TypeScript |
| Build | [Vite 8](https://vite.dev/) |
| UI / Material Design | [Vuetify 4](https://vuetifyjs.com/) com ícones SVG de [`@mdi/js`](https://pictogrammers.com/library/mdi/) |
| Estado | [Pinia](https://pinia.vuejs.org/) |
| Idiomas | [vue-i18n](https://vue-i18n.intlify.dev/) (mensagens em `src/locales`, pré-compiladas pelo `unplugin-vue-i18n`) |
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
  data/typeChart.ts           # tabela de efetividade de tipos (estática, 6ª geração em diante)
  data/exclusives.ts          # exclusivos de versão por jogo (estático, ids de espécie)
  services/pokeapi/           # cliente HTTP, DTOs da PokéAPI e mapeamento para o domínio
    pokemon.service.ts        #   índice, resumo e detalhe do Pokémon
    pokedex.service.ts        #   entradas de uma Pokédex regional (número no jogo + espécie)
    species.service.ts        #   espécie (descrição, gênero, grupos de ovo, formas)
    evolution.service.ts      #   cadeia de evolução -> árvore com métodos descritos
  utils/
    pokemon.ts                # formatação, URLs de artwork e de grito, cores dos tipos, stats
    evolution.ts              # regras "como evoluir" em pt-BR (gatilhos + condições)
    games.ts                  # busca de jogo/dex, agrupamento por geração, formas regionais
    typeChart.ts              # multiplicadores, fraquezas do time e cobertura ofensiva
    exclusives.ts             # versão exclusiva de uma espécie dentro de um jogo
    storage.ts
  stores/
    pokedex.ts                # Pinia: índice + cache de resumos (persistido) e Pokédex regionais (memória)
    pokemonDetail.ts          # Pinia: detalhes, espécies e cadeias (só em memória)
  composables/
    usePokemonList.ts         # busca + filtros (jogo, captura, tipo, versão) + lotes do scroll infinito
    useTeam.ts                # time de até 6 na URL (?team=) e análise de tipos
    usePokemonDetail.ts       # carrega detalhe -> espécie -> cadeia, reage à rota e ao jogo (?game=)
    useCry.ts                 # áudio único compartilhado, desbloqueado no gesto do usuário
    useDebouncedRef.ts
  components/
    atoms/                    # TypeChip, TypeToggle, MultiplierBadge, PokemonArtwork, PokemonAvatar,
                              # DexNumber, StatBar, InfoTile, CryButton, CatchToggle
    molecules/                # PokemonCard, SearchField, GameFilterChip, TypeFilterChip, DexChips,
                              # CaughtFilterChips, VersionFilterChip, TeamSlot, EmptyState, PokemonHero, AboutGrid,
                              # AbilityList, StatsList, EvolutionStage, EvolutionMethod, VarietyChips
    organisms/                # AppHeader, ListFilters, PokemonGrid, GamePickerSheet, TypePickerSheet, VersionPickerSheet,
                              # LanguageSheet, TeamBench, TeamAnalysis, TeamDefenseTable, TeamCoverage,
                              # EvolutionChain, EvolutionBranch (recursivo)
    templates/                # DefaultLayout (home) e DetailLayout (voltar + ações + filtros)
  views/
    HomeView.vue              # página inicial (fica em KeepAlive para preservar o scroll)
    PokemonDetailView.vue     # página de detalhes
    TeamView.vue              # team builder (mesma listagem da Home + time + análise)
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
| `localStorage` | índice (`pokeinfo:index:v1`, ~40 KB) e mapa de tipos (`pokeinfo:types:v1`, ~16 KB) | ~60 KB para a Pokédex inteira |
| `localStorage` | capturados por jogo (`pokeinfo:caught:v1`), um bitset em base64 por jogo | ~170 bytes por jogo (~4 KB no total) |
| Service worker `pokeapi-index` | resposta do índice | 3 entradas, 7 dias |
| Service worker `pokeapi-types` | os 18 `/type/{nome}` que montam o mapa de tipos (~20 KB cada) | 24 entradas, 30 dias |
| Service worker `pokeapi-pokedex` | Pokédex regionais por jogo (12 a 45 KB) | 12 entradas, 30 dias |
| Service worker `pokeapi-species` | espécies e cadeias de evolução (~2 a 50 KB) | 100 entradas, 7 dias |
| Service worker `pokeapi-detail` | respostas de detalhe da PokéAPI (~300 KB cada) | 60 entradas, 7 dias |
| Service worker `pokeapi-artwork` | artworks oficiais | 200 entradas, 30 dias |
| Service worker `pokeapi-cries-v2` | gritos dos Pokémon (~7 KB cada) | 60 entradas, 30 dias |

Os cards não fazem requisição por Pokémon: os tipos vêm de um mapa montado uma vez a partir dos
18 endpoints `/type/{nome}` (~385 KB no total, renovado em segundo plano a cada 7 dias). Ler os tipos
de `/pokemon/{id}` custaria ~290 KB por card, quase tudo lista de golpes. Só um Pokémon que não
esteja no mapa (lançado depois do cache) dispara uma busca individual.

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
