<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { mdiPokeball } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { prefersReducedMotion } from '@/composables/usePrefersReducedMotion'

const props = defineProps<{
  caught: boolean
  /** Nome do Pokémon, para o leitor de tela dizer qual está sendo marcado (cards em grade). */
  name: string
  /** Tamanho do botão; o padrão cabe no canto do card e mantém área de toque confortável. */
  size?: 'small' | 'default'
}>()

const emit = defineEmits<{ toggle: [] }>()

const { t } = useI18n()

const wrapRef = useTemplateRef<HTMLElement>('wrap')

const bursting = ref(false)
/** O toque foi aqui: só a mudança causada por ele anima (não a troca de Pokémon no detalhe). */
let toggledHere = false
let burstTimer: ReturnType<typeof setTimeout> | undefined

function onClick(): void {
  toggledHere = true
  emit('toggle')
}

// Só anima o "pop" quando a pessoa marca (não-marcado → marcado) — nunca no mount, ao desmarcar
// (a transição de opacidade basta) ou quando o valor muda por fora.
watch(
  () => props.caught,
  (caught, wasCaught) => {
    const fromClick = toggledHere
    toggledHere = false
    if (!fromClick || !caught || wasCaught) return
    if (prefersReducedMotion()) return
    bursting.value = true
    clearTimeout(burstTimer)
    // Cobre a duração de todos os pontinhos do burst (maior delay + duração de cada um, ver CSS).
    burstTimer = setTimeout(() => {
      bursting.value = false
    }, 600)
    // Web Animations API nativa (antes era o @vueuse/motion, só para este efeito).
    wrapRef.value?.animate(
      [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.4) rotate(-18deg)' },
        { transform: 'scale(0.95) rotate(8deg)' },
        { transform: 'scale(1) rotate(0deg)' },
      ],
      { duration: 380, easing: 'ease-out' },
    )
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
      :aria-label="t('catch.toggle', { name })"
      :title="caught ? t('catch.caught') : t('catch.mark')"
      @click.stop.prevent="onClick"
    />
    <!-- Só existe durante a animação: são 6 nós a mais em cada card da lista. -->
    <span v-if="bursting" class="catch-burst" aria-hidden="true">
      <span v-for="n in 6" :key="n" class="catch-burst__dot" />
    </span>
  </span>
</template>

<style scoped>
.catch-toggle-wrap {
  position: relative;
  display: inline-flex;
}

/* 0.6 mantém o ícone desmarcado acima de 3:1 sobre o fundo colorido do card (era 0.4, ~2:1). */
.catch-toggle {
  opacity: 0.6;
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
