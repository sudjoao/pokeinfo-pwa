# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.3.0] - 2026-10-23

Tela de detalhes completa, ferramentas novas (tipos, comparação, quiz), recursos de coleção
(caixas, shiny, backup), acessibilidade revisada e imagens ~10× menores.

### Adicionado

#### Tela de detalhes

- Fraquezas e resistências (4×, 2×, ½, ¼, imune) com a tabela de tipos da geração do jogo.
- Golpes por jogo: por nível, TM/HM, ovo, tutor e outros, com tipo, categoria, poder, precisão e PP
  daquele jogo (inclusive valores antigos, como Karate Chop Normal na 1ª geração).
- Treino (EVs ao derrotar, exp. base, taxa de captura com a chance aproximada, felicidade base,
  curva de crescimento) e reprodução (grupos de ovo, gênero, ciclos/passos e a lista de Pokémon
  compatíveis para cruzar).
- Texto da Pokédex do jogo selecionado e todas as entradas por versão.
- Botão para ver o artwork shiny e stats mínimos/máximos nos níveis 50 e 100.
- Sheet de habilidade com a descrição e todos os Pokémon que a têm.
- Botões de comparar e de compartilhar no cabeçalho; deslizar para os lados vai ao anterior/próximo.

#### Listagem e coleção

- Filtros e ordenação ("Filtros"): ordenar por número, nome, total, cada stat, altura ou peso (o card
  mostra o valor) e filtrar por geração, categoria, "fraco a", habilidade, total mínimo e favoritos,
  tudo na URL. Também no team builder.
- Favoritos: coração no detalhe e atalho no menu (`/?fav=1`).
- Caixas de 30 estilo Pokémon HOME para living dex (`?layout=boxes`), com capturados por caixa.
- Capturados na aba Rotas: Poké Bola por Pokémon, contagem por rota e opção de esconder capturados.
- Shiny capturado (separado da captura normal) e contador de shiny hunt por jogo, com Shiny Charm,
  método Masuda, chance por encontro e probabilidade acumulada.
- Backup de capturados, shinies, favoritos e caçadas por arquivo JSON e por link (`/?backup=`),
  com a opção de somar ou substituir ao importar.

#### Ferramentas

- Calculadora de tipos (`/types`): defesa, ataque e tabela 18×18, com as tabelas da 1ª geração, da
  2ª à 5ª e da 6ª em diante.
- Comparação de até 3 Pokémon lado a lado (`/compare`).
- Quiz "Quem é esse Pokémon?" (`/quiz`) com silhueta, grito como dica, filtro por geração e recorde.
- Pokémon aleatório.
- Team builder: copiar e importar no formato do Pokémon Showdown, compartilhar o time e sugestões de
  Pokémon que resistem às fraquezas do time.

#### Navegação e app

- Menu lateral com navegação, idioma, tema manual (sistema, claro ou escuro), backup e sobre.
- Compartilhar pela folha nativa (ou copiando o link), botão voltar ao topo e aviso de offline.
- Manifest com atalhos (time, tipos, favoritos, quiz) e capturas de tela para a instalação.
- Acessibilidade: botão "Pular para o conteúdo", foco no título ao trocar de tela (e no card aberto
  ao voltar para a lista) e anúncio da quantidade de resultados para leitores de tela.

#### Projeto

- Testes de unidade com Vitest e CI no GitHub Actions (lint, type-check, testes e build).
- Geradores de dados em `scripts/`: tabelas da PokéAPI (`src/data/generated/`) e rotas por jogo,
  com o procedimento dos dados da Bulbapedia documentado em `scripts/README.md`.

### Alterado

- O team builder, o detalhe e o filtro "fraco a" usam a tabela de tipos e os tipos dos Pokémon da
  geração do jogo selecionado (ex.: sem Fada antes da 6ª geração, Clefairy Normal em Red/Blue).
- Artworks em WebP redimensionado pelo proxy wsrv.nl, em três larguras fixas, com o PNG original
  como plano B: o primeiro lote da Pokédex baixa ~70 KB de imagens em vez de ~700 KB, e o cache de
  artworks deixa de ocupar ~24 MB (o cache antigo é apagado).
