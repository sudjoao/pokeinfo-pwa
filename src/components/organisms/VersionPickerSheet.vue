<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BOTH_VERSIONS } from '@/composables/usePokemonList'
import type { ExclusiveVersion } from '@/data/exclusives'

/**
 * Filtro de versão: "nas duas versões", "só A" e "só B". Os três grupos cobrem a Pokédex inteira,
 * então não existe opção "todos": sem marcação (ou com "Limpar") aparecem todos.
 */
const props = defineProps<{
  gameTitle: string
  versions: readonly ExclusiveVersion[]
  selected: readonly string[]
  /** Quantos Pokémon da Pokédex atual há em cada grupo, por chave. */
  counts: Record<string, number>
}>()

const emit = defineEmits<{
  toggle: [key: string]
  clear: []
}>()

const open = defineModel<boolean>({ default: false })

const { t } = useI18n()

interface Option {
  key: string
  title: string
  subtitle: string
}

const options = computed<Option[]>(() => {
  const [a, b] = props.versions
  if (!a || !b) return []
  return [
    {
      key: BOTH_VERSIONS,
      title: t('versionFilter.both', { a: a.title, b: b.title }),
      subtitle: t('versionFilter.bothHint'),
    },
    {
      key: a.slug,
      title: t('versionFilter.only', { version: a.title }),
      subtitle: t('versionFilter.onlyHint', { version: a.title, other: b.title }),
    },
    {
      key: b.slug,
      title: t('versionFilter.only', { version: b.title }),
      subtitle: t('versionFilter.onlyHint', { version: b.title, other: a.title }),
    },
  ]
})
</script>

<template>
  <v-bottom-sheet v-model="open" inset>
    <v-card class="version-picker" rounded="t-xl" :aria-label="t('versionFilter.title')">
      <v-card-title class="text-title-large pt-4">{{ t('versionFilter.title') }}</v-card-title>
      <v-card-subtitle class="text-wrap">
        {{ t('versionFilter.hint', { game: gameTitle }) }}
      </v-card-subtitle>
      <v-list density="comfortable" nav role="group" :aria-label="t('versionFilter.label')">
        <v-list-item
          v-for="option in options"
          :key="option.key"
          :title="option.title"
          :subtitle="option.subtitle"
          :active="selected.includes(option.key)"
          color="primary"
          rounded="lg"
          @click="emit('toggle', option.key)"
        >
          <template #prepend>
            <v-checkbox-btn :model-value="selected.includes(option.key)" tabindex="-1" />
          </template>
          <template #append>
            <span class="version-picker__count text-label-large">
              {{ counts[option.key] ?? 0 }}
            </span>
          </template>
        </v-list-item>
      </v-list>
      <v-card-actions class="version-picker__actions">
        <v-btn variant="text" :disabled="selected.length === 0" @click="emit('clear')">
          {{ t('common.clear') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.version-picker__count {
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.version-picker__actions {
  padding-bottom: calc(8px + var(--safe-bottom));
}
</style>
