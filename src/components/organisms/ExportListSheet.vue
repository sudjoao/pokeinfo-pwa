<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { mdiContentCopy, mdiShareVariant, mdiTableLarge, mdiTextBoxOutline } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { Game, GameDex } from '@/data/games'
import type { BoxEntry } from '@/components/organisms/PokemonBoxes.vue'
import { usePokedexStore } from '@/stores/pokedex'
import { useDexLabel } from '@/composables/useDexLabel'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'
import { shareText } from '@/composables/useShare'
import { exclusiveVersionOf, exclusiveVersions } from '@/utils/exclusives'
import { readStorage, writeStorage } from '@/utils/storage'
import {
  buildExport,
  DEFAULT_EXPORT_OPTIONS,
  entriesInScope,
  type ExportEntry,
  type ExportFormat,
  type ExportLabels,
  type ExportOptions,
  type ExportScope,
} from '@/utils/exportList'

/**
 * Exporta a lista (ou a seleção) como texto para a área de transferência: faltantes, capturados ou
 * todos, em texto corrido ou em colunas para planilha. A prévia é o próprio texto: se a cópia
 * automática falhar, ele fica selecionado para copiar à mão.
 */
const props = defineProps<{
  /** Lista de onde sai a exportação (busca e filtros já aplicados, sem o filtro de captura). */
  entries: readonly BoxEntry[]
  /** Espécies capturadas no jogo; undefined = sem jogo (sem escolha de capturados/faltantes). */
  caughtIds?: ReadonlySet<number>
  game: Game | null
  dex: GameDex | null
  /** Recorte inicial ao abrir. */
  initialScope: ExportScope
  /** A lista tem busca ou filtros além do jogo (vai dito no cabeçalho do texto). */
  filtered: boolean
  /** Exportando os selecionados, não a lista. */
  selection?: boolean
  /** Link absoluto da ficha do Pokémon (com o jogo, onde está "Onde encontrar"). */
  linkFor: (id: number) => string
}>()

const emit = defineEmits<{ copied: [count: number]; shared: [] }>()

const open = defineModel<boolean>({ default: false })
useOverlayFocusReturn(open)

const { t } = useI18n()
const { dexLabel } = useDexLabel()
const pokedex = usePokedexStore()

const OPTIONS_KEY = 'pokeinfo:export:v1'

/** Formato e campos ficam salvos: quem exporta para planilha costuma voltar a exportar assim. */
const options = ref<ExportOptions>({
  ...DEFAULT_EXPORT_OPTIONS,
  ...readStorage<Partial<ExportOptions>>(OPTIONS_KEY),
})
watch(options, (value) => writeStorage(OPTIONS_KEY, value), { deep: true })

const scope = ref<ExportScope>(props.caughtIds ? props.initialScope : 'all')
const failed = ref(false)
watch(open, (value) => {
  if (!value) return
  scope.value = props.caughtIds ? props.initialScope : 'all'
  failed.value = false
})

const hasGame = computed(() => props.caughtIds !== undefined)
const hasVersions = computed(() => exclusiveVersions(props.game?.slug).length > 0)

function speciesOf(entry: BoxEntry): number {
  return entry.speciesId ?? entry.id
}

/** Dados de cada linha (os tipos já traduzidos), na ordem da lista. */
const rows = computed<ExportEntry[]>(() => {
  const ids = props.caughtIds
  const gameSlug = props.game?.slug
  return props.entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    dexNumber: entry.dexNumber,
    speciesId: entry.speciesId,
    caught: ids ? ids.has(speciesOf(entry)) : undefined,
    types: pokedex.typesOf(entry.id)?.map((type) => t(`type.${type}`)),
    exclusiveTo: exclusiveVersionOf(gameSlug, speciesOf(entry))?.title,
  }))
})

const caughtCount = computed(() => rows.value.filter((row) => row.caught).length)
const counts = computed<Record<ExportScope, number>>(() => ({
  missing: rows.value.length - caughtCount.value,
  caught: caughtCount.value,
  all: rows.value.length,
}))

