<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import type { Game } from '@/data/games'
import type { RegionMap } from '@/data/maps/types'
import { hasRegionMap, loadRegionMap } from '@/data/maps'
import type { RouteEncounters } from '@/composables/useRouteEncounters'
import type { RouteListSection } from '@/utils/routes'
import { mapLocations } from '@/utils/routeMap'
import { formatAreaName } from '@/utils/encounters'
import { speciesIdOf } from '@/utils/forms'
import { announce } from '@/composables/useAnnouncer'
import RegionMapCanvas from '@/components/molecules/RegionMapCanvas.vue'
import RouteLocationCard from '@/components/molecules/RouteLocationCard.vue'
import RouteMapLegend from '@/components/molecules/RouteMapLegend.vue'

const props = defineProps<{
  game: Game
  sections: readonly RouteListSection[]
  encounters: RouteEncounters
  /** Locais que batem com a busca (null sem busca). */
  matches: ReadonlySet<string> | null
  caughtIds?: ReadonlySet<number>
  onlyMissing?: boolean
}>()

const emit = defineEmits<{ select: [id: number]; toggleCaught: [speciesId: number] }>()

const { t } = useI18n()
const { mdAndUp } = useDisplay()
const { results, loading, failed } = props.encounters

/** Seções com desenho (região, ilhas, DLC); as outras viram botões abaixo do mapa. */
const mapped = computed(() => props.sections.filter((section) => hasRegionMap(section.key)))
const unmapped = computed(() => props.sections.filter((section) => !hasRegionMap(section.key)))

const activeKey = ref(mapped.value[0]?.key ?? '')
const active = computed(
  () => mapped.value.find((section) => section.key === activeKey.value) ?? mapped.value[0],
)

/** Mapas já baixados (cada região é um chunk próprio). */
const cache = new Map<string, RegionMap>()
const regionMap = shallowRef<RegionMap | null>(null)
const mapFailed = ref(false)

async function showSection(key: string): Promise<void> {
  mapFailed.value = false
  const cached = cache.get(key)
  if (cached) {
    regionMap.value = cached
    return
  }
  regionMap.value = null
  try {
    const map = await loadRegionMap(key)
    cache.set(key, map)
    if (active.value?.key === key) regionMap.value = map
  } catch {
    if (active.value?.key === key) mapFailed.value = true
  }
}

watch(
  () => active.value?.key,
  (key) => key && showSection(key),
  { immediate: true },
)

const selected = ref<string | null>(null)

watch(
  () => props.game.slug,
  () => {
    selected.value = null
    activeKey.value = mapped.value[0]?.key ?? ''
  },
)

/** Todos os locais do jogo, na ordem da história (anterior/próximo atravessam as seções). */
const allRoutes = computed(() => props.sections.flatMap((section) => section.routes))
const order = computed(() => allRoutes.value.map((route) => route.location))

const available = computed(() => new Set(active.value?.routes.map((route) => route.location)))
const activeOrder = computed(() => active.value?.routes.map((route) => route.location) ?? [])

/** Locais da seção sem ponto no desenho (navio, céu, eventos), como botões. */
const offMap = computed(() => {
  const map = regionMap.value
  if (!map || !active.value) return []
  const drawn = mapLocations(map)
  const listed = new Set(map.offMap ?? [])
  return active.value.routes
    .map((route) => route.location)
    .filter((location) => listed.has(location) || !drawn.has(location))
})

/** Locais com todas as espécies capturadas (só os já abertos: os outros nem foram baixados). */
const completed = computed(() => {
  const ids = props.caughtIds
  const done = new Set<string>()
  if (!ids) return done
  for (const [location, list] of Object.entries(results.value)) {
    if (list.length && list.every((pokemon) => ids.has(speciesIdOf(pokemon.id)))) done.add(location)
  }
  return done
})

const canvas = ref<InstanceType<typeof RegionMapCanvas> | null>(null)
const sheet = ref<{ $el: HTMLElement } | null>(null)

