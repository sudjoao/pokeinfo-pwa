<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiChevronLeft, mdiChevronRight, mdiVolumeHigh, mdiVolumeOff } from '@mdi/js'
import { usePokemonDetail } from '@/composables/usePokemonDetail'
import { useCry } from '@/composables/useCry'
import { formatDexNumber, formatPokemonName } from '@/utils/pokemon'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonHero from '@/components/molecules/PokemonHero.vue'
import AboutGrid from '@/components/molecules/AboutGrid.vue'
import AbilityList from '@/components/molecules/AbilityList.vue'
import StatsList from '@/components/molecules/StatsList.vue'
import VarietyChips from '@/components/molecules/VarietyChips.vue'
import EvolutionChain from '@/components/organisms/EvolutionChain.vue'
import PokemonDetailSkeleton from '@/components/organisms/PokemonDetailSkeleton.vue'

const route = useRoute()
const router = useRouter()

const idParam = computed(() => String(route.params.id ?? ''))

const {
  detail,
  species,
  chain,
  chainSummaries,
  status,
  speciesStatus,
  chainStatus,
  errorMessage,
  previous,
  next,
  retry,
} = usePokemonDetail(idParam)

const cry = useCry()

const title = computed(() => (detail.value ? formatPokemonName(detail.value.name) : 'PokéInfo'))

watch(detail, (value) => {
  document.title = value ? `${formatPokemonName(value.name)} · Pokédex` : 'Pokédex'
  // Se a tela foi aberta por um toque no card, o grito já tocou dentro do gesto;
  // aqui cobrimos a abertura por URL direta (o iOS pode recusar sem gesto, e tudo bem).
  if (value) cry.autoPlay(value.id, value.cryUrl)
})

/** Navega para outro Pokémon tocando o grito ainda dentro do gesto do usuário. */
function goTo(id: number): void {
  cry.play(id)
  router.push({ name: 'pokemon', params: { id } })
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}

const showVarieties = computed(() => (species.value?.varieties.length ?? 0) > 1)
</script>

<template>
  <DetailLayout :title="title" @back="goBack">
    <template v-if="cry.supported" #actions>
      <v-btn
        :icon="cry.muted.value ? mdiVolumeOff : mdiVolumeHigh"
        :aria-label="cry.muted.value ? 'Ativar som' : 'Desativar som'"
        @click="cry.toggleMuted"
      />
    </template>

    <PokemonDetailSkeleton v-if="status === 'loading'" />

    <EmptyState
      v-else-if="status === 'not-found'"
      title="Pokémon não encontrado"
      message="Confira o número ou o nome e tente de novo."
      action-label="Voltar à Pokédex"
      @action="router.push({ name: 'home' })"
    />

    <EmptyState
      v-else-if="status === 'error' || !detail"
      variant="error"
      title="Não foi possível carregar o Pokémon"
      :message="errorMessage ?? undefined"
      action-label="Tentar novamente"
      @action="retry"
    />

    <template v-else>
      <nav class="d-flex justify-space-between align-center mb-3" aria-label="Pokémon vizinhos">
        <v-btn
          v-if="previous"
          variant="text"
          :prepend-icon="mdiChevronLeft"
          class="text-none"
          @click="goTo(previous.id)"
        >
          {{ formatDexNumber(previous.id) }} {{ formatPokemonName(previous.name) }}
        </v-btn>
        <span v-else />
        <v-btn
          v-if="next"
          variant="text"
          :append-icon="mdiChevronRight"
          class="text-none"
          @click="goTo(next.id)"
        >
          {{ formatPokemonName(next.name) }} {{ formatDexNumber(next.id) }}
        </v-btn>
      </nav>

      <v-row>
        <v-col cols="12" md="5">
          <PokemonHero
            :pokemon="detail"
            :genus="species?.genus"
            :show-cry="cry.supported"
            :cry-playing="cry.playing.value"
            :cry-muted="cry.muted.value"
            @play-cry="cry.play(detail.id, detail.cryUrl ?? undefined)"
          />
        </v-col>

        <v-col cols="12" md="7" class="d-flex flex-column ga-4">
          <v-card v-if="speciesStatus === 'loading'">
            <v-skeleton-loader type="paragraph" />
          </v-card>
          <v-card v-else-if="species?.description">
            <v-card-title class="text-title-medium">Pokédex</v-card-title>
            <v-card-text class="text-body-large">{{ species.description }}</v-card-text>
          </v-card>

          <AboutGrid :pokemon="detail" :species="species" />
          <AbilityList :abilities="detail.abilities" />
          <StatsList :stats="detail.stats" />
        </v-col>

        <v-col cols="12">
          <v-card v-if="chainStatus === 'loading'">
            <v-card-title class="text-title-medium">Evolução</v-card-title>
            <v-skeleton-loader type="list-item-avatar-two-line@2" />
          </v-card>
          <v-card v-else-if="chainStatus === 'error' || !chain">
            <v-card-title class="text-title-medium">Evolução</v-card-title>
            <v-card-text class="d-flex flex-column align-start ga-2">
              <span>Não foi possível carregar a cadeia de evolução.</span>
              <v-btn color="primary" variant="tonal" size="small" @click="retry">
                Tentar novamente
              </v-btn>
            </v-card-text>
          </v-card>
          <EvolutionChain
            v-else
            :chain="chain"
            :summaries="chainSummaries"
            :current-species-id="detail.speciesId"
            @select="goTo"
          />
        </v-col>

        <v-col v-if="showVarieties && species" cols="12">
          <VarietyChips
            :varieties="species.varieties"
            :species-name="species.name"
            :current-id="detail.id"
            @select="goTo"
          />
        </v-col>
      </v-row>
    </template>
  </DetailLayout>
</template>
