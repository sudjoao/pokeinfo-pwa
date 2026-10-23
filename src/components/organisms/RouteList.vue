<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { usePokedexStore } from '@/stores/pokedex'
import { isStaticRoute, routesForGame, toRoutePokemon, type AnyGameRoute } from '@/utils/routes'
import { formatAreaName } from '@/utils/encounters'
import { speciesIdOf } from '@/utils/forms'
import RoutePokemonRow from '@/components/molecules/RoutePokemonRow.vue'

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

const routes = computed(() => routesForGame(props.game))

const openPanel = ref<string | undefined>(undefined)
const results = ref<Record<string, RoutePokemon[]>>({})
const loading = ref<Record<string, boolean>>({})
const failed = ref<Record<string, boolean>>({})

/** Troca de jogo: os resultados são específicos do jogo, então não podem sobreviver à troca. */
watch(
  () => props.game.slug,
  () => {
    openPanel.value = undefined
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
    const dtos = await Promise.all(
      route.areas.map((area) => pokedexStore.ensureAreaEncounters(area)),
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
      <v-switch
        v-if="caughtIds"
        v-model="onlyMissing"
        :label="t('routes.onlyMissing')"
        color="primary"
        density="compact"
        hide-details
        class="mb-2"
      />
      <v-expansion-panels v-model="openPanel" variant="accordion">
        <v-expansion-panel v-for="route in routes" :key="route.location" :value="route.location">
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
            <v-skeleton-loader v-if="loading[route.location]" type="list-item-two-line@3" />

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
    </template>
  </div>
</template>

<style scoped>
.route-pokemon-list {
  padding: 0;
  margin: 0;
}
</style>