const scopeOptions = computed(() => [
  { value: 'missing' as const, label: t('export.scopeMissing') },
  { value: 'caught' as const, label: t('export.scopeCaught') },
  { value: 'all' as const, label: t('export.scopeAll') },
])

const selected = computed(() => entriesInScope(rows.value, scope.value))

/** Os links só são montados quando pedidos (resolver a rota de mil Pokémon custa). */
const withLinks = computed<ExportEntry[]>(() =>
  options.value.links
    ? selected.value.map((row) => ({ ...row, url: props.linkFor(row.id) }))
    : selected.value,
)

/** "Scarlet / Violet · Paldea" ou "Pokédex Nacional": subtítulo do sheet e cabeçalho do texto. */
const context = computed(() =>
  [props.game?.title, props.dex ? dexLabel(props.dex) : t('home.nationalDex')]
    .filter(Boolean)
    .join(' · '),
)

const summary = computed(() => {
  const total = rows.value.length
  let text: string
  if (!hasGame.value) text = t('export.summaryCount', total)
  else if (scope.value === 'missing')
    text = t('export.summaryMissing', { n: counts.value.missing, total })
  else text = t('export.summaryCaught', { n: caughtCount.value, total })
  if (props.selection) return t('export.summarySelection', { summary: text })
  return props.filtered ? t('export.summaryFiltered', { summary: text }) : text
})

const labels = computed<ExportLabels>(() => ({
  title: `PokeInfo · ${context.value}`,
  summary: summary.value,
  national: t('common.national'),
  number: t('export.colNumber'),
  name: t('export.colName'),
  types: t('export.colTypes'),
  caught: t('export.colCaught'),
  exclusive: t('export.colExclusive'),
  link: t('export.colLink'),
  yes: t('export.yes'),
  no: t('export.no'),
  onlyIn: (version) => t('export.onlyIn', { version }),
}))

/** A marca de capturado só tem o que mostrar em "Todos" (nos outros recortes todos são iguais). */
const effectiveOptions = computed<ExportOptions>(() => ({
  ...options.value,
  exclusive: options.value.exclusive && hasVersions.value,
  status: options.value.status && hasGame.value && scope.value === 'all',
}))

const text = computed(() =>
  selected.value.length ? buildExport(withLinks.value, effectiveOptions.value, labels.value) : '',
)

const formatHint = computed(() =>
  options.value.format === 'table' ? t('export.formatTableHint') : t('export.formatTextHint'),
)

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const previewRef = useTemplateRef<{ $el: HTMLElement }>('preview')

/** A cópia automática falhou (permissão, navegador antigo): deixa o texto selecionado na prévia. */
async function selectPreview(): Promise<void> {
  failed.value = true
  await nextTick()
  const area = previewRef.value?.$el.querySelector('textarea')
  area?.focus()
  area?.select()
}

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(text.value)
    emit('copied', selected.value.length)
    open.value = false
  } catch {
    selectPreview()
  }
}

async function share(): Promise<void> {
  const result = await shareText(text.value)
  if (result === 'shared') {
    emit('shared')
    open.value = false
  } else if (result === 'copied') {
    emit('copied', selected.value.length)
    open.value = false
  } else if (result === 'failed') {
    selectPreview()
  }
}

function setFormat(value: ExportFormat): void {
  options.value.format = value
}
</script>

