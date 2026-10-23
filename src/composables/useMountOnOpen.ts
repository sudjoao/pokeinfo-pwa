import { ref, watch, type Ref } from 'vue'

/**
 * Vira true na primeira vez que `open` abre e fica assim. Com `v-if` num sheet carregado por
 * `defineAsyncComponent`, o código dele (e os componentes do Vuetify que só ele usa) só é baixado
 * quando a pessoa abre; depois continua montado para a animação de fechar e reabrir.
 */
export function useMountOnOpen(open: Readonly<Ref<boolean>>): Readonly<Ref<boolean>> {
  const mounted = ref(open.value)
  watch(open, (value) => {
    if (value) mounted.value = true
  })
  return mounted
}
