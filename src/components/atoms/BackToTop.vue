<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiArrowUp } from '@mdi/js'
import { prefersReducedMotion } from '@/composables/usePrefersReducedMotion'

/** Distância (px) rolada a partir da qual o botão aparece. */
const THRESHOLD = 1600

defineProps<{
  /** Espaço extra embaixo (ex.: bandeja do time no celular). */
  offset?: number
}>()

const { t } = useI18n()
const visible = ref(false)
let frame = 0

function onScroll(): void {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => (visible.value = window.scrollY > THRESHOLD))
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

/** Volta ao topo e leva o foco para o conteúdo (quem usa teclado não fica no fim da lista). */
function toTop(): void {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  const mains = document.querySelectorAll<HTMLElement>('#main-content')
  mains[mains.length - 1]?.focus({ preventScroll: true })
}
</script>

<template>
  <v-fab-transition>
    <v-btn
      v-if="visible"
      :icon="mdiArrowUp"
      color="primary"
      class="back-to-top"
      :style="{ '--offset': `${offset ?? 0}px` }"
      :aria-label="t('common.backToTop')"
      @click="toTop"
    />
  </v-fab-transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: calc(16px + var(--safe-right));
  bottom: calc(16px + var(--safe-bottom) + var(--offset));
  z-index: 5;
}
</style>
