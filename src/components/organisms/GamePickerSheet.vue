<script setup lang="ts">
import { computed } from 'vue'
import { mdiEarth } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import { groupGamesByGeneration } from '@/utils/games'
import { useDexLabel } from '@/composables/useDexLabel'

const props = defineProps<{
  games: readonly Game[]
  /** Slug do jogo selecionado; null = todos. */
  selected: string | null
}>()

const emit = defineEmits<{ select: [slug: string | null] }>()

const open = defineModel<boolean>({ default: false })

const { t } = useI18n()
const { dexLabel } = useDexLabel()

const groups = computed(() => groupGamesByGeneration(props.games))

function subtitle(game: Game): string {
  return game.dexes.map(dexLabel).join(' · ')
}

function choose(slug: string | null): void {
  emit('select', slug)
  open.value = false
}
</script>

<template>
  <v-bottom-sheet v-model="open" inset>
    <v-card class="game-picker" rounded="t-xl" :aria-label="t('home.chooseGame')">
      <v-card-title class="text-title-large pt-4">{{ t('home.pickGame') }}</v-card-title>
      <v-list class="game-picker__list" density="comfortable" nav>
        <v-list-item
          :active="selected === null"
          :prepend-icon="mdiEarth"
          :title="t('home.allGames')"
          :subtitle="t('home.nationalDex')"
          color="primary"
          rounded="lg"
          @click="choose(null)"
        />
        <template v-for="group in groups" :key="group.generation">
          <v-list-subheader>{{ t('home.generation', { n: group.generation }) }}</v-list-subheader>
          <v-list-item
            v-for="game in group.games"
            :key="game.slug"
            :active="game.slug === selected"
            :title="game.title"
            :subtitle="subtitle(game)"
            color="primary"
            rounded="lg"
            @click="choose(game.slug)"
          />
        </template>
      </v-list>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.game-picker {
  display: flex;
  flex-direction: column;
  max-height: 80dvh;
}

.game-picker__list {
  overflow-y: auto;
  padding-bottom: calc(8px + var(--safe-bottom));
}
</style>
