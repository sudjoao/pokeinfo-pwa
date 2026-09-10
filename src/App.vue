<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <v-app>
    <!-- A Home fica em KeepAlive para preservar o scroll infinito e a busca ao voltar do detalhe. -->
    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['HomeView']">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </v-app>
</template>
