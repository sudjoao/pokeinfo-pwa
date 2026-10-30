# Scripts de dados

Os arquivos de `src/data/` que não dá para buscar em tempo de execução são gerados aqui. Nenhum
script tem dependências (Node 22.18+ ou 24, que já remove os tipos ao importar `.ts`).

| Script | Gera | Fonte | Quando rodar |
| --- | --- | --- | --- |
| `gen-pokemon-data.mjs` | `src/data/generated/` (stats, habilidades, golpes, formas, tabela de tipos antiga) | PokéAPI GraphQL beta + REST para o que faltar | Jogo, geração ou DLC nova |
| `gen-reference-data.mjs` | `src/data/generated/learnsets/*.ts` (quem aprende cada golpe, por jogo), `items.ts`, `natures.ts`, `characteristics.ts` | PokéAPI GraphQL beta (learnsets, ~15 s) + REST para itens que faltarem | Jogo, geração ou DLC nova; tem `--check` |
| `gen-dex-index.mjs` | `src/data/generated/dexIndex.ts` (índice id + nome e tipos de cada Pokémon/forma, ~9 KB gz) | PokéAPI REST (`/pokemon` e os 18 `/type`) | Pokémon ou formas novas; tem `--check` |
| `gen-routes.mjs` | `src/data/routes.ts` (locais com encontro por jogo) | PokéAPI REST (~1700 requisições, alguns minutos) | Jogo novo com `hasEncounterData`, ou dado novo na PokéAPI |
| `gen-trainers.mjs` | `src/data/generated/trainers/*.ts` (líderes, Elite 4 e campeão de cada jogo, com times e revanches) | Bulbapedia, API MediaWiki (~120 páginas, uma por vez, ~2 min) | Jogo novo ou correção na Bulbapedia; tem `--check` |

```sh
node scripts/gen-pokemon-data.mjs
node scripts/gen-dex-index.mjs --check   # só compara
node scripts/gen-dex-index.mjs           # reescreve o índice e os tipos
node scripts/gen-reference-data.mjs --check   # só compara
node scripts/gen-reference-data.mjs           # reescreve learnsets, itens, naturezas e características
node scripts/gen-routes.mjs --check   # só compara com o arquivo atual
node scripts/gen-routes.mjs           # reescreve src/data/routes.ts
npx prettier --write src/data/routes.ts
node scripts/gen-trainers.mjs --check --cache /tmp/bulbapedia   # só compara (guarda as páginas)
node scripts/gen-trainers.mjs --cache /tmp/bulbapedia           # reescreve os times
```

`gen-routes.mjs` tem uma lista `IGNORED` com erros conhecidos da PokéAPI (locais marcados num jogo
em que não existem). Ao rodar de novo, confira com `--check` o que mudou antes de aceitar.

`gen-trainers.mjs` lê os templates `{{Party}}` e `{{Pokémon}}` das páginas de cada treinador. Quem
entra em cada jogo, a ordem e o tipo de especialidade ficam escritos à mão em `GAMES`, no topo do
script; o filtro `where` (local da luta) separa a luta da liga das outras do mesmo treinador
(Giovanni no esconderijo, Larry no ginásio e na Elite 4). Ficam de fora torres de batalha, torneios
de exibição, Multi Battles e o modo Challenge de Black 2/White 2 (vale o Normal). Golpes, habilidades
e itens são conferidos com os arquivos gerados da PokéAPI; o script avisa o que não reconhecer.
Em 2026-10-30 a API da Bulbapedia voltou a responder a scripts; se voltar o 403 do Cloudflare,
rode com `--cache` apontando para uma pasta com o wikitext salvo à mão (`{página}.txt`).

## Dados da Bulbapedia (sem script)

Além dos times (`gen-trainers.mjs`, acima), dois arquivos vêm da Bulbapedia, porque a PokéAPI não tem o dado. Os scripts originais se perderam e,
em 2026-10-23, a Bulbapedia passou a responder requisições automáticas com o desafio do Cloudflare
(HTTP 403). Por isso não há script versionado: abaixo está o procedimento exato para refazer à mão
ou com um script, quando o acesso permitir. Use um `User-Agent` que identifique o projeto.

### `src/data/exclusives.ts` (exclusivos de versão)

- Página: `Version-exclusive Pokémon`, via API MediaWiki
  (`/w/api.php?action=parse&page=Version-exclusive_Pokémon&prop=wikitext&section=N`), uma seção por
  geração da série principal.
- Cada linha é um template `{{VexXX|número|Nome|yes|no}}`: os parâmetros 3 e 4 dizem se a espécie
  existe na versão 1 e na 2. Exceção: em `Vex1` o 3 é Red, o 4 é o Blue japonês e o 5 é Green
  (= Blue internacional, o que o app usa).
- Regras: espécie marcada nas duas versões é removida (formas diferentes em cada versão, como
  Basculin, Tauros de Paldea, Kyurem e Necrozma, não contam como exclusivas); exclusivos das DLCs e
  da White Forest entram no jogo base; as formas Partner do Let's Go são ignoradas.
- Resultado de 2026-09-11: 787 ids. Os testes (`src/utils/__tests__/games.spec.ts`) conferem alguns
  casos conhecidos (Deino só em Sword, Larvitar só em Shield).

### `src/data/routes-bdsp.ts` (rotas de Brilliant Diamond / Shining Pearl)

- Páginas: as mesmas ~70 de local de Sinnoh usadas por `diamond-pearl` em `routes.ts`, achadas por
  título (`action=query&titles=...&redirects=1`; "Route 2xx" já redireciona para "Sinnoh Route 2xx").
- Template: `{{Catch/entrybdsp|dex|nome|BD|SP|método|nível|manhã%|dia%|noite%|type1=|type2=}}`, ou
  `all=X%` quando a chance é igual o dia todo. A chance por método soma manhã/dia/noite (capada em
  100, a mesma simplificação do resto do app).
- Métodos mapeados para os slugs já usados: `walk`, `surf`, `old-rod`, `good-rod`, `super-rod`,
  `rock-smash`, `honey-tree`, `gift`, `npc-trade`, `gift-egg`, `static`, `swarm` e `poke-radar`.
- Fora: `roaming-sinnoh`, `sinnoh-hall-of-origin-1`, `sinnoh-pokemart` (não são lugares),
  `ruin-maniac-cave` (mesma página de `maniac-tunnel`) e locais sem tabela de selvagens (Floaroma
  Meadow, Flower Paradise, Newmoon Island, Spear Pillar).
- Só o id nacional fica salvo; o nome vem do índice em tempo de execução.
