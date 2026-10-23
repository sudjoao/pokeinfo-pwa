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
} from '@mdi/js'
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

/** Abre uma sheet e fecha o menu (as duas sobrepostas confundem leitor de tela e foco). */
function then(action: () => void): void {
  open.value = false
  action()
}
</script>

<template>
  <v-navigation-drawer v-model="open" temporary :aria-label="t('menu.title')">
    <!-- role="navigation": o v-list põe role="list", que não aceita os links como filhos. -->
    <v-list nav density="comfortable" role="navigation" :aria-label="t('menu.title')">
      <v-list-subheader>PokeInfo</v-list-subheader>
      <v-list-item
        :prepend-icon="mdiBookOpenVariant"
        :title="t('menu.pokedex')"
        :to="{ name: 'home' }"
        exact
        rounded="lg"
        @click="open = false"
      />
      <v-list-item
        :prepend-icon="mdiHeartOutline"
        :title="t('favorites.title')"
        :to="{ name: 'home', query: { fav: '1' } }"
        rounded="lg"
        @click="open = false"
      />
      <v-list-item
        :prepend-icon="mdiSwordCross"
        :title="t('menu.team')"
        :to="{ name: 'team' }"
        rounded="lg"
        @click="open = false"
      />
      <v-list-item
        :prepend-icon="mdiShieldHalfFull"
        :title="t('menu.types')"
        :to="{ name: 'types' }"
        rounded="lg"
        @click="open = false"
      />
      <v-list-item
        :prepend-icon="mdiCompareHorizontal"
        :title="t('menu.compare')"
        :to="{ name: 'compare' }"
        rounded="lg"
        @click="open = false"
      />
      <v-list-item
        :prepend-icon="mdiHelpCircleOutline"
        :title="t('menu.quiz')"
        :to="{ name: 'quiz' }"
        rounded="lg"
        @click="open = false"
      />
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
        <v-btn value="system" size="small">{{ t('menu.themeSystem') }}</v-btn>
        <v-btn value="light" size="small">{{ t('menu.themeLight') }}</v-btn>
        <v-btn value="dark" size="small">{{ t('menu.themeDark') }}</v-btn>
      </v-btn-toggle>
    </div>
    <v-list nav density="comfortable">
      <v-list-item
        :prepend-icon="mdiDiceMultipleOutline"
        :title="t('menu.random')"
        rounded="lg"
        @click="then(() => emit('random'))"
      />
      <v-list-item
        :prepend-icon="mdiTranslate"
        :title="t('menu.language')"
        rounded="lg"
        @click="then(() => emit('openLanguage'))"
      />
      <v-list-item
        :prepend-icon="mdiDatabaseArrowDownOutline"
        :title="t('menu.backup')"
        rounded="lg"
        @click="then(() => emit('openBackup'))"
      />
      <v-list-item
        :prepend-icon="mdiInformationOutline"
        :title="t('menu.about')"
        rounded="lg"
        @click="then(() => emit('openAbout'))"
      />
    </v-list>
  </v-navigation-drawer>
</template>
