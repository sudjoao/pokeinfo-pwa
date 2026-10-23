<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiChevronLeft, mdiChevronRight, mdiCompareHorizontal, mdiShareVariant } from '@mdi/js'
import { usePokemonDetail, type NeighborEntry } from '@/composables/usePokemonDetail'
import { useCry } from '@/composables/useCry'
import { announce } from '@/composables/useAnnouncer'
import { focusPageTitle } from '@/composables/usePageFocus'
import { useCaughtStore } from '@/stores/caught'
import { useFavoritesStore } from '@/stores/favorites'
import { useHuntsStore, useShinyCaughtStore } from '@/stores/shiny'
import { hasShinies } from '@/utils/shiny'
import ShinyHuntCard from '@/components/organisms/ShinyHuntCard.vue'
import { useDexLabel } from '@/composables/useDexLabel'
import { gameContextFromQuery, gameContextQuery } from '@/utils/games'
import { exclusiveVersionOf } from '@/utils/exclusives'
import { formatDexNumber, formatPokemonName } from '@/utils/pokemon'
import { useAbilityInfo } from '@/composables/useAbilityInfo'
import { useEggCompatibility } from '@/composables/useEggCompatibility'
import { useSwipe } from '@/composables/useSwipe'
import { shareLink } from '@/composables/useShare'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import AppNotice from '@/components/molecules/AppNotice.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonHero from '@/components/molecules/PokemonHero.vue'
import AboutGrid from '@/components/molecules/AboutGrid.vue'
import AbilityList from '@/components/molecules/AbilityList.vue'
import StatsList from '@/components/molecules/StatsList.vue'
import VarietyChips from '@/components/molecules/VarietyChips.vue'
import PokedexCard from '@/components/molecules/PokedexCard.vue'
import TrainingCard from '@/components/molecules/TrainingCard.vue'
import BreedingCard from '@/components/molecules/BreedingCard.vue'
import TypeDefenses from '@/components/organisms/TypeDefenses.vue'
import AbilitySheet from '@/components/organisms/AbilitySheet.vue'
import EggCompatSheet from '@/components/organisms/EggCompatSheet.vue'
import EvolutionChain from '@/components/organisms/EvolutionChain.vue'
import LocationList from '@/components/organisms/LocationList.vue'
import PokemonDetailSkeleton from '@/components/organisms/PokemonDetailSkeleton.vue'

// A tabela de golpes (~16 KB gz) vem num chunk próprio, em paralelo com o resto da tela.
const MovesCard = defineAsyncComponent(() => import('@/components/organisms/MovesCard.vue'))
const SpritesCard = defineAsyncComponent(() => import('@/components/organisms/SpritesCard.vue'))
const HeldItemsCard = defineAsyncComponent(() => import('@/components/organisms/HeldItemsCard.vue'))
const GenerationChangesCard = defineAsyncComponent(
  () => import('@/components/organisms/GenerationChangesCard.vue'),
)

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { dexLabel } = useDexLabel()

const idParam = computed(() => String(route.params.id ?? ''))
/** Jogo selecionado na Home, preservado na URL (`?game=&dex=`). */
const context = computed(() => gameContextFromQuery(route.query))

const {
  detail,
  species,
  chain,
  chainSummaries,
  encounters,
  status,
  speciesStatus,
  chainStatus,
  encountersStatus,
  errorMessage,
  dexNumber,
  previous,
  next,
  retry,
  requestEncounters,
} = usePokemonDetail(idParam, context)

/**
 * A lista de locais chegou perto da tela: só agora os encontros (resposta grande) são pedidos.
 * Enquanto espécie e evolução carregam a página fica curta e a lista "parece" perto; por isso só
 * vale depois que essas seções assentam.
 */
const locationsNear = ref(false)
function onLocationsNear(visible: boolean): void {
  locationsNear.value = visible
}
watch([locationsNear, speciesStatus, chainStatus], ([near, speciesState, chainState]) => {
  if (near && speciesState !== 'loading' && chainState !== 'loading') requestEncounters()
})

