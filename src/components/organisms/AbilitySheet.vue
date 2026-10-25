<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PokemonButtonGrid, {
  type PokemonButtonItem,
} from '@/components/molecules/PokemonButtonGrid.vue'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

const props = defineProps<{
  title: string
  description: string | null
  /** Idioma da descrição ('en' quando a interface está em pt-BR). */
  descriptionLang?: string
  status: 'loading' | 'ready' | 'error'
  /** Pokémon (e formas) que têm a habilidade; null enquanto a tabela carrega. */
  holders: readonly (PokemonButtonItem & { hidden: boolean })[] | null
}>()

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const emit = defineEmits<{ select: [id: number]; retry: [] }>()

const { t } = useI18n()

const items = computed(() =>
  (props.holders ?? []).map((holder) => ({
    ...holder,
    note: holder.hidden ? t('ability.hidden') : undefined,
  })),
)

function select(id: number): void {
  open.value = false
  emit('select', id)
}
</script>

<template>
  <v-bottom-sheet v-model="open" scrollable :aria-label="title">
    <v-card rounded="t-xl" :title="title">
      <v-card-text class="ability-sheet__body">
        <v-skeleton-loader aria-hidden="true" v-if="status === 'loading'" type="paragraph" />
        <div v-else-if="status === 'error'" class="d-flex flex-column align-start ga-2">
          <span>{{ t('ability.error') }}</span>
          <v-btn color="primary" variant="tonal" size="small" @click="emit('retry')">
            {{ t('common.retry') }}
          </v-btn>
        </div>
        <p v-else class="text-body-large" :lang="description ? descriptionLang : undefined">
          {{ description ?? t('ability.noDescription') }}
        </p>

        <template v-if="holders">
          <h2 class="text-title-small mt-4 mb-2">
            {{ t('ability.pokemonWith', { n: holders.length }) }}
          </h2>
          <PokemonButtonGrid :items="items" @select="select" />
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
.ability-sheet__body {
  max-height: 70dvh;
}
</style>
