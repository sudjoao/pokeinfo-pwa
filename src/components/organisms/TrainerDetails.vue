<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiOpenInNew } from '@mdi/js'
import type { Game } from '@/data/games'
import type { PokemonType } from '@/types/pokemon'
import type { Trainer, TrainerBattle } from '@/types/trainers'
import { usePokedexStore } from '@/stores/pokedex'
import { typesInGeneration } from '@/utils/typeChart'
import { attackingTypes, maxLevel, sameCondition, teamWeaknesses } from '@/utils/trainers'
import { useConditionLabel } from '@/composables/useConditionLabel'
import TypeChip from '@/components/atoms/TypeChip.vue'
import TrainerPokemonRow from '@/components/molecules/TrainerPokemonRow.vue'

/** Corpo do painel de um treinador: escolha da luta e da variação, resumo de tipos e o time. */
const props = defineProps<{ trainer: Trainer; game: Game }>()
const emit = defineEmits<{ select: [id: number] }>()

const { t } = useI18n()
const pokedex = usePokedexStore()
const conditionLabel = useConditionLabel(() => props.game)

const battleIndex = ref(0)
const teamIndex = ref(0)
watch(
  () => props.trainer,
  () => {
    battleIndex.value = 0
    teamIndex.value = 0
  },
)

const battle = computed<TrainerBattle | undefined>(() => props.trainer.battles[battleIndex.value])

/** Troca de luta mantém a mesma variação (inicial/versão) quando a nova luta também tem. */
watch(battleIndex, (index, previous) => {
  const before = props.trainer.battles[previous]?.teams[teamIndex.value]?.when
  const teams = props.trainer.battles[index]?.teams ?? []
  const same = teams.findIndex((team) => sameCondition(team.when, before))
  teamIndex.value = same >= 0 ? same : 0
})

/** O que muda entre os times da luta: inicial, versão ou o Eevee do rival. */
const variantsLabel = computed(() => {
  const when = battle.value?.teams[0]?.when
  if (when?.starter) return t('league.yourStarter')
  if (when?.rivalEevee) return t('league.rivalEeveeShort')
  if (when?.version) return t('league.version')
  return t('league.variants')
})
const variantsLabelId = useId()

const team = computed(() => battle.value?.teams[teamIndex.value] ?? battle.value?.teams[0])

function battleLabel(entry: TrainerBattle, index: number): string {
  if (entry.kind === 'first') return t('league.first')
  // Revanches numeradas na ordem da página ("Revanche", "Revanche 2"…).
  const rematches = props.trainer.battles.slice(0, index + 1).filter((b) => b.kind === 'rematch')
  return rematches.length > 1 ? t('league.rematchN', { n: rematches.length }) : t('league.rematch')
}

/** Membros com nome e tipos na geração do jogo (formas regionais têm os próprios tipos). */
const members = computed(() =>
  (team.value?.pokemon ?? []).map((pokemon) => {
    const own = pokedex.typesOf(pokemon.id) ?? []
    return {
      pokemon,
      name: pokedex.entryOf(pokemon.id)?.name ?? String(pokemon.id),
      types: typesInGeneration(pokemon.id, own, props.game.generation) as readonly PokemonType[],
    }
  }),
)

const weaknesses = computed(() =>
  teamWeaknesses(
    members.value.map((member) => member.types).filter((types) => types.length),
    props.game.generation,
  ),
)
const attacks = computed(() => attackingTypes(team.value?.pokemon ?? [], props.game.slug))
const total = computed(() => members.value.length)
const levelCap = computed(() => maxLevel(team.value?.pokemon ?? []))

const bulbapediaUrl = computed(
  () =>
    `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(props.trainer.page.replace(/ /g, '_'))}`,
)
</script>

