<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { PokemonHeldItem } from '@/types/pokemon'
import { heldItemsForGame, type HeldRarity } from '@/utils/detailExtras'
import { itemSpriteUrl } from '@/utils/pokemon'
import { useItemName } from '@/composables/useItemName'

const props = defineProps<{
  items: readonly PokemonHeldItem[]
  game: Game | null
}>()

const { t } = useI18n()

const rows = computed(() => heldItemsForGame(props.items, props.game))
const itemName = useItemName(() => props.items.map((held) => held.item))

function rarityText(rarity: HeldRarity): string {
  const pct = t('routes.chance', { pct: rarity.rarity })
  return rarity.label ? `${rarity.label} ${pct}` : pct
}
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('heldItems.title') }}</v-card-title>
    <v-card-text>
      <p v-if="!rows.length" class="text-body-medium opacity-70 mb-0">
        {{ t('heldItems.noneInGame', { game: game?.title }) }}
      </p>
      <ul v-else class="held-items">
        <li v-for="row in rows" :key="row.item" class="d-flex align-center ga-3">
          <img
            :src="itemSpriteUrl(row.item)"
            alt=""
            width="32"
            height="32"
            loading="lazy"
            crossorigin="anonymous"
            class="held-items__sprite"
          />
          <div class="min-width-0">
            <RouterLink
              :to="{
                name: 'item',
                params: { slug: row.item },
                query: game ? { game: game.slug } : {},
              }"
              class="held-items__link text-body-medium font-weight-medium"
            >
              {{ itemName(row.item) }}
            </RouterLink>
            <div class="text-label-small opacity-70">
              {{ row.rarities.map(rarityText).join(' · ') }}
              <template v-if="row.more">· {{ t('heldItems.more', row.more) }}</template>
            </div>
          </div>
        </li>
      </ul>
      <p class="text-body-small opacity-70 mt-3 mb-0">{{ t('heldItems.hint') }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.held-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.held-items__sprite {
  flex: 0 0 32px;
  image-rendering: pixelated;
}

.held-items__link {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.4);
  text-underline-offset: 3px;
}

.min-width-0 {
  min-width: 0;
}
</style>
