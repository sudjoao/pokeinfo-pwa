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
} from '@mdi/js'
import type { RouteLocationRaw } from 'vue-router'
import type { ThemePreference } from '@/composables/useThemePreference'

defineProps<{ theme: ThemePreference }>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  setTheme: [theme: ThemePreference]
  openLanguage: []
  openBackup: []
  openAbout: []
  random: []
}>()

const { t } = useI18n()

interface NavItem {
  icon: string
  /** Chave i18n do título. */
  title: string
  to: RouteLocationRaw
  exact?: boolean
}

/** Navegação em três grupos: coleção, ferramentas de consulta e jogos. */
const NAV_GROUPS: readonly { title: string; items: readonly NavItem[] }[] = [
  {
    title: 'menu.groupMain',
    items: [
      { icon: mdiBookOpenVariant, title: 'menu.pokedex', to: { name: 'home' }, exact: true },
      {
        icon: mdiHeartOutline,
        title: 'favorites.title',
        to: { name: 'home', query: { fav: '1' } },
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
    items: [{ icon: mdiHelpCircleOutline, title: 'menu.quiz', to: { name: 'quiz' } }],
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
          :exact="item.exact"
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
