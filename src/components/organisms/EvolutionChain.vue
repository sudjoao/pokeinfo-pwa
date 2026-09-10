<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import type { EvolutionChain, PokemonSummary } from '@/types/pokemon'
import { formatItemName } from '@/utils/evolution'
import EvolutionBranch from '@/components/organisms/EvolutionBranch.vue'

const props = defineProps<{
  chain: EvolutionChain
  summaries: Record<number, PokemonSummary>
  currentSpeciesId: number
}>()

const emit = defineEmits<{ select: [speciesId: number] }>()

const { smAndDown } = useDisplay()

const hasEvolutions = computed(() => props.chain.root.evolvesTo.length > 0)
const babyItem = computed(() =>
  props.chain.babyTriggerItem ? formatItemName(props.chain.babyTriggerItem) : null,
)
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">Evolução</v-card-title>
    <v-card-text>
      <p v-if="!hasEvolutions" class="text-body-medium opacity-70 mb-0">Este Pokémon não evolui.</p>
      <template v-else>
        <div class="evolution-chain" :class="{ 'evolution-chain--vertical': smAndDown }">
          <EvolutionBranch
            :node="chain.root"
            :summaries="summaries"
            :current-species-id="currentSpeciesId"
            :vertical="smAndDown"
            @select="emit('select', $event)"
          />
        </div>
        <p v-if="babyItem" class="text-body-small opacity-70 mt-4 mb-0">
          {{ chain.root.name === 'happiny' || chain.root.isBaby ? 'A forma bebê nasce' : 'Nasce' }}
          de um ovo quando um dos pais segura {{ babyItem }}.
        </p>
        <p class="text-body-small opacity-60 mt-2 mb-0">
          Toque em um estágio para ver seus detalhes.
        </p>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.evolution-chain {
  overflow-x: auto;
  padding: 4px 0 8px;
}

.evolution-chain--vertical {
  display: flex;
  justify-content: center;
}
</style>
