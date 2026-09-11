<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <v-app>
    <!-- A Home fica em KeepAlive para preservar o scroll infinito e a busca ao voltar do detalhe. -->
    <!--
      Transition fica fora do KeepAlive (ordem exigida pelo Vue Router). Sem mode="out-in": nessa
      versão do vue-router, out-in trava a navegação para as rotas com import() (detalhe e time) —
      o RouterView fica renderizando só o comentário do v-if, sem erro no console. Por isso o
      crossfade é simultâneo: main.css tira a página que está saindo do fluxo (position: absolute)
      pra a que está entrando não pular a página inteira durante os ~180ms de sobreposição.
      Sem :key no component: trocar de Pokémon dentro do detalhe (evolução, anterior/próximo)
      reaproveita a mesma instância de PokemonDetailView de propósito — ver usePokemonDetail.ts —
      então não repete a transição de página aqui; quem dá o feedback visual da troca é a entrada
      do sprite em PokemonArtwork.
    -->
    <RouterView v-slot="{ Component }">
      <Transition name="page">
        <KeepAlive :include="['HomeView']">
          <component :is="Component" />
        </KeepAlive>
      </Transition>
    </RouterView>
  </v-app>
</template>
