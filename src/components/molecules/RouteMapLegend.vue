<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiChessRook, mdiPineTree, mdiTunnel, mdiWaves } from '@mdi/js'
import type { MapStyle } from '@/composables/useMapStyle'

const props = withDefaults(defineProps<{ variant?: MapStyle }>(), { variant: 'schematic' })

const { t } = useI18n()

const classic = computed(() => props.variant === 'classic')

/** Marcadores quadrados com ícone, nas mesmas cores do mapa (RegionMapCanvas). */
const MARKERS = [
  { key: 'cave', icon: mdiTunnel, color: '#8a6a52' },
  { key: 'forest', icon: mdiPineTree, color: '#3f8a3a' },
  { key: 'tower', icon: mdiChessRook, color: '#7556a8' },
  { key: 'water', icon: mdiWaves, color: '#2f78bf' },
] as const
</script>

<template>
  <details class="route-map-legend text-label-medium" :class="{ 'is-classic': classic }">
    <summary>{{ t('routes.map.legend.title') }}</summary>
    <ul class="route-map-legend__list">
      <li>
        <svg viewBox="-12 -12 24 24" aria-hidden="true">
          <template v-if="classic">
            <rect x="-9" y="-9" width="18" height="18" class="route-map-legend__town is-city" />
            <rect x="-3.5" y="-3.5" width="7" height="7" class="route-map-legend__inner" />
          </template>
          <template v-else>
            <circle r="9" class="route-map-legend__town" />
            <circle r="3.5" class="route-map-legend__dot" />
          </template>
        </svg>
        {{ t('routes.map.legend.city') }}
      </li>
      <li>
        <svg viewBox="-12 -12 24 24" aria-hidden="true">
          <rect
            v-if="classic"
            x="-7"
            y="-7"
            width="14"
            height="14"
            class="route-map-legend__town"
          />
          <circle v-else r="7" class="route-map-legend__town" />
        </svg>
        {{ t('routes.map.legend.town') }}
      </li>
      <li>
        <svg viewBox="-16 -12 32 24" aria-hidden="true">
          <rect
            x="-12"
            y="-8"
            width="24"
            height="16"
            :rx="classic ? 2 : 8"
            class="route-map-legend__badge"
          />
          <text y="3.5" text-anchor="middle" class="route-map-legend__badge-text">1</text>
        </svg>
        {{ t('routes.map.legend.route') }}
      </li>
      <li>
        <svg viewBox="0 -12 32 24" aria-hidden="true">
          <rect v-if="classic" y="-8" width="32" height="16" class="route-map-legend__sea-bg" />
          <path d="M2 0 H30" class="route-map-legend__sea" />
        </svg>
        {{ t('routes.map.legend.sea') }}
      </li>
      <li>
        <svg viewBox="0 -12 32 24" aria-hidden="true">
          <path d="M2 0 H30" class="route-map-legend__cave" />
        </svg>
        {{ t('routes.map.legend.tunnel') }}
      </li>
      <li v-for="marker in MARKERS" :key="marker.key">
        <svg viewBox="-12 -12 24 24" aria-hidden="true">
          <rect x="-9" y="-9" width="18" height="18" :rx="classic ? 1 : 5" :fill="marker.color" />
          <path :d="marker.icon" fill="#fff" transform="translate(-6.5 -6.5) scale(0.5417)" />
        </svg>
        {{ t(`routes.map.legend.${marker.key}`) }}
      </li>
      <li>
        <svg viewBox="-12 -12 24 24" aria-hidden="true">
          <rect
            v-if="classic"
            x="-7"
            y="-7"
            width="14"
            height="14"
            class="route-map-legend__town route-map-legend__town--off"
          />
          <circle v-else r="7" class="route-map-legend__town route-map-legend__town--off" />
        </svg>
        {{ t('routes.map.legend.noData') }}
      </li>
      <li>
        <svg viewBox="-12 -12 24 24" aria-hidden="true">
          <circle r="7" class="route-map-legend__done" />
          <path d="M-3.4 0 l2.4 2.5 l4.5 -4.8" class="route-map-legend__check" />
        </svg>
        {{ t('routes.map.legend.done') }}
      </li>
    </ul>
  </details>
</template>

<style scoped>
.route-map-legend summary {
  cursor: pointer;
  width: fit-content;
  padding: 4px 0;
}

.route-map-legend__list {
  list-style: none;
  padding: 4px 0 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.route-map-legend__list li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.route-map-legend__list svg {
  height: 20px;
  width: auto;
}

.route-map-legend__town {
  fill: rgb(var(--v-theme-surface));
  stroke: currentColor;
  stroke-width: 3;
}

.route-map-legend__town--off {
  opacity: 0.45;
}

.route-map-legend__dot {
  fill: currentColor;
}

.route-map-legend__badge {
  fill: rgb(var(--v-theme-surface));
  stroke: currentColor;
  stroke-width: 2;
}

.route-map-legend__badge-text {
  fill: currentColor;
  font-size: 11px;
  font-weight: 700;
}

.route-map-legend__sea {
  stroke: #3f86c4;
  stroke-width: 3;
  stroke-dasharray: 7 6;
}

.route-map-legend__cave {
  stroke: #8a6a52;
  stroke-width: 4;
  stroke-dasharray: 0.5 7;
  stroke-linecap: round;
}

/* Estilo clássico: as mesmas cores do RegionMapCanvas (.region-map--classic). */
.is-classic .route-map-legend__town {
  fill: #ef7d2c;
  stroke: #1b1914;
  stroke-width: 2.5;
}

.is-classic .route-map-legend__town.is-city {
  fill: #d83a2a;
}

.route-map-legend__inner {
  fill: #fffdf4;
}

.is-classic .route-map-legend__badge {
  fill: #fffbe6;
  stroke: #6e5427;
}

.is-classic .route-map-legend__badge-text {
  fill: #1b1914;
}

.route-map-legend__sea-bg {
  fill: #4c8fd6;
}

.is-classic .route-map-legend__sea {
  stroke: #f4fbff;
  stroke-dasharray: 4 8;
  stroke-linecap: square;
}

.is-classic .route-map-legend__cave {
  stroke: #4a3720;
  stroke-dasharray: 3 9;
  stroke-linecap: square;
}

.route-map-legend__done {
  fill: #2e7d32;
}

.route-map-legend__check {
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
