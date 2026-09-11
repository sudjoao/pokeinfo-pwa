<script setup lang="ts">
import {
  mdiAccountOutline,
  mdiBookOpenPageVariantOutline,
  mdiDatabaseOutline,
  mdiGithub,
  mdiPokeball,
} from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { AUTHOR, AUTHOR_URL, BULBAPEDIA_URL, POKEAPI_URL, REPO_URL } from '@/data/credits'

/** Créditos do app: autor, repositório, fontes de dados e aviso de marca. */
const open = defineModel<boolean>({ default: false })

const { t } = useI18n()

const links = [
  {
    icon: mdiAccountOutline,
    titleKey: 'about.madeBy',
    params: { author: AUTHOR },
    subtitle: AUTHOR_URL,
    href: AUTHOR_URL,
  },
  { icon: mdiGithub, titleKey: 'about.repo', params: {}, subtitle: REPO_URL, href: REPO_URL },
  {
    icon: mdiDatabaseOutline,
    titleKey: 'about.data',
    params: {},
    subtitle: POKEAPI_URL,
    href: POKEAPI_URL,
  },
  {
    icon: mdiBookOpenPageVariantOutline,
    titleKey: 'about.exclusives',
    params: {},
    subtitle: 'bulbapedia.bulbagarden.net',
    href: BULBAPEDIA_URL,
  },
]
</script>

<template>
  <v-bottom-sheet v-model="open" inset>
    <v-card class="about-sheet" rounded="t-xl" :aria-label="t('about.title')">
      <v-card-title class="text-title-large pt-4 d-flex align-center ga-2">
        <v-icon :icon="mdiPokeball" color="primary" />
        {{ t('about.title') }}
      </v-card-title>
      <v-card-text class="text-body-medium pb-0">{{ t('about.description') }}</v-card-text>
      <v-list density="comfortable" nav>
        <v-list-item
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener"
          :prepend-icon="link.icon"
          :title="t(link.titleKey, link.params)"
          :subtitle="link.subtitle"
          rounded="lg"
        />
      </v-list>
      <v-card-text class="text-body-small opacity-70 pt-0">{{ t('about.disclaimer') }}</v-card-text>
      <v-card-actions class="about-sheet__actions">
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="open = false">{{ t('about.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.about-sheet {
  display: flex;
  flex-direction: column;
  max-height: 90dvh;
  overflow-y: auto;
}

.about-sheet__actions {
  padding-bottom: calc(8px + var(--safe-bottom));
}
</style>
