<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PokemonAbility } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'

defineProps<{ abilities: PokemonAbility[] }>()

const { t } = useI18n()
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.abilities') }}</v-card-title>
    <v-card-text class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="ability in abilities"
        :key="ability.name"
        size="default"
        :variant="ability.isHidden ? 'outlined' : 'tonal'"
        color="secondary"
      >
        {{ formatPokemonName(ability.name) }}
        <span v-if="ability.isHidden" class="text-label-small ms-1 opacity-70">
          {{ t('detail.hiddenAbility') }}
        </span>
      </v-chip>
      <span v-if="!abilities.length" class="text-body-medium opacity-60">
        {{ t('detail.noAbilities') }}
      </span>
    </v-card-text>
  </v-card>
</template>
