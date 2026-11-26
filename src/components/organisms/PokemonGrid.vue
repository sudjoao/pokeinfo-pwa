<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { mdiRefresh } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { announce } from '@/composables/useAnnouncer'
import type { RouteLocationRaw } from 'vue-router'
import type { PokemonListItem } from '@/types/pokemon'
import PokemonGridChunk from '@/components/organisms/PokemonGridChunk.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'

export type GridStatus = 'idle' | 'loading' | 'error' | 'done'

const props = defineProps<{
  items: PokemonListItem[]
  status: GridStatus
  errorMessage?: string | null
  skeletonCount?: number
  /** Ids de espécie capturados no jogo selecionado; undefined esconde o botão de captura. */
  caughtIds?: ReadonlySet<number>
  /** Ids (da forma) escolhidos, ex.: os que já estão no time; undefined = lista sem seleção. */
  selectedIds?: ReadonlySet<number>
  /** Modo de seleção múltipla da Home (o card alterna a seleção; ver PokemonCard). */
  selectable?: boolean
  /** Cards mais largos em telas grandes (quando o grid divide a largura com um painel). */
  wide?: boolean
  /** Destino de cada card (vira link); sem ele o card é um botão de seleção (team builder). */
  linkTo?: (pokemon: PokemonListItem) => RouteLocationRaw
  /** Mostra os artworks shiny. */
  shiny?: boolean
}>()

const emit = defineEmits<{
  load: []
  retry: []
  select: [pokemon: PokemonListItem]
  toggleCaught: [speciesId: number]
}>()

const { t } = useI18n()

const sentinelVisible = ref(false)

/** Espera o lote entrar no DOM e o IntersectionObserver reavaliar o sentinela (dois frames). */
function afterLayout(): Promise<void> {
  return nextTick().then(
    () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )
}

// Dispara o carregamento sempre que o sentinela estiver visível e a lista estiver ociosa.
// Cobre tanto o scroll do usuário quanto o caso em que o lote carregado não preencheu a tela.
// Como os lotes agora resolvem sem rede, a visibilidade é reconferida após o layout:
// sem isso o valor antigo (ainda "visível") encadearia todos os lotes de uma vez.
watch(
  () => props.status,
  (status) => {
    // O erro do lote seguinte aparece longe do foco (no fim da lista): avisa o leitor de tela.
    if (status === 'error') announce(props.errorMessage ?? t('home.loadMoreError'))
  },
)

watch(
  [sentinelVisible, () => props.status],
  async ([visible, status]) => {
    if (!visible || status !== 'idle') return
    await afterLayout()
    if (sentinelVisible.value && props.status === 'idle') emit('load')
  },
  { immediate: true },
)

function onIntersect(isIntersecting: boolean) {
  sentinelVisible.value = isIntersecting
}

/** Cards da primeira dobra no celular (duas linhas de dois): imagens sem lazy e com prioridade. */
const PRIORITY_CARDS = 4

// Começa a carregar o próximo lote ~1,5 telas antes do fim da lista.
const intersectOptions = { rootMargin: '0px 0px 1200px 0px' }

/*
 * Virtualização por blocos: a lista é dividida em blocos de CHUNK cards (múltiplo de 2, 3, 4 e 6
 * colunas: só o último bloco pode ter linha incompleta). Um bloco que fica a mais de ~2 telas da
 * área visível vira um espaçador com a altura que ele media, e volta a renderizar os cards ao se
 * aproximar: a Nacional rolada até o fim tinha mais de mil cards no DOM. A altura é medida (os
 * cards variam: nome em duas linhas, selo de exclusivo), então a rolagem não pula.
 */
const CHUNK = 24
const CHUNK_MARGIN = '2000px 0px'

const root = useTemplateRef<HTMLElement>('root')
const chunks = computed(() => {
  const list: PokemonListItem[][] = []
  for (let i = 0; i < props.items.length; i += CHUNK) list.push(props.items.slice(i, i + CHUNK))
  return list
})
/** Altura medida dos blocos que estão longe da tela (só eles têm entrada). */
const collapsed = ref<Record<number, number>>({})
let observer: IntersectionObserver | null = null
const observed = new Set<Element>()

function onChunks(entries: IntersectionObserverEntry[]): void {
  const next = { ...collapsed.value }
  let changed = false
  for (const entry of entries) {
    const index = Number((entry.target as HTMLElement).dataset.chunk)
    if (!Number.isFinite(index)) continue
    if (entry.isIntersecting) {
      if (index in next) {
        delete next[index]
        changed = true
      }
    } else if (!(index in next)) {
      // Sem altura ainda (acabou de montar fora da tela): não dá para trocar por espaçador.
      const height = (entry.target as HTMLElement).offsetHeight
      if (height > 0) {
        next[index] = height
        changed = true
      }
    }
  }
  if (changed) collapsed.value = next
}

