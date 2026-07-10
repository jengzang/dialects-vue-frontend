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

        <span v-for="option in modeOptions" :key="option.id">
          {{ getModeLabel(option.id) }}: {{ getDisplayContent(option.id) }}
        </span>

        <button
          v-for="option in modeOptions"
          :key="`${option.id}-${option.bool}`"
          class="mini-button"
          :style="shouldUseBaseDescription(option.id) ? { fontSize: '17px' } : {}"
          @click="handleAction(option.id, option.bool)"
        >
          🔍{{ getModeLabel(option.id) }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseFeatureString } from '@/main/utils/query/ResultTable.js';
import { resultCache } from '@/main/store/store.js';
import { getResultModeId } from '@/i18n/utils/resultI18n.js';

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

const modeOptions = computed(() => {
  const modeId = getResultModeId(resultCache.mode || '');

  if (modeId === 'phonological') {
    return [
      { id: 'phonological', bool: false },
      { id: 'character', bool: true }
    ];
  }

  if (modeId === 'character') {
    return [
      { id: 'character', bool: false },
      { id: 'phonological', bool: true }
    ];
  }

  return [
    { id: 'unknown', bool: false },
    { id: 'unknown', bool: true }
  ];
});

const getModeLabel = (modeId) => t(`result.valuePopup.modes.${modeId}`);

const getBaseModeText = (modeId, value) => {
  if (modeId === 'character') {
    return t('result.valuePopup.descriptions.characterInput', { value });
  }

  if (modeId === 'phonological') {
    return t('result.valuePopup.descriptions.phonologicalInput', { value });
  }

  return t('result.valuePopup.descriptions.unknown');
};

const shouldUseBaseDescription = (modeId) => {
  const parseResult = parseFeatureString(props.data?.feature || '', resultCache.tableName);
  const hasMatchedFields = parseResult?.matched_fields !== null;

  return (modeId === 'character' && !hasMatchedFields) ||
    (modeId === 'phonological' && hasMatchedFields);
};

const getDisplayContent = (modeId) => {
  if (shouldUseBaseDescription(modeId)) {
    return getBaseModeText(modeId, props.data?.value || '');
  }

  if (modeId === 'phonological') {
    return t('result.valuePopup.descriptions.allSyllables');
  }

  if (modeId === 'character') {
    return t('result.valuePopup.descriptions.groupByFeature');
  }

  return t('result.valuePopup.descriptions.unknown');
};

const handleAction = (modeId, bool) => {
  emit('confirm', { ...props.data, modeId, bool });
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

$glass-background: rgba(255, 255, 255, 0.3);
$glass-background-light: rgba(255, 255, 255, 0.05);
$glass-highlight: rgba(255, 255, 255, 0.2);

$transition-duration: 0.3s;
$animation-duration: 0.4s;

@mixin glass-blur($blur, $saturation) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

/* 弹窗基本样式 */
.popup-vue {
  position: fixed;
  left: 50%;
  z-index: 90000;
  max-width: 300px;
  padding: 6px 10px;
  visibility: visible;
  opacity: 1;
  background: linear-gradient(
    135deg,
    $glass-background,
    $glass-background-light
  );
  border: 1px solid $glass-background;
  border-radius: $popup-radius;
  box-shadow:
    inset 0 0 1px $glass-background,
    0 4px 14px rgba(0, 0, 0, 0.2),
    0 0 8px $glass-highlight;
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

  span {
    display: block;
    margin: 1px 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.1;
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
