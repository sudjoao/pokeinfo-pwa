<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { PokemonGameSprite } from '@/types/pokemon'
import { spriteGame, spriteTitle, spritesForGame } from '@/utils/detailExtras'
import { prefersReducedMotion } from '@/composables/usePrefersReducedMotion'

const props = defineProps<{
  sprites: readonly PokemonGameSprite[]
  game: Game | null
  /** Começa no shiny quando o hero está mostrando o shiny. */
  shiny?: boolean
}>()

const { t } = useI18n()

/** Quantos aparecem antes de "Mostrar todos" (a lista inteira passa de 20 nos Pokémon antigos). */
const PREVIEW = 8

const showShiny = ref(props.shiny ?? false)
const expanded = ref(false)
/** GIFs só sem "reduzir movimento"; senão o PNG parado do mesmo jogo. */
const animate = !prefersReducedMotion()

const ordered = computed(() => spritesForGame(props.sprites, props.game))
const hasShiny = computed(() => props.sprites.some((s) => s.shiny || s.animatedShiny))
const visible = computed(() => (expanded.value ? ordered.value : ordered.value.slice(0, PREVIEW)))

function srcOf(sprite: PokemonGameSprite): string | null {
  const animated = showShiny.value ? sprite.animatedShiny : sprite.animated
  const still = showShiny.value ? sprite.shiny : sprite.front
  return (animate ? animated || still : still || animated) ?? null
}

function isCurrent(sprite: PokemonGameSprite): boolean {
  return !!props.game && spriteGame(sprite.key)?.slug === props.game.slug
}
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium d-flex align-center flex-wrap ga-2">
      {{ t('sprites.title') }}
      <v-spacer />
      <v-switch
        v-if="hasShiny"
        v-model="showShiny"
        :label="t('sprites.shiny')"
        color="primary"
        density="compact"
        hide-details
        class="flex-grow-0"
      />
    </v-card-title>
    <v-card-text>
      <ul class="sprites-grid">
        <li
          v-for="sprite in visible"
          :key="sprite.key"
          class="sprites-grid__item"
          :class="{ 'sprites-grid__item--current': isCurrent(sprite) }"
        >
          <img
            v-if="srcOf(sprite)"
            :src="srcOf(sprite)!"
            alt=""
            width="96"
            height="96"
            loading="lazy"
            crossorigin="anonymous"
            decoding="async"
            class="sprites-grid__img"
          />
          <span v-else class="sprites-grid__empty text-label-small opacity-70">
            {{ t('sprites.noShiny') }}
          </span>
          <span class="text-label-small text-center">
            {{ spriteTitle(sprite.key) }}
            <span v-if="isCurrent(sprite)" class="d-sr-only">{{ t('sprites.current') }}</span>
          </span>
          <span class="text-label-small opacity-70">
            {{ t('sprites.generation', { n: sprite.generation }) }}
          </span>
        </li>
      </ul>
      <v-btn
        v-if="ordered.length > PREVIEW"
        variant="text"
        class="mt-2"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? t('sprites.showLess') : t('sprites.showAll', { n: ordered.length }) }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.sprites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.sprites-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.sprites-grid__item--current {
  outline: 2px solid rgb(var(--v-theme-primary));
}

.sprites-grid__img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: pixelated;
}

.sprites-grid__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  text-align: center;
}
</style>
