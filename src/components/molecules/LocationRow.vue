<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { EncounterLocation } from '@/types/pokemon'
import {
  formatAreaName,
  formatEncounterMethod,
  formatLevelRange,
  versionTitle,
} from '@/utils/encounters'

const props = defineProps<{
  location: EncounterLocation
  /** Jogo da linha, para nomear a versão do selo "Só Sword". */
  game: Game
}>()

const { t, te } = useI18n()

const name = computed(() => formatAreaName(props.location.area))
const levels = computed(() => formatLevelRange(props.location, t))
const methods = computed(() =>
  props.location.methods.map((slug) => formatEncounterMethod(slug, t, te)),
)
const onlyIn = computed(() =>
  props.location.onlyIn ? versionTitle(props.game, props.location.onlyIn) : null,
)
</script>

<template>
  <li class="location-row">
    <div class="d-flex align-baseline flex-wrap gc-2">
      <span class="text-body-medium font-weight-medium">{{ name }}</span>
      <span class="text-label-small opacity-70">{{ levels }}</span>
    </div>
    <div class="d-flex flex-wrap ga-1 mt-1">
      <v-chip v-for="method in methods" :key="method" size="x-small" variant="tonal">
        {{ method }}
      </v-chip>
      <v-chip v-if="onlyIn" size="x-small" variant="outlined" color="primary">
        {{ t('versionFilter.only', { version: onlyIn }) }}
      </v-chip>
    </div>
  </li>
</template>

<style scoped>
.location-row {
  list-style: none;
  padding: 8px 0;
}

.location-row + .location-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