const regional = computed(() =>
  context.value && dexNumber.value !== null
    ? {
        number: dexNumber.value,
        dexLabel: dexLabel(context.value.dex),
        gameTitle: context.value.game.title,
      }
    : null,
)

/** Rótulo dos vizinhos: número regional quando a navegação segue a Pokédex do jogo. */
function neighborNumber(entry: NeighborEntry): string {
  return entry.dexNumber === undefined
    ? formatDexNumber(entry.id)
    : formatDexNumber(entry.dexNumber, 3)
}

const cry = useCry()

const caughtStore = useCaughtStore()
/** Estado de captura no jogo da URL; undefined (sem jogo) esconde o botão no hero. */
const caught = computed(() =>
  context.value && detail.value
    ? caughtStore.isCaught(context.value.game.slug, detail.value.speciesId)
    : undefined,
)

function toggleCaught(): void {
  if (context.value && detail.value) {
    caughtStore.toggle(context.value.game.slug, detail.value.speciesId)
  }
}

/** Versão do jogo da URL em que a espécie é exclusiva (null quando existe nas duas ou sem jogo). */
const exclusiveTo = computed(() =>
  context.value && detail.value
    ? (exclusiveVersionOf(context.value.game.slug, detail.value.speciesId)?.title ?? null)
    : null,
)

const title = computed(() => (detail.value ? formatPokemonName(detail.value.name) : t('app.name')))

watch(
  [detail, locale],
  ([value]) => {
    document.title = value
      ? t('app.detailTitle', { name: formatPokemonName(value.name) })
      : t('app.dexTitle')
  },
  { immediate: true },
)

watch(detail, (value) => {
  // Se a tela foi aberta por um toque no card, o grito já tocou dentro do gesto;
  // aqui cobrimos a abertura por URL direta (o iOS pode recusar sem gesto, e tudo bem).
  if (value) cry.autoPlay(value.id, value.cryUrl)
})

// Troca de Pokémon na mesma tela (vizinho, swipe, evolução, forma): o leitor de tela não percebe
// sozinho. Se o foco ficou num controle que ainda existe (ex.: "próximo"), só anuncia o nome,
// para a pessoa poder seguir apertando; se ele sumiu (o estágio atual vira texto), vai para o h1.
let shownId: number | undefined
watch(
  () => detail.value?.id,
  (id) => {
    // Entre um e outro o detalhe fica undefined (carregando): compara com o último mostrado.
    if (id === undefined) return
    const previousId = shownId
    shownId = id
    if (previousId === undefined || id === previousId) return
    nextTick(() => {
      const active = document.activeElement
      if (!active || active === document.body || !active.isConnected) focusPageTitle()
      else announce(title.value)
    })
  },
)

/**
 * Navega para outro Pokémon tocando o grito ainda dentro do gesto do usuário; mantém o jogo na URL.
 * Usa replace para o histórico ficar sempre "lista → detalhe": por mais Pokémon que a pessoa
 * percorra (vizinhos, evoluções, formas), voltar leva direto à listagem com os filtros de antes.
 */
function goTo(id: number): void {
  cry.play(id)
  router.replace({ name: 'pokemon', params: { id }, query: gameContextQuery(context.value) })
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home', query: gameContextQuery(context.value) })
}

const showVarieties = computed(() => (species.value?.varieties.length ?? 0) > 1)

/** Artwork shiny no hero; continua ligado ao navegar entre Pokémon (para comparar shinies). */
const shiny = ref(false)

const favorites = useFavoritesStore()

const shinyCaught = useShinyCaughtStore()
const hunts = useHuntsStore()
/** Caçada de shiny do jogo da URL (só com jogo e a partir da 2ª geração, quando existe shiny). */
const shinyContext = computed(() =>
  context.value && detail.value && hasShinies(context.value.game.generation)
    ? { game: context.value.game, speciesId: detail.value.speciesId }
    : null,
)
const hunt = computed(() =>
  shinyContext.value
    ? hunts.huntOf(shinyContext.value.game.slug, shinyContext.value.speciesId)
    : null,
)

