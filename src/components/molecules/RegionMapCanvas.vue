<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  mdiChessRook,
  mdiFitToPageOutline,
  mdiFlower,
  mdiImageFilterHdr,
  mdiIsland,
  mdiMagnifyMinusOutline,
  mdiMagnifyPlusOutline,
  mdiOfficeBuilding,
  mdiPillar,
  mdiPineTree,
  mdiSignDirection,
  mdiStarFourPoints,
  mdiTunnel,
  mdiWaves,
} from '@mdi/js'
import type { MapLabelSide, MapPlaceKind, MapPoint, RegionMap } from '@/data/maps/types'
import { formatAreaName } from '@/utils/encounters'
import {
  areaPath,
  existsInGame,
  linePath,
  mapLabel,
  pathMidpoint,
  routeBadgeText,
  splitLabel,
} from '@/utils/routeMap'

const props = defineProps<{
  map: RegionMap
  /** Nome da região, para o leitor de tela ("Mapa de Kanto"). */
  title: string
  gameSlug: string
  /** Locais com Pokémon no jogo: só eles respondem ao toque. */
  available: ReadonlySet<string>
  selected: string | null
  /** Locais que batem com a busca; null sem busca (nada fica apagado). */
  matches: ReadonlySet<string> | null
  /** Locais em que todas as espécies já foram capturadas (selo verde). */
  completed: ReadonlySet<string>
  /** Ordem da história: define a ordem do Tab entre os locais. */
  order: readonly string[]
}>()

const emit = defineEmits<{ select: [location: string] }>()

const { t } = useI18n()
const uid = useId()

/** Zoom em que os nomes ficam legíveis (13 unidades ≈ 10,5 px) num celular. */
const READABLE_ZOOM = 0.8
const MAX_ZOOM = 3
const ZOOM_STEP = 1.4

const ICONS: Record<Exclude<MapPlaceKind, 'city' | 'town'>, string> = {
  cave: mdiTunnel,
  forest: mdiPineTree,
  tower: mdiChessRook,
  building: mdiOfficeBuilding,
  water: mdiWaves,
  mountain: mdiImageFilterHdr,
  ruins: mdiPillar,
  field: mdiFlower,
  island: mdiIsland,
  special: mdiStarFourPoints,
}

/** Raio (ou meia largura) do marcador, para o nome não encostar nele. */
function markerRadius(kind: MapPlaceKind): number {
  if (kind === 'city') return 10
  if (kind === 'town') return 7.5
  return 9
}

const LINE_HEIGHT = 13

interface LabelLayout {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  lines: string[]
}

function labelLayout(name: string, side: MapLabelSide, radius: number): LabelLayout | null {
  if (side === 'none') return null
  const lines = splitLabel(name)
  const extra = (lines.length - 1) * LINE_HEIGHT
  const gap = radius + 5
  const diagonal = radius * 0.7 + 3
  switch (side) {
    case 'n':
      return { x: 0, y: -gap - extra, anchor: 'middle', lines }
    case 'e':
      return { x: gap, y: 4.5 - extra / 2, anchor: 'start', lines }
    case 'w':
      return { x: -gap, y: 4.5 - extra / 2, anchor: 'end', lines }
    case 'ne':
      return { x: diagonal, y: -diagonal - extra, anchor: 'start', lines }
    case 'nw':
      return { x: -diagonal, y: -diagonal - extra, anchor: 'end', lines }
    case 'se':
      return { x: diagonal, y: diagonal + 9, anchor: 'start', lines }
    case 'sw':
      return { x: -diagonal, y: diagonal + 9, anchor: 'end', lines }
    default:
      return { x: 0, y: gap + 10, anchor: 'middle', lines }
  }
}

const areas = computed(() =>
  props.map.areas
    .filter((area) => existsInGame(area, props.gameSlug))
    .map((area) => ({ kind: area.kind, d: areaPath(area.points, area.smooth) })),
)
const captions = computed(() =>
  (props.map.captions ?? []).filter((caption) => existsInGame(caption, props.gameSlug)),
)

