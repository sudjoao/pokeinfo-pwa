<script setup lang="ts">
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { useI18n } from 'vue-i18n'

/** Vizinho na navegação anterior/próximo, com o rótulo já montado pela view. */
export interface NeighborLink {
  id: number
  number: string
  name: string
}

/** Botões "anterior" e "próximo" da ficha (no topo e, repetidos, no fim da página longa). */
defineProps<{
  previous: NeighborLink | null
  next: NeighborLink | null
}>()

const emit = defineEmits<{ select: [id: number] }>()

const { t } = useI18n()
</script>

<template>
  <nav class="d-flex justify-space-between align-center" :aria-label="t('detail.neighborsLabel')">
    <v-btn
      v-if="previous"
      variant="text"
      :prepend-icon="mdiChevronLeft"
      class="text-none"
      @click="emit('select', previous.id)"
    >
      {{ previous.number }} {{ previous.name }}
    </v-btn>
    <span v-else />
    <v-btn
      v-if="next"
      variant="text"
      :append-icon="mdiChevronRight"
      class="text-none"
      @click="emit('select', next.id)"
    >
      {{ next.name }} {{ next.number }}
    </v-btn>
  </nav>
</template>
