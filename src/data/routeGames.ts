/**
 * Jogos com a aba "Rotas" (alguma lista em `routes.ts` ou `routes-bdsp.ts`). Fica separado para a
 * Home decidir se mostra a aba sem carregar os ~170 KB de rotas, que só vêm ao abrir a aba.
 * Um teste (utils/__tests__/routes.spec.ts) garante que bate com os dois arquivos.
 */
export const ROUTE_GAMES: ReadonlySet<string> = new Set([
  'red-blue',
  'yellow',
  'gold-silver',
  'crystal',
  'ruby-sapphire',
  'emerald',
  'firered-leafgreen',
  'diamond-pearl',
  'platinum',
  'heartgold-soulsilver',
  'black-white',
  'black-2-white-2',
  'x-y',
  'omega-ruby-alpha-sapphire',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'lets-go-pikachu-lets-go-eevee',
  'sword-shield',
  'brilliant-diamond-shining-pearl',
])