- Contraste revisado (WCAG AA): chips de tipo com texto claro ou escuro conforme a cor,
  multiplicadores e textos secundários mais fortes, chip "secundário" do tema escuro com texto
  escuro. No seletor de tipos, os não escolhidos deixaram de ficar esmaecidos.
- O card da Pokédex virou um link de verdade (abre em nova aba com cmd/ctrl+clique).
- Os botões de idioma e "Sobre" do cabeçalho foram para o menu lateral.
- Animação de captura com a Web Animations API, sem o `@vueuse/motion` (~12 KB gz a menos no JS
  inicial), e `content-visibility` nos cards da grade.
- Rotas regeneradas: entram Birth Island e Navel Rock (Emerald) e Trainers' School (Ultra Sun/Moon).

### Corrigido

- Cards, estágios da evolução, membros do time e Pokémon das rotas não eram alcançáveis pelo
  teclado nem anunciados como botão/link.
- Zoom bloqueado (`user-scalable=no`) e orientação travada em retrato no manifest.
- Chips de filtro sem papel de botão para o leitor de tela.
- Poké Bola de captura com rótulo que mudava junto com o estado; agora diz qual Pokémon é e usa só
  o `aria-pressed`, e o ícone desmarcado ficou mais visível.
- Forma atual nas formas alternativas aparecia desabilitada e quase ilegível.

### Removido

- Dependência `@vueuse/motion`.

## [1.2.0] - 2026-09-12

### Adicionado

- Aba **Rotas** na Home (com um jogo selecionado): os locais do jogo com encontro, cada um com os
  Pokémon, a faixa de nível e a chance por método (ex.: "Grama 50%"), carregados ao abrir a rota.
  Lista de locais gerada a partir de `/location-area` da PokéAPI (`src/data/routes.ts`).
- Rotas de Brilliant Diamond / Shining Pearl, que a PokéAPI não tem, a partir da Bulbapedia
  (`src/data/routes-bdsp.ts`), com os métodos "Enxame" e "Poké Radar".

## [1.1.0] - 2026-09-11

### Adicionado

- Idioma **Español**: interface em espanhol e, quando a PokéAPI tem, nome, categoria e descrição da
  espécie e nomes de habilidades, itens e golpes em espanhol (buscados sob demanda).
- Animações: transição entre telas, entrada do artwork, "pop" da Poké Bola ao capturar, estágios da
  evolução em cascata com destaque no atual e entrada/saída dos membros do time. Todas respeitam
  "reduzir movimento" do sistema.

### Corrigido

- Navegação travando com a transição de página nas telas carregadas sob demanda, e ajustes nas
  animações de captura, da evolução e do time.

## [1.0.0] - 2026-09-11

