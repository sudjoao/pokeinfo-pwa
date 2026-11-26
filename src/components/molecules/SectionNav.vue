<script setup lang="ts">
import { useI18n } from 'vue-i18n'

export interface PageSection {
  /** `id` do elemento da seção (vira `#id` na URL). */
  id: string
  label: string
}

/**
 * Atalhos para as seções de uma página longa (a ficha tem ~15 cards): uma linha de chips que rola
 * na horizontal e fica grudada sob o cabeçalho. Cada chip é um link `#id`, então a seção também
 * pode ser compartilhada na URL; a view faz a rolagem e marca a seção visível.
 */
defineProps<{
  sections: readonly PageSection[]
  /** Seção visível no momento. */
  active?: string | null
}>()

const emit = defineEmits<{ select: [id: string] }>()

const { t } = useI18n()

function onClick(event: MouseEvent, id: string): void {
  // Sem modificador: a view rola até a seção e põe o hash na URL (o link normal recarregaria a
  // rota). Com cmd/ctrl, o link abre em outra aba como qualquer outro.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  emit('select', id)
}
</script>

<template>
  <nav class="section-nav" :aria-label="t('detail.sectionsLabel')">
    <ul class="section-nav__list">
      <li v-for="section in sections" :key="section.id">
        <a
          :href="`#${section.id}`"
          class="section-nav__link v-chip v-chip--label v-chip--size-small text-label-large"
          :class="{ 'section-nav__link--active': section.id === active }"
          :aria-current="section.id === active ? 'location' : undefined"
          @click="onClick($event, section.id)"
        >
          {{ section.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* Grudada logo abaixo do cabeçalho, por cima dos cards que rolam (como as abas da Home). */
.section-nav {
  position: sticky;
  top: calc(var(--v-layout-top, 0px) + var(--safe-top));
  z-index: 2;
  margin-inline: -16px;
  padding: 6px 16px;
  background: rgb(var(--v-theme-background));
}

.section-nav__list {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.section-nav__list::-webkit-scrollbar {
  display: none;
}

.section-nav__link {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding-inline: 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.section-nav__link--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.section-nav__link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
