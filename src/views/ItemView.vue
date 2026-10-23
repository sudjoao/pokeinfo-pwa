<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { GAMES } from '@/data/games'
import type { BerryDetail, ItemDetail } from '@/services/pokeapi/item.service'
import { useReferenceStore } from '@/stores/reference'
import { usePokedexStore } from '@/stores/pokedex'
import { findGame } from '@/utils/games'
import { formatPokemonName, isPokemonType } from '@/utils/pokemon'
import { findItem, itemName } from '@/utils/items'
import { latestGameWith, raritiesInGame, type HeldRarity } from '@/utils/detailExtras'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import InfoTile from '@/components/atoms/InfoTile.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import PokemonButtonGrid from '@/components/molecules/PokemonButtonGrid.vue'

const route = useRoute()
const router = useRouter()
const { t, te, locale, n } = useI18n()
const reference = useReferenceStore()
const pokedex = usePokedexStore()
// Nomes de quem segura vêm do índice (em cache local; a Home pode nem ter sido aberta).
onMounted(() => pokedex.load())

const slug = computed(() => String(route.params.slug ?? ''))
const entry = computed(() => findItem(slug.value))
const title = computed(() =>
  entry.value ? itemName(entry.value, locale.value) : formatPokemonName(slug.value),
)
watch([title, locale], () => (document.title = t('app.detailTitle', { name: title.value })), {
  immediate: true,
})

const game = ref<string | null>(findGame(String(route.query.game ?? ''))?.slug ?? null)
watch(game, (value) => router.replace({ query: value ? { game: value } : {} }))
const gameItems = computed(() => [
  { value: null, title: t('itemPage.allGames') },
  ...[...GAMES].reverse().map((g) => ({ value: g.slug, title: g.title })),
])

const detail = shallowRef<ItemDetail | null>(null)
const berry = shallowRef<BerryDetail | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')

async function load(): Promise<void> {
  const current = slug.value
  status.value = 'loading'
  berry.value = null
  try {
    const result = await reference.ensureItem(current)
    if (current !== slug.value) return
    detail.value = result
    status.value = 'ready'
    if (entry.value?.berry) {
      reference
        .ensureBerry(current)
        .then((b) => current === slug.value && (berry.value = b))
        .catch(() => {})
    }
  } catch {
    if (current === slug.value) status.value = 'error'
  }
}
watch(slug, load, { immediate: true })

const effect = computed(() => {
  const d = detail.value
  if (!d) return null
  if (locale.value === 'es') {
    const es = (game.value && d.effectEs[game.value]) || d.effectEsLatest
    if (es) return { text: es, lang: 'es' }
  }
  const en = d.effect ?? d.flavorEn
  return en ? { text: en, lang: 'en' } : null
})

function rarityText(rarity: HeldRarity): string {
  const pct = t('routes.chance', { pct: rarity.rarity })
  return rarity.label ? `${rarity.label} ${pct}` : pct
}

/** Quem segura: com jogo, só nas versões dele; sem jogo, a chance do jogo mais recente. */
const holders = computed(() =>
  (detail.value?.heldBy ?? []).flatMap((held) => {
    const g = game.value ? findGame(game.value) : latestGameWith(held.rarity)
    if (!g) return []
    const rarities = raritiesInGame(g, held.rarity)
    if (!rarities.length) return []
    const note = rarities.map(rarityText).join(' · ')
    return [
      {
        id: held.id,
        name: pokedex.entryOf(held.id)?.name ?? String(held.id),
        note: game.value ? note : `${note} (${g.title})`,
      },
    ]
  }),
)

function label(group: string, value: string): string {
  return te(`${group}.${value}`) ? t(`${group}.${value}`) : formatPokemonName(value)
}

function openPokemon(id: number): void {
  router.push({ name: 'pokemon', params: { id }, query: game.value ? { game: game.value } : {} })
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'items' })
}
</script>

