<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  mdiBookOpenVariant,
  mdiHeartOutline,
  mdiDatabaseArrowDownOutline,
  mdiInformationOutline,
  mdiShieldHalfFull,
  mdiCompareHorizontal,
  mdiHelpCircleOutline,
  mdiDiceMultipleOutline,
  mdiSwordCross,
  mdiTranslate,
  mdiLightningBolt,
  mdiBagPersonalOutline,
  mdiCalculatorVariantOutline,
  mdiSpeedometer,
  mdiCalendarStar,
  mdiCloudDownloadOutline,
} from '@mdi/js'
import { useRoute, type RouteLocationNormalizedLoaded, type RouteLocationRaw } from 'vue-router'
import type { ThemePreference } from '@/composables/useThemePreference'

defineProps<{ theme: ThemePreference }>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  setTheme: [theme: ThemePreference]
  openLanguage: []
  openBackup: []
  openOffline: []
  openAbout: []
  random: []
}>()

const { t } = useI18n()
const route = useRoute()

interface NavItem {
  icon: string
  /** Chave i18n do título. */
  title: string
  to: RouteLocationRaw
  /**
   * Quando o item fica marcado como atual. Sem isso vale o padrão do link, que não olha a query:
   * "Pokédex" (`/`) e "Favoritos" (`/?fav=1`) ficariam marcados juntos.
   */
  isActive?: (route: RouteLocationNormalizedLoaded) => boolean
}

const isFavorites = (route: RouteLocationNormalizedLoaded) =>
  route.name === 'home' && route.query.fav === '1'

/** Navegação em três grupos: coleção, ferramentas de consulta e jogos. */
const NAV_GROUPS: readonly { title: string; items: readonly NavItem[] }[] = [
  {
    title: 'menu.groupMain',
    items: [
      {
        icon: mdiBookOpenVariant,
        title: 'menu.pokedex',
        to: { name: 'home' },
        isActive: (route) => route.name === 'home' && !isFavorites(route),
      },
      {
        icon: mdiHeartOutline,
        title: 'favorites.title',
        to: { name: 'home', query: { fav: '1' } },
        isActive: isFavorites,
      },
      { icon: mdiSwordCross, title: 'menu.team', to: { name: 'team' } },
    ],
  },
  {
    title: 'menu.groupTools',
    items: [
      { icon: mdiLightningBolt, title: 'menu.moves', to: { name: 'moves' } },
      { icon: mdiBagPersonalOutline, title: 'menu.items', to: { name: 'items' } },
      { icon: mdiCalculatorVariantOutline, title: 'menu.stats', to: { name: 'stats' } },
      { icon: mdiSpeedometer, title: 'menu.speed', to: { name: 'speed' } },
      { icon: mdiShieldHalfFull, title: 'menu.types', to: { name: 'types' } },
      { icon: mdiCompareHorizontal, title: 'menu.compare', to: { name: 'compare' } },
    ],
  },
  {
    title: 'menu.groupGames',
    items: [
      { icon: mdiCalendarStar, title: 'menu.daily', to: { name: 'daily' } },
      { icon: mdiHelpCircleOutline, title: 'menu.quiz', to: { name: 'quiz' } },
    ],
  },
]

/** Abre uma sheet e fecha o menu (as duas sobrepostas confundem leitor de tela e foco). */
function then(action: () => void): void {
  open.value = false
  action()
}
</script>

<template>
  <!-- tag="div": o drawer seria um <nav> em volta do outro, com o mesmo rótulo. -->
  <v-navigation-drawer v-model="open" temporary tag="div">
    <!-- role="navigation": o v-list põe role="list", que não aceita os links como filhos. -->
    <v-list nav density="comfortable" role="navigation" :aria-label="t('menu.title')">
      <template v-for="group in NAV_GROUPS" :key="group.title">
        <v-list-subheader>{{ t(group.title) }}</v-list-subheader>
        <v-list-item
          v-for="item in group.items"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="t(item.title)"
          :to="item.to"
          :active="item.isActive?.(route)"
          :aria-current="item.isActive ? (item.isActive(route) ? 'page' : 'false') : undefined"
          rounded="lg"
          @click="open = false"
        />
      </template>
    </v-list>

    <v-divider class="my-2" />
    <h2 class="text-title-small px-4 pt-2 pb-1">{{ t('menu.preferences') }}</h2>
    <div class="px-4 py-2">
      <div id="menu-theme-label" class="text-label-large mb-2">{{ t('menu.theme') }}</div>
      <v-btn-toggle
        :model-value="theme"
        mandatory
        divided
        density="compact"
        variant="outlined"
        class="theme-toggle"
        aria-labelledby="menu-theme-label"
        @update:model-value="emit('setTheme', $event)"
      >
        <v-btn value="system" size="small" :aria-pressed="theme === 'system'">{{
          t('menu.themeSystem')
        }}</v-btn>
        <v-btn value="light" size="small" :aria-pressed="theme === 'light'">{{
          t('menu.themeLight')
        }}</v-btn>
        <v-btn value="dark" size="small" :aria-pressed="theme === 'dark'">{{
          t('menu.themeDark')
        }}</v-btn>
      </v-btn-toggle>
    </div>
    <!-- Itens de ação: botões num grupo (como listitem o leitor não diz que são clicáveis). -->
    <v-list nav density="comfortable" role="group">
      <v-list-item
        :prepend-icon="mdiDiceMultipleOutline"
        :title="t('menu.random')"
        role="button"
        rounded="lg"
        @click="then(() => emit('random'))"
      />
      <v-list-item
        :prepend-icon="mdiTranslate"
        :title="t('menu.language')"
        role="button"
        aria-haspopup="dialog"
        rounded="lg"
        @click="then(() => emit('openLanguage'))"
      />
      <v-list-item
        :prepend-icon="mdiDatabaseArrowDownOutline"
        :title="t('menu.backup')"
        role="button"
        aria-haspopup="dialog"
        rounded="lg"
        @click="then(() => emit('openBackup'))"
      />
      <v-list-item
        :prepend-icon="mdiCloudDownloadOutline"
        :title="t('menu.offline')"
        role="button"
        aria-haspopup="dialog"
        rounded="lg"
        @click="then(() => emit('openOffline'))"
      />
      <v-list-item
        :prepend-icon="mdiInformationOutline"
        :title="t('menu.about')"
        role="button"
        aria-haspopup="dialog"
        rounded="lg"
        @click="then(() => emit('openAbout'))"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
/* Os três botões dividem a largura do menu (com o padding padrão, "Escuro" saía da gaveta). */
.theme-toggle {
  display: flex;
  width: 100%;
}
.theme-toggle :deep(.v-btn) {
  flex: 1 1 0;
  min-width: 0;
  padding-inline: 4px;
}
</style>
