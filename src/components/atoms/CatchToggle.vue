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
const { apply } = useMotion(wrapRef, { initial: { scale: 1 } })

const bursting = ref(false)
let skipNextWatch = true

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
    bursting.value = true
    if (!prefersReducedMotion()) {
      apply({ scale: [1, 1.25, 1], transition: { duration: 260, ease: 'easeOut' } })
    }
  },
)

function onBurstEnd(): void {
  bursting.value = false
}
</script>

<template>
  <span
    ref="wrap"
    class="catch-toggle-wrap"
    :class="{ 'catch-toggle-wrap--burst': bursting }"
    @animationend="onBurstEnd"
  >
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

.catch-toggle-wrap--burst::before,
.catch-toggle-wrap--burst::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  pointer-events: none;
}

.catch-toggle-wrap--burst::before {
  animation: catch-burst-dot-left 0.4s ease-out forwards;
}

.catch-toggle-wrap--burst::after {
  animation: catch-burst-dot-right 0.4s ease-out 0.06s forwards;
}

@keyframes catch-burst-dot-left {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(calc(-50% - 14px), calc(-50% - 14px)) scale(0.4);
  }
}

@keyframes catch-burst-dot-right {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(calc(-50% + 14px), calc(-50% - 14px)) scale(0.4);
  }
}
</style>
