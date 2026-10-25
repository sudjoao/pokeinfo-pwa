<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { mdiAccountCircleOutline } from '@mdi/js'
import { useAppMenu } from '@/composables/useAppMenu'
import { useAccountStore } from '@/stores/account'

/**
 * Conta no cabeçalho: foto (ou inicial) de quem entrou, ou o ícone de entrar. Como o SoundToggle, é
 * um controle global do app, por isso lê o store direto em vez de receber props de cada tela. Um
 * ponto avisa quando a sincronização está parada (sem conexão ou com erro). Some quando o build não
 * tem Supabase configurado.
 */
const account = useAccountStore()
const { user, status } = storeToRefs(account)
const { accountOpen } = useAppMenu()
const { t } = useI18n()

const stalled = computed(
  () => user.value !== null && (status.value === 'offline' || status.value === 'error'),
)

const label = computed(() => {
  if (!user.value) return t('account.menuSignIn')
  const name = user.value.name || user.value.email
  const who = t('account.headerLabel', { name })
  return stalled.value ? `${who}. ${t(`account.status.${status.value}`)}` : who
})

const initial = computed(() => (user.value?.name || user.value?.email || '?').charAt(0))
</script>

<template>
  <v-btn
    v-if="account.enabled"
    icon
    :aria-label="label"
    aria-haspopup="dialog"
    class="account-button"
    @click="accountOpen = true"
  >
    <!-- Foto do Google: sem Referer (o servidor de fotos às vezes recusa com ele). -->
    <img
      v-if="user?.avatar"
      :src="user.avatar"
      alt=""
      width="28"
      height="28"
      referrerpolicy="no-referrer"
      class="account-button__photo"
    />
    <span v-else-if="user" class="account-button__initial text-label-large" aria-hidden="true">
      {{ initial }}
    </span>
    <v-icon v-else :icon="mdiAccountCircleOutline" />
    <span v-if="stalled" class="account-button__dot" aria-hidden="true" />
  </v-btn>
</template>

<style scoped>
.account-button__photo,
.account-button__initial {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  /* Contorno claro: a foto não some sobre o vermelho do cabeçalho. */
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.85);
}

.account-button__photo {
  object-fit: cover;
}

.account-button__initial {
  display: grid;
  place-items: center;
  text-transform: uppercase;
  background: rgb(255 255 255 / 0.2);
}

.account-button__dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}
</style>
