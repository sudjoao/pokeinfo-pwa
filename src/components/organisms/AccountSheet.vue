<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  mdiCloudAlertOutline,
  mdiCloudCheckOutline,
  mdiCloudOffOutline,
  mdiCloudOutline,
  mdiCloudSyncOutline,
  mdiGoogle,
  mdiLogout,
  mdiSync,
} from '@mdi/js'
import type { AccountUser, SyncStatus } from '@/stores/account'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

const props = defineProps<{
  user: AccountUser | null
  status: SyncStatus
  /** Texto pronto do status (useSyncStatusText). */
  statusText: string
  online: boolean
  /** Ação em andamento (indo para o Google, saindo, excluindo). */
  busy: 'signIn' | 'signOut' | 'delete' | null
}>()

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const emit = defineEmits<{
  signIn: []
  syncNow: []
  signOut: []
  deleteAccount: []
}>()

const { t } = useI18n()

const confirmDelete = ref(false)

const STATUS_ICONS: Record<SyncStatus, string> = {
  idle: mdiCloudOutline,
  syncing: mdiCloudSyncOutline,
  synced: mdiCloudCheckOutline,
  offline: mdiCloudOffOutline,
  error: mdiCloudAlertOutline,
}

const statusIcon = computed(() => STATUS_ICONS[props.online ? props.status : 'offline'])

const initial = computed(() => (props.user?.name || props.user?.email || '?').charAt(0))

function onDelete(): void {
  confirmDelete.value = false
  emit('deleteAccount')
}
</script>

<template>
  <v-bottom-sheet v-model="open" inset :aria-label="t('account.title')">
    <v-card rounded="t-xl" :title="t('account.title')">
      <v-card-text v-if="!user" class="d-flex flex-column ga-3">
        <p class="text-body-medium mb-0">{{ t('account.intro') }}</p>
        <p class="text-body-small opacity-70 mb-0">{{ t('account.privacy') }}</p>
        <v-btn
          color="primary"
          size="large"
          class="align-self-start"
          :prepend-icon="mdiGoogle"
          :loading="busy === 'signIn'"
          :disabled="!online"
          @click="emit('signIn')"
        >
          {{ t('account.signIn') }}
        </v-btn>
        <p v-if="!online" class="text-body-small mb-0">{{ t('account.signInOffline') }}</p>
      </v-card-text>

      <v-card-text v-else class="d-flex flex-column ga-3">
        <div class="d-flex align-center ga-3">
          <v-avatar size="48" color="primary">
            <!-- Foto do Google: sem Referer (o servidor de fotos às vezes recusa com ele). -->
            <img
              v-if="user.avatar"
              :src="user.avatar"
              alt=""
              referrerpolicy="no-referrer"
              class="account-sheet__photo"
            />
            <span v-else class="text-title-medium text-uppercase">{{ initial }}</span>
          </v-avatar>
          <div class="account-sheet__who">
            <div v-if="user.name" class="text-title-medium">{{ user.name }}</div>
            <div class="text-body-medium opacity-70">{{ user.email }}</div>
          </div>
        </div>
        <div class="d-flex align-center ga-2" role="status">
          <v-icon :icon="statusIcon" size="small" />
          <span class="text-body-medium">{{ statusText }}</span>
        </div>
        <p class="text-body-small opacity-70 mb-0">{{ t('account.syncHint') }}</p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            variant="tonal"
            :prepend-icon="mdiSync"
            :loading="status === 'syncing'"
            :disabled="!online"
            @click="emit('syncNow')"
          >
            {{ t('account.syncNow') }}
          </v-btn>
          <v-btn
            variant="tonal"
            :prepend-icon="mdiLogout"
            :loading="busy === 'signOut'"
            @click="emit('signOut')"
          >
            {{ t('account.signOut') }}
          </v-btn>
        </div>
        <p class="text-body-small opacity-70 mb-0">{{ t('account.signOutHint') }}</p>
        <v-btn
          variant="text"
          color="error"
          class="align-self-start"
          :loading="busy === 'delete'"
          :disabled="!online"
          @click="confirmDelete = true"
        >
          {{ t('account.delete') }}
        </v-btn>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="confirmDelete" max-width="420" :aria-label="t('account.deleteTitle')">
      <v-card :title="t('account.deleteTitle')" :text="t('account.deleteText')">
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDelete = false">{{ t('backup.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" @click="onDelete">
            {{ t('account.deleteConfirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-bottom-sheet>
</template>

<style scoped>
.account-sheet__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-sheet__who {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
