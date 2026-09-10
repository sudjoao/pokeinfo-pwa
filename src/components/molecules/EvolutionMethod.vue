<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiArrowDown, mdiArrowRight, mdiChevronDown, mdiChevronUp } from '@mdi/js'
import type { EvolutionMethod } from '@/types/pokemon'
import { formLabel, formatVersionGroup } from '@/utils/evolution'

const props = defineProps<{
  methods: EvolutionMethod[]
  /** Nome da espécie-alvo, para rotular formas ("Lycanroc" -> "forma Midday"). */
  speciesName: string
  vertical?: boolean
}>()

const showAll = ref(false)

const primary = computed(() => props.methods.filter((m) => m.isDefault))
const others = computed(() => props.methods.filter((m) => !m.isDefault))

function formOf(method: EvolutionMethod): string | null {
  return method.resultForm ? formLabel(method.resultForm, props.speciesName) : null
}
</script>

<template>
  <div class="evolution-method" :class="{ 'evolution-method--vertical': vertical }">
    <v-icon :icon="vertical ? mdiArrowDown : mdiArrowRight" size="28" class="opacity-60" />
    <div class="evolution-method__text">
      <div
        v-for="method in primary"
        :key="method.description + method.resultForm"
        class="text-body-small"
      >
        {{ method.description }}
        <span v-if="formOf(method)" class="font-weight-bold">→ forma {{ formOf(method) }}</span>
      </div>

      <template v-if="others.length">
        <v-btn
          size="x-small"
          variant="text"
          class="px-1 text-none"
          :append-icon="showAll ? mdiChevronUp : mdiChevronDown"
          @click.stop="showAll = !showAll"
        >
          {{ showAll ? 'Menos' : `+${others.length} em outros jogos` }}
        </v-btn>
        <v-expand-transition>
          <ul v-if="showAll" class="evolution-method__others text-body-small">
            <li v-for="method in others" :key="method.description + method.resultForm">
              {{ method.description }}
              <span v-if="formOf(method)" class="font-weight-bold"
                >→ forma {{ formOf(method) }}</span
              >
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
