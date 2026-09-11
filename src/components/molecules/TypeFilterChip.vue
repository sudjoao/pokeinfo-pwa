<script setup lang="ts">
import { computed } from 'vue'
import { mdiChevronDown, mdiFilterVariant } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_COLORS } from '@/utils/pokemon'

const props = defineProps<{
  /** Tipos escolhidos; vazio = sem filtro. */
  types: readonly PokemonType[]
}>()

const emit = defineEmits<{ click: [] }>()

const { t } = useI18n()

const active = computed(() => props.types.length > 0)
const label = computed(() =>
  active.value ? props.types.map((type) => t(`type.${type}`)).join(' / ') : t('typeFilter.chip'),
)
</script>

<template>
  <v-chip
    :variant="active ? 'flat' : 'tonal'"
    size="default"
    :prepend-icon="active ? undefined : mdiFilterVariant"
    :append-icon="mdiChevronDown"
    class="type-filter-chip flex-shrink-0"
    :class="{ 'type-filter-chip--active': active }"
    aria-haspopup="dialog"
    @click="emit('click')"
  >
    <template v-if="active" #prepend>
      <span class="d-inline-flex ga-1 me-1" aria-hidden="true">
        <span
          v-for="type in types"
          :key="type"
          class="type-filter-chip__dot"
          :style="{ background: TYPE_COLORS[type] }"
        />
      </span>
    </template>
    {{ label }}
  </v-chip>
</template>

<style scoped>
/* Sobre o cabeçalho colorido, a chip ativa inverte as cores (como as chips de dex). */
.type-filter-chip--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.type-filter-chip__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}
</style>
