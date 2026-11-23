<script setup lang="ts">
/** Chip liga/desliga da linha de filtros (Megas, Shiny). */
defineProps<{
  label: string
  icon: string
  active: boolean
  /** Quantidade ao lado do rótulo; sem ela, só o rótulo. */
  count?: number
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <v-chip
    size="default"
    :variant="active ? 'flat' : 'tonal'"
    :prepend-icon="icon"
    class="list-toggle-chip flex-shrink-0"
    :class="{ 'list-toggle-chip--active': active }"
    role="button"
    :aria-pressed="active"
    @click="emit('click')"
  >
    {{ label }}
    <span v-if="count !== undefined" class="list-toggle-chip__count ms-1">{{ count }}</span>
  </v-chip>
</template>

<style scoped>
/* Sobre o cabeçalho vermelho: a ativa usa surface + texto primary (a cor primária some no fundo). */
.list-toggle-chip--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

/* No escuro o primário dá 4,43:1 sobre a superfície; o vermelho claro de .text-primary-safe passa. */
.v-theme--dark .list-toggle-chip--active,
.v-theme--dark.list-toggle-chip--active {
  color: #fca5a5;
}

.list-toggle-chip__count {
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}
</style>
