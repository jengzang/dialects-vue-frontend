<template>
  <aside class="qq-group-contact" role="note">
    <span class="qq-group-label">
      <PhChatCircleDots class="qq-group-icon" weight="fill" aria-hidden="true" />
      <span>{{ t('common.contact.qqQuestion') }}</span>
    </span>
    <span class="qq-group-actions">
      <button
        type="button"
        class="qq-group-number"
        :title="t('common.contact.qqCopy')"
        :aria-label="t('common.contact.qqCopy')"
        @click="copyGroupNumber"
      >
        {{ QQ_GROUP_NUMBER }}
        <PhCopy class="qq-group-copy-icon" weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="qq-group-number"
        @click="showQrCode = true"
      >
        <PhQrCode class="qq-group-scan-icon" weight="bold" aria-hidden="true" />
        {{ t('common.contact.qqScan') }}
      </button>
    </span>

    <AppModal
      :model-value="showQrCode"
      size="sm"
      :title="t('common.contact.qqModalTitle')"
      :close-label="t('common.button.close')"
      @update:modelValue="showQrCode = false"
    >
      <div class="qq-qr-modal">
        <img
          class="qq-qr-image"
          :src="QQ_GROUP_QR"
          :alt="t('common.contact.qqQRAlt')"
        >
      </div>
    </AppModal>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhChatCircleDots, PhCopy, PhQrCode } from '@phosphor-icons/vue'
import AppModal from '@/components/common/AppModal.vue'
import { showError, showSuccess } from '@/utils/ui/message.js'

const QQ_GROUP_NUMBER = '1041666605'
const QQ_GROUP_QR = '/brand/qq-group.webp'

const { t } = useI18n()
const showQrCode = ref(false)

async function copyGroupNumber() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(QQ_GROUP_NUMBER)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = QQ_GROUP_NUMBER
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showSuccess(t('common.contact.qqCopied'))
  } catch {
    showError(t('common.contact.qqCopyFailed'))
  }
}
</script>

<style scoped lang="scss">
.qq-group-contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  padding: 8px 16px;
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: 999px;
  background: rgba(var(--color-primary-rgb), 0.08);
  color: var(--text-secondary);
  font-size: var(--font-size-16);
  text-align: center;
}

.qq-group-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.qq-group-icon {
  flex: none;
  width: 18px;
  height: 18px;
  color: var(--color-primary);
}

.qq-group-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qq-group-number,
.qq-group-scan {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font: inherit;
  cursor: pointer;
}

.qq-group-number {
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.qq-group-scan {
  border: 1px solid rgba(var(--color-primary-rgb), 0.45);
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
}

.qq-group-copy-icon,
.qq-group-scan-icon {
  width: 13px;
  height: 13px;
}

.qq-qr-modal {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

.qq-qr-image {
  display: block;
  width: min(340px, 80dvw);
  max-height: 62dvh;
  object-fit: contain;
}

@media (max-aspect-ratio: 1 / 1) {
  .qq-group-contact {
    gap: 8px;
    padding: 7px 12px;
    font-size: var(--font-size-14);
  }
}
</style>
