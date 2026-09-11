<script setup lang="ts">
import { mdiStarFourPoints } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { ExclusiveVersion } from '@/data/exclusives'

/** Chips "Só Sword" / "Só Shield": mostram só os exclusivos de uma versão do jogo selecionado. */
defineProps<{
  versions: readonly ExclusiveVersion[]
  /** Slug da versão selecionada; null = todos. */
  selected: string | null
  /** Quantos exclusivos de cada versão existem na Pokédex atual, por slug. */
  counts: Record<string, number>
}>()

const emit = defineEmits<{ select: [slug: string | null] }>()

const { t } = useI18n()

/** Tocar na chip já selecionada volta para "todos". */
function pick(slug: string, selected: string | null): void {
  emit('select', selected === slug ? null : slug)
}
</script>

<template>
  <v-chip
    v-for="version in versions"
    :key="version.slug"
    size="default"
    :variant="version.slug === selected ? 'flat' : 'tonal'"
    :prepend-icon="mdiStarFourPoints"
    class="version-chip flex-shrink-0"
    :class="{ 'version-chip--selected': version.slug === selected }"
    :aria-pressed="version.slug === selected"
    :aria-label="t('home.exclusivesOf', { version: version.title })"
    @click="pick(version.slug, selected)"
  >
    {{ t('home.onlyIn', { version: version.title }) }}
    <span class="version-chip__count ms-1">{{ counts[version.slug] ?? 0 }}</span>
  </v-chip>
</template>

<style scoped>
/* Mesmo tratamento das outras chips: sobre o cabeçalho colorido, a selecionada inverte as cores. */
.version-chip--selected {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.version-chip__count {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
</style>
