<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BATTLE_TYPES } from '@/data/typeChart'
import type { PokemonType } from '@/types/pokemon'
import TypeToggle from '@/components/atoms/TypeToggle.vue'

defineProps<{
  selected: readonly PokemonType[]
}>()

const emit = defineEmits<{
  toggle: [type: PokemonType]
  clear: []
}>()

const open = defineModel<boolean>({ default: false })

const { t } = useI18n()
</script>

<template>
  <v-bottom-sheet v-model="open" inset>
    <v-card class="type-picker" rounded="t-xl" :aria-label="t('typeFilter.title')">
      <v-card-title class="text-title-large pt-4">{{ t('typeFilter.title') }}</v-card-title>
      <v-card-subtitle>{{ t('typeFilter.hint') }}</v-card-subtitle>
      <v-card-text class="d-flex flex-wrap ga-2" role="group" :aria-label="t('typeFilter.label')">
        <TypeToggle
          v-for="type in BATTLE_TYPES"
          :key="type"
          :type="type"
          :selected="selected.includes(type)"
          @toggle="emit('toggle', $event)"
        />
      </v-card-text>
      <v-card-actions class="type-picker__actions">
        <v-btn variant="text" :disabled="selected.length === 0" @click="emit('clear')">
          {{ t('common.clear') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="open = false">
          {{ t('common.done') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.type-picker__actions {
  padding-bottom: calc(8px + var(--safe-bottom));
}
</style>
