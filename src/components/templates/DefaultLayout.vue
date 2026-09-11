<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AUTHOR, AUTHOR_URL, POKEAPI_URL } from '@/data/credits'
import AppHeader from '@/components/organisms/AppHeader.vue'

defineProps<{ extensionHeight?: number }>()

const { t } = useI18n()
</script>

<template>
  <!--
    Raiz única (display: contents, não afeta o layout) para que o <Transition> de página em
    App.vue consiga animar: um componente com múltiplas raízes (Fragment) não é animável.
  -->
  <div class="default-layout-root">
    <AppHeader title="PokeInfo" :extension-height="extensionHeight">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
      <template v-if="$slots.header" #extension>
        <slot name="header" />
      </template>
    </AppHeader>

    <v-main class="default-layout">
      <v-container class="default-layout__content" max-width="1280">
        <slot />
        <footer class="default-layout__footer text-body-small text-center opacity-60 pt-6">
          <i18n-t keypath="about.madeBy" tag="span">
            <template #author>
              <a :href="AUTHOR_URL" target="_blank" rel="noopener">{{ AUTHOR }}</a>
            </template>
          </i18n-t>
          ·
          <a :href="POKEAPI_URL" target="_blank" rel="noopener">{{ t('about.data') }}</a>
        </footer>
      </v-container>
    </v-main>
  </div>
</template>

<style scoped>
.default-layout-root {
  display: contents;
}

.default-layout__footer a {
  color: inherit;
}

.default-layout__content {
  padding-bottom: calc(16px + var(--safe-bottom));
  padding-left: calc(16px + var(--safe-left));
  padding-right: calc(16px + var(--safe-right));
}
</style>
