<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiArrowDown, mdiArrowRight, mdiChevronDown, mdiChevronUp } from '@mdi/js'
import type { EvolutionMethod } from '@/types/pokemon'
import {
  describeEvolution,
  formLabel,
  formatVersionGroup,
  type VocabularyLookup,
} from '@/utils/evolution'
import { formatPokemonName } from '@/utils/pokemon'
import { useVocabularyStore } from '@/stores/vocabulary'

const props = defineProps<{
  methods: EvolutionMethod[]
  /** Nome da espécie-alvo, para rotular formas ("Lycanroc" -> "forma Midday"). */
  speciesName: string
  vertical?: boolean
}>()

const { t, locale } = useI18n()
const vocabularyStore = useVocabularyStore()

const showAll = ref(false)

const primary = computed(() => props.methods.filter((m) => m.isDefault))
const others = computed(() => props.methods.filter((m) => !m.isDefault))

/** Slugs de item/golpe citados nos métodos exibidos, pra pré-buscar o nome em espanhol. */
function collectSlugs(methods: EvolutionMethod[]): { items: Set<string>; moves: Set<string> } {
  const items = new Set<string>()
  const moves = new Set<string>()
  for (const { requirement: r } of methods) {
    if (r.item) items.add(r.item)
    if (r.heldItem) items.add(r.heldItem)
    if (r.usedMove) moves.add(r.usedMove)
    if (r.knownMove) moves.add(r.knownMove)
  }
  return { items, moves }
}

watch(
  () => [props.methods, locale.value] as const,
  ([methods, currentLocale]) => {
    if (currentLocale !== 'es') return
    const { items, moves } = collectSlugs(methods)
    items.forEach((slug) => vocabularyStore.ensureItemNameEs(slug))
    moves.forEach((slug) => vocabularyStore.ensureMoveNameEs(slug))
  },
  { immediate: true },
)

const vocabulary = computed<VocabularyLookup>(() =>
  locale.value === 'es'
    ? { items: vocabularyStore.items, moves: vocabularyStore.moves }
    : { items: {}, moves: {} },
)

/** Frase no idioma atual, montada na exibição (o cache guarda só as condições). */
function describe(method: EvolutionMethod): string {
  const sentence = describeEvolution(method.requirement, t, vocabulary.value)
  return method.baseForm
    ? `${sentence} ${t('detail.fromForm', { form: formatPokemonName(method.baseForm) })}`
    : sentence
}

function formOf(method: EvolutionMethod): string | null {
  return method.resultForm ? formLabel(method.resultForm, props.speciesName) : null
}
</script>

<template>
  <div class="evolution-method" :class="{ 'evolution-method--vertical': vertical }">
    <v-icon :icon="vertical ? mdiArrowDown : mdiArrowRight" size="28" class="opacity-60" />
    <div class="evolution-method__text">
      <div v-for="(method, i) in primary" :key="i" class="text-body-small">
        {{ describe(method) }}
        <span v-if="formOf(method)" class="font-weight-bold">
          {{ t('detail.resultForm', { form: formOf(method) }) }}
        </span>
      </div>

      <template v-if="others.length">
        <v-btn
          size="x-small"
          variant="text"
          class="px-1 text-none"
          :append-icon="showAll ? mdiChevronUp : mdiChevronDown"
          @click.stop="showAll = !showAll"
        >
          {{ showAll ? t('common.less') : t('detail.otherGames', { n: others.length }) }}
        </v-btn>
        <v-expand-transition>
          <ul v-if="showAll" class="evolution-method__others text-body-small">
            <li v-for="(method, i) in others" :key="i">
              {{ describe(method) }}
              <span v-if="formOf(method)" class="font-weight-bold">
                {{ t('detail.resultForm', { form: formOf(method) }) }}
              </span>
              <span v-if="method.versionGroup" class="opacity-60">
                ({{ formatVersionGroup(method.versionGroup) }})
              </span>
            </li>
          </ul>
        </v-expand-transition>
      </template>
    </div>
  </div>
</template>

<style scoped>
.evolution-method {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  flex: 0 0 auto;
}

.evolution-method__text {
  min-width: 0;
  overflow-wrap: anywhere;
}

.evolution-method--vertical {
  flex-direction: column;
  width: 100%;
  max-width: 150px;
  text-align: center;
  padding: 4px 0;
}

.evolution-method__others {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  opacity: 0.85;
}

.evolution-method__others li + li {
  margin-top: 2px;
}
</style>
