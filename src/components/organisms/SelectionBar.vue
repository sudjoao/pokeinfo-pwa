<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { mdiClose, mdiCloseCircleOutline, mdiContentCopy, mdiPokeball } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

/**
 * Barra da seleção múltipla, fixa no rodapé enquanto a lista rola: quantos estão selecionados,
 * selecionar todos da lista e as ações em lote. No DOM ela vem antes da lista (logo depois do
 * botão "Selecionar"): quem usa teclado chega às ações sem passar por centenas de cards.
 */
const props = defineProps<{
  count: number
  /** Total da lista atual (com busca e filtros): o alvo de "Selecionar todos". */
  total: number
  allSelected: boolean
  /** Sem jogo não há captura para marcar: sobra só copiar. */
  canMark: boolean
}>()

const emit = defineEmits<{
  close: []
  toggleAll: []
  mark: [caught: boolean]
  copy: []
  /** Altura da barra, para a lista e o "voltar ao topo" abrirem espaço. */
  resize: [height: number]
}>()

const { t } = useI18n()

const barRef = useTemplateRef<HTMLElement>('bar')
let observer: ResizeObserver | undefined

onMounted(() => {
  const bar = barRef.value
  if (!bar) return
  observer = new ResizeObserver(() => emit('resize', bar.offsetHeight))
  observer.observe(bar)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  emit('resize', 0)
})

const empty = () => props.count === 0

/** No celular as três ações dividem a largura: ícone em cima do texto, para caber sem cortar. */
const { width } = useDisplay()
const stacked = computed(() => width.value < 760)
</script>

<template>
  <section ref="bar" class="selection-bar" :aria-label="t('select.region')">
    <div class="selection-bar__inner">
      <div class="selection-bar__status d-flex align-center ga-1">
        <v-btn
          :icon="mdiClose"
          variant="text"
          size="small"
          :aria-label="t('select.exit')"
          :title="t('select.exit')"
          @click="emit('close')"
        />
        <!-- role=status: cada toque num card confirma a contagem para o leitor de tela. -->
        <span class="selection-bar__count text-title-small" role="status">
          {{ t('select.count', count) }}
        </span>
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          :disabled="total === 0"
          :aria-pressed="allSelected"
          @click="emit('toggleAll')"
        >
          {{ allSelected ? t('select.clearAll') : t('select.selectAll', { n: total }) }}
        </v-btn>
      </div>
      <div class="selection-bar__actions d-flex ga-2">
        <template v-if="canMark">
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="mdiPokeball"
            :stacked="stacked"
            :size="stacked ? 'small' : undefined"
            :disabled="empty()"
            :title="t('select.markCaughtLong')"
            @click="emit('mark', true)"
          >
            {{ t('select.markCaught') }}
          </v-btn>
          <v-btn
            variant="tonal"
            :prepend-icon="mdiCloseCircleOutline"
            :stacked="stacked"
            :size="stacked ? 'small' : undefined"
            :disabled="empty()"
            :title="t('select.markMissingLong')"
            @click="emit('mark', false)"
          >
            {{ t('select.markMissing') }}
          </v-btn>
        </template>
        <v-btn
          variant="tonal"
          :prepend-icon="mdiContentCopy"
          :stacked="stacked"
          :size="stacked ? 'small' : undefined"
          :disabled="empty()"
          :title="t('select.copyLong')"
          aria-haspopup="dialog"
          @click="emit('copy')"
        >
          {{ t('select.copy') }}
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Mesma linguagem da bandeja do time: superfície com borda e sombra para cima. */
.selection-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1005;
  padding: 4px calc(12px + var(--safe-right)) calc(8px + var(--safe-bottom))
    calc(8px + var(--safe-left));
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.12);
}

.selection-bar__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  max-width: 1280px;
  margin: 0 auto;
}

.selection-bar__status {
  flex: 1 1 280px;
  min-width: 0;
}

.selection-bar__count {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* No celular as ações dividem a linha de baixo; com espaço, ficam à direita da contagem. */
.selection-bar__actions {
  flex: 1 1 100%;
  padding-left: 4px;
}

.selection-bar__actions .v-btn {
  flex: 1 1 0;
  min-width: 0;
}

@media (min-width: 760px) {
  .selection-bar__actions {
    flex: 0 0 auto;
  }

  .selection-bar__actions .v-btn {
    flex: 0 0 auto;
  }
}
</style>