const lines = computed(() =>
  props.map.routes
    .filter((route) => existsInGame(route, props.gameSlug))
    .map((route) => ({
      d: linePath(route.path),
      kind: route.kind ?? 'land',
      location: route.location ?? null,
    })),
)

interface MapNode {
  key: string
  location: string
  type: 'place' | 'badge'
  at: MapPoint
  kind: MapPlaceKind | 'badge'
  /** Placa: número da rota ou null (placa com ícone de estrada). */
  text: string | null
  width: number
  label: LabelLayout | null
  /** Nome completo (leitor de tela e dica do mouse). */
  name: string
}

const nodes = computed<MapNode[]>(() => {
  const list: MapNode[] = []
  for (const route of props.map.routes) {
    if (!route.location || !existsInGame(route, props.gameSlug)) continue
    const text = routeBadgeText(route.location)
    list.push({
      key: `route:${route.location}:${list.length}`,
      location: route.location,
      type: 'badge',
      at: route.badge ?? pathMidpoint(route.path),
      kind: 'badge',
      text,
      width: text ? Math.max(20, text.length * 7 + 10) : 22,
      label: null,
      name: formatAreaName(route.location),
    })
  }
  for (const place of props.map.places) {
    if (!existsInGame(place, props.gameSlug)) continue
    list.push({
      key: `place:${place.location}`,
      location: place.location,
      type: 'place',
      at: place.at,
      kind: place.kind,
      text: null,
      width: 0,
      label: labelLayout(mapLabel(place.location), place.label ?? 's', markerRadius(place.kind)),
      name: formatAreaName(place.location),
    })
  }
  // Ordem do Tab = ordem da história; o que não está na história fica no fim.
  const rank = new Map(props.order.map((location, index) => [location, index]))
  return list.sort(
    (a, b) =>
      (rank.get(a.location) ?? Infinity) - (rank.get(b.location) ?? Infinity) ||
      (a.type === b.type ? 0 : a.type === 'badge' ? -1 : 1),
  )
})

/** Pinta lugares sem Pokémon antes dos com Pokémon, para os tocáveis ficarem por cima. */
const paintedNodes = computed(() => {
  const inactive = nodes.value.filter((node) => !props.available.has(node.location))
  const active = nodes.value.filter((node) => props.available.has(node.location))
  return [...inactive, ...active]
})

function isDimmed(location: string): boolean {
  return !!props.matches && !props.matches.has(location)
}

function onKeydown(event: KeyboardEvent, location: string): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('select', location)
}

function onNodeClick(location: string): void {
  if (suppressClick) return
  emit('select', location)
}

// ---- Zoom e arrasto ----

const scroller = ref<HTMLElement | null>(null)
const viewportWidth = ref(0)
const viewportHeight = ref(0)
/** null = zoom inicial (legível no celular, inteiro na tela grande). */
const chosenZoom = ref<number | null>(null)

const fitZoom = computed(() => {
  if (!viewportWidth.value) return 1
  return Math.min(viewportWidth.value / props.map.width, MAX_ZOOM)
})
const minZoom = computed(() => Math.min(fitZoom.value, READABLE_ZOOM))
const zoom = computed(() => chosenZoom.value ?? Math.max(fitZoom.value, READABLE_ZOOM))
const width = computed(() => Math.round(props.map.width * zoom.value))
const height = computed(() => Math.round(props.map.height * zoom.value))

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(minZoom.value, value))
}

/** Troca o zoom mantendo parado o ponto (em px do viewport) sob o dedo, o mouse ou o centro. */
function setZoom(value: number, anchor?: { x: number; y: number }): void {
  const element = scroller.value
  const previous = zoom.value
  const next = clampZoom(value)
  if (!element || Math.abs(next - previous) < 0.001) return
  const ax = anchor?.x ?? element.clientWidth / 2
  const ay = anchor?.y ?? element.clientHeight / 2
  const mapX = (element.scrollLeft + ax) / previous
  const mapY = (element.scrollTop + ay) / previous
  chosenZoom.value = next
  nextTick(() => {
    element.scrollLeft = mapX * next - ax
    element.scrollTop = mapY * next - ay
  })
}

