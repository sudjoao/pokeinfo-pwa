<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  h,
  nextTick,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
  type Component,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  mdiCompareHorizontal,
  mdiImageOutline,
  mdiLinkVariant,
  mdiShareVariant,
  mdiSwordCross,
} from '@mdi/js'
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
import { useListShiny } from '@/composables/useListShiny'
import { gameContextFromQuery, gameContextQuery } from '@/utils/games'
import { exclusiveVersionOf } from '@/utils/exclusives'
import { isMega, megaLabel, pokemonLabel, withoutMegas } from '@/utils/megas'
import { speciesIdOf } from '@/utils/forms'
import { formatDexNumber } from '@/utils/pokemon'
import { speciesDisplayName } from '@/utils/species'
import { LATEST_GENERATION } from '@/utils/typeChart'
import { useMountOnOpen } from '@/composables/useMountOnOpen'
import { useRecentStore } from '@/stores/recent'
import { useShareImage } from '@/composables/useShareImage'
import { useAbilityInfo } from '@/composables/useAbilityInfo'
import { useEggCompatibility } from '@/composables/useEggCompatibility'
import { useSwipe } from '@/composables/useSwipe'
import { useTeam } from '@/composables/useTeam'
import { useShortcut } from '@/composables/useShortcut'
import { shareLink } from '@/composables/useShare'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import AppNotice from '@/components/molecules/AppNotice.vue'
import BackToTop from '@/components/atoms/BackToTop.vue'
import CardSkeleton from '@/components/molecules/CardSkeleton.vue'
import NeighborNav, { type NeighborLink } from '@/components/molecules/NeighborNav.vue'
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
import MegaEvolutionCard from '@/components/organisms/MegaEvolutionCard.vue'
import LocationList from '@/components/organisms/LocationList.vue'
import PokemonDetailSkeleton from '@/components/organisms/PokemonDetailSkeleton.vue'

const ShareImageDialog = defineAsyncComponent(
  () => import('@/components/organisms/ShareImageDialog.vue'),
)
const CaptureSheet = defineAsyncComponent(() => import('@/components/organisms/CaptureSheet.vue'))

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { dexLabel } = useDexLabel()

/**
 * Cards carregados sob demanda (a tabela de golpes, ~16 KB gz, vem num chunk próprio, em paralelo
 * com o resto da tela). Enquanto o chunk baixa, no lugar fica um card com o título e um esqueleto:
 * sem ele a coluna ficava vazia e a página pulava quando o card chegava (e a lista de locais, que
 * só é pedida quando chega perto da tela, parecia perto antes da hora).
 */
function asyncCard(loader: () => Promise<{ default: Component }>, titleKey: string) {
  return defineAsyncComponent({
    loader,
    loadingComponent: () => h(CardSkeleton, { title: t(titleKey) }),
    delay: 0,
  })
}
const MovesCard = asyncCard(() => import('@/components/organisms/MovesCard.vue'), 'moves.title')
const SpritesCard = asyncCard(
  () => import('@/components/organisms/SpritesCard.vue'),
  'sprites.title',
)
const HeldItemsCard = asyncCard(
  () => import('@/components/organisms/HeldItemsCard.vue'),
  'heldItems.title',
)
const GenerationChangesCard = asyncCard(
  () => import('@/components/organisms/GenerationChangesCard.vue'),
  'changes.title',
)

const idParam = computed(() => String(route.params.id ?? ''))
/** Jogo selecionado na Home, preservado na URL (`?game=&dex=`). */
const context = computed(() => gameContextFromQuery(route.query))

/**
 * Artwork shiny no hero: começa como a lista está (a preferência "Shiny" dos cards) e continua
 * ligado ao navegar entre Pokémon (para comparar shinies). Trocar aqui não muda a lista.
 */
const shiny = ref(useListShiny().shiny.value)

const {
  detail,
  species,
  chain,
  chainSummaries,
  megaLine,
  megaSummaries,
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
} = usePokemonDetail(idParam, context, shiny)

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

/**
 * Rótulo dos vizinhos: número regional quando a navegação segue a Pokédex do jogo; na Nacional,
 * o da espécie (uma forma, como o Raichu de Alola, tem id 10100 mas é o #0026).
 */
function neighborNumber(entry: NeighborEntry): string {
  return entry.dexNumber === undefined
    ? formatDexNumber(speciesIdOf(entry.id))
    : formatDexNumber(entry.dexNumber, 3)
}