<template>
  <DetailLayout :title="title" @back="goBack">
    <div class="d-flex flex-column ga-4">
      <v-card v-if="!entry" class="pa-4">
        <p class="mb-3">{{ t('itemPage.notFound') }}</p>
        <v-btn color="primary" variant="tonal" :to="{ name: 'items' }">{{
          t('itemsPage.title')
        }}</v-btn>
      </v-card>

      <template v-else>
        <v-card>
          <v-card-text>
            <div class="d-flex align-center ga-4 mb-4">
              <img
                v-if="entry.sprite"
                :src="entry.sprite"
                alt=""
                width="64"
                height="64"
                crossorigin="anonymous"
                class="item-page__sprite"
              />
              <div>
                <div class="text-body-medium">
                  {{ label('itemsPage.category', entry.category) }}
                </div>
                <div class="text-label-medium opacity-70">
                  {{ t(`itemsPage.pockets.${entry.pocket}`) }}
                </div>
              </div>
            </div>
            <div class="item-page__tiles">
              <InfoTile
                :label="t('itemPage.price')"
                :value="
                  entry.cost
                    ? t('itemPage.priceValue', { n: n(entry.cost) })
                    : t('itemPage.notSold')
                "
              />
              <InfoTile
                :label="t('itemPage.fling')"
                :value="detail ? (detail.flingPower ? String(detail.flingPower) : '—') : undefined"
              />
            </div>
            <v-skeleton-loader
              v-if="status === 'loading'"
              aria-hidden="true"
              type="paragraph"
              class="mt-3"
            />
            <div v-else-if="status === 'error'" class="d-flex flex-column align-start ga-2 mt-4">
              <span>{{ t('itemPage.loadError') }}</span>
              <v-btn color="primary" variant="tonal" size="small" @click="load">{{
                t('common.retry')
              }}</v-btn>
            </div>
            <p v-else-if="effect" class="text-body-medium mt-4 mb-0" :lang="effect.lang">
              {{ effect.text }}
            </p>
          </v-card-text>
        </v-card>

        <v-card v-if="berry">
          <v-card-title tag="h2" class="text-title-medium">{{ t('itemPage.berry') }}</v-card-title>
          <v-card-text>
            <div class="item-page__tiles">
              <InfoTile
                :label="t('itemPage.firmness')"
                :value="label('itemPage.firmnessValue', berry.firmness)"
              />
              <InfoTile
                :label="t('itemPage.growth')"
                :value="t('itemPage.growthValue', { n: berry.growthTime })"
              />
              <InfoTile :label="t('itemPage.harvest')" :value="String(berry.maxHarvest)" />
              <InfoTile
                :label="t('itemPage.size')"
                :value="t('itemPage.sizeValue', { n: n(berry.size / 10) })"
              />
            </div>
            <div class="d-flex align-center flex-wrap ga-2 mt-4">
              <span class="text-label-large">{{ t('itemPage.naturalGift') }}</span>
              <TypeChip
                v-if="isPokemonType(berry.naturalGiftType)"
                :type="berry.naturalGiftType"
                size="small"
              />
              <span class="text-body-medium">{{
                t('itemPage.naturalGiftPower', { n: berry.naturalGiftPower })
              }}</span>
            </div>
            <p v-if="berry.flavors.length" class="text-body-medium mt-3 mb-0">
              <span class="text-label-large me-2">{{ t('itemPage.flavors') }}</span>
              {{
                berry.flavors.map((f) => `${label('flavor', f.flavor)} ${f.potency}`).join(' · ')
              }}
            </p>
          </v-card-text>
        </v-card>

        <v-card v-if="status === 'ready'">
          <v-card-title tag="h2" class="text-title-medium">{{ t('itemPage.heldBy') }}</v-card-title>
          <v-card-text>
            <v-select
              v-model="game"
              :items="gameItems"
              :label="t('moves.game')"
              density="compact"
              variant="outlined"
              hide-details
              class="item-page__game mb-3"
            />
            <p v-if="!holders.length" class="opacity-70 mb-0">{{ t('itemPage.heldByNone') }}</p>
            <PokemonButtonGrid v-else :items="holders" @select="openPokemon" />
          </v-card-text>
        </v-card>
      </template>
    </div>
  </DetailLayout>
</template>

<style scoped>
.item-page__sprite {
  image-rendering: pixelated;
}

.item-page__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px 12px;
}

.item-page__game {
  max-width: 360px;
}
</style>
