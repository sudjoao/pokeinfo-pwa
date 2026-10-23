// Gerado por scripts/gen-reference-data.mjs a partir da PokéAPI (características). Não editar à mão.

/**
 * [stat com o maior IV, resto do IV ÷ 5, texto em inglês, texto em espanhol]. Ex.: "Loves to eat"
 * = o maior IV é o de HP e vale 0, 5, 10, 15, 20, 25 ou 30.
 */
export type CharacteristicRow = readonly [string, number, string, string]

export const CHARACTERISTICS: readonly CharacteristicRow[] = [
  ["hp",0,"Loves to eat","Le encanta comer"],
  ["attack",0,"Proud of its power","Se enorgullece de su fuerza"],
  ["defense",0,"Sturdy body","Se caracteriza por su cuerpo resistente"],
  ["special-attack",0,"Highly curious","Siente mucha curiosidad por todo"],
  ["special-defense",0,"Strong willed","Se distingue por su gran fuerza de voluntad"],
  ["speed",0,"Likes to run","Le gusta ir muy rápido"],
  ["hp",1,"Takes plenty of siestas","A menudo se duerme"],
  ["attack",1,"Likes to thrash about","Le gusta revolverse"],
  ["defense",1,"Capable of taking hits","Encaja bien los ataques"],
  ["special-attack",1,"Mischievous","Le gusta hacer travesuras"],
  ["special-defense",1,"Somewhat vain","Es un poco petulante"],
  ["speed",1,"Alert to sounds","Siempre tiene el oído alerta"],
  ["hp",2,"Nods off a lot","Duerme mucho"],
  ["attack",2,"A little quick tempered","A veces se enfada"],
  ["defense",2,"Highly persistent","Es muy persistente"],
  ["special-attack",2,"Thoroughly cunning","Es muy sagaz"],
  ["special-defense",2,"Strongly defiant","Es muy insolente"],
  ["speed",2,"Impetuous and silly","Es de carácter simple e impetuoso"],
  ["hp",3,"Scatters things often","Suele desordenar cosas"],
  ["attack",3,"Likes to fight","Le gusta luchar"],
  ["defense",3,"Good endurance","Se caracteriza por ser muy resistente"],
  ["special-attack",3,"Often lost in thought","A menudo está en Babia"],
  ["special-defense",3,"Hates to lose","Odia perder"],
  ["speed",3,"Somewhat of a clown","Le encanta hacer payasadas"],
  ["hp",4,"Likes to relax","Le gusta relajarse"],
  ["attack",4,"Quick tempered","Tiene mal genio"],
  ["defense",4,"Good perseverance","Es muy perseverante"],
  ["special-attack",4,"Very finicky","Es muy tiquismiquis"],
  ["special-defense",4,"Somewhat stubborn","Es un poco cabezota"],
  ["speed",4,"Quick to flee","Huye rápido"],
]
