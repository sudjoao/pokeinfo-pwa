# dev-maps (só para o modo dev)

Imagens dos mapas oficiais dos jogos para comparar com o nosso desenho no `npm run dev`
(aba Rotas → Mapa → painel **DEV** abaixo do mapa). Nada desta pasta além deste README vai
para o git nem para o build: a arte é da Nintendo/Game Freak/The Pokémon Company e o app usa
só o desenho próprio (`src/data/maps/`).

## Nomes

O painel escolhe sozinho, nesta ordem:

1. `<seção>.<jogo>.png`: ex.: `kanto.firered-leafgreen.png`, `kanto.red-blue.png`
2. `<seção>.png`: ex.: `kanto.png`, `johto.png`

Seções: `kanto`, `sevii`, `johto`, `hoenn`, `sinnoh`, `unova`, `kalos`, `alola`, `galar`,
`isleOfArmor`, `crownTundra`. Jogos: os slugs de `src/data/games.ts`. Qualquer outro nome
também aparece na lista do painel para escolher à mão (`.png`, `.jpg`, `.webp`, `.gif`).

## Onde baixar

A Serebii serve os mapas regionais direto, em `https://www.serebii.net/pokearth/<região>.png`
(`kanto`, `johto`, `hoenn`, `sinnoh`, `unova`, `kalos`, `alola`, `galar`). O `kanto.png` de lá
traz Kanto do FireRed/LeafGreen com as Ilhas Sevii embaixo (200×618): recorte as duas partes
(Kanto são as primeiras 141 linhas; Sevii, da linha 180 em diante). Não há mapa inteiro da Ilha da
Armadura nem da Tundra da Coroa, só recortes por local.

A Bulbapedia e a Bulbagarden Archives bloqueiam acesso automático (Cloudflare): de lá, só à mão
pelo navegador.

## Ajuste

Ligue a chave no painel, use **Encaixar** e ajuste escala, esticar e posição até as cidades
baterem. O ajuste fica salvo por seção no localStorage (`pokeinfo:dev-map-reference:v1`).