/** Centraliza o local acima do cartão do celular (no painel lateral, o mapa inteiro está livre). */
function centerOn(location: string, behavior: ScrollBehavior = 'smooth'): void {
  nextTick(() =>
    setTimeout(() => {
      const covered = mdAndUp.value ? 0 : (sheet.value?.$el.offsetHeight ?? 0) + 8
      canvas.value?.centerOn(location, behavior, covered)
    }),
  )
}

function select(location: string, { center = !mdAndUp.value } = {}): void {
  const section = props.sections.find((s) => s.routes.some((r) => r.location === location))
  if (section && hasRegionMap(section.key) && section.key !== activeKey.value) {
    activeKey.value = section.key
  }
  selected.value = location
  const route = allRoutes.value.find((r) => r.location === location)
  if (route) props.encounters.load(route)
  announce(formatAreaName(location))
  if (center) centerOn(location)
}

function close(): void {
  selected.value = null
}

const selectedIndex = computed(() => (selected.value ? order.value.indexOf(selected.value) : -1))
const previous = computed(() =>
  selectedIndex.value > 0 ? order.value[selectedIndex.value - 1]! : null,
)
const next = computed(() =>
  selectedIndex.value >= 0 && selectedIndex.value < order.value.length - 1
    ? order.value[selectedIndex.value + 1]!
    : null,
)
const step = computed(() =>
  selectedIndex.value >= 0 ? { index: selectedIndex.value + 1, total: order.value.length } : null,
)

function retrySelected(): void {
  const route = allRoutes.value.find((r) => r.location === selected.value)
  if (route) props.encounters.load(route)
}

/** Ao abrir o mapa (ou trocar de seção), mostra onde a história começa ou o local escolhido. */
watch(regionMap, (map) => {
  if (!map) return
  const target =
    selected.value && available.value.has(selected.value) ? selected.value : activeOrder.value[0]
  if (target) centerOn(target, 'instant')
})

/** Busca com um único local na seção: o mapa vai até ele. */
watch(
  () => props.matches,
  (found) => {
    if (!found?.size) return
    const inSection = activeOrder.value.filter((location) => found.has(location))
    if (inSection.length === 1) centerOn(inSection[0]!)
    else if (!inSection.length) {
      // Nada nesta seção: vai para a primeira seção com desenho que tem resultado.
      const other = mapped.value.find((s) => s.routes.some((r) => found.has(r.location)))
      if (other) activeKey.value = other.key
    }
  },
)

function sectionTitle(key: string): string {
  return t(`routes.section.${key}`)
}
</script>