function updateHunt(change: { count?: number; charm?: boolean; masuda?: boolean }): void {
  const target = shinyContext.value
  if (target) hunts.update(target.game.slug, target.speciesId, change)
}
const favorite = computed(() => (detail.value ? favorites.isFavorite(detail.value.id) : false))

const ability = useAbilityInfo()
const egg = useEggCompatibility()

// Deslizar para os lados troca de Pokémon (anterior/próximo), como virar página.
useSwipe(useTemplateRef<HTMLElement>('swipeArea'), {
  onNext: () => next.value && goTo(next.value.id),
  onPrevious: () => previous.value && goTo(previous.value.id),
})

const notice = ref<string | null>(null)

function share(): void {
  if (!detail.value) return
  shareLink(title.value, window.location.href).then((result) => {
    if (result === 'copied') notice.value = t('common.linkCopied')
    else if (result === 'failed') notice.value = t('common.shareFailed')
  })
}
</script>

<template>
  <DetailLayout :title="title" :ready="status !== 'loading'" @back="goBack">
    <template #actions>
      <v-btn v-if="detail" :icon="mdiShareVariant" :aria-label="t('common.share')" @click="share" />
      <v-btn
        v-if="detail"
        :icon="mdiCompareHorizontal"
        :aria-label="t('compare.withThis')"
        :to="{ name: 'compare', query: { ids: String(detail.id) } }"
      />
    </template>

    <div ref="swipeArea">
      <PokemonDetailSkeleton v-if="status === 'loading'" />

      <EmptyState
        v-else-if="status === 'not-found'"
        :title="t('detail.notFoundTitle')"
        :message="t('detail.notFoundMessage')"
        :action-label="t('detail.backToDex')"
        @action="goBack"
      />

      <EmptyState
        v-else-if="status === 'error' || !detail"
        variant="error"
        :title="t('detail.errorTitle')"
        :message="errorMessage ?? undefined"
        :action-label="t('common.retry')"
        @action="retry"
      />

      <template v-else>
        <nav
          class="d-flex justify-space-between align-center mb-3"
          :aria-label="t('detail.neighborsLabel')"
        >
          <v-btn
            v-if="previous"
            variant="text"
            :prepend-icon="mdiChevronLeft"
            class="text-none"
            @click="goTo(previous.id)"
          >
            {{ neighborNumber(previous) }} {{ formatPokemonName(previous.name) }}
          </v-btn>
          <span v-else />
          <v-btn
            v-if="next"
            variant="text"
            :append-icon="mdiChevronRight"
            class="text-none"
            @click="goTo(next.id)"
          >
            {{ formatPokemonName(next.name) }} {{ neighborNumber(next) }}
          </v-btn>
        </nav>

        <v-row>
          <v-col cols="12" md="5">
            <PokemonHero
              :pokemon="detail"
              :species="species"
              :regional="regional"
              :caught="caught"
              :exclusive-to="exclusiveTo"
              :show-cry="cry.supported"
              :cry-playing="cry.playing.value"
              :shiny="shiny"
              :favorite="favorite"
              @toggle-favorite="favorites.toggle(detail.id)"
              @play-cry="cry.listen(detail.id, detail.cryUrl ?? undefined)"
              @toggle-caught="toggleCaught"
              @toggle-shiny="shiny = !shiny"
            />
            <TypeDefenses
              class="mt-4"
              :pokemon-id="detail.id"
              :types="detail.types"
              :generation="context?.game.generation"
              :game-title="context?.game.title"
            />
          </v-col>

          <v-col cols="12" md="7" class="d-flex flex-column ga-4">
            <v-card v-if="speciesStatus === 'loading'">
              <v-skeleton-loader aria-hidden="true" type="paragraph" />
            </v-card>
            <PokedexCard
              v-else-if="species"
              :texts="species.pokedexTexts"
              :game="context?.game ?? null"
            />

            <AboutGrid :pokemon="detail" :species="species" />
            <AbilityList :abilities="detail.abilities" @open="ability.show" />
            <StatsList :stats="detail.stats" />
          </v-col>

          <v-col cols="12" md="6">
            <TrainingCard :pokemon="detail" :species="species" class="fill-height" />
          </v-col>
          <v-col v-if="species" cols="12" md="6">
            <BreedingCard
              :species="species"
              class="fill-height"
              @open-compatible="egg.show(species)"
            />
          </v-col>

          <v-col v-if="detail.heldItems.length" cols="12" md="6">
            <HeldItemsCard
              :items="detail.heldItems"
              :game="context?.game ?? null"
              class="fill-height"
            />
          </v-col>
          <v-col
            v-if="detail.pastTypes.length || detail.pastAbilities.length || detail.pastStats.length"
            cols="12"
            md="6"
          >
            <GenerationChangesCard
              :past-types="detail.pastTypes"
              :past-abilities="detail.pastAbilities"
              :past-stats="detail.pastStats"
              :stats="detail.stats"
              class="fill-height"
            />
          </v-col>

          <v-col cols="12">
            <v-card v-if="chainStatus === 'loading'">
              <v-card-title tag="h2" class="text-title-medium">{{
                t('detail.evolution')
              }}</v-card-title>
              <v-skeleton-loader aria-hidden="true" type="list-item-avatar-two-line@2" />
            </v-card>
            <v-card v-else-if="chainStatus === 'error' || !chain">
              <v-card-title tag="h2" class="text-title-medium">{{
                t('detail.evolution')
              }}</v-card-title>
              <v-card-text class="d-flex flex-column align-start ga-2">
                <span>{{ t('detail.evolutionError') }}</span>
                <v-btn color="primary" variant="tonal" size="small" @click="retry">
                  {{ t('common.retry') }}
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

          <v-col v-if="detail.sprites.length" cols="12">
            <SpritesCard
              :key="detail.id"
              :sprites="detail.sprites"
              :game="context?.game ?? null"
              :shiny="shiny"
            />
          </v-col>

          <v-col v-if="shinyContext" cols="12" md="6">
            <ShinyHuntCard
              :game-title="shinyContext.game.title"
              :generation="shinyContext.game.generation"
              :caught="shinyCaught.isCaught(shinyContext.game.slug, shinyContext.speciesId)"
              :hunt="hunt"
              @toggle-caught="shinyCaught.toggle(shinyContext.game.slug, shinyContext.speciesId)"
              @count="updateHunt({ count: (hunt?.count ?? 0) + $event })"
              @set-charm="updateHunt({ charm: $event })"
              @set-masuda="updateHunt({ masuda: $event })"
              @reset="hunts.reset(shinyContext.game.slug, shinyContext.speciesId)"
            />
          </v-col>

          <v-col cols="12">
            <MovesCard :moves="detail.moves" :version-group="context?.game.slug ?? null" />
          </v-col>

          <v-col cols="12">
            <LocationList
              v-intersect="{ handler: onLocationsNear, options: { rootMargin: '400px 0px' } }"
              :encounters="encounters"
              :status="encountersStatus"
              :game="context?.game ?? null"
              @retry="retry"
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

        <AbilitySheet
          v-model="ability.open.value"
          :title="ability.title.value"
          :description="ability.description.value"
          :description-lang="ability.descriptionLang.value"
          :status="ability.status.value"
          :holders="ability.holders.value"
          @select="goTo"
          @retry="ability.retry"
        />
        <EggCompatSheet
          v-model="egg.open.value"
          :status="egg.status.value"
          :species="egg.species.value"
          :is-ditto="egg.isDitto.value"
          @select="goTo"
          @retry="egg.retry"
        />
      </template>
    </div>
    <AppNotice :text="notice" :timeout="2500" @close="notice = null" />
  </DetailLayout>
</template>
