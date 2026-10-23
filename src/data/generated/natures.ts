// Gerado por scripts/gen-reference-data.mjs a partir da PokéAPI (naturezas). Não editar à mão.

/**
 * [slug, nome em espanhol, stat que sobe ×1,1, stat que desce ×0,9, sabor que gosta, sabor que
 * odeia]. Stats e sabores nulos nas 5 naturezas neutras (Hardy, Docile, Serious, Bashful, Quirky).
 */
export type NatureRow = readonly [string, string, string | null, string | null, string | null, string | null]

export const NATURES: readonly NatureRow[] = [
  ["hardy","Fuerte",null,null,null,null],
  ["bold","Osada","defense","attack","sour","spicy"],
  ["modest","Modesta","special-attack","attack","dry","spicy"],
  ["calm","Serena","special-defense","attack","bitter","spicy"],
  ["timid","Miedosa","speed","attack","sweet","spicy"],
  ["lonely","Huraña","attack","defense","spicy","sour"],
  ["docile","Dócil",null,null,null,null],
  ["mild","Afable","special-attack","defense","dry","sour"],
  ["gentle","Amable","special-defense","defense","bitter","sour"],
  ["hasty","Activa","speed","defense","sweet","sour"],
  ["adamant","Firme","attack","special-attack","spicy","dry"],
  ["impish","Agitada","defense","special-attack","sour","dry"],
  ["bashful","Tímida",null,null,null,null],
  ["careful","Cauta","special-defense","special-attack","bitter","dry"],
  ["rash","Alocada","special-attack","special-defense","dry","bitter"],
  ["jolly","Alegre","speed","special-attack","sweet","dry"],
  ["naughty","Pícara","attack","special-defense","spicy","bitter"],
  ["lax","Floja","defense","special-defense","sour","bitter"],
  ["quirky","Rara",null,null,null,null],
  ["naive","Ingenua","speed","special-defense","sweet","bitter"],
  ["brave","Audaz","attack","speed","spicy","sweet"],
  ["relaxed","Plácida","defense","speed","sour","sweet"],
  ["quiet","Mansa","special-attack","speed","dry","sweet"],
  ["sassy","Grosera","special-defense","speed","bitter","sweet"],
  ["serious","Seria",null,null,null,null],
]