const canZoomIn = computed(() => zoom.value < MAX_ZOOM - 0.001)
const canZoomOut = computed(() => zoom.value > minZoom.value + 0.001)
const isFit = computed(() => Math.abs(zoom.value - fitZoom.value) < 0.001)

/**
 * Leva um local ao centro da parte da tela que está à vista: abaixo do cabeçalho fixo (o mesmo
 * `scroll-padding-top` da página) e acima de `coveredBottom` px do fim da janela (o cartão do
 * celular). Rola o mapa o quanto der e a página pelo resto: no celular o mapa quase cabe inteiro
 * na altura do viewport e sozinho não chega às bordas. Usado ao abrir o mapa, ao tocar num local
 * e no anterior/próximo.
 */
function centerOn(location: string, behavior: ScrollBehavior = 'smooth', coveredBottom = 0): void {
  const element = scroller.value
  const node = nodes.value.find((n) => n.location === location)
  if (!element || !node) return
  const [x, y] = node.at
  const rect = element.getBoundingClientRect()
  const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  const targetY = (header + window.innerHeight - coveredBottom) / 2
  const maxTop = element.scrollHeight - element.clientHeight
  const maxLeft = element.scrollWidth - element.clientWidth
  const top = Math.min(maxTop, Math.max(0, y * zoom.value - (targetY - rect.top)))
  const left = Math.min(maxLeft, Math.max(0, x * zoom.value - element.clientWidth / 2))
  element.scrollTo({ left, top, behavior })
  const rest = rect.top + y * zoom.value - top - targetY
  if (Math.abs(rest) > 24) window.scrollBy({ top: rest, behavior })
}

defineExpose({ centerOn })

let suppressClick = false
const dragging = ref(false)
let drag: { x: number; y: number; left: number; top: number; moved: boolean } | null = null

/** Arrastar com o mouse move o mapa (no toque, a rolagem nativa já faz isso). */
function onPointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !scroller.value) return
  drag = {
    x: event.clientX,
    y: event.clientY,
    left: scroller.value.scrollLeft,
    top: scroller.value.scrollTop,
    moved: false,
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
}

function onPointerMove(event: PointerEvent): void {
  if (!drag || !scroller.value) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (!drag.moved && Math.hypot(dx, dy) < 4) return
  drag.moved = true
  dragging.value = true
  scroller.value.scrollLeft = drag.left - dx
  scroller.value.scrollTop = drag.top - dy
}

function onPointerUp(): void {
  window.removeEventListener('pointermove', onPointerMove)
  // O clique que vem logo depois de um arrasto não seleciona o local em que o mouse parou.
  if (drag?.moved) {
    suppressClick = true
    setTimeout(() => (suppressClick = false))
  }
  drag = null
  dragging.value = false
}

/** Ctrl + roda (e a pinça do trackpad, que chega assim) aproxima em volta do ponteiro. */
function onWheel(event: WheelEvent): void {
  if (!event.ctrlKey || !scroller.value) return
  event.preventDefault()
  const rect = scroller.value.getBoundingClientRect()
  setZoom(zoom.value * Math.exp(-event.deltaY / 200), {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  })
}

/** Pinça com dois dedos no mapa: zoom do mapa, não da página. */
let pinch: { distance: number; zoom: number } | null = null

