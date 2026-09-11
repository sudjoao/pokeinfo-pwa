<script setup lang="ts">
import { mdiChevronDown, mdiGamepadVariant } from '@mdi/js'
import { useI18n } from 'vue-i18n'

defineProps<{
  /** Título do jogo selecionado; null = Pokédex Nacional (todos os jogos). */
  label: string | null
}>()

const emit = defineEmits<{ click: [] }>()

const { t } = useI18n()
</script>

<template>
  <v-chip
    :color="label ? 'secondary' : undefined"
    :variant="label ? 'flat' : 'tonal'"
    size="default"
    :prepend-icon="mdiGamepadVariant"
    :append-icon="mdiChevronDown"
    class="game-filter-chip flex-shrink-0"
    aria-haspopup="dialog"
    @click="emit('click')"
  >
    {{ label ?? t('home.allGames') }}
  </v-chip>
</template>

<style scoped>
.game-filter-chip {
  max-width: 100%;
}
</style>
