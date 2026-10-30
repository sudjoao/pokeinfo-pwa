<script setup lang="ts">
import { computed } from 'vue'
import { mdiPlus } from '@mdi/js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Game, GameDex } from '@/data/games'
import type { PokemonType } from '@/types/pokemon'
import { gameContextQuery } from '@/utils/games'
import { useTeam } from '@/composables/useTeam'
import { useTeamActions } from '@/composables/useTeamActions'
import TeamPanel from '@/components/organisms/TeamPanel.vue'
import TeamOverlays from '@/components/organisms/TeamOverlays.vue'

/**
 * Aba "Time" da Home: o time salvo do jogo selecionado com a análise, para voltar a ele durante o
 * jogo. Escolher os Pokémon continua no team builder (`/team`), que mostra o mesmo time.
 */
const props = defineProps<{
  game: Game | null
  dex: GameDex | null
  /** Lista atual da Home (busca e filtros): de onde saem as sugestões. */
  candidates: readonly { id: number; name: string }[]
  /** Filtro de tipo da Home, levado ao team builder. */
  types: readonly PokemonType[]
}>()

const { t } = useI18n()
const router = useRouter()

const team = useTeam(() => props.game)

const contextQuery = computed(() =>
  gameContextQuery(props.game && props.dex ? { game: props.game, dex: props.dex } : null),
)

const actions = useTeamActions(team, {
  game: () => props.game,
  context: () => contextQuery.value,
  candidates: () => props.candidates,
})

const savedText = computed(() =>
  props.game ? t('team.savedFor', { game: props.game.title }) : t('team.savedNational'),
)

/** Abre o team builder já com o jogo e o filtro de tipo da Home. */
function openBuilder(): void {
  const query: Record<string, string> = { ...contextQuery.value }
  if (props.types.length) query.type = props.types.join(',')
  router.push({ name: 'team', query })
}
</script>

<template>
  <div class="team-tab">
    <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
      <p class="text-body-small opacity-70 mb-0">{{ savedText }}</p>
      <v-btn color="primary" variant="flat" :prepend-icon="mdiPlus" @click="openBuilder">
        {{ t('team.edit') }}
      </v-btn>
    </div>

    <TeamPanel
      :members="team.members.value"
      :defense="team.defense.value"
      :threats="team.threats.value"
      :coverage="team.coverage.value"
      :gaps="team.gaps.value"
      :suggestions="actions.suggestions.value"
      @select="actions.openMember"
      @remove="actions.removeMember"
      @add="openBuilder"
      @clear="actions.clearTeam"
      @add-suggestion="actions.toggle"
      @export-showdown="actions.copyShowdown"
      @import-showdown="actions.importOpen.value = true"
      @share="actions.shareTeam"
      @share-image="actions.openShareImage"
    />

    <TeamOverlays :actions="actions" />
  </div>
</template>

<style scoped>
/* A análise foi pensada para uma coluna: larga demais, as tabelas ficam esticadas. */
.team-tab {
  max-width: 760px;
}
</style>