function touchDistance(touches: TouchList): number {
  const [a, b] = [touches[0]!, touches[1]!]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function onTouchStart(event: TouchEvent): void {
  if (event.touches.length === 2)
    pinch = { distance: touchDistance(event.touches), zoom: zoom.value }
}

function onTouchMove(event: TouchEvent): void {
  if (!pinch || event.touches.length !== 2 || !scroller.value) return
  event.preventDefault()
  const rect = scroller.value.getBoundingClientRect()
  const [a, b] = [event.touches[0]!, event.touches[1]!]
  setZoom(pinch.zoom * (touchDistance(event.touches) / pinch.distance), {
    x: (a.clientX + b.clientX) / 2 - rect.left,
    y: (a.clientY + b.clientY) / 2 - rect.top,
  })
}

function onTouchEnd(event: TouchEvent): void {
  if (event.touches.length < 2) pinch = null
}

let observer: ResizeObserver | null = null

onMounted(() => {
  const element = scroller.value
  if (!element) return
  observer = new ResizeObserver(([entry]) => {
    viewportWidth.value = entry!.contentRect.width
    viewportHeight.value = entry!.contentRect.height
  })
  observer.observe(element)
  viewportWidth.value = element.clientWidth
  viewportHeight.value = element.clientHeight
  // Passivos: false para poder impedir o zoom da página e a rolagem durante a pinça.
  element.addEventListener('wheel', onWheel, { passive: false })
  element.addEventListener('touchstart', onTouchStart, { passive: true })
  element.addEventListener('touchmove', onTouchMove, { passive: false })
  element.addEventListener('touchend', onTouchEnd, { passive: true })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  const element = scroller.value
  if (!element) return
  element.removeEventListener('wheel', onWheel)
  element.removeEventListener('touchstart', onTouchStart)
  element.removeEventListener('touchmove', onTouchMove)
  element.removeEventListener('touchend', onTouchEnd)
})

/** Outro mapa (troca de seção ou de jogo): volta ao zoom inicial. */
watch(
  () => props.map,
  () => (chosenZoom.value = null),
)
</script>

<template>
  <div class="region-map">
    <div
      ref="scroller"
      class="region-map__viewport"
      :class="{ 'is-dragging': dragging }"
      @pointerdown="onPointerDown"
    >
      <svg
        class="region-map__svg"
        :viewBox="`0 0 ${map.width} ${map.height}`"
        :width="width"
        :height="height"
        role="group"
        :aria-label="t('routes.map.label', { region: title })"
      >
        <defs>
          <pattern :id="`${uid}-waves`" width="28" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 10 q7 -6 14 0 t14 0" class="region-map__wave" />
          </pattern>
        </defs>

        <g aria-hidden="true">
          <rect class="region-map__sea" :width="map.width" :height="map.height" />
          <rect :width="map.width" :height="map.height" :fill="`url(#${uid}-waves)`" />
          <path
            v-for="(area, index) in areas"
            :key="index"
            :d="area.d"
            :class="`region-map__area region-map__area--${area.kind}`"
          />
          <text
            v-for="caption in captions"
            :key="caption.text"
            class="region-map__caption"
            :x="caption.at[0]"
            :y="caption.at[1]"
            text-anchor="middle"
          >
            {{ caption.text }}
          </text>

          <g class="region-map__lines">
            <path
              v-for="(line, index) in lines"
              :key="`casing-${index}`"
              :d="line.d"
              :class="`region-map__casing region-map__casing--${line.kind}`"
            />
            <path
              v-for="(line, index) in lines"
              :key="`line-${index}`"
              :d="line.d"
              :class="[
                `region-map__line region-map__line--${line.kind}`,
                {
                  'is-active': line.location && available.has(line.location),
                  'is-dimmed': !!matches && (!line.location || isDimmed(line.location)),
                  'is-selected': line.location && line.location === selected,
                },
              ]"
            />
          </g>
        </g>

        <g
          v-for="node in paintedNodes"
          :key="node.key"
          class="region-map__node"
          :class="{
            'is-active': available.has(node.location),
            'is-selected': node.location === selected,
            'is-dimmed': isDimmed(node.location),
            'is-match': matches?.has(node.location),
          }"
          :transform="`translate(${node.at[0]} ${node.at[1]})`"
          :role="available.has(node.location) ? 'button' : undefined"
          :tabindex="available.has(node.location) ? 0 : undefined"
          :aria-label="available.has(node.location) ? node.name : undefined"
          :aria-pressed="available.has(node.location) ? node.location === selected : undefined"
          :aria-hidden="available.has(node.location) ? undefined : 'true'"
          @click="available.has(node.location) && onNodeClick(node.location)"
          @keydown="onKeydown($event, node.location)"
        >
          <title>{{ node.name }}</title>
          <!-- Alvo de toque de 36 unidades, maior que o desenho. -->
          <circle class="region-map__hit" r="18" />

          <template v-if="node.type === 'badge'">
            <rect
              class="region-map__ring"
              :x="-node.width / 2 - 5"
              y="-14"
              :width="node.width + 10"
              height="28"
              rx="14"
            />
            <rect
              class="region-map__badge"
              :x="-node.width / 2"
              y="-9"
              :width="node.width"
              height="18"
              rx="9"
            />
            <text v-if="node.text" class="region-map__badge-text" y="4" text-anchor="middle">
              {{ node.text }}
            </text>
            <path
              v-else
              class="region-map__badge-icon"
              :d="mdiSignDirection"
              transform="translate(-6 -6) scale(0.5)"
            />
          </template>

          <template v-else>
            <circle class="region-map__ring" :r="markerRadius(node.kind as MapPlaceKind) + 6" />
            <template v-if="node.kind === 'city' || node.kind === 'town'">
              <circle
                :class="`region-map__town region-map__town--${node.kind}`"
                :r="markerRadius(node.kind)"
              />
              <circle v-if="node.kind === 'city'" class="region-map__town-dot" r="3.5" />
            </template>
            <template v-else>
              <rect
                :class="`region-map__marker region-map__marker--${node.kind}`"
                x="-9"
                y="-9"
                width="18"
                height="18"
                rx="5"
              />
              <path
                class="region-map__marker-icon"
                :d="ICONS[node.kind as keyof typeof ICONS]"
                transform="translate(-6.5 -6.5) scale(0.5417)"
              />
            </template>
            <text
              v-if="node.label"
              :class="`region-map__label region-map__label--${node.kind}`"
              :x="node.label.x"
              :y="node.label.y"
              :text-anchor="node.label.anchor"
            >
              <tspan
                v-for="(line, index) in node.label.lines"
                :key="index"
                :x="node.label.x"
                :dy="index ? LINE_HEIGHT : 0"
              >
                {{ line }}
              </tspan>
            </text>
          </template>

          <g
            v-if="completed.has(node.location)"
            class="region-map__done"
            :transform="
              node.type === 'badge'
                ? `translate(${node.width / 2} -8)`
                : `translate(${markerRadius(node.kind as MapPlaceKind) * 0.8} ${-markerRadius(node.kind as MapPlaceKind) * 0.8})`
            "
          >
            <circle r="5.5" />
            <path d="M-2.6 0 l1.8 1.9 l3.4 -3.6" />
          </g>
        </g>
      </svg>
    </div>

    <div class="region-map__zoom">
      <v-btn
        :icon="mdiMagnifyPlusOutline"
        size="small"
        variant="elevated"
        :disabled="!canZoomIn"
        :aria-label="t('routes.map.zoomIn')"
        @click="setZoom(zoom * ZOOM_STEP)"
      />
      <v-btn
        :icon="mdiMagnifyMinusOutline"
        size="small"
        variant="elevated"
        :disabled="!canZoomOut"
        :aria-label="t('routes.map.zoomOut')"
        @click="setZoom(zoom / ZOOM_STEP)"
      />
      <v-btn
        :icon="mdiFitToPageOutline"
        size="small"
        variant="elevated"
        :disabled="isFit"
        :aria-label="t('routes.map.fit')"
        @click="setZoom(fitZoom)"
      />
    </div>
  </div>
