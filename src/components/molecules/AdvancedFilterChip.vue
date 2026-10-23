<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { mdiChevronDown, mdiTune } from '@mdi/js'

/** Chip "Filtros" (ordenação, geração, categoria, fraqueza, habilidade, favoritos). */
defineProps<{ count: number }>()

const emit = defineEmits<{ click: [] }>()

const { t } = useI18n()
</script>

<template>
  <v-chip
    :variant="count ? 'flat' : 'tonal'"
    size="default"
    :prepend-icon="mdiTune"
    :append-icon="mdiChevronDown"
    class="advanced-filter-chip flex-shrink-0"
    :class="{ 'advanced-filter-chip--active': count }"
    role="button"
    aria-haspopup="dialog"
    @click="emit('click')"
  >
    {{ count ? t('filters.chipActive', { n: count }) : t('filters.chip') }}
  </v-chip>
</template>

<style scoped>
/* Sobre o cabeçalho vermelho: a ativa usa surface + texto primary (a cor primária some no fundo). */
.advanced-filter-chip--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
}
</style>
