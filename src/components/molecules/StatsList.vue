<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonStat } from '@/types/pokemon'
import { statRange } from '@/utils/stats'
import StatBar from '@/components/atoms/StatBar.vue'

const props = defineProps<{ stats: PokemonStat[] }>()

const { t } = useI18n()

const total = computed(() => props.stats.reduce((sum, stat) => sum + stat.value, 0))

/** 0 = só os stats base; 50/100 = mostra também a faixa mínima e máxima nesse nível. */
const level = ref<0 | 50 | 100>(0)

const ranges = computed(() =>
  level.value ? props.stats.map((stat) => statRange(stat.name, stat.value, level.value)) : null,
)
</script>

<template>
  <v-card>
    <v-card-title
      class="text-title-medium d-flex justify-space-between align-center flex-wrap ga-2"
    >
      <span>{{ t('detail.stats') }}</span>
      <span class="text-label-large opacity-70">{{ t('detail.statsTotal', { n: total }) }}</span>
    </v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <v-btn-toggle
        v-model="level"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="align-self-start"
      >
        <v-btn :value="0" size="small" :aria-pressed="level === 0">{{
          t('detail.statsBase')
        }}</v-btn>
        <v-btn :value="50" size="small" :aria-pressed="level === 50">{{
          t('detail.statsAtLevel', { n: 50 })
        }}</v-btn>
        <v-btn :value="100" size="small" :aria-pressed="level === 100">{{
          t('detail.statsAtLevel', { n: 100 })
        }}</v-btn>
      </v-btn-toggle>
      <StatBar
        v-for="(stat, index) in stats"
        :key="stat.name"
        :name="stat.name"
        :value="stat.value"
        :range="ranges?.[index]"
      />
      <p v-if="ranges" class="text-body-small opacity-70 mb-0">{{ t('detail.statsRangeHint') }}</p>
    </v-card-text>
  </v-card>
</template>
