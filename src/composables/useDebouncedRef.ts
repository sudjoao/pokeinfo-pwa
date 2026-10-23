import { onScopeDispose, ref, watch, type Ref } from 'vue'

/** Retorna uma ref que só reflete o valor de `source` após `delay` ms sem mudanças. */
export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })
  // Sem isso, um valor digitado logo antes de sair da tela ainda dispararia depois.
  onScopeDispose(() => clearTimeout(timer))

  return debounced
}