<template>
  <div class="trainer-details">
    <v-chip-group
      v-if="trainer.battles.length > 1"
      v-model="battleIndex"
      mandatory
      selected-class="text-primary-safe"
      :aria-label="t('league.battles')"
    >
      <v-chip
        v-for="(entry, index) in trainer.battles"
        :key="index"
        :value="index"
        size="small"
        variant="outlined"
        filter
      >
        {{ battleLabel(entry, index) }}
      </v-chip>
    </v-chip-group>

    <div v-if="battle && battle.teams.length > 1" class="d-flex align-center flex-wrap gc-2">
      <span :id="variantsLabelId" class="text-label-medium">{{ variantsLabel }}</span>
      <v-chip-group
        v-model="teamIndex"
        mandatory
        selected-class="text-primary-safe"
        :aria-labelledby="variantsLabelId"
      >
        <v-chip
          v-for="(entry, index) in battle.teams"
          :key="index"
          :value="index"
          size="small"
          variant="outlined"
          filter
        >
          {{ conditionLabel.short(entry.when) }}
        </v-chip>
      </v-chip-group>
    </div>

    <!-- O nível da primeira luta já está no título do painel; aqui só quando dá para trocar. -->
    <p
      v-if="battle?.detail || trainer.battles.length > 1"
      class="text-label-medium opacity-80 mt-1 mb-2"
    >
      <span v-if="battle?.detail" lang="en">{{ battle.detail }}</span>
      <template v-if="battle?.detail && trainer.battles.length > 1"> · </template>
      <template v-if="trainer.battles.length > 1">
        {{ t('league.maxLevel', { n: levelCap }) }}
      </template>
    </p>

    <p v-if="battle?.note" class="trainer-details__note text-body-small mb-3" lang="en">
      {{ battle.note }}
    </p>

    <div v-if="weaknesses.length || attacks.length" class="trainer-details__summary mb-2">
      <div v-if="weaknesses.length" class="d-flex flex-wrap align-center ga-1">
        <span class="text-label-medium me-1">{{ t('league.weakTo') }}</span>
        <span
          v-for="entry in weaknesses"
          :key="entry.type"
          class="d-inline-flex align-center ga-1"
          :title="t('league.hits', { count: entry.count, total })"
        >
          <TypeChip :type="entry.type" size="x-small" />
          <span class="text-label-small opacity-80">
            <span aria-hidden="true">{{ entry.count }}/{{ total }}</span>
            <span class="d-sr-only">{{ t('league.hits', { count: entry.count, total }) }}</span>
          </span>
        </span>
      </div>
      <div v-if="attacks.length" class="d-flex flex-wrap align-center ga-1 mt-1">
        <span class="text-label-medium me-1">{{ t('league.attacksWith') }}</span>
        <span
          v-for="entry in attacks"
          :key="entry.type"
          class="d-inline-flex align-center ga-1"
          :title="t('league.usedBy', { count: entry.count, total })"
        >
          <TypeChip :type="entry.type" size="x-small" />
          <span class="text-label-small opacity-80">
            <span aria-hidden="true">{{ entry.count }}/{{ total }}</span>
            <span class="d-sr-only">{{ t('league.usedBy', { count: entry.count, total }) }}</span>
          </span>
        </span>
      </div>
    </div>

    <ul class="trainer-details__team">
      <TrainerPokemonRow
        v-for="(member, index) in members"
        :key="`${member.pokemon.id}-${index}`"
        :pokemon="member.pokemon"
        :name="member.name"
        :types="member.types"
        :game="game"
        @select="emit('select', $event)"
      />
    </ul>

    <v-btn
      :href="bulbapediaUrl"
      target="_blank"
      rel="noopener"
      variant="text"
      size="small"
      color="primary"
      :append-icon="mdiOpenInNew"
      class="mt-1 px-1"
    >
      {{ t('league.bulbapedia') }}
    </v-btn>
  </div>
</template>

<style scoped>
.trainer-details__team {
  padding: 0;
  margin: 0;
}

.trainer-details__note {
  border-inline-start: 3px solid rgba(var(--v-theme-primary), 0.6);
  padding-inline-start: 8px;
}
</style>
