# PokeInfo

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
- **Tela de detalhes** (`/pokemon/:id`, aceita número ou nome): artwork (com botão para ver a versão
  shiny), categoria da espécie, altura/peso, habilidades (com a oculta marcada), stats base com barras,
  formas alternativas e navegação anterior/próximo. Também:
  - **Pokédex por jogo**: com um jogo selecionado, o texto da Pokédex é o de uma versão dele; dá para
    abrir todas as entradas (textos repetidos entre versões aparecem uma vez só).
  - **Fraquezas e resistências** (4×, 2×, ½, ¼, imune) com a tabela de tipos da geração do jogo.
  - **Stats mínimos e máximos** nos níveis 50 e 100 (natureza, IV e EV extremos).
  - **Treino** (EVs ao derrotar, exp. base, taxa de captura, felicidade base, curva de crescimento)
    com a **calculadora de captura** (bola, HP, status, nível, turno; fórmula da geração do jogo, e a
    Repeat Ball usa o "capturado" do app) e **reprodução** (grupos de ovo, gênero, ciclos/passos e a lista de
    Pokémon compatíveis para cruzar, vinda de `/egg-group`).
  - **Habilidades**: tocar numa habilidade abre a descrição e todos os Pokémon que a têm.
  - **Golpes por jogo**: por nível, TM/HM, ovo, tutor e outros, com tipo, categoria, poder, precisão
    e PP do jogo escolhido (inclusive valores antigos, como Karate Chop Normal na 1ª geração). Os
    golpes já vêm em `/pokemon/{id}`; os dados de cada golpe ficam numa tabela gerada
    (`src/data/generated/moves.ts`), carregada num chunk próprio. Cada golpe é um link para a
    página dele.
  - **Sprites nos jogos** (da 1ª geração à atual, com shiny e GIFs animados), **itens segurados**
    pelos selvagens com a chance em cada versão (Light Ball: Sword 5% · Shield 1%) e **mudanças
    entre gerações** (tipos, habilidades e stats antigos, como Clefairy Normal até a 5ª geração),
    tudo do mesmo `/pokemon/{id}`, sem requisição a mais.
- **Cadeia de evolução** com o "como evoluir" em português para todos os gatilhos da PokéAPI
  (nível, item, troca, amizade, local, hora do dia, golpe conhecido, stats, formas regionais…).
  O método padrão dos jogos atuais fica em destaque; métodos de jogos antigos ficam recolhidos.
- **Grito do Pokémon**: começa desligado; o botão de som no cabeçalho liga os gritos ao abrir
  um Pokémon (um aviso aponta para ele na primeira visita). O alto-falante do detalhe toca sempre.
- **Onde encontrar**: a tela de detalhes lista os locais em que o Pokémon aparece, com método de
  encontro (grama, surf, pesca, presente, troca, raid…) e faixa de nível. Ao abrir a partir de um
  jogo, mostra só os locais daquele jogo (com um botão para ver os outros); sem jogo, agrupa por
  jogo em painéis. Quando o encontro só existe em uma das versões, a linha ganha o selo "Só Sword".
  Vem de `/pokemon/{id}/encounters` (uma requisição por Pokémon, só na tela de detalhes).
- **Filtro por tipo**: chip "Tipo" abre um seletor com os 18 tipos; dá para escolher até dois
  (o Pokémon precisa ter os dois, ex.: Água/Terra). Combina com jogo, busca e captura e vai na URL
  (`?type=water,ground`). Não faz requisição: usa o mapa de tipos que já fica em cache.
- **Filtros e ordenação** (chip "Filtros", também no team builder): ordenar por número, nome, total de
  stats, cada stat, altura ou peso (o card mostra o valor), e filtrar por geração, categoria
  (lendário, mítico, bebê, comum), "fraco a" um tipo (com a tabela da geração do jogo), habilidade,
  total mínimo e só favoritos. Tudo na URL (`?sort=total&desc=1&gen=1&cat=legendary`). Os stats e
  habilidades vêm de uma tabela gerada (~26 KB gz) baixada só quando algum desses filtros é usado.
