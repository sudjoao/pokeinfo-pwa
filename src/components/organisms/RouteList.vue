<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { usePokedexStore } from '@/stores/pokedex'
import {
  isStaticRoute,
  routeSectionsForGame,
  toRoutePokemon,
  type AnyGameRoute,
} from '@/utils/routes'
import { mapLimit } from '@/utils/async'

/** Áreas de um local baixadas ao mesmo tempo. */
const AREA_CONCURRENCY = 4
import { formatAreaName } from '@/utils/encounters'
import { speciesIdOf } from '@/utils/forms'
import RoutePokemonRow from '@/components/molecules/RoutePokemonRow.vue'
import SearchField from '@/components/molecules/SearchField.vue'

const props = defineProps<{
  game: Game
  /** Espécies capturadas no jogo (a marcação é por espécie, as formas regionais contam junto). */
  caughtIds?: ReadonlySet<number>
}>()
const emit = defineEmits<{ select: [id: number]; toggleCaught: [speciesId: number] }>()

/** Esconde nas rotas abertas os Pokémon já capturados. */
const onlyMissing = ref(false)

function isCaught(pokemon: RoutePokemon): boolean {
  return props.caughtIds?.has(speciesIdOf(pokemon.id)) ?? false
}

function visible(list: readonly RoutePokemon[]): RoutePokemon[] {
  return onlyMissing.value ? list.filter((pokemon) => !isCaught(pokemon)) : [...list]
}

function caughtCount(list: readonly RoutePokemon[]): number {
  return new Set(list.filter(isCaught).map((pokemon) => speciesIdOf(pokemon.id))).size
}

function speciesCount(list: readonly RoutePokemon[]): number {
  return new Set(list.map((pokemon) => speciesIdOf(pokemon.id))).size
}

const { t } = useI18n()
const pokedexStore = usePokedexStore()

/** Na ordem da história, por região/DLC; o título só aparece quando há mais de uma seção. */
const sections = computed(() => routeSectionsForGame(props.game))
const routes = computed(() => sections.value.flatMap((section) => section.routes))

/** Sem diferenciar maiúsculas nem acentos ("cave" acha "Cave of Origin"). */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const search = ref('')
/** Seções com os locais que batem com a busca; as que ficam vazias somem. */
const visibleSections = computed(() => {
  const term = normalize(search.value?.trim() ?? '')
  if (!term) return sections.value
  return sections.value
    .map((section) => ({
      ...section,
      routes: section.routes.filter((route) =>
        normalize(formatAreaName(route.location)).includes(term),
      ),
    }))
    .filter((section) => section.routes.length)
})

const openPanel = ref<string | undefined>(undefined)
const results = ref<Record<string, RoutePokemon[]>>({})
const loading = ref<Record<string, boolean>>({})
const failed = ref<Record<string, boolean>>({})

/** Troca de jogo: os resultados são específicos do jogo, então não podem sobreviver à troca. */
watch(
  () => props.game.slug,
  () => {
    openPanel.value = undefined
    search.value = ''
    results.value = {}
    loading.value = {}
    failed.value = {}
  },
)

async function loadRoute(route: AnyGameRoute): Promise<void> {
  if (results.value[route.location] || loading.value[route.location]) return

  if (isStaticRoute(route)) {
    // Já vem pronto (ex.: BDSP via Bulbapedia): só falta o nome, resolvido pelo índice em memória.
    results.value = {
      ...results.value,
      [route.location]: route.pokemon.map((pokemon) => ({
        ...pokemon,
        name: pokedexStore.entryOf(pokemon.id)?.name ?? String(pokemon.id),
      })),
    }
    return
  }

  loading.value = { ...loading.value, [route.location]: true }
  failed.value = { ...failed.value, [route.location]: false }
  try {
    // Covis de Dynamax chegam a 22 áreas: em lotes, para não abrir dezenas de requisições juntas.
    const dtos = await mapLimit(route.areas, AREA_CONCURRENCY, (area) =>
      pokedexStore.ensureAreaEncounters(area),
    )
    results.value = { ...results.value, [route.location]: toRoutePokemon(dtos, props.game) }
  } catch {
    failed.value = { ...failed.value, [route.location]: true }
  } finally {
    loading.value = { ...loading.value, [route.location]: false }
  }
}

