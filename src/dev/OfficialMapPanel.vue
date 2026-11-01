<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import {
  enabled,
  files,
  filesLoaded,
  fitReference,
  guessFile,
  loadFiles,
  loadSize,
  sections,
  sizes,
} from './officialMap'

/**
 * Só no modo dev: liga a imagem do mapa oficial por baixo do nosso e ajusta posição, escala e
 * opacidade até as cidades baterem. O ajuste fica salvo por seção no localStorage.
 */
const props = defineProps<{
  sectionKey: string
  gameSlug: string
  map: { width: number; height: number }
}>()

const reference = computed(() => sections[props.sectionKey])
const fit = computed(() => {
  const file = reference.value?.file
  const size = file ? sizes[file] : undefined
  return size ? Math.min(props.map.width / size.width, props.map.height / size.height) : 1
})

async function useFile(file: string | null, refit = false): Promise<void> {
  if (!file) {
    const current = sections[props.sectionKey]
    if (current) current.file = null
    return
  }
  const size = await loadSize(file)
  const current = sections[props.sectionKey]
  if (refit || !current || current.file !== file) {
    sections[props.sectionKey] = fitReference(file, size, props.map, current?.opacity)
  }
}

/** Seção nova (ou lista recém-carregada): retoma o ajuste salvo ou chuta o arquivo pelo nome. */
async function prepare(): Promise<void> {
  if (!enabled.value || !filesLoaded.value) return
  const current = sections[props.sectionKey]
  // Sem imagem de propósito (limpou o campo): fica assim.
  if (current && !current.file) return
  if (current?.file && files.value.includes(current.file)) await loadSize(current.file)
  else await useFile(guessFile(files.value, props.sectionKey, props.gameSlug))
}

onMounted(loadFiles)
watch([() => props.sectionKey, filesLoaded, enabled], prepare)
</script>

<template>
  <v-card variant="outlined" color="warning" class="official-map-panel pa-3 mt-3">
    <div class="d-flex align-center ga-2 flex-wrap">
      <v-chip size="small" color="warning" variant="flat" label>DEV</v-chip>
      <v-switch
        v-model="enabled"
        label="Imagem oficial por baixo do mapa"
        color="warning"
        density="compact"
        hide-details
        inset
      />
    </div>

    <template v-if="enabled">
      <p v-if="filesLoaded && !files.length" class="text-body-small mt-2 mb-0">
        Nenhuma imagem em <code>dev-maps/</code>. Salve lá o mapa da região (ex.:
        <code>{{ sectionKey }}.png</code> ou <code>{{ sectionKey }}.{{ gameSlug }}.png</code>) e
        recarregue. Instruções em <code>dev-maps/README.md</code>.
      </p>

      <template v-else-if="filesLoaded">
        <div class="d-flex align-center ga-2 mt-2">
          <v-select
            :model-value="reference?.file || null"
            :items="files"
            label="Imagem"
            density="compact"
            hide-details
            clearable
            @update:model-value="useFile($event)"
          />
          <v-btn
            variant="tonal"
            color="warning"
            :disabled="!reference?.file"
            @click="useFile(reference?.file ?? null, true)"
          >
            Encaixar
          </v-btn>
          <v-btn variant="text" @click="loadFiles">Atualizar lista</v-btn>
        </div>

        <div v-if="reference?.file" class="official-map-panel__sliders mt-2">
          <v-slider
            v-model="reference.opacity"
            label="Opacidade"
            :min="0"
            :max="1"
            :step="0.05"
            density="compact"
            hide-details
            thumb-label
          />
          <v-slider
            v-model="reference.scale"
            label="Escala"
            :min="fit / 4"
            :max="fit * 4"
            :step="fit / 400"
            density="compact"
            hide-details
          />
          <v-slider
            v-model="reference.stretch"
            label="Esticar (vertical)"
            :min="0.5"
            :max="2"
            :step="0.005"
            density="compact"
            hide-details
          />
          <v-slider
            v-model="reference.x"
            label="Posição X"
            :min="-map.width"
            :max="map.width"
            :step="1"
            density="compact"
            hide-details
          />
          <v-slider
            v-model="reference.y"
            label="Posição Y"
            :min="-map.height"
            :max="map.height"
            :step="1"
            density="compact"
            hide-details
          />
          <p class="text-body-small opacity-70 mb-0">
            escala {{ reference.scale.toFixed(3) }} · esticar {{ reference.stretch.toFixed(3) }} · x
            {{ Math.round(reference.x) }} · y {{ Math.round(reference.y) }}. Setas do teclado num
            controle ajustam fino.
          </p>
        </div>
      </template>
    </template>
  </v-card>
</template>

<style scoped>
.official-map-panel__sliders {
  display: grid;
  gap: 4px;
}
</style>
