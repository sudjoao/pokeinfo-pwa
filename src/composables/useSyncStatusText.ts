import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SyncStatus } from '@/stores/account'

/** "Sincronizado às 14:32", "Sincronizando…", "Sem conexão…": para o menu e a sheet da conta. */
export function useSyncStatusText(
  status: Ref<SyncStatus>,
  lastSyncedAt: Ref<string | null>,
  online: Ref<boolean>,
) {
  const { t, locale } = useI18n()
  return computed(() => {
    if (!online.value) return t('account.status.offline')
    if (status.value === 'synced' && lastSyncedAt.value) {
      const date = new Date(lastSyncedAt.value)
      const today = date.toDateString() === new Date().toDateString()
      const time = today
        ? date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleString(locale.value, { dateStyle: 'short', timeStyle: 'short' })
      return t('account.status.synced', { time })
    }
    return t(`account.status.${status.value}`)
  })
}
