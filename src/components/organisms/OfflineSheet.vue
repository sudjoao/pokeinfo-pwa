<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'
import { useOfflinePacks } from '@/composables/useOfflinePacks'
import { usePokemonData } from '@/composables/usePokemonData'
import { estimatePackMb, OFFLINE_PACKS, packUrls, type OfflinePack } from '@/utils/offline'
import { DAILY_SPECIES } from '@/utils/daily'

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const { t, n } = useI18n()
const offline = useOfflinePacks()
const pokemonData = usePokemonData()

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const generations = ref<number[]>([...GENERATIONS])
const packs = ref<OfflinePack[]>(['data', 'images'])

onMounted(() => {
  pokemonData.load().catch(() => {})
  offline.refreshStatus()
})
watch(open, (value) => value && offline.refreshStatus())

/** Espécies 1–1025 por geração (da tabela gerada; as formas aparecem pelas espécies). */
const byGeneration = computed(() => {
  const rows = pokemonData.table.value?.rows
  const groups = new Map<number, number[]>()
  if (!rows) return groups
  for (let id = 1; id <= DAILY_SPECIES; id++) {
    const generation = rows[id]?.[8] as number | undefined
    if (!generation || !generations.value.includes(generation)) continue
    groups.set(generation, [...(groups.get(generation) ?? []), id])
  }
  return groups
})
const ids = computed(() => [...byGeneration.value.values()].flat())

const mb = (value: number) => t('offline.mb', { n: n(Math.max(1, Math.round(value))) })
const estimate = computed(() =>
  packs.value.reduce((sum, pack) => sum + estimatePackMb(pack, byGeneration.value), 0),
)
const percent = computed(() =>
  offline.progress.value.total
    ? Math.round((offline.progress.value.done / offline.progress.value.total) * 100)
    : 0,
)

/** Quanto de cada pacote já está salvo, considerando só as gerações escolhidas (aproximado). */
function savedText(pack: OfflinePack): string {
  const expected = ids.value.length * packUrls(pack, 1).length
  const count = Math.min(offline.saved.value[pack], expected)
  return t('offline.saved', { n: n(count), total: n(expected) })
}

const usageText = computed(() => {
  const usage = offline.usage.value
  if (!usage) return null
  return t('offline.usage', {
    used: mb(usage.used / 1024 / 1024),
    quota: mb(usage.quota / 1024 / 1024),
  })
})

function start(): void {
  offline.download(packs.value, ids.value)
}
</script>

<template>
  <v-bottom-sheet v-model="open" inset scrollable :aria-label="t('offline.title')">
    <v-card rounded="t-xl" :title="t('offline.title')">
      <v-card-text class="d-flex flex-column ga-3 offline-sheet__body">
        <p v-if="!offline.supported" class="mb-0">{{ t('offline.unsupported') }}</p>
        <template v-else>
          <p class="text-body-medium mb-0">{{ t('offline.intro') }}</p>

          <div>
            <h2 id="offline-generations" class="text-title-small mb-1">
              {{ t('offline.generations') }}
            </h2>
            <v-chip-group
              v-model="generations"
              multiple
              column
              selected-class="text-primary-safe"
              aria-labelledby="offline-generations"
            >
              <v-chip
                v-for="generation in GENERATIONS"
                :key="generation"
                :value="generation"
                filter
                variant="outlined"
                size="small"
                role="button"
                :aria-pressed="generations.includes(generation)"
                :disabled="offline.running.value"
              >
                {{ t('offline.generation', { n: generation }) }}
              </v-chip>
            </v-chip-group>
          </div>

          <div>
            <h2 class="text-title-small mb-1">{{ t('offline.packs') }}</h2>
            <v-checkbox
              v-for="pack in OFFLINE_PACKS"
              :key="pack"
              v-model="packs"
              :value="pack"
              :disabled="offline.running.value"
              density="compact"
              hide-details
            >
              <template #label>
                <span>
                  {{ t(`offline.pack.${pack}`) }}
                  <span class="text-label-small opacity-70 d-block">
                    ≈ {{ mb(estimatePackMb(pack, byGeneration)) }} · {{ savedText(pack) }}
                  </span>
                </span>
              </template>
            </v-checkbox>
          </div>

          <template v-if="offline.running.value">
            <v-progress-linear :model-value="percent" color="primary" height="8" rounded />
            <p class="text-body-small mb-0" aria-live="polite">
              {{
                t('offline.progress', {
                  done: n(offline.progress.value.done),
                  total: n(offline.progress.value.total),
                })
              }}
            </p>
          </template>
          <p
            v-else-if="offline.progress.value.total && offline.progress.value.failed"
            class="text-body-small mb-0"
            role="status"
          >
            {{ t('offline.failed', { n: offline.progress.value.failed }) }}
          </p>

          <p v-if="usageText" class="text-body-small opacity-70 mb-0">{{ usageText }}</p>
          <p class="text-body-small opacity-70 mb-0">{{ t('offline.hint') }}</p>
        </template>
      </v-card-text>
      <v-card-actions v-if="offline.supported" class="flex-wrap">
        <v-btn
          color="error"
          variant="text"
          :disabled="offline.running.value"
          @click="offline.clear"
        >
          {{ t('offline.clear') }}
        </v-btn>
        <v-spacer />
        <v-btn v-if="offline.running.value" @click="offline.cancel">{{ t('backup.cancel') }}</v-btn>
        <v-btn
          v-else
          color="primary"
          variant="flat"
          :disabled="!packs.length || !ids.length"
          @click="start"
        >
          {{ t('offline.download', { size: mb(estimate) }) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.offline-sheet__body {
  max-height: 75vh;
}
</style>
