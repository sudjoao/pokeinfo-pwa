<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BackupSummary } from '@/composables/useBackup'
import type { FirstSyncChoice } from '@/stores/account'

/**
 * Primeira sincronização deste aparelho com uma conta que já tem dados (ex.: entrou no Mac e agora
 * no iPhone, que também tinha marcações). Sem fechar por fora: a sincronização espera a escolha.
 */
defineProps<{
  device: BackupSummary
  cloud: BackupSummary
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{ choose: [choice: FirstSyncChoice] }>()

const { t } = useI18n()

const choice = ref<FirstSyncChoice>('merge')

const OPTIONS: readonly FirstSyncChoice[] = ['merge', 'cloud', 'device']

function confirm(): void {
  emit('choose', choice.value)
  open.value = false
}
</script>

<template>
  <v-dialog v-model="open" max-width="480" persistent :aria-label="t('account.firstSyncTitle')">
    <v-card :title="t('account.firstSyncTitle')">
      <v-card-text class="d-flex flex-column ga-3">
        <p class="text-body-medium mb-0">{{ t('account.firstSyncText') }}</p>
        <dl class="first-sync__summary text-body-small">
          <dt class="text-label-large">{{ t('account.firstSyncDevice') }}</dt>
          <dd>{{ t('backup.summary', { ...device }) }}</dd>
          <dt class="text-label-large">{{ t('account.firstSyncCloud') }}</dt>
          <dd>{{ t('backup.summary', { ...cloud }) }}</dd>
        </dl>
        <v-radio-group v-model="choice" hide-details>
          <v-radio
            v-for="(option, index) in OPTIONS"
            :key="option"
            :value="option"
            :class="{ 'mt-2': index > 0 }"
          >
            <template #label>
              <div>
                <div>{{ t(`account.choice.${option}`) }}</div>
                <div class="text-body-small opacity-70">
                  {{ t(`account.choice.${option}Hint`) }}
                </div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="confirm">{{
          t('account.firstSyncConfirm')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.first-sync__summary {
  display: grid;
  gap: 2px 0;
  margin: 0;
}

.first-sync__summary dd {
  margin: 0 0 8px;
}
</style>