<template>
  <div class="route-map" :class="{ 'route-map--wide': mdAndUp }">
    <div class="route-map__main">
      <v-btn-toggle
        v-if="mapped.length > 1"
        v-model="activeKey"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="route-map__sections mb-2"
        :aria-label="t('routes.map.sections')"
      >
        <v-btn
          v-for="section in mapped"
          :key="section.key"
          :value="section.key"
          :aria-pressed="section.key === active?.key"
        >
          {{ sectionTitle(section.key) }}
        </v-btn>
      </v-btn-toggle>

      <div v-if="mapFailed" class="d-flex flex-column align-start ga-2 py-4">
        <span>{{ t('routes.map.loadError') }}</span>
        <v-btn color="primary" variant="tonal" size="small" @click="showSection(activeKey)">
          {{ t('common.retry') }}
        </v-btn>
      </div>
      <v-skeleton-loader v-else-if="!regionMap" aria-hidden="true" type="image" height="420" />
      <RegionMapCanvas
        v-else-if="active"
        ref="canvas"
        :map="regionMap"
        :title="sectionTitle(active.key)"
        :game-slug="game.slug"
        :available="available"
        :selected="selected"
        :matches="matches"
        :completed="completed"
        :order="activeOrder"
        @select="select"
      />

      <p class="text-label-medium opacity-70 mt-2 mb-0">{{ t('routes.map.hint') }}</p>
      <RouteMapLegend class="mt-2" />

      <div v-if="offMap.length" class="mt-3">
        <h3 class="text-title-small mb-1">{{ t('routes.map.offMap') }}</h3>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="location in offMap"
            :key="location"
            :color="location === selected ? 'primary' : undefined"
            :variant="location === selected ? 'flat' : 'tonal'"
            :aria-pressed="location === selected"
            @click="select(location)"
          >
            {{ formatAreaName(location) }}
          </v-chip>
        </div>
      </div>

      <div v-for="section in unmapped" :key="section.key" class="mt-3">
        <h3 class="text-title-small mb-1">{{ sectionTitle(section.key) }}</h3>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="route in section.routes"
            :key="route.location"
            :color="route.location === selected ? 'primary' : undefined"
            :variant="route.location === selected ? 'flat' : 'tonal'"
            :aria-pressed="route.location === selected"
            @click="select(route.location)"
          >
            {{ formatAreaName(route.location) }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Tela grande: painel ao lado do mapa, sempre visível. -->
    <aside v-if="mdAndUp" class="route-map__panel">
      <v-card v-if="selected" class="pa-4">
        <RouteLocationCard
          :game="game"
          :location="selected"
          :pokemon="results[selected]"
          :loading="!!loading[selected]"
          :failed="!!failed[selected]"
          :caught-ids="caughtIds"
          :only-missing="onlyMissing"
          :previous="previous"
          :next="next"
          :step="step"
          @close="close"
          @go="select($event, { center: true })"
          @retry="retrySelected"
          @select="emit('select', $event)"
          @toggle-caught="emit('toggleCaught', $event)"
        />
      </v-card>
      <v-card v-else class="pa-4 text-body-medium">
        <p class="mb-3">{{ t('routes.map.empty') }}</p>
        <v-btn
          v-if="activeOrder[0]"
          color="primary"
          variant="tonal"
          @click="select(activeOrder[0]!, { center: true })"
        >
          {{ t('routes.map.start', { name: formatAreaName(activeOrder[0]!) }) }}
        </v-btn>
      </v-card>
    </aside>

    <!-- Celular: cartão preso ao rodapé, sem cobrir o mapa inteiro nem bloquear o toque nele. -->
    <Transition name="route-map-sheet">
      <v-card
        v-if="!mdAndUp && selected"
        ref="sheet"
        class="route-map__sheet pa-4"
        elevation="8"
        @keydown.esc="close"
      >
        <RouteLocationCard
          :game="game"
          :location="selected"
          :pokemon="results[selected]"
          :loading="!!loading[selected]"
          :failed="!!failed[selected]"
          :caught-ids="caughtIds"
          :only-missing="onlyMissing"
          :previous="previous"
          :next="next"
          :step="step"
          @close="close"
          @go="select($event, { center: true })"
          @retry="retrySelected"
          @select="emit('select', $event)"
          @toggle-caught="emit('toggleCaught', $event)"
        />
      </v-card>
    </Transition>
    <!-- Espaço para o fim da página não ficar escondido atrás do cartão. -->
    <div v-if="!mdAndUp && selected" class="route-map__sheet-spacer" aria-hidden="true" />
  </div>
</template>

<style scoped>
.route-map--wide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.route-map__main {
  min-width: 0;
}

.route-map__sections {
  max-width: 100%;
  overflow-x: auto;
}

.route-map__panel {
  position: sticky;
  top: calc(140px + var(--safe-top));
  max-height: calc(100dvh - 160px - var(--safe-top));
  overflow-y: auto;
}

.route-map__sheet {
  position: fixed;
  z-index: 1005;
  left: calc(8px + var(--safe-left));
  right: calc(8px + var(--safe-right));
  bottom: calc(8px + var(--safe-bottom));
  max-height: 46dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 20px !important;
}

.route-map__sheet-spacer {
  height: 46dvh;
}

@media (prefers-reduced-motion: no-preference) {
  .route-map-sheet-enter-active,
  .route-map-sheet-leave-active {
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }

  .route-map-sheet-enter-from,
  .route-map-sheet-leave-to {
    transform: translateY(24px);
    opacity: 0;
  }
}
</style>
