<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DefaultLayout from '@/components/templates/DefaultLayout.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import { useAccountStore } from '@/stores/account'

/**
 * Volta do login com o Google (`/auth/callback?code=...`): troca o código pela sessão e segue para
 * a tela de onde a pessoa saiu. O código sai da URL logo de cara (não fica no histórico).
 */
const { t } = useI18n()
const router = useRouter()
const account = useAccountStore()

const failed = ref(false)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  window.history.replaceState(window.history.state, '', window.location.pathname)
  try {
    const next = await account.completeSignIn(params)
    await router.replace(next)
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <DefaultLayout>
    <EmptyState
      v-if="failed"
      variant="error"
      :title="t('account.callbackError')"
      :message="t('account.callbackErrorHint')"
      :action-label="t('account.backHome')"
      @action="router.replace({ name: 'home' })"
    />
    <div v-else class="d-flex flex-column align-center ga-4 py-16" role="status">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-body-large mb-0">{{ t('account.callbackLoading') }}</p>
    </div>
  </DefaultLayout>
</template>