</template>

<style scoped>
.region-map {
  /* Cores do desenho (tema claro); o escuro troca abaixo. */
  --map-sea: #cfe2f1;
  --map-wave: #b9d3e9;
  --map-land: #f4f0e3;
  --map-coast: #c3b694;
  --map-mountain: #e4d5b8;
  --map-forest: #d2e5bf;
  --map-snow: #f7f9fc;
  --map-sand: #f0e1b2;
  --map-lava: #f2c6ad;
  --map-road: #a08b6b;
  --map-road-casing: #fffaf0;
  --map-sea-route: #3f86c4;
  --map-cave-route: #7a6a55;
  --map-ink: #2a2620;
  --map-ink-soft: #6b6152;
  --map-town-fill: #ffffff;
  --map-badge-fill: #ffffff;
  --map-done: #2e7d32;

  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--map-sea);
  box-shadow: 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity));
}

:global(.v-theme--dark .region-map) {
  --map-sea: #102536;
  --map-wave: #163049;
  --map-land: #262c25;
  --map-coast: #45503f;
  --map-mountain: #3a352d;
  --map-forest: #213a26;
  --map-snow: #3b4452;
  --map-sand: #3d3727;
  --map-lava: #4b2b22;
  --map-road: #a49271;
  --map-road-casing: #313829;
  --map-sea-route: #69aee6;
  --map-cave-route: #b5a283;
  --map-ink: #eeeae2;
  --map-ink-soft: #b3aa9a;
  --map-town-fill: #1e1e1e;
  --map-badge-fill: #2a2a2a;
  --map-done: #66bb6a;
}

