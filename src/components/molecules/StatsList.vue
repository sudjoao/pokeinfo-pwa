<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonStat } from '@/types/pokemon'
import StatBar from '@/components/atoms/StatBar.vue'

const props = defineProps<{ stats: PokemonStat[] }>()

const { t } = useI18n()

const total = computed(() => props.stats.reduce((sum, stat) => sum + stat.value, 0))
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium d-flex justify-space-between align-center">
      <span>{{ t('detail.stats') }}</span>
      <span class="text-label-large opacity-70">{{ t('detail.statsTotal', { n: total }) }}</span>
    </v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <StatBar v-for="stat in stats" :key="stat.name" :name="stat.name" :value="stat.value" />
    </v-card-text>
  </v-card>
</template>
