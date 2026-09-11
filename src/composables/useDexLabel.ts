import { useI18n } from 'vue-i18n'
import type { GameDex } from '@/data/games'

/**
 * Nome da Pokédex no idioma atual. Regiões (Kanto, Galar…) são iguais em todo idioma e ficam
 * em `data/games.ts`; só as poucas com tradução (Tundra da Coroa, Hiperespaço…) têm chave `dex.*`.
 */
export function useDexLabel() {
  const { t, te } = useI18n()
  function dexLabel(dex: GameDex): string {
    return te(`dex.${dex.slug}`) ? t(`dex.${dex.slug}`) : dex.label
  }
  return { dexLabel }
}
