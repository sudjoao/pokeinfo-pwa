<script setup lang="ts">
import { computed } from 'vue'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_STYLES } from '@/utils/pokemon'

const props = defineProps<{ type: PokemonType }>()

const style = computed(() => TYPE_STYLES[props.type])
</script>

<template>
  <v-chip :color="style.color" variant="flat" class="type-chip">
    {{ style.label }}
  </v-chip>
</template>

<style scoped>
.type-chip {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
}
</style>