- **Favoritos**: coração no detalhe; o menu tem o atalho "Favoritos" (`/?fav=1`).
- **Calculadora de tipos** (`/types`): defesa (até 2 tipos), ataque (1 tipo) e a tabela 18×18, com as
  tabelas da 1ª geração, da 2ª à 5ª e da 6ª em diante; tudo na URL para compartilhar o cálculo.
- **Comparar** (`/compare?ids=6,9,3`): até 3 Pokémon lado a lado (stats com o maior destacado, total,
  altura, peso, habilidades e fraquezas). O detalhe tem um botão que já abre a comparação com ele.
- **Golpes** (`/moves`): todos os golpes aprendíveis com busca, filtro por tipo e categoria e
  ordenação por poder, precisão ou PP, com os valores do jogo escolhido. O modo **Quem aprende**
  cruza até 4 golpes num jogo (Earthquake + Ice Beam em Scarlet/Violet). A página do golpe
  (`/move/:slug`) tem efeito, chance de efeito secundário, prioridade, alvo, TM do jogo, histórico
  de valores e quem aprende por nível, TM, ovo e tutor. Os learnsets vêm de arquivos gerados, um por
  jogo, baixados só quando aquele jogo é pedido.
- **Itens e berries** (`/items`, `/item/:slug`): os ~1.600 itens dos jogos por bolso, com busca;
  cada item mostra efeito, preço, Fling e quem segura na natureza; berries têm firmeza, sabores,
  crescimento e Natural Gift.
- **Naturezas e IVs** (`/stats`): tabela 5×5 das naturezas com os sabores e uma calculadora que, com
  nível, natureza, EVs e os stats do jogo, dá a faixa de cada IV (estreitada pela característica),
  ou faz o inverso.
- **Velocidade** (`/speed`): speed tiers no nível 50 ou 100 (mín, neutro, máx, máx com natureza),
  com Choice Scarf, Tailwind e estágios, por jogo, e o time destacado (atalho no team builder).
- **Pokémon do dia** (`/daily`): adivinhe o Pokémon em até 8 palpites com pistas de geração, tipos,
  altura, peso e total de stats. O mesmo para todos no mesmo dia, sem servidor (a data escolhe uma
  posição numa permutação fixa das 1.025 espécies); resultado em emojis para compartilhar,
  estatísticas salvas e no backup, e modo treino.
- **Quem é esse Pokémon?** (`/quiz`): silhueta com 4 opções, grito como dica, filtro por geração,
  sequência e recorde salvo no aparelho. O menu também tem "Pokémon aleatório".
- **Team builder** (`/team`): monte um time de até 6 Pokémon tocando nos cards da mesma listagem
  filtrada (jogo, Pokédex, versão, tipo, busca, capturados). No celular, uma bandeja fixa no rodapé
  mostra os 6 slots enquanto a lista rola e abre um sheet com o time completo; no desktop, o time
  fica num painel lateral que acompanha a rolagem. Nos dois casos aparecem as fraquezas do time,
  a tabela defensiva (quanto cada tipo de ataque causa em cada membro) e a cobertura ofensiva por
  STAB (tipos que o time acerta de forma super efetiva e os que ficam sem cobertura). O time não é
  salvo: fica só na URL (`/team?game=scarlet-violet&team=906,909,912`), o que sobrevive a recarregar
  e permite compartilhar o link. A análise usa a tabela de tipos da geração do jogo selecionado.
  O time pode ser **copiado e importado no formato do Pokémon Showdown** (só as espécies; itens,
  golpes e EVs são ignorados na importação), e o painel sugere Pokémon da lista atual que
  **resistem às fraquezas do time** sem serem fracos a elas (tocar adiciona).
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
  Na aba **Rotas** cada Pokémon também tem a Poké Bola, a rota mostra quantos já foram capturados
  ("3/14") e dá para esconder os capturados.