function observeChunks(): void {
  if (!root.value) return
  if (!observer) {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(onChunks, { rootMargin: CHUNK_MARGIN })
  }
  for (const el of root.value.querySelectorAll('[data-chunk]')) {
    if (observed.has(el)) continue
    observed.add(el)
    observer.observe(el)
  }
}

function stopObserving(): void {
  observer?.disconnect()
  observer = null
  observed.clear()
}

// Os blocos existem só depois do primeiro lote; a cada bloco novo, entra na observação.
watch(
  () => chunks.value.length,
  () => nextTick(observeChunks),
  { immediate: true },
)

// Outra largura (girar o aparelho) muda a altura dos blocos: expande todos e mede de novo.
let lastWidth = typeof window === 'undefined' ? 0 : window.innerWidth
function onResize(): void {
  if (window.innerWidth === lastWidth) return
  lastWidth = window.innerWidth
  collapsed.value = {}
}

// A Home fica em KeepAlive: escondida, não observa nem escuta a janela.
onActivated(() => {
  window.addEventListener('resize', onResize)
  nextTick(observeChunks)
})
onDeactivated(() => {
  window.removeEventListener('resize', onResize)
  stopObserving()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  stopObserving()
})
</script>

<template>
  <div ref="root" class="pokemon-grid">
    <!--
      Grade em CSS, sem v-row/v-col: a lista passa de mil células, e cada VCol é uma instância de
      componente a mais por card. Os breakpoints são os do Vuetify (sm 600, md 960, lg 1280).
      v-memo: marcar um capturado (ou chegar um lote novo) re-renderiza a grade; sem ele o Vue
      recriaria os vnodes de todas as centenas de células para comparar. Só a célula cujo estado
      mudou é refeita. `linkTo` é estável; o card calcula o destino (e reage ao jogo) sozinho.
      Um bloco longe da tela é só um espaçador com a altura medida (ver CHUNK no script).
    -->
    <div
      v-for="(chunk, chunkIndex) in chunks"
      :key="chunkIndex"
      :data-chunk="chunkIndex"
      class="pokemon-grid__cells"
      :class="{
        'pokemon-grid__cells--wide': wide,
        'pokemon-grid__cells--spacer': chunkIndex in collapsed,
      }"
      :style="chunkIndex in collapsed ? { height: `${collapsed[chunkIndex]}px` } : undefined"
      :aria-hidden="chunkIndex in collapsed ? 'true' : undefined"
    >
      <PokemonGridChunk
        v-if="!(chunkIndex in collapsed)"
        :items="chunk"
        :caught-ids="caughtIds"
        :selected-ids="selectedIds"
        :selectable="selectable"
        :wide="wide"
        :link-to="linkTo"
        :shiny="shiny"
        :priority-count="chunkIndex === 0 ? PRIORITY_CARDS : 0"
        @select="emit('select', $event)"
        @toggle-caught="emit('toggleCaught', $event)"
      />
    </div>

    <div
      v-intersect="{ handler: onIntersect, options: intersectOptions }"
      class="pokemon-grid__sentinel"
      aria-hidden="true"
    />

    <div
      v-if="status === 'loading'"
      class="pokemon-grid__cells mt-1"
      :class="{ 'pokemon-grid__cells--wide': wide }"
    >
      <div v-for="n in skeletonCount ?? 6" :key="n" class="pokemon-grid__cell">
        <PokemonCardSkeleton />
      </div>
    </div>

    <div v-else-if="status === 'error'" class="text-center py-6">
      <p class="text-body-medium mb-3">{{ errorMessage ?? t('home.loadMoreError') }}</p>
      <v-btn color="primary" variant="tonal" :prepend-icon="mdiRefresh" @click="emit('retry')">
        {{ t('common.retry') }}
      </v-btn>
    </div>

    <p
      v-else-if="status === 'done' && items.length"
      class="text-center text-body-medium py-6 opacity-70"
    >
      {{ t('home.endOfList') }}
    </p>
  </div>
</template>

<style scoped>
/* Mesmas colunas e espaçamento (8 px) do v-row compacto com v-col cols=6 sm=4 md=3 lg=2. */
.pokemon-grid__cells {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (min-width: 600px) {
  .pokemon-grid__cells {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .pokemon-grid__cells {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pokemon-grid__cells--wide {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .pokemon-grid__cells {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .pokemon-grid__cells--wide {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* Blocos seguidos com o mesmo espaçamento das linhas; o espaçador mantém a altura do bloco. */
.pokemon-grid__cells + .pokemon-grid__cells {
  margin-top: 8px;
}

.pokemon-grid__cells--spacer {
  display: block;
}

/*
 * O navegador pula layout e pintura dos cards fora da tela (a lista inteira pode passar de mil
 * cards ao rolar até o fim); `auto` lembra a altura real depois do primeiro desenho.
 */
.pokemon-grid :deep(.pokemon-grid__cell) {
  content-visibility: auto;
  contain-intrinsic-size: auto 280px;
}

.pokemon-grid__sentinel {
  height: 1px;
}
</style>
