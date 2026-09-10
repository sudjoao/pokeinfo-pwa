<script setup lang="ts">
import type { EvolutionNode, PokemonSummary } from '@/types/pokemon'
import EvolutionStage from '@/components/molecules/EvolutionStage.vue'
import EvolutionMethod from '@/components/molecules/EvolutionMethod.vue'

/**
 * Renderiza um nó da cadeia e, recursivamente, suas evoluções.
 * Horizontal (desktop): estágio à esquerda, evoluções empilhadas à direita.
 * Vertical (celular): estágio em cima, evoluções abaixo lado a lado (quebrando linha).
 */
defineProps<{
  node: EvolutionNode
  summaries: Record<number, PokemonSummary>
  currentSpeciesId: number
  vertical?: boolean
}>()

const emit = defineEmits<{ select: [speciesId: number] }>()
</script>

<template>
  <div
    class="evolution-branch"
    :class="{
      'evolution-branch--vertical': vertical,
      'evolution-branch--wide': !vertical && node.evolvesTo.length > 3,
    }"
  >
    <EvolutionStage
      :species-id="node.speciesId"
      :name="node.name"
      :summary="summaries[node.speciesId]"
      :current="node.speciesId === currentSpeciesId"
      :is-baby="node.isBaby"
      @select="emit('select', $event)"
    />

    <div v-if="node.evolvesTo.length" class="evolution-branch__children">
      <div v-for="child in node.evolvesTo" :key="child.speciesId" class="evolution-branch__child">
        <EvolutionMethod :methods="child.methods" :species-name="child.name" :vertical="vertical" />
        <EvolutionBranch
          :node="child"
          :summaries="summaries"
          :current-species-id="currentSpeciesId"
          :vertical="vertical"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.evolution-branch {
  display: flex;
  align-items: center;
  gap: 12px;
}

.evolution-branch__children {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evolution-branch__child {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Com muitas ramificações (Eevee), alinhar a base ao topo evita que ela fique fora da tela. */
.evolution-branch--wide {
  align-items: flex-start;
}

.evolution-branch--wide > .evolution-stage {
  margin-top: 48px;
}

.evolution-branch--vertical {
  flex-direction: column;
  gap: 0;
}

.evolution-branch--vertical > .evolution-branch__children {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.evolution-branch--vertical > .evolution-branch__children > .evolution-branch__child {
  flex-direction: column;
  gap: 0;
  align-items: center;
  width: 150px;
}
</style>