- **Rotas**: com um jogo com dados de encontro selecionado, a aba **Rotas** lista os locais na ordem
  da história (Pallet Town, Route 1, Viridian City…), divididos por região ou DLC quando o jogo tem
  mais de uma (Johto/Kanto, Ilhas Sevii, Isle of Armor, Crown Tundra), com busca pelo nome. Cada
  local mostra os Pokémon com nível e chance por método, separada por condição quando ela muda:
  hora do dia, estação, swarm, rádio, Poké Radar, slot 2 e tipo de árvore no Headbutt
  ("Grama · noite 15% · manhã/dia 5%"). A ordem é escrita à mão em `src/data/routeOrder.ts`,
  porque a PokéAPI não tem esse dado.
- **Shiny**: com um jogo selecionado (2ª geração em diante), o detalhe tem um card para marcar o shiny
  como capturado (separado da captura normal) e um contador de encontros com Shiny Charm e método
  Masuda, mostrando a chance por encontro do jogo (1/8192 até a 5ª geração, 1/4096 depois) e a
  probabilidade de já ter achado. Fica salvo no aparelho e entra no backup.
- **Caixas (living dex)**: um botão alterna a lista entre cards e caixas de 30 (6×5, como no Pokémon
  HOME), na ordem da Pokédex atual e com os filtros aplicados (`?layout=boxes`). Cada caixa mostra o
  intervalo de números e quantos foram capturados; com um jogo selecionado, tocar marca/desmarca.
- **Backup**: no menu (☰), "Backup dos dados" baixa um JSON com capturados, shinies capturados,
  favoritos e caçadas, importa esse arquivo e gera um **link** (`/?backup=...`, ~200 caracteres por
  jogo marcado) que, aberto em outro aparelho, pergunta se deve somar ou substituir os dados. O
  link também aparece como **QR code**, para passar os dados apontando a câmera.
- **Conta Google (opcional)**: o botão de conta no cabeçalho da Pokédex ("Entrar com o Google") guarda capturados, shinies, favoritos,
  caçadas e o Pokémon do dia na conta (Supabase) e sincroniza o Mac e o iPhone. O app continua
  funcionando no aparelho e sem internet; a conta recebe uma cópia em segundo plano, com mescla de
  3 vias para não perder marcações feitas offline nos dois aparelhos. Sair mantém os dados no
  aparelho; dá para excluir a conta pelo app. Detalhes e configuração em
  [`supabase/README.md`](supabase/README.md).
- **Menu lateral** com navegação, idioma, **tema** (sistema, claro ou escuro, salvo no aparelho),
  backup e créditos.
- **Idioma**: botão no cabeçalho alterna entre *Português* (interface em pt-BR, com os textos que só
  existem em inglês na PokéAPI mantidos assim) e *English* (tudo em inglês, inclusive tipos, stats,
  grupos de ovo e as frases de evolução). Começa no idioma do aparelho e a escolha fica salva.
- Tema claro/escuro seguindo a preferência do sistema (ou escolhido no menu).
- **Vistos recentemente** (faixa no topo da Pokédex) e **buscas recentes** (ao focar a busca vazia),
  salvos no aparelho e fora do backup.
- **Compartilhar** o Pokémon ou o time pela folha nativa do aparelho (link ou **imagem** PNG gerada
  no aparelho, com prévia antes de enviar), **deslizar**
  para os lados no detalhe para ir ao anterior/próximo, botão **voltar ao topo** nas listas longas e
  aviso quando o aparelho está **offline**.
- **Instalação**: o manifest tem atalhos (time, tipos, favoritos, Pokémon do dia, quiz) e capturas
  de tela.
- **Acessibilidade** (WCAG 2.2 AA, verificado com axe nas telas principais nos dois temas): cards,
  estágios da evolução, membros do time e linhas de rota são links/botões nativos, alcançáveis pelo
  teclado (o card da Pokédex é um link de verdade: abre em nova aba com cmd/ctrl+clique); chips de
  tipo com texto claro ou escuro conforme o contraste com a cor do tipo; zoom liberado e orientação
  livre; botão "Pular para o conteúdo"; ao trocar de tela o foco vai para o título (e, ao voltar
  para a lista, para o card que foi aberto); a quantidade de resultados é anunciada ao leitor de
  tela depois de buscar ou filtrar.
