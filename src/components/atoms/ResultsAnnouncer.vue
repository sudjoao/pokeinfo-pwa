<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  /** Quantos Pokémon passam pelos filtros (a lista inteira, não só o lote já carregado). */
  count: number
  /** Falso enquanto a fonte carrega: evita anunciar um "nenhum encontrado" passageiro. */
  ready: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <!--
    Região viva invisível: quem usa leitor de tela ouve quantos resultados ficaram depois de
    buscar ou filtrar, sem precisar sair do campo/chip. Fica sempre no DOM (só o texto muda),
    senão o leitor não percebe a atualização.
  -->
  <p class="d-sr-only" aria-live="polite" aria-atomic="true">
    {{ ready ? t('home.resultsCount', count) : '' }}
  </p>
</template>
