# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

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

[1.0.0]: https://github.com/sudjoao/pokeinfo-pwa/releases/tag/v1.0.0
