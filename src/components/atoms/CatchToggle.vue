<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { mdiPokeball } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useMotion } from '@vueuse/motion'
import { prefersReducedMotion } from '@/composables/usePrefersReducedMotion'

const props = defineProps<{
  caught: boolean
  /** Tamanho do botão; o padrão cabe no canto do card e mantém área de toque confortável. */
  size?: 'small' | 'default'
}>()

const emit = defineEmits<{ toggle: [] }>()

const { t } = useI18n()

const wrapRef = useTemplateRef<HTMLElement>('wrap')
const { apply } = useMotion(wrapRef, { initial: { scale: 1, rotate: 0 } })

const bursting = ref(false)
let skipNextWatch = true
let burstTimer: ReturnType<typeof setTimeout> | undefined

// Só anima o "pop" quando a captura passa de não-marcado para marcado — nunca no mount
// (mesmo já capturado) nem ao desmarcar, onde só a transição de opacidade já existente basta.
watch(
  () => props.caught,
  (caught, wasCaught) => {
    if (skipNextWatch) {
      skipNextWatch = false
      return
    }
    if (!caught || wasCaught) return
    if (prefersReducedMotion()) return
    bursting.value = true
    clearTimeout(burstTimer)
    // Cobre a duração de todos os pontinhos do burst (maior delay + duração de cada um, ver CSS).
    burstTimer = setTimeout(() => {
      bursting.value = false
    }, 600)
    apply({
      scale: [1, 1.4, 0.95, 1],
      rotate: [0, -18, 8, 0],
      transition: { duration: 380, ease: 'easeOut' },
    })
  },
)
</script>

<template>
  <span ref="wrap" class="catch-toggle-wrap" :class="{ 'catch-toggle-wrap--burst': bursting }">
    <v-btn
      :icon="mdiPokeball"
      :size="size ?? 'small'"
      :variant="caught ? 'flat' : 'text'"
      :color="caught ? 'primary' : undefined"
      class="catch-toggle"
      :class="{ 'catch-toggle--caught': caught }"
      :aria-pressed="caught"
      :aria-label="caught ? t('catch.unmark') : t('catch.mark')"
      :title="caught ? t('catch.caught') : t('catch.mark')"
      @click.stop.prevent="emit('toggle')"
    />
    <span class="catch-burst" aria-hidden="true">
      <span v-for="n in 6" :key="n" class="catch-burst__dot" />
    </span>
  </span>
</template>

<style scoped>
.catch-toggle-wrap {
  position: relative;
  display: inline-flex;
}

.catch-toggle {
  opacity: 0.4;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.catch-toggle--caught {
  opacity: 1;
}

.catch-toggle:active {
  transform: scale(0.9);
}

.catch-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.catch-burst__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.6);
}

/* 6 pontinhos em leque (hexágono), cada um com seu próprio destino via --dx/--dy. */
.catch-toggle-wrap--burst .catch-burst__dot {
  animation: catch-burst-pop 0.5s ease-out both;
}

.catch-toggle-wrap--burst .catch-burst__dot:nth-child(1) {
  --dx: 20px;
  --dy: 0px;
  animation-delay: 0s;
}

.catch-toggle-wrap--burst .catch-burst__dot:nth-child(2) {
  --dx: 10px;
  --dy: -17px;
  animation-delay: 0.02s;
}

.catch-toggle-wrap--burst .catch-burst__dot:nth-child(3) {
  --dx: -10px;
  --dy: -17px;
  animation-delay: 0.04s;
}

.catch-toggle-wrap--burst .catch-burst__dot:nth-child(4) {
  --dx: -20px;
  --dy: 0px;
  animation-delay: 0.06s;
}

.catch-toggle-wrap--burst .catch-burst__dot:nth-child(5) {
  --dx: -10px;
  --dy: 17px;
  animation-delay: 0.02s;
}

.catch-toggle-wrap--burst .catch-burst__dot:nth-child(6) {
  --dx: 10px;
  --dy: 17px;
  animation-delay: 0.04s;
}

@keyframes catch-burst-pop {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3);
  }
}
</style>
