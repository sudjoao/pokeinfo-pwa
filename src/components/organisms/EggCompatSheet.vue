<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PokemonButtonGrid, {
  type PokemonButtonItem,
} from '@/components/molecules/PokemonButtonGrid.vue'

defineProps<{
  status: 'loading' | 'ready' | 'error'
  species: readonly PokemonButtonItem[]
  /** O próprio Pokémon é Ditto (cruza com todos que geram ovos). */
  isDitto: boolean
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{ select: [id: number]; retry: [] }>()

const { t } = useI18n()

function select(id: number): void {
  open.value = false
  emit('select', id)
}
</script>

<template>
  <v-bottom-sheet v-model="open" scrollable>
    <v-card rounded="t-xl" :title="t('detail.eggCompatibleTitle')">
      <v-card-text class="egg-sheet__body">
        <p v-if="isDitto" class="text-body-large mb-0">{{ t('detail.eggDittoSelf') }}</p>
        <template v-else>
          <v-skeleton-loader v-if="status === 'loading'" type="list-item-avatar@4" />
          <div v-else-if="status === 'error'" class="d-flex flex-column align-start ga-2">
            <span>{{ t('detail.eggCompatibleError') }}</span>
            <v-btn color="primary" variant="tonal" size="small" @click="emit('retry')">
              {{ t('common.retry') }}
            </v-btn>
          </div>
          <template v-else>
            <p class="text-body-medium mb-3">
              {{ t('detail.eggCompatibleCount', species.length) }} · {{ t('detail.eggDitto') }}
            </p>
            <PokemonButtonGrid :items="species" @select="select" />
          </template>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.egg-sheet__body {
  max-height: 70vh;
}
</style>
