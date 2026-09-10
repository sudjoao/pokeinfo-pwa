<script setup lang="ts">
import type { PokemonAbility } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'

defineProps<{ abilities: PokemonAbility[] }>()
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">Habilidades</v-card-title>
    <v-card-text class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="ability in abilities"
        :key="ability.name"
        size="default"
        :variant="ability.isHidden ? 'outlined' : 'tonal'"
        color="secondary"
      >
        {{ formatPokemonName(ability.name) }}
        <span v-if="ability.isHidden" class="text-label-small ms-1 opacity-70">(oculta)</span>
      </v-chip>
      <span v-if="!abilities.length" class="text-body-medium opacity-60">Nenhuma habilidade.</span>
    </v-card-text>
  </v-card>
</template>
