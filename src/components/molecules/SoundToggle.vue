<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { mdiVolumeHigh, mdiVolumeOff } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useCry } from '@/composables/useCry'

/** Espera antes do aviso da primeira visita, para não competir com o carregamento da tela. */
const HINT_DELAY_MS = 800

const { t } = useI18n()
const cry = useCry()

const button = useTemplateRef<ComponentPublicInstance>('button')
const buttonEl = computed(() => (button.value?.$el as HTMLElement | undefined) ?? undefined)
const hint = useTemplateRef<ComponentPublicInstance>('hint')
const hintId = useId()

/**
 * Aviso "toque aqui para ativar os sons", ancorado no botão. Não é modal e não move o foco:
 * quem usa leitor de tela ouve o texto pelo aria-describedby ao chegar no botão.
 */
const hintOpen = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function shouldHint(): boolean {
  return cry.supported && !cry.enabled.value && !cry.hintSeen.value
}

onMounted(() => {
  if (!shouldHint()) return
  timer = setTimeout(() => (hintOpen.value = shouldHint()), HINT_DELAY_MS)
})

// Qualquer saída conta como visto: fechar, ativar, clicar fora, Esc ou trocar de tela.
watch(hintOpen, (open) => {
  if (open) return
  const sheet = hint.value?.$el as HTMLElement | undefined
  if (sheet?.contains(document.activeElement)) buttonEl.value?.focus()
  cry.dismissHint()
})

function leave(): void {
  clearTimeout(timer)
  if (hintOpen.value) cry.dismissHint()
  hintOpen.value = false
}
onBeforeUnmount(leave)
onDeactivated(leave)

function toggle(): void {
  cry.toggleEnabled()
  hintOpen.value = false
}

function enable(): void {
  cry.setEnabled(true)
  hintOpen.value = false
}
</script>

<template>
  <template v-if="cry.supported">
    <v-btn
      ref="button"
      :icon="cry.enabled.value ? mdiVolumeHigh : mdiVolumeOff"
      :aria-label="t('sound.toggle')"
      :aria-pressed="cry.enabled.value"
      :aria-describedby="hintOpen ? hintId : undefined"
      @click="toggle"
    />
    <v-overlay
      v-model="hintOpen"
      :target="buttonEl"
      location="bottom end"
      origin="top end"
      location-strategy="connected"
      scroll-strategy="reposition"
      :scrim="false"
      :close-on-back="false"
      :offset="8"
      content-class="sound-hint"
    >
      <v-sheet
        :id="hintId"
        ref="hint"
        color="surface-variant"
        rounded="lg"
        elevation="6"
        class="sound-hint__card pa-3"
      >
        <p class="text-body-medium mb-2">{{ t('sound.hint') }}</p>
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" size="small" @click="hintOpen = false">
            {{ t('sound.dismiss') }}
          </v-btn>
          <v-btn variant="flat" color="primary" size="small" @click="enable">
            {{ t('sound.enable') }}
          </v-btn>
        </div>
      </v-sheet>
    </v-overlay>
  </template>
</template>

<style scoped>
.sound-hint__card {
  max-width: min(280px, calc(100vw - 32px));
}
</style>
