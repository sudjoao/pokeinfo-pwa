<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatPokemonName } from '@/utils/pokemon'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'

defineProps<{ items: readonly { id: number; name: string }[] }>()

const emit = defineEmits<{ select: [id: number]; clear: [] }>()

const { t } = useI18n()
</script>

<template>
  <section class="recent-strip" :aria-labelledby="'recent-strip-title'">
    <div class="d-flex align-center justify-space-between mb-1">
      <h2 id="recent-strip-title" class="text-title-small">{{ t('recent.title') }}</h2>
      <v-btn variant="text" size="small" @click="emit('clear')">{{ t('common.clear') }}</v-btn>
    </div>
    <ul class="recent-strip__list">
      <li v-for="item in items" :key="item.id">
        <button type="button" class="recent-strip__item" @click="emit('select', item.id)">
          <PokemonAvatar :id="item.id" :name="item.name" :size="48" decorative />
          <span class="text-label-small text-truncate">{{ formatPokemonName(item.name) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recent-strip__list {
  display: flex;
  gap: 8px;
  padding: 0 0 4px;
  margin: 0;
  overflow-x: auto;
  list-style: none;
  scroll-snap-type: x proximity;
}

.recent-strip__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 72px;
  padding: 6px 4px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  border-radius: 12px;
  scroll-snap-align: start;
}

.recent-strip__item:hover,
.recent-strip__item:focus-visible {
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>
