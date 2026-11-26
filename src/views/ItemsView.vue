<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiFilterRemoveOutline } from '@mdi/js'
import { GAMES } from '@/data/games'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { announce } from '@/composables/useAnnouncer'
import { findGame } from '@/utils/games'
import { formatPokemonName } from '@/utils/pokemon'
import { allItems, filterItems, ITEM_POCKETS, itemName, type ItemPocket } from '@/utils/items'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const { t, te, locale } = useI18n()

/** Itens por vez na lista (são ~1.600): "Mostrar mais" adiciona outro lote. */
const PAGE = 60

const search = ref('')
const debouncedSearch = useDebouncedRef(search, 250)
const pocket = ref<ItemPocket | null>(null)
/** Jogo levado à página do item (o "quem segura" é por jogo); null = todos os jogos. */
const game = ref<string | null>(null)
const shown = ref(PAGE)

/**
 * Estado vindo da URL. A tela fica em KeepAlive (voltar de um item mantém a lista e a rolagem),
 * então a URL é relida ao reativar: voltando, é a que a tela escreveu; por um link, ela manda.
 */
function readFromRoute(): void {
  search.value = typeof route.query.q === 'string' ? route.query.q : ''
  pocket.value = (ITEM_POCKETS as readonly string[]).includes(String(route.query.pocket))
    ? (route.query.pocket as ItemPocket)
    : null
  game.value = findGame(String(route.query.game ?? ''))?.slug ?? null
}
readFromRoute()
onActivated(() => {
  if (route.name === 'items') readFromRoute()
})

// Só na própria rota: a busca tem atraso, e um toque num item nesse intervalo levaria a query
// para a URL da página do item (a tela continua viva no KeepAlive).
watch([debouncedSearch, pocket, game], () => {
  if (route.name !== 'items') return
  shown.value = PAGE
  const query: LocationQueryRaw = {}
  const term = (debouncedSearch.value ?? '').trim()
  if (term) query.q = term
  if (pocket.value) query.pocket = pocket.value
  if (game.value) query.game = game.value
  router.replace({ query })
})

const gameItems = computed(() => [
  { value: null, title: t('itemPage.allGames') },
  ...[...GAMES].reverse().map((g) => ({ value: g.slug, title: g.title })),
])

function clearFilters(): void {
  search.value = ''
  pocket.value = null
}

const filtered = computed(() =>
  filterItems(allItems(), debouncedSearch.value ?? '', pocket.value, locale.value),
)
watch(
  () => filtered.value.length,
  (count) => announce(t('itemsPage.results', count)),
)

function categoryLabel(category: string): string {
  return te(`itemsPage.category.${category}`)
    ? t(`itemsPage.category.${category}`)
    : formatPokemonName(category)
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('itemsPage.title')" @back="goBack">
    <div class="d-flex flex-column ga-3">
      <div class="items-filters">
        <SearchField
          v-model="search"
          :placeholder="t('itemsPage.searchPlaceholder')"
          :label="t('itemsPage.searchLabel')"
          density="compact"
          class="items-filters__search"
        />
        <v-select
          v-model="game"
          :items="gameItems"
          :label="t('moves.game')"
          density="compact"
          variant="outlined"
          hide-details
        />
      </div>
      <v-chip-group
        v-model="pocket"
        :aria-label="t('itemsPage.pocket')"
        selected-class="text-primary-safe"
        column
      >
        <v-chip
          v-for="value in ITEM_POCKETS"
          :key="value"
          :value="value"
          filter
          variant="outlined"
          role="button"
          :aria-pressed="pocket === value"
        >
          {{ t(`itemsPage.pockets.${value}`) }}
        </v-chip>
      </v-chip-group>

      <EmptyState
        v-if="!filtered.length"
        :title="t('itemsPage.emptyTitle')"
        :message="t('itemsPage.empty')"
        :action-label="t('home.clearFilters')"
        :action-icon="mdiFilterRemoveOutline"
        @action="clearFilters"
      />
      <v-card v-else>
        <!-- role="navigation": o v-list põe role="list", que não aceita os links como filhos (como no AppMenu). -->
        <v-list
          density="comfortable"
          role="navigation"
          :aria-label="t('itemsPage.results', filtered.length)"
        >
          <v-list-item
            v-for="item in filtered.slice(0, shown)"
            :key="item.slug"
            :to="{ name: 'item', params: { slug: item.slug }, query: game ? { game } : {} }"
            :title="itemName(item, locale)"
            :subtitle="categoryLabel(item.category)"
          >
            <template #prepend>
              <img
                v-if="item.sprite"
                :src="item.sprite"
                alt=""
                width="32"
                height="32"
                loading="lazy"
                crossorigin="anonymous"
                class="items-list__sprite me-3"
              />
              <span v-else class="items-list__sprite me-3" aria-hidden="true" />
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions v-if="filtered.length > shown">
          <v-btn variant="text" @click="shown += PAGE">
            {{ t('movesPage.showMore', { n: filtered.length - shown }) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </DetailLayout>
</template>

<style scoped>
.items-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.items-filters__search {
  grid-column: 1 / -1;
}

.items-list__sprite {
  display: inline-block;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  image-rendering: pixelated;
}
</style>