.region-map__viewport {
  overflow: auto;
  max-height: min(72dvh, 820px);
  overscroll-behavior: contain;
  cursor: grab;
  /* Um dedo rola o mapa; a pinça de dois dedos é tratada no script. */
  touch-action: pan-x pan-y;
  -webkit-user-select: none;
  user-select: none;
}

.region-map__viewport.is-dragging {
  cursor: grabbing;
}

.region-map__svg {
  display: block;
  font-family: inherit;
}

.region-map__sea {
  fill: var(--map-sea);
}

.region-map__wave {
  fill: none;
  stroke: var(--map-wave);
  stroke-width: 1.2;
  stroke-linecap: round;
}

.region-map__area {
  stroke: none;
}

.region-map__area--land {
  fill: var(--map-land);
  stroke: var(--map-coast);
  stroke-width: 2;
  stroke-linejoin: round;
}

.region-map__area--mountain {
  fill: var(--map-mountain);
}

.region-map__area--forest {
  fill: var(--map-forest);
}

.region-map__area--snow {
  fill: var(--map-snow);
  stroke: var(--map-coast);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.region-map__area--sand {
  fill: var(--map-sand);
}

.region-map__area--lava {
  fill: var(--map-lava);
}

.region-map__area--water {
  fill: var(--map-sea);
  stroke: var(--map-coast);
  stroke-width: 1.5;
}

.region-map__caption {
  fill: var(--map-ink-soft);
  font-size: 15px;
  font-style: italic;
  font-weight: 500;
  letter-spacing: 0.12em;
  opacity: 0.75;
}

.region-map__casing,
.region-map__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.region-map__casing--land {
  stroke: var(--map-road-casing);
  stroke-width: 9;
}

.region-map__casing--water,
.region-map__casing--cave {
  stroke: none;
}

.region-map__line--land {
  stroke: var(--map-road);
  stroke-width: 4.5;
}

.region-map__line--water {
  stroke: var(--map-sea-route);
  stroke-width: 3;
  stroke-dasharray: 7 6;
}

.region-map__line--cave {
  stroke: var(--map-cave-route);
  stroke-width: 4;
  stroke-dasharray: 0.5 7;
}

.region-map__line.is-selected {
  stroke: rgb(var(--v-theme-primary));
}

.region-map__line.is-dimmed,
.region-map__node.is-dimmed {
  opacity: 0.25;
}

.region-map__node {
  outline: none;
}

.region-map__node.is-active {
  cursor: pointer;
}

.region-map__hit {
  fill: transparent;
}

.region-map__ring {
  fill: none;
  stroke: rgb(var(--v-theme-primary));
  stroke-width: 3;
  opacity: 0;
}

.region-map__node.is-selected .region-map__ring,
.region-map__node:focus-visible .region-map__ring {
  opacity: 1;
}

.region-map__node:focus-visible .region-map__ring {
  stroke-dasharray: 4 3;
}

.region-map__node.is-match .region-map__ring {
  opacity: 0.6;
}

.region-map__town {
  fill: var(--map-town-fill);
  stroke: var(--map-ink);
  stroke-width: 3;
}

.region-map__town-dot {
  fill: var(--map-ink);
}

.region-map__marker {
  stroke: var(--map-town-fill);
  stroke-width: 1.5;
}

.region-map__marker--cave {
  fill: #8a6a52;
}
.region-map__marker--forest {
  fill: #3f8a3a;
}
.region-map__marker--tower {
  fill: #7556a8;
}
.region-map__marker--building {
  fill: #546e7a;
}
.region-map__marker--water {
  fill: #2f78bf;
}
.region-map__marker--mountain {
  fill: #9a7046;
}
.region-map__marker--ruins {
  fill: #a7832f;
}
.region-map__marker--field {
  fill: #6d9f2a;
}
.region-map__marker--island {
  fill: #23897c;
}
.region-map__marker--special {
  fill: #c2185b;
}

.region-map__marker-icon,
.region-map__badge-icon {
  fill: #ffffff;
  pointer-events: none;
}

.region-map__badge-icon {
  fill: var(--map-ink);
}

.region-map__badge {
  fill: var(--map-badge-fill);
  stroke: var(--map-road);
  stroke-width: 1.5;
}

.region-map__badge-text {
  fill: var(--map-ink);
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.region-map__node.is-active .region-map__badge {
  stroke: var(--map-ink);
  stroke-width: 2;
}

/* Sem Pokémon neste jogo: continua visível para orientar, mas apagado e sem toque. */
.region-map__node:not(.is-active) .region-map__badge,
.region-map__node:not(.is-active) .region-map__badge-text,
.region-map__node:not(.is-active) .region-map__marker,
.region-map__node:not(.is-active) .region-map__marker-icon {
  opacity: 0.4;
}

.region-map__node:not(.is-active) .region-map__town {
  stroke: var(--map-ink-soft);
}

.region-map__node:not(.is-active) .region-map__label {
  fill: var(--map-ink-soft);
}

.region-map__label {
  fill: var(--map-ink);
  font-size: 12.5px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--map-land);
  stroke-width: 3.5px;
  stroke-linejoin: round;
  pointer-events: none;
}

/* O nome também é alvo do toque (só nos locais com Pokémon). */
.region-map__node.is-active .region-map__label {
  pointer-events: auto;
}

.region-map__label--city {
  font-size: 13.5px;
  font-weight: 700;
}

.region-map__label--cave,
.region-map__label--forest,
.region-map__label--tower,
.region-map__label--building,
.region-map__label--water,
.region-map__label--mountain,
.region-map__label--ruins,
.region-map__label--field,
.region-map__label--island,
.region-map__label--special {
  font-size: 11.5px;
  font-weight: 500;
}

.region-map__node.is-selected .region-map__label {
  fill: rgb(var(--v-theme-primary));
}

.region-map__done circle {
  fill: var(--map-done);
  stroke: var(--map-town-fill);
  stroke-width: 1.5;
}

.region-map__done path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.region-map__zoom {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (prefers-reduced-motion: no-preference) {
  .region-map__ring {
    transition: opacity 0.15s ease;
  }
}
</style>