Primeira versão estável da Pokédex em formato de PWA, consumindo a [PokéAPI](https://pokeapi.co/).

### Adicionado

#### Listagem e busca

- Listagem de todos os Pokémon com scroll infinito (lotes de 24) e cards no padrão Material
  Design 3, com artwork oficial, número, nome e tipos.
- Busca por nome (parcial) ou por número da Pokédex, refletida na URL (`?q=`).
- Filtro por tipo com até dois tipos combinados (`?type=water,ground`), sem requisição extra.
- Tela inicial mantida em `KeepAlive` para preservar a posição do scroll ao voltar dos detalhes.

#### Pokédex por jogo

- Seleção de qualquer jogo da série principal, de Red/Blue a Legends: Z-A, com a Pokédex
  regional na ordem do jogo e o número regional em destaque.
- Chips para alternar entre as Pokédex de jogos com mais de uma (Kalos, ilhas de Alola, DLCs de
  Galar e Paldea).
- Formas regionais (Alola, Galar, Hisui, Paldea) exibidas direto no card da região correspondente.
- Estado completo na URL (`?game=&dex=&q=`); ao abrir um Pokémon a partir de um jogo, a tela de
  detalhes mostra o número regional e o anterior/próximo seguem a ordem daquela Pokédex.

#### Tela de detalhes

- Artwork, categoria da espécie, descrição da Pokédex, altura/peso, gênero, grupos de ovo,
  habilidades (com a oculta marcada), stats base com barras, formas alternativas e navegação
  anterior/próximo. Aceita número ou nome na rota (`/pokemon/:id`).
- Cadeia de evolução com o "como evoluir" descrito para todos os gatilhos da PokéAPI (nível,
  item, troca, amizade, local, hora do dia, golpe conhecido, stats, formas regionais…). O método
  dos jogos atuais fica em destaque e os de jogos antigos ficam recolhidos.
- Grito do Pokémon ao abrir a tela, com botão para repetir e para silenciar. O áudio é
  desbloqueado no toque do card para funcionar no iOS.
- Seção "Onde encontrar" com os locais em que o Pokémon aparece, método de encontro (grama,
  surf, pesca, presente, troca, raid…) e faixa de nível. Com um jogo selecionado mostra só os
  locais dele, com botão para ver os outros; sem jogo, agrupa por jogo em painéis. Encontros que
  só existem em uma versão recebem selo (ex.: "Só Sword").

#### Team builder

- Rota `/team` para montar um time de até 6 Pokémon a partir da mesma listagem filtrada
  (jogo, Pokédex, versão, tipo, busca, capturados).
- Bandeja fixa no rodapé com os 6 slots no celular (abre um sheet com o time completo) e painel
  lateral que acompanha a rolagem no desktop.
- Análise do time: fraquezas, tabela defensiva por tipo de ataque e cobertura ofensiva por STAB,
  com os tipos que ficam sem cobertura.
- Time guardado só na URL (`/team?game=&team=906,909,912`), o que sobrevive a recarregar e
  permite compartilhar o link.

#### Exclusivos de versão

- Selo "Só Sword"/"Só Shield" (e equivalentes) no card e no hero dos detalhes quando a espécie só
  existe em uma das versões do jogo selecionado.
- Chip "Versão" com três grupos (ambas, só a primeira, só a segunda), contagem por grupo e
  filtro na URL (`?versions=both,sword`). Funciona também no team builder.
- Lista estática gerada a partir da Bulbapedia, já que a PokéAPI não tem esse dado.

#### Capturados por jogo

- Poké Bola em cada card e no hero dos detalhes para marcar o Pokémon como capturado no jogo
  selecionado.
- Chips "Capturados" e "Faltam" com contagem da Pokédex atual e filtro na URL (`?caught=`).
- Marcação por espécie, salva no aparelho em um bitset base64 (~170 bytes por jogo).

#### Idioma, tema e PWA

- Alternância entre Português (pt-BR) e English no cabeçalho, começando no idioma do aparelho.
  Em inglês, tipos, stats, grupos de ovo e frases de evolução também são traduzidos.
- Tema claro/escuro seguindo a preferência do sistema.
- Instalável no iOS/Android como app (manifest + service worker) e funcionamento offline:
  índice e mapa de tipos em `localStorage`; Pokédex, espécies, detalhes, locais, artworks e gritos
  em caches do service worker com limites de entradas e validade.
- Tela "Sobre" e rodapé com autor, repositório e fontes de dados.
- Deploy configurado para a Vercel (rewrites de SPA, `sw.js` sem cache, content-type do manifest).

### Limitações conhecidas

- A PokéAPI não tem textos em português: descrição da Pokédex, categoria, habilidades, golpes,
  itens e locais ficam em inglês mesmo no modo Português.
- A lista de jogos e a de exclusivos são estáticas e precisam ser atualizadas manualmente.
- Os locais de encontro cobrem as gerações 1 a 7 e Sword/Shield; a PokéAPI ainda não tem esse
  dado para BDSP, Legends: Arceus, Scarlet/Violet e Legends: Z-A.
- As marcações de captura ficam só no aparelho, sem sincronização entre dispositivos.
- Os gritos vêm só em `.ogg`; em navegadores sem suporte o botão de som não aparece.

[1.3.0]: https://github.com/sudjoao/pokeinfo-pwa/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/sudjoao/pokeinfo-pwa/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/sudjoao/pokeinfo-pwa/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/sudjoao/pokeinfo-pwa/releases/tag/v1.0.0
