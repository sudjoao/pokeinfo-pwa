<script setup lang="ts">
import { computed } from 'vue'
import { mdiChevronDown, mdiStarFourPoints } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { BOTH_VERSIONS } from '@/composables/usePokemonList'
import type { ExclusiveVersion } from '@/data/exclusives'

const props = defineProps<{
  versions: readonly ExclusiveVersion[]
  /** Grupos marcados ("both" e/ou slugs de versão); vazio = sem filtro. */
  selected: readonly string[]
}>()

const emit = defineEmits<{ click: [] }>()

const { t } = useI18n()

const active = computed(() => props.selected.length > 0)

/** "Versão" sem filtro; com filtro, os grupos marcados na ordem das opções ("Ambas · Só Sword"). */
const label = computed(() => {
  if (!active.value) return t('versionFilter.chip')
  const parts: string[] = []
  if (props.selected.includes(BOTH_VERSIONS)) parts.push(t('versionFilter.bothShort'))
  for (const version of props.versions) {
    if (props.selected.includes(version.slug)) {
      parts.push(t('versionFilter.only', { version: version.title }))
    }
  }
  return parts.join(' · ')
})
</script>

<template>
  <v-chip
    :variant="active ? 'flat' : 'tonal'"
    size="default"
    :prepend-icon="mdiStarFourPoints"
    :append-icon="mdiChevronDown"
    class="version-filter-chip flex-shrink-0"
    :class="{ 'version-filter-chip--active': active }"
    aria-haspopup="dialog"
    :aria-label="t('versionFilter.label')"
    @click="emit('click')"
  >
    {{ label }}
  </v-chip>
</template>

<style scoped>
/* Sobre o cabeçalho colorido, a chip ativa inverte as cores (como as chips de dex e de tipo). */
.version-filter-chip--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}
</style>
