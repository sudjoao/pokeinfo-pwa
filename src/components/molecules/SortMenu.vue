<script setup lang="ts">
import { computed } from 'vue'
import { mdiSortAscending, mdiSortDescending, mdiSortVariant } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { SORT_KEYS, type SortKey } from '@/utils/advancedFilters'
import { STAT_NAMES } from '@/types/pokemon'

/**
 * Ordenação da lista, visível na barra de Cards/Caixas (antes só dentro de "Filtros"): o botão diz
 * a ordem atual e o menu troca o critério ou o sentido.
 */
const props = defineProps<{
  sort: SortKey
  desc: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ update: [sort: SortKey, desc: boolean] }>()

const { t } = useI18n()

function label(key: SortKey): string {
  if ((STAT_NAMES as readonly string[]).includes(key)) return t(`stat.${key}`)
  return t(`filters.sort.${key}`)
}

const items = computed(() => SORT_KEYS.map((key) => ({ key, title: label(key) })))
const current = computed(() => label(props.sort))
/** Na ordem padrão (número crescente) o botão fica neutro; qualquer outra ordem o destaca. */
const active = computed(() => props.sort !== 'number' || props.desc)

/** Ao escolher um stat/total, o padrão útil é do maior para o menor (como no sheet de filtros). */
function choose(key: SortKey): void {
  if (key === props.sort) return
  emit('update', key, key !== 'number' && key !== 'name')
}
</script>

<template>
  <v-btn
    :variant="active ? 'flat' : 'tonal'"
    :color="active ? 'secondary' : undefined"
    :prepend-icon="desc ? mdiSortDescending : mdiSortAscending"
    :disabled="disabled"
    class="text-none"
    :aria-label="t('filters.sortCurrent', { sort: current })"
    aria-haspopup="menu"
  >
    {{ current }}
    <v-menu activator="parent" location="bottom start">
      <v-list density="compact" :aria-label="t('filters.sortBy')">
        <v-list-item
          v-for="item in items"
          :key="item.key"
          :title="item.title"
          :active="item.key === sort"
          :aria-current="item.key === sort ? 'true' : undefined"
          @click="choose(item.key)"
        />
        <v-divider />
        <v-list-item
          :prepend-icon="mdiSortVariant"
          :title="desc ? t('filters.asc') : t('filters.desc')"
          @click="emit('update', sort, !desc)"
        />
      </v-list>
    </v-menu>
  </v-btn>
</template>
