# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Detalhe completo: fraquezas e resistências pela tabela da geração do jogo, golpes por jogo (nível,
  TM/HM, ovo, tutor, outros) com os valores antigos de cada golpe, treino (EVs, exp. base, chance de
  captura, felicidade, crescimento), reprodução (ciclos/passos e Pokémon compatíveis), texto da
  Pokédex do jogo selecionado com todas as entradas, botão shiny, stats mín./máx. nos níveis 50/100
  e sheet de habilidade com descrição e quem mais a tem.
- Tabela de tipos por geração (1ª, 2ª–5ª, 6ª+) e tipos antigos dos Pokémon no team builder, no
  detalhe e no filtro "fraco a".
- Filtros e ordenação: total de stats, cada stat, altura, peso, geração, categoria, fraqueza,
  habilidade, total mínimo e só favoritos, tudo na URL.
- Favoritos (coração no detalhe, atalho no menu).
- Capturados na aba Rotas (Poké Bola, contagem por rota, esconder capturados).
- Caixas de 30 estilo Pokémon HOME para living dex (`?layout=boxes`).
- Backup de capturados, shinies, favoritos e caçadas por arquivo JSON e por link (`/?backup=`).
- Shiny capturado e contador de shiny hunt com Shiny Charm e Masuda.
- Calculadora de tipos (`/types`), comparação de até 3 Pokémon (`/compare`), quiz "Quem é esse
  Pokémon?" (`/quiz`) e Pokémon aleatório.
- Team builder: exportar/importar no formato do Pokémon Showdown e sugestões para as fraquezas.
- Menu lateral com navegação, idioma, tema manual (sistema/claro/escuro), backup e sobre.
- Compartilhar (Web Share ou link copiado), deslizar no detalhe, voltar ao topo, aviso de offline,
  atalhos e capturas de tela no manifest.
- Testes com Vitest, CI no GitHub Actions e geradores de dados em `scripts/`.

### Alterado

- Artworks servidos em WebP redimensionado pelo proxy wsrv.nl, em três larguras fixas, com o PNG
  original como plano B. O primeiro lote da Pokédex baixa ~70 KB de imagens em vez de ~700 KB, e o
  cache de artworks do service worker deixa de ocupar ~24 MB (o cache antigo é apagado).
- Chips de tipo, ameaças do time e multiplicadores com cores de texto/fundo que passam de 4,5:1;
  textos secundários com opacidade 0.7 (antes 0.45–0.6); chip "secundário" do tema escuro com texto
  escuro.
- No seletor de tipos, os tipos não escolhidos não ficam mais esmaecidos (o texto ficava ilegível);
  o escolhido ganha check e anel duplo.
- `@vueuse/motion` trocado pela Web Animations API (~12 KB gz a menos no JS inicial) e
  `content-visibility` nos cards da grade.
- Os botões de idioma e "Sobre" do cabeçalho foram para o menu lateral.

### Corrigido

- Cards da Pokédex, do team builder, estágios da evolução, membros do time e Pokémon das rotas não
  eram alcançáveis pelo teclado (o `v-card` com `@click` vira uma `<div>` sem `tabindex`). Agora o
  card da Pokédex é um link de verdade e os demais são botões, sem elementos interativos aninhados.
- Zoom bloqueado (`user-scalable=no`) e orientação travada em retrato no manifest.
- Chips de filtro (jogo, versão, tipo, Pokédex, capturados) sem papel de botão para o leitor de tela.
- Poké Bola de captura com rótulo que mudava junto com o estado; agora diz qual Pokémon é e usa só o
  `aria-pressed`. O ícone desmarcado ficou mais visível (era ~2:1 sobre o card).
- Forma atual nas formas alternativas aparecia desabilitada e quase ilegível; agora fica marcada
  como atual.

### Adicionado

- Botão "Pular para o conteúdo", foco no título ao trocar de tela (e no card aberto ao voltar para a
  lista) e anúncio da quantidade de resultados para leitores de tela.

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
