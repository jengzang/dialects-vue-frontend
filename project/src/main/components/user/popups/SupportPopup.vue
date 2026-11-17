<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="t('home.supportModal.title')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="home-support-content">
      <p class="home-support-subtitle">{{ t('home.supportModal.subtitle') }}</p>
      <div class="donate-qr-grid">
        <div class="donate-qr-box">
          <img :src="weixinQR" :alt="t('home.supportModal.weixinAlt')" />
          <p class="donate-qr-label">{{ t('home.supportModal.weixinLabel') }}</p>
        </div>
        <div class="donate-qr-box">
          <img :src="alipayQR" :alt="t('home.supportModal.alipayAlt')" />
          <p class="donate-qr-label">{{ t('home.supportModal.alipayLabel') }}</p>
        </div>
      </div>
      <DonorSection />
    </div>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import DonorSection from '@/main/components/user/DonorSection.vue'
const weixinQR = '/brand/weixin.webp'
const alipayQR = '/brand/zfb.webp'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

function handleClose() {
  emit('close')
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-main: var(--text-primary);

$shadow-default: 0 4px 12px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.15);

$transition-duration: 0.3s;

.home-support-content {
  @include flex-col;
  gap: 24px;
}

.home-support-subtitle {
  margin: 0;
  color: $text-main;
  text-align: center;
}

.donate-qr-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.donate-qr-box {
  @include flex-col;
  align-items: center;

  img {
    width: 100%;
    max-width: 150px;
    height: auto;
    border-radius: var(--radius-md);
    box-shadow: $shadow-default;
    cursor: pointer;
    transition:
      box-shadow $transition-duration ease,
      transform $transition-duration ease;

    &:hover {
      box-shadow: $shadow-hover;
      transform: scale(1.05);
    }
  }

  .donate-qr-label {
    margin: 0.625rem 0 0;
    color: $text-main;
    text-align: center;
    font-size: var(--font-size-16);
    font-weight: 600;
  }
}

@media (orientation: portrait) {
  .donate-qr-grid {
    gap: 1rem;
  }

  .donate-qr-box {
    img {
      max-width: 120px;
    }
  }
}
</style>
