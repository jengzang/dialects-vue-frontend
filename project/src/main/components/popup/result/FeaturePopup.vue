<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="popup-vue popup-animated"
      :style="{ position: 'fixed', top: `${position.top}px`, left: `${position.left}px`, zIndex: 999999 }"
      @click.stop
    >
      <div class="popup-content">
        <p>📍 {{ t('result.terms.location') }}: {{ data.location }}</p>
        <p>🧩 {{ t('result.terms.feature') }}: {{ checkedFeatures }}</p>
        <p>🔍 {{ t('result.featurePopup.queryLabel') }}: {{ t('result.featurePopup.queryHint', { feature: data.feature || '' }) }}</p>

        <template v-for="field in unmatchedFields" :key="field">
          <button
            class="mini-button"
            style="font-size: 16px; margin: 0 2px;"
            @click="handleFieldClick(field)"
          >
            {{ field }}
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseFeatureString } from '@/main/utils/ResultTable.js';
import { resultCache } from '@/main/store/store.js';



const props = defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) }
});

const emit = defineEmits(['close', 'confirm']);
const { t } = useI18n();

const checkedFeatures = computed(() => {
  const terms = (resultCache.features || []).filter(Boolean);
  return terms.length > 0 ? terms.join(' · ') : t('result.terms.none');
});

const unmatchedFields = computed(() => {
  return parseFeatureString(props.data?.feature || '', resultCache.tableName).unmatched_fields || [];
});

const handleFieldClick = (field) => {
  emit('confirm', { ...props.data, field });
  emit('close');
};

const handleGlobalClick = (e) => {
  if (props.visible && !e.target.closest('.popup-vue')) {
    emit('close');
  }
};

onMounted(() => document.addEventListener('click', handleGlobalClick));
onUnmounted(() => document.removeEventListener('click', handleGlobalClick));
</script>

<style scoped lang="scss">
$popup-text-color: #222;
$popup-radius: 12px;

$glass-color: rgba(255, 255, 255, 0.3);
$glass-color-light: rgba(255, 255, 255, 0.05);

$transition-duration: 0.3s;
$animation-duration: 0.4s;

@mixin glass-blur($blur, $saturation) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

/* 弹窗基本样式 */
.popup-vue {
  max-width: 300px;
  padding: 6px 10px;
  visibility: visible;
  opacity: 1;
  background: linear-gradient(
    135deg,
    $glass-color,
    $glass-color-light
  );
  border: 1px solid $glass-color;
  border-radius: $popup-radius;
  box-shadow:
    inset 0 0 1px $glass-color,
    0 4px 14px rgba(0, 0, 0, 0.2),
    0 0 8px rgba(255, 255, 255, 0.2);
  color: $popup-text-color;
  text-align: center;
  font-weight: 500;
  transform: translateX(-50%);

  @include glass-blur(5px, 180%);

  transition:
    transform $transition-duration ease,
    opacity $transition-duration ease;

  p {
    display: block;
    margin: 1px 0 2px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
  }
}

/* 弹窗入场动画 */
.popup-animated {
  animation: popup-bounce-in $animation-duration ease-out forwards;
}

@keyframes popup-bounce-in {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(0) scale(0.8);
  }

  60% {
    opacity: 1;
    transform: translateX(-50%) translateY(10px) scale(1.05);
  }

  100% {
    transform: translateX(-50%) translateY(20px) scale(1);
  }
}
</style>
