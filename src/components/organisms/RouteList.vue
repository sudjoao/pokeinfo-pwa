<script setup lang="ts">
import { computed, defineAsyncComponent, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiFormatListBulleted, mdiMapOutline } from '@mdi/js'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { routeSectionsForGame } from '@/utils/routes'
import { formatAreaName } from '@/utils/encounters'
import { speciesIdOf } from '@/utils/forms'
import { readStorage, writeStorage } from '@/utils/storage'
import { hasRegionMap } from '@/data/maps'
import { useRouteEncounters } from '@/composables/useRouteEncounters'
import RouteEncounterList from '@/components/molecules/RouteEncounterList.vue'
import SearchField from '@/components/molecules/SearchField.vue'

/** O desenho e os dados do mapa só baixam quando alguém abre o mapa. */
const RouteMap = defineAsyncComponent(() => import('@/components/organisms/RouteMap.vue'))

/** Última visão escolhida (lista ou mapa), lembrada entre jogos e visitas. */
const VIEW_KEY = 'pokeinfo:routes-view:v1'

const props = defineProps<{
  game: Game
  /** Espécies capturadas no jogo (a marcação é por espécie, as formas regionais contam junto). */
  caughtIds?: ReadonlySet<number>
}>()
const emit = defineEmits<{ select: [id: number]; toggleCaught: [speciesId: number] }>()

/** Esconde nas rotas abertas os Pokémon já capturados. */
const onlyMissing = ref(false)

function isCaught(pokemon: RoutePokemon): boolean {
  return props.caughtIds?.has(speciesIdOf(pokemon.id)) ?? false
}

function caughtCount(list: readonly RoutePokemon[]): number {
  return new Set(list.filter(isCaught).map((pokemon) => speciesIdOf(pokemon.id))).size
}

function speciesCount(list: readonly RoutePokemon[]): number {
  return new Set(list.map((pokemon) => speciesIdOf(pokemon.id))).size
}

const { t } = useI18n()

/** Na ordem da história, por região/DLC; o título só aparece quando há mais de uma seção. */
const sections = computed(() => routeSectionsForGame(props.game))
const routes = computed(() => sections.value.flatMap((section) => section.routes))

/** O mapa existe quando alguma seção do jogo tem desenho (os "Outros encontros" não têm). */
const canShowMap = computed(() => sections.value.some((section) => hasRegionMap(section.key)))
const storedView = ref<'list' | 'map'>(readStorage<string>(VIEW_KEY) === 'map' ? 'map' : 'list')
const view = computed(() => (canShowMap.value ? storedView.value : 'list'))

function setView(value: 'list' | 'map'): void {
  storedView.value = value
  writeStorage(VIEW_KEY, value)
}

/** Sem diferenciar maiúsculas nem acentos ("cave" acha "Cave of Origin"). */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const search = ref('')
const searchTerm = computed(() => normalize(search.value?.trim() ?? ''))

/** Locais que batem com a busca (null sem busca), para o mapa destacar. */
const matches = computed<ReadonlySet<string> | null>(() => {
  const term = searchTerm.value
  if (!term) return null
  return new Set(
    routes.value
      .map((route) => route.location)
      .filter((location) => normalize(formatAreaName(location)).includes(term)),
  )
})

/** Seções com os locais que batem com a busca; as que ficam vazias somem. */
const visibleSections = computed(() => {
  const found = matches.value
  if (!found) return sections.value
  return sections.value
    .map((section) => ({
      ...section,
      routes: section.routes.filter((route) => found.has(route.location)),
    }))
    .filter((section) => section.routes.length)
})

const openPanel = ref<string | undefined>(undefined)
const encounters = useRouteEncounters(toRef(props, 'game'))
const { results, loading, failed } = encounters

/** Troca de jogo: painel aberto e busca são do jogo anterior. */
watch(
  () => props.game.slug,
  () => {
    openPanel.value = undefined
    search.value = ''
  },
)

function loadLocation(location: string | undefined): void {
  const route = routes.value.find((r) => r.location === location)
  if (route) encounters.load(route)
}

watch(openPanel, loadLocation)
</script>

<template>
  <div>
    <p v-if="!routes.length" class="text-body-medium opacity-70 mb-0">
      {{ t('routes.empty', { game: game.title }) }}
    </p>

    <template v-else>
      <div class="route-list__toolbar d-flex flex-wrap align-center gc-3 gr-2 mb-2">
        <SearchField
          v-model="search"
          :placeholder="t('routes.searchPlaceholder')"
          :label="t('routes.searchLabel')"
          density="compact"
          class="route-list__search"
        />
        <v-btn-toggle
          v-if="canShowMap"
          :model-value="view"
          mandatory
          density="compact"
          variant="outlined"
          divided
          :aria-label="t('routes.view.label')"
          @update:model-value="setView"
        >
          <v-btn value="list" :prepend-icon="mdiFormatListBulleted" :aria-pressed="view === 'list'">
            {{ t('routes.view.list') }}
          </v-btn>
          <v-btn value="map" :prepend-icon="mdiMapOutline" :aria-pressed="view === 'map'">
            {{ t('routes.view.map') }}
          </v-btn>
        </v-btn-toggle>
      </div>
      <v-switch
        v-if="caughtIds"
        v-model="onlyMissing"
        :label="t('routes.onlyMissing')"
        color="primary"
        density="compact"
        hide-details
        class="mb-2"
      />

      <p v-if="view === 'map' && matches && !matches.size" class="text-body-medium opacity-70 mb-2">
        {{ t('routes.noMatch', { query: search.trim() }) }}
      </p>
      <RouteMap
        v-if="view === 'map'"
        :game="game"
        :sections="sections"
        :encounters="encounters"
        :matches="matches"
        :caught-ids="caughtIds"
        :only-missing="onlyMissing"
        @select="emit('select', $event)"
        @toggle-caught="emit('toggleCaught', $event)"
      />

      <template v-else>
        <p v-if="!visibleSections.length" class="text-body-medium opacity-70 mb-0">
          {{ t('routes.noMatch', { query: search.trim() }) }}
        </p>
        <section v-for="section in visibleSections" :key="section.key" class="route-section">
          <h2 v-if="sections.length > 1" class="text-title-small mb-2">
            {{ t(`routes.section.${section.key}`) }}
          </h2>
          <!-- Um grupo por seção, todos no mesmo openPanel: abrir um painel fecha o dos outros. -->
          <v-expansion-panels v-model="openPanel" variant="accordion">
            <v-expansion-panel
              v-for="route in section.routes"
              :key="route.location"
              :value="route.location"
            >
              <v-expansion-panel-title>
                <span class="text-body-medium font-weight-medium">{{
                  formatAreaName(route.location)
                }}</span>
                <span v-if="results[route.location]" class="text-label-small opacity-70 ms-2">
                  {{ t('routes.pokemonCount', results[route.location]!.length) }}
                  <template v-if="caughtIds">
                    ·
                    {{
                      t('routes.caughtCount', {
                        caught: caughtCount(results[route.location]!),
                        total: speciesCount(results[route.location]!),
                      })
                    }}
                  </template>
                </span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <RouteEncounterList
                  :game="game"
                  :pokemon="results[route.location]"
                  :loading="!!loading[route.location]"
                  :failed="!!failed[route.location]"
                  :caught-ids="caughtIds"
                  :only-missing="onlyMissing"
                  @retry="encounters.load(route)"
                  @select="emit('select', $event)"
                  @toggle-caught="emit('toggleCaught', $event)"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.route-section + .route-section {
  margin-top: 16px;
}

.route-list__search {
  flex: 1 1 240px;
}
</style>
