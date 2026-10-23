<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { announce } from '@/composables/useAnnouncer'
import { formatPokemonName } from '@/utils/pokemon'
import { allItems, filterItems, ITEM_POCKETS, itemName, type ItemPocket } from '@/utils/items'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'

const route = useRoute()
const router = useRouter()
const { t, te, locale } = useI18n()

/** Itens por vez na lista (são ~1.600): "Mostrar mais" adiciona outro lote. */
const PAGE = 60

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const debouncedSearch = useDebouncedRef(search, 250)
const pocket = ref<ItemPocket | null>(
  (ITEM_POCKETS as readonly string[]).includes(String(route.query.pocket))
    ? (route.query.pocket as ItemPocket)
    : null,
)
const shown = ref(PAGE)

watch([debouncedSearch, pocket], () => {
  shown.value = PAGE
  const query: LocationQueryRaw = {}
  const term = (debouncedSearch.value ?? '').trim()
  if (term) query.q = term
  if (pocket.value) query.pocket = pocket.value
  router.replace({ query })
})

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
      <SearchField
        v-model="search"
        :placeholder="t('itemsPage.searchPlaceholder')"
        :label="t('itemsPage.searchLabel')"
        density="compact"
      />
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

      <v-card>
        <v-card-text v-if="!filtered.length" class="opacity-70">{{
          t('itemsPage.empty')
        }}</v-card-text>
        <template v-else>
          <!-- role="navigation": o v-list põe role="list", que não aceita os links como filhos (como no AppMenu). -->
          <v-list
            density="comfortable"
            role="navigation"
            :aria-label="t('itemsPage.results', filtered.length)"
          >
            <v-list-item
              v-for="item in filtered.slice(0, shown)"
              :key="item.slug"
              :to="{
                name: 'item',
                params: { slug: item.slug },
                query: route.query.game ? { game: route.query.game } : {},
              }"
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
        </template>
      </v-card>
    </div>
  </DetailLayout>
</template>

<style scoped>
.items-list__sprite {
  display: inline-block;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  image-rendering: pixelated;
}
</style>