watch(openPanel, (location) => {
  const route = routes.value.find((r) => r.location === location)
  if (route) loadRoute(route)
})
</script>

<template>
  <div>
    <p v-if="!routes.length" class="text-body-medium opacity-70 mb-0">
      {{ t('routes.empty', { game: game.title }) }}
    </p>

    <template v-else>
      <SearchField
        v-model="search"
        :placeholder="t('routes.searchPlaceholder')"
        :label="t('routes.searchLabel')"
        density="compact"
        class="mb-2"
      />
      <v-switch
        v-if="caughtIds"
        v-model="onlyMissing"
        :label="t('routes.onlyMissing')"
        color="primary"
        density="compact"
        hide-details
        class="mb-2"
      />
      <p v-if="!visibleSections.length" class="text-body-medium opacity-70 mb-0">
        {{ t('routes.noMatch', { query: search.trim() }) }}
      </p>
      <section v-for="section in visibleSections" :key="section.key" class="route-section">
        <h2 v-if="sections.length > 1" class="text-title-small mb-2">
          {{ t(`routes.section.${section.key}`) }}
        </h2>
        <!-- Um grupo por seção, todos no mesmo openPanel: abrir um painel fecha o dos outros. -->
        <v-expansion-panels v-model="openPanel" variant="accordion">
          <v-expansion-panel
            v-for="route in section.routes"
            :key="route.location"
            :value="route.location"
          >
            <v-expansion-panel-title>
              <span class="text-body-medium font-weight-medium">{{
                formatAreaName(route.location)
              }}</span>
              <span v-if="results[route.location]" class="text-label-small opacity-70 ms-2">
                {{ t('routes.pokemonCount', results[route.location]!.length) }}
                <template v-if="caughtIds">
                  ·
                  {{
                    t('routes.caughtCount', {
                      caught: caughtCount(results[route.location]!),
                      total: speciesCount(results[route.location]!),
                    })
                  }}
                </template>
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-skeleton-loader
                aria-hidden="true"
                v-if="loading[route.location]"
                type="list-item-two-line@3"
              />

              <div v-else-if="failed[route.location]" class="d-flex flex-column align-start ga-2">
                <span>{{ t('routes.loadError') }}</span>
                <v-btn color="primary" variant="tonal" size="small" @click="loadRoute(route)">
                  {{ t('common.retry') }}
                </v-btn>
              </div>

              <p
                v-else-if="results[route.location] && !results[route.location]!.length"
                class="text-body-medium opacity-70 mb-0"
              >
                {{ t('routes.emptyRoute', { game: game.title }) }}
              </p>

              <template v-else-if="results[route.location]">
                <p
                  v-if="!visible(results[route.location]!).length"
                  class="text-body-medium opacity-70 mb-0"
                >
                  {{ t('routes.allCaught') }}
                </p>
                <ul v-else class="route-pokemon-list">
                  <RoutePokemonRow
                    v-for="pokemon in visible(results[route.location]!)"
                    :key="pokemon.id"
                    :pokemon="pokemon"
                    :game="game"
                    :caught="caughtIds ? isCaught(pokemon) : undefined"
                    @select="emit('select', $event)"
                    @toggle-caught="emit('toggleCaught', speciesIdOf(pokemon.id))"
                  />
                </ul>
              </template>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>
    </template>
  </div>
</template>

<style scoped>
.route-section + .route-section {
  margin-top: 16px;
}

.route-pokemon-list {
  padding: 0;
  margin: 0;
}
</style>