<template>
  <v-bottom-sheet
    v-model="open"
    inset
    scrollable
    :aria-label="selection ? t('export.selectionTitle') : t('export.title')"
  >
    <v-card class="export-sheet" rounded="t-xl">
      <v-card-title class="text-title-large pt-4">
        {{ selection ? t('export.selectionTitle') : t('export.title') }}
      </v-card-title>
      <v-card-subtitle class="text-wrap">
        {{ context }}
        <template v-if="filtered && !selection"> · {{ t('export.filtersHint') }}</template>
      </v-card-subtitle>

      <v-card-text class="pt-3">
        <template v-if="hasGame">
          <h3 id="export-scope" class="export-sheet__label text-title-small">
            {{ t('export.scope') }}
          </h3>
          <v-btn-toggle
            v-model="scope"
            mandatory
            divided
            variant="outlined"
            density="comfortable"
            color="primary"
            class="export-sheet__toggle"
            aria-labelledby="export-scope"
          >
            <v-btn
              v-for="option in scopeOptions"
              :key="option.value"
              :value="option.value"
              :aria-pressed="scope === option.value"
            >
              {{ option.label }}
              <span class="export-sheet__count ms-1">{{ counts[option.value] }}</span>
            </v-btn>
          </v-btn-toggle>
        </template>

        <h3 id="export-format" class="export-sheet__label text-title-small">
          {{ t('export.format') }}
        </h3>
        <v-btn-toggle
          :model-value="options.format"
          mandatory
          divided
          variant="outlined"
          density="comfortable"
          color="primary"
          class="export-sheet__toggle"
          aria-labelledby="export-format"
          aria-describedby="export-format-hint"
          @update:model-value="setFormat"
        >
          <v-btn
            value="text"
            :prepend-icon="mdiTextBoxOutline"
            :aria-pressed="options.format === 'text'"
          >
            {{ t('export.formatText') }}
          </v-btn>
          <v-btn
            value="table"
            :prepend-icon="mdiTableLarge"
            :aria-pressed="options.format === 'table'"
          >
            {{ t('export.formatTable') }}
          </v-btn>
        </v-btn-toggle>
        <p id="export-format-hint" class="export-sheet__hint text-body-small mt-1">
          {{ formatHint }}
        </p>

        <fieldset class="export-sheet__fields">
          <legend class="export-sheet__label text-title-small">{{ t('export.include') }}</legend>
          <v-checkbox
            v-model="options.types"
            :label="t('export.types')"
            hide-details
            density="compact"
          />
          <v-checkbox
            v-if="hasVersions"
            v-model="options.exclusive"
            :label="t('export.exclusive')"
            hide-details
            density="compact"
          />
          <v-checkbox v-model="options.links" hide-details density="compact">
            <template #label>
              <span>
                {{ t('export.links') }}
                <span class="export-sheet__hint d-block text-body-small">
                  {{ hasGame ? t('export.linksHintGame') : t('export.linksHint') }}
                </span>
              </span>
            </template>
          </v-checkbox>
          <v-checkbox
            v-if="hasGame && scope === 'all'"
            v-model="options.status"
            :label="t('export.status')"
            hide-details
            density="compact"
          />
        </fieldset>

        <v-alert
          v-if="failed"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
          role="alert"
          :text="t('export.copyFailed')"
        />

        <v-textarea
          v-if="text"
          ref="preview"
          :model-value="text"
          :label="t('export.preview')"
          readonly
          no-resize
          rows="7"
          variant="outlined"
          hide-details
          class="export-sheet__preview mt-4"
        />
        <p v-else class="export-sheet__hint text-body-medium mt-4">{{ t('export.empty') }}</p>
      </v-card-text>

      <v-card-actions class="export-sheet__actions">
        <v-btn variant="text" @click="open = false">{{ t('common.close') }}</v-btn>
        <v-spacer />
        <v-btn
          v-if="canShare"
          variant="tonal"
          :prepend-icon="mdiShareVariant"
          :disabled="!text"
          @click="share"
        >
          {{ t('common.share') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :prepend-icon="mdiContentCopy"
          :disabled="!text"
          @click="copy"
        >
          {{ t('export.copy', selected.length) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.export-sheet__label {
  margin: 12px 0 6px;
  padding: 0;
}

.export-sheet__label:first-child {
  margin-top: 0;
}

.export-sheet__toggle {
  max-width: 100%;
}

/* Rótulos com contagem não cabem em 3 colunas fixas num celular estreito: o grupo rola. */
.export-sheet__toggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: normal;
}

.export-sheet__count {
  font-variant-numeric: tabular-nums;
  font-weight: 400;
}

.export-sheet__hint {
  /* 0.7 é o mínimo que mantém 4,5:1 (ver medium-emphasis-opacity no tema). */
  opacity: 0.7;
}

.export-sheet__fields {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.export-sheet__preview :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  /* Linhas longas (com link) quebram em vez de rolar na horizontal dentro do celular. */
  white-space: pre-wrap;
}

.export-sheet__actions {
  padding-bottom: calc(8px + var(--safe-bottom));
}
</style>