function neighborLink(entry: NeighborEntry | null): NeighborLink | null {
  return entry
    ? { id: entry.id, number: neighborNumber(entry), name: pokemonLabel(entry.id, entry.name) }
    : null
}
const previousLink = computed(() => neighborLink(previous.value))
const nextLink = computed(() => neighborLink(next.value))

const cry = useCry()

const caughtStore = useCaughtStore()
const recent = useRecentStore()
const captureOpen = ref(false)
const captureMounted = useMountOnOpen(captureOpen)
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

/**
 * Nome como a lista mostra: "Mega Charizard X" nas megas (não "Charizard Mega X") e o nome em
 * espanhol da espécie no idioma `es`. Vale para o título da aba, o h1, o hero e os diálogos.
 */
const displayName = computed(() => {
  const current = detail.value
  if (!current) return ''
  return isMega(current.id)
    ? megaLabel(current.name)
    : speciesDisplayName(species.value, current.name, locale.value)
})
const title = computed(() => displayName.value || t('app.name'))

watch(
  [displayName, locale],
  ([name]) => {
    document.title = name ? t('app.detailTitle', { name }) : t('app.dexTitle')
  },
  { immediate: true },
)

watch(detail, (value) => {
  // Se a tela foi aberta por um toque no card, o grito já tocou dentro do gesto;
  // aqui cobrimos a abertura por URL direta (o iOS pode recusar sem gesto, e tudo bem).
  if (value) cry.autoPlay(value.id, value.cryUrl)
  // Também cobre a abertura por URL direta, por isso o registro fica aqui e não no card.
  if (value) recent.visit(value.id)
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

/** As megas ficam na seção própria (e só nos jogos em que existem), fora dos chips de formas. */
const formVarieties = computed(() => withoutMegas(species.value?.varieties ?? []))
const showVarieties = computed(() => formVarieties.value.length > 1)

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

/** Desfaz o último "Zerar" (o contador pode estar em milhares e o toque é fácil de errar). */
const undoHuntReset = shallowRef<(() => void) | null>(null)

function resetHunt(): void {
  const target = shinyContext.value
  if (!target) return
  const previous = hunts.huntOf(target.game.slug, target.speciesId)
  hunts.reset(target.game.slug, target.speciesId)
  undoHuntReset.value = previous?.count
    ? () => hunts.update(target.game.slug, target.speciesId, previous)
    : null
}
const favorite = computed(() => (detail.value ? favorites.isFavorite(detail.value.id) : false))

const ability = useAbilityInfo()
const egg = useEggCompatibility()

// Deslizar para os lados troca de Pokémon (anterior/próximo), como virar página.
useSwipe(useTemplateRef<HTMLElement>('swipeArea'), {
  onNext: () => next.value && goTo(next.value.id),
  onPrevious: () => previous.value && goTo(previous.value.id),
})
// No teclado, as setas fazem o mesmo.
useShortcut(['ArrowLeft', 'ArrowRight'], (event) => {
  const target = event.key === 'ArrowRight' ? next.value : previous.value
  if (target) goTo(target.id)
})

const notice = ref<string | null>(null)

/** Time do jogo da URL (um por jogo, salvo no aparelho): o botão do cabeçalho põe e tira a forma aberta. */
const team = useTeam(() => context.value?.game)
const inTeam = computed(() => !!detail.value && team.has(detail.value.id))

function toggleTeam(): void {
  const current = detail.value
  const game = context.value?.game
  if (!current || !game) return
  const result = team.toggle(current.id)
  const name = displayName.value
  notice.value =
    result === 'full'
      ? t('team.full')
      : t(result === 'added' ? 'team.addedFromDetail' : 'team.removedFromDetail', {
          name,
          game: game.title,
        })
}

function share(): void {
  if (!detail.value) return
  shareLink(title.value, window.location.href).then((result) => {
    if (result === 'copied') notice.value = t('common.linkCopied')
    else if (result === 'failed') notice.value = t('common.shareFailed')
  })
}

const shareImage = useShareImage()
const shareImageMounted = useMountOnOpen(shareImage.open)

function openShareImage(): void {
  const current = detail.value
  if (!current) return
  shareImage.generate(
    async () => {
      const { pokemonImage } = await import('@/utils/shareImage')
      return pokemonImage(current, {
        title: 'PokeInfo',
        subtitle: context.value?.game.title,
        type: (type) => t(`type.${type}`),
        stat: (name) => t(`statShort.${name}`),
        footer: window.location.host,
      })
    },
    `pokeinfo-${current.name}.png`,
    title.value,
  )
}

async function sendShareImage(): Promise<void> {
  const result = await shareImage.share()
  if (result === 'downloaded') notice.value = t('shareImage.downloaded')
  else if (result === 'failed') notice.value = t('common.shareFailed')
  else if (result === 'shared') shareImage.open.value = false
}
</script>

<template>
  <DetailLayout :title="title" :ready="status !== 'loading'" @back="goBack">
    <template #actions>
      <v-menu v-if="detail" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" :icon="mdiShareVariant" :aria-label="t('common.share')" />
        </template>
        <v-list density="compact">
          <v-list-item
            :prepend-icon="mdiLinkVariant"
            :title="t('shareImage.link')"
            @click="share"
          />
          <v-list-item
            :prepend-icon="mdiImageOutline"
            :title="t('shareImage.button')"
            aria-haspopup="dialog"
            @click="openShareImage"
          />
        </v-list>
      </v-menu>
      <v-btn
        v-if="detail && context"
        :icon="mdiSwordCross"
        :variant="inTeam ? 'flat' : 'text'"
        :color="inTeam ? 'primary' : undefined"
        :aria-pressed="inTeam"
        :aria-label="
          t(inTeam ? 'team.removeFromDetail' : 'team.addFromDetail', { game: context.game.title })
        "
        @click="toggleTeam"
      />
      <v-btn
        v-if="detail"
        :icon="mdiCompareHorizontal"
        :aria-label="t('compare.withThis')"
        :to="{ name: 'compare', query: { ids: String(detail.id), ...gameContextQuery(context) } }"
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
        <NeighborNav class="mb-3" :previous="previousLink" :next="nextLink" @select="goTo" />

        <v-row>
          <v-col cols="12" md="5">
            <PokemonHero
              :pokemon="detail"
              :name="displayName"
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
            <!-- As formas (regional, Gigantamax…) são navegação: ficam junto do hero, não no fim da página. -->
            <VarietyChips
              v-if="showVarieties && species"
              class="mt-4"
              :varieties="formVarieties"
              :species-name="species.name"
              :current-id="detail.id"
              @select="goTo"
            />
            <TypeDefenses
              class="mt-4"
              :pokemon-id="detail.id"
              :types="detail.types"
              :abilities="detail.abilities"
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
            <StatsList :stats="detail.stats" :pokemon-id="detail.id" />
          </v-col>

          <v-col cols="12" md="6">
            <TrainingCard
              :pokemon="detail"
              :species="species"
              :generation="context?.game.generation"
              class="fill-height"
              @open-capture="captureOpen = true"
            />
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

          <v-col v-if="megaLine" cols="12">
            <MegaEvolutionCard
              :line="megaLine"
              :summaries="megaSummaries"
              :current-id="detail.id"
              :species-id="detail.speciesId"
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
              @reset="resetHunt"
            />
          </v-col>

          <v-col cols="12">
            <MovesCard
              :moves="detail.moves"
              :types="detail.types"
              :version-group="context?.game.slug ?? null"
            />
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
        </v-row>

        <!-- A página é longa (golpes, locais): os vizinhos de novo no fim, para seguir sem voltar ao topo. -->
        <NeighborNav
          v-if="previousLink || nextLink"
          class="mt-4"
          :previous="previousLink"
          :next="nextLink"
          @select="goTo"
        />

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
        <ShareImageDialog
          v-if="shareImageMounted"
          v-model="shareImage.open.value"
          :status="shareImage.status.value"
          :url="shareImage.url.value"
          :alt="t('shareImage.pokemonAlt', { name: displayName })"
          @share="sendShareImage"
        />
        <CaptureSheet
          v-if="captureMounted && species"
          v-model="captureOpen"
          :name="displayName"
          :capture-rate="species.captureRate"
          :types="detail.types"
          :generation="context?.game.generation ?? LATEST_GENERATION"
          :caught="caught ?? false"
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
    <BackToTop />
    <AppNotice :text="notice" :timeout="2500" @close="notice = null" />
    <AppNotice
      :text="undoHuntReset ? t('shiny.resetDone') : null"
      :action-label="t('common.undo')"
      @action="undoHuntReset?.()"
      @close="undoHuntReset = null"
    />
  </DetailLayout>
</template>
