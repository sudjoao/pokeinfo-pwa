<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { mdiEarth } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import { groupGamesByGeneration } from '@/utils/games'
import { useDexLabel } from '@/composables/useDexLabel'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

const props = defineProps<{
  games: readonly Game[]
  /** Slug do jogo selecionado; null = todos. */
  selected: string | null
  /** Últimos jogos escolhidos (fora o atual), num bloco no topo: os atuais ficam no fim da lista. */
  recent?: readonly Game[]
}>()

const emit = defineEmits<{ select: [slug: string | null] }>()

const open = defineModel<boolean>({ default: false })
useOverlayFocusReturn(open)

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

const list = useTemplateRef<{ $el: HTMLElement }>('list')

// A lista tem ~30 jogos e o escolhido costuma estar no fim: ao abrir, ele já aparece na tela.
watch(open, async (value) => {
  if (!value) return
  await nextTick()
  requestAnimationFrame(() => {
    list.value?.$el
      .querySelector('.game-picker__game[aria-checked="true"]')
      ?.scrollIntoView({ block: 'center' })
  })
})
</script>

<template>
  <v-bottom-sheet v-model="open" inset :aria-label="t('home.chooseGame')">
    <v-card class="game-picker" rounded="t-xl">
      <v-card-title class="text-title-large pt-4">{{ t('home.pickGame') }}</v-card-title>
      <v-list
        ref="list"
        class="game-picker__list"
        density="comfortable"
        nav
        role="radiogroup"
        :aria-label="t('home.chooseGame')"
      >
        <v-list-item
          :active="selected === null"
          role="radio"
          :aria-checked="selected === null"
          :prepend-icon="mdiEarth"
          :title="t('home.allGames')"
          :subtitle="t('home.nationalDex')"
          color="primary"
          rounded="lg"
          @click="choose(null)"
        />
        <template v-if="recent?.length">
          <v-list-subheader>{{ t('home.recentGames') }}</v-list-subheader>
          <v-list-item
            v-for="game in recent"
            :key="`recent-${game.slug}`"
            role="radio"
            :aria-checked="false"
            :title="game.title"
            :subtitle="subtitle(game)"
            color="primary"
            rounded="lg"
            @click="choose(game.slug)"
          />
        </template>
        <template v-for="group in groups" :key="group.generation">
          <v-list-subheader>{{ t('home.generation', { n: group.generation }) }}</v-list-subheader>
          <v-list-item
            v-for="game in group.games"
            :key="game.slug"
            class="game-picker__game"
            :active="game.slug === selected"
            role="radio"
            :aria-checked="game.slug === selected"
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