- **Offline**: índice e mapa de tipos ficam em cache local; artworks e respostas recentes ficam no service worker.
  Em **Usar offline** (menu) dá para baixar, por geração, as fichas completas, as imagens e os gritos
  (com estimativa de tamanho, progresso, cancelar/retomar e apagar), guardados em caches próprios.
- Instalável no iOS/Android como app (manifest + service worker).

### Limitações conhecidas

- A PokéAPI não tem textos em português: mesmo no modo *Português*, descrição da Pokédex, categoria
  da espécie, nomes de habilidades, golpes, itens e locais ficam em inglês (como nos jogos).
- Legends: Z-A ainda não tem golpes na PokéAPI (nem no REST), então a busca "quem aprende" e os
  aprendizes por jogo não incluem esse jogo.
- A lista de jogos é estática (`src/data/games.ts`): quando a PokéAPI incluir um jogo novo, é preciso
  adicioná-lo ali. Versões japonesas, Colosseum/XD (sem Pokédex) e jogos fora da série principal
  ficam de fora; DLCs aparecem como Pokédex do jogo base.
- Na Pokédex de Alola o app mostra a forma de Alola mesmo quando a forma de Kanto também é obtível.
- Sem entrar com o Google, as marcações ficam só no aparelho (o backup por arquivo ou link faz a
  ponte). Com a conta, a sincronização acontece ao abrir o app e logo depois de cada marcação, não em
  tempo real.
- Os exclusivos de versão são por espécie: uma espécie com uma forma em cada versão (Basculin,
  Tauros de Paldea, Kyurem…) não conta como exclusiva. Exclusivos das DLCs e da White Forest entram
  no jogo base, e Red/Blue segue a distribuição internacional. Jogos de versão única (Yellow,
  Emerald, Platinum, Legends) não têm o filtro.
- A análise de tipos segue a geração do jogo selecionado (tabela da 1ª geração, da 2ª à 5ª e da 6ª em
  diante, e os tipos antigos de Pokémon como Clefairy e Magnemite), a partir das tabelas geradas em
  `src/data/generated/`. A cobertura ofensiva olha só os tipos do próprio Pokémon (STAB), não os
  golpes que ele aprende, e cada tipo defensor isolado.
- Os locais de encontro cobrem as gerações 1 a 7 e Sword/Shield (com as DLCs). A PokéAPI ainda
  não tem esse dado para Brilliant Diamond / Shining Pearl, Legends: Arceus, Scarlet / Violet e
  Legends: Z-A, e só lista encontros selvagens, presentes e trocas (evoluções e ovos não entram).
  O nome da área é montado a partir do slug da API (`kanto-route-1-area` → "Kanto Route 1").
- Os gritos vêm só em `.ogg` (Vorbis). Safari toca a partir do macOS 14.1 / iOS 17.4 (suporte
  completo no 18.4); em navegadores sem suporte o botão de som não aparece. No iOS o áudio só
  toca depois de um toque do usuário, por isso o grito é disparado no toque do card, e o botão
  lateral de silencioso do iPhone também silencia o app.
- O grito é baixado com `fetch` e tocado por blob, em vez de apontar o `<audio>` para a URL:
  o Safari pede mídia por faixas (`Range`) e o cache do service worker guardaria só a primeira
  resposta parcial, deixando o som mudo nas próximas visitas.

### Roadmap


## Dados gerados

`scripts/gen-pokemon-data.mjs` monta `src/data/generated/` a partir da PokéAPI: stats, altura, peso,
geração, flags e habilidades de todos os Pokémon (`pokemon.ts`), golpes com os valores antigos
(`moves.ts`) e as exceções da tabela de tipos e os tipos antigos de Pokémon (`typesPast.ts`). Usa o
GraphQL beta só no script (o app não depende dele) e completa pelo REST o que ainda não estiver lá.
Rodar de novo quando sair jogo ou geração nova: `node scripts/gen-pokemon-data.mjs`.
`scripts/gen-reference-data.mjs` gera os learnsets por jogo (`learnsets/*.ts`, um chunk por jogo, fora
do precache), o índice de itens, as naturezas e as características. As rotas
(`src/data/routes.ts`) vêm de `scripts/gen-routes.mjs` (um teste falha se aparecer local novo fora da
ordem da história em `src/data/routeOrder.ts`); os exclusivos e as rotas de BDSP vêm da
Bulbapedia, com o procedimento descrito em [`scripts/README.md`](scripts/README.md).

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
| Dados | [PokéAPI v2](https://pokeapi.co/docs/v2) (imagens redimensionadas pelo [wsrv.nl](https://wsrv.nl/)) |
| QR code | [uqr](https://github.com/unjs/uqr) (MIT, só no backup) |
| Conta e sincronização | [Supabase](https://supabase.com/) (Auth com Google + Postgres com RLS), SDK carregado sob demanda |
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
  data/credits.ts             # autor, repositório e fontes de dados (tela "Sobre" e rodapé)
  services/pokeapi/           # cliente HTTP, DTOs da PokéAPI e mapeamento para o domínio
    pokemon.service.ts        #   índice, resumo e detalhe do Pokémon
    pokedex.service.ts        #   entradas de uma Pokédex regional (número no jogo + espécie)
    species.service.ts        #   espécie (descrição, gênero, grupos de ovo, formas)
    evolution.service.ts      #   cadeia de evolução -> árvore com métodos descritos
    encounter.service.ts      #   locais de encontro -> uma linha por área e por jogo
  utils/
    pokemon.ts                # formatação, URLs de artwork e de grito, cores dos tipos, stats
    evolution.ts              # regras "como evoluir" em pt-BR (gatilhos + condições)
    games.ts                  # busca de jogo/dex, agrupamento por geração, formas regionais
    typeChart.ts              # multiplicadores, fraquezas do time e cobertura ofensiva
    exclusives.ts             # versão exclusiva de uma espécie dentro de um jogo
    encounters.ts             # nome da área a partir do slug, método e faixa de nível
    storage.ts
  stores/
    pokedex.ts                # Pinia: índice + cache de resumos (persistido) e Pokédex regionais (memória)
    pokemonDetail.ts          # Pinia: detalhes, espécies, cadeias e locais (só em memória)
  composables/
    usePokemonList.ts         # busca + filtros (jogo, captura, tipo, versão) + lotes do scroll infinito
    useTeam.ts                # time de até 6 na URL (?team=) e análise de tipos
    usePokemonDetail.ts       # carrega detalhe -> espécie + locais -> cadeia, reage à rota e ao jogo (?game=)
    useCry.ts                 # áudio único compartilhado, desbloqueado no gesto do usuário
    useDebouncedRef.ts
  components/
    atoms/                    # TypeChip, TypeToggle, MultiplierBadge, PokemonArtwork, PokemonAvatar,
                              # DexNumber, StatBar, InfoTile, CryButton, CatchToggle
    molecules/                # PokemonCard, SearchField, GameFilterChip, TypeFilterChip, DexChips,
                              # CaughtFilterChips, VersionFilterChip, TeamSlot, EmptyState, PokemonHero, AboutGrid,
                              # AbilityList, StatsList, EvolutionStage, EvolutionMethod, VarietyChips, LocationRow
    organisms/                # AppHeader, ListFilters, PokemonGrid, GamePickerSheet, TypePickerSheet, VersionPickerSheet, AboutSheet,
                              # LanguageSheet, TeamBench, TeamPanel, TeamTray, TeamAnalysis, TeamDefenseTable, TeamCoverage,
                              # EvolutionChain, EvolutionBranch (recursivo), LocationList
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
4. O artwork é montado a partir do id, sem depender do JSON de detalhe. Ele passa pelo proxy
   [wsrv.nl](https://wsrv.nl/), que redimensiona e converte para WebP em três larguras fixas
   (96, 240 e 480 px, para telas 2×): o PNG original tem 475 px e ~120 KB, o do card fica com ~13 KB.
   Se o proxy falhar, a imagem cai para o PNG original do repositório de sprites.
5. A tela de detalhes busca `/pokemon/{id}`, depois `/pokemon-species/{id}` e
   `/evolution-chain/{id}`; os tipos dos estágios da evolução vêm do cache de resumos.
   A URL do grito também é derivada do id, o que permite tocá-lo ainda no toque do card.
6. Os locais de encontro vêm de `/pokemon/{id}/encounters` em paralelo com a espécie; a resposta
   crua é repetitiva (uma entrada por área × versão × nível), então o app guarda só uma linha por
   área e por jogo, e as versões da API são mapeadas para os jogos de `data/games.ts`.

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
| Service worker `pokeapi-encounters` | locais de encontro por Pokémon (1 a 10 KB comprimidos) | 60 entradas, 7 dias |
| Service worker `pokemon-artwork-webp` | artworks em WebP via wsrv.nl (~13 KB no card, ~40 KB no detalhe) | 400 entradas, 30 dias |
| Service worker `pokeapi-artwork-v2` | PNG original, só quando o proxy falha (~120 KB cada) | 30 entradas, 30 dias |
| Service worker `pokeapi-cries-v2` | gritos dos Pokémon (~7 KB cada) | 60 entradas, 30 dias |
| Service worker `pokeapi-vocabulary` | habilidades, itens, golpes, berries, máquinas (o `/move` traz os aprendizes) | 300 entradas, 30 dias |
| Service worker `pokeapi-sprites` | sprites por jogo, animados e de itens (1 a 30 KB) | 400 entradas, 30 dias |
| Service worker `generated-learnsets` | learnsets por jogo (5 a 99 KB gz), fora do precache | 30 entradas, 90 dias |
| Caches `pokeinfo-offline-*-v1` | só o que a pessoa baixa em "Usar offline" (fichas, imagens, gritos) | sem limite de entradas; apagar pela sheet |
| `localStorage` | Pokémon do dia (`pokeinfo:daily:v1`) e recentes (`pokeinfo:recent:v1`) | poucos KB |
| `localStorage` | só com conta: sessão do Supabase (`pokeinfo:auth:v1`) e a base da última sincronização (`pokeinfo:sync:v1`, mesmo tamanho da coleção) | poucos KB |

Os cards não fazem requisição por Pokémon: os tipos vêm de um mapa montado uma vez a partir dos
18 endpoints `/type/{nome}` (~385 KB no total, renovado em segundo plano a cada 7 dias). Ler os tipos
de `/pokemon/{id}` custaria ~290 KB por card, quase tudo lista de golpes. Só um Pokémon que não
esteja no mapa (lançado depois do cache) dispara uma busca individual.

Detalhes, espécies, cadeias e locais ficam só em memória durante a sessão (store `pokemonDetail`),
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

O projeto está configurado para a Vercel (`vercel.json`): rewrites para SPA, `sw.js` sem cache,
o content-type correto para o `manifest.webmanifest` e cabeçalhos de segurança (`nosniff`, sem
iframe, `Referrer-Policy` e `Permissions-Policy`). Basta conectar o repositório.

Os arquivos de `/assets` têm hash no nome e saem com `immutable` (um ano): quem abre pelo navegador,
sem o service worker, não revalida dezenas de chunks a cada visita. Eles ficam fora do rewrite da
SPA, então um chunk de um deploy antigo dá 404 em vez de receber o `index.html` como JavaScript.
Ícones e capturas de tela ficam em cache por uma semana.

Para a conta Google, configure o Supabase e o Google Cloud e adicione `VITE_SUPABASE_URL` e
`VITE_SUPABASE_PUBLISHABLE_KEY` nas variáveis da Vercel: passo a passo em
[`supabase/README.md`](supabase/README.md).

## Créditos

Feito por [sudjoao](https://github.com/sudjoao). Código-fonte em
[github.com/sudjoao/pokeinfo-pwa](https://github.com/sudjoao/pokeinfo-pwa); os créditos também
aparecem no app, no botão "Sobre" do cabeçalho e no rodapé da lista.

Dados e imagens fornecidos pela [PokéAPI](https://pokeapi.co/); lista de exclusivos de versão a
partir da [Bulbapedia](https://bulbapedia.bulbagarden.net/). Pokémon é marca registrada da
Nintendo/Creatures Inc./GAME FREAK inc.; este projeto é um estudo sem fins comerciais.
