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
import { parseFeatureString } from '@/main/utils/ResultTable.js';
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

<style scoped>
/* 弹窗的基本样式 */
.popup-vue {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(5px) saturate(180%);
  -webkit-backdrop-filter: blur(5px) saturate(180%);
  padding: 6px 10px;
  max-width: 300px;
  border-radius: 12px;
  box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 14px rgba(0, 0, 0, 0.2), 0 0 8px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 90000;
  text-align: center;
  color: #222;
  font-weight: 500;
  opacity: 1;
  visibility: visible;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.popup-vue p {
  font-size: 14px;
  font-weight: bold;
  margin-top: 1px;
  margin-bottom: 2px;
  line-height: 1.2;
  display: block;
}

.popup-vue span {
  font-size: 13px;
  font-weight: normal;
  margin-top: 1px;
  margin-bottom: 1px;
  line-height: 1.1;
  display: block;
}

/* 弹窗入场动画 */
.popup-animated {
  animation: popup-bounce-in 0.4s ease-out forwards;
}

@keyframes popup-bounce-in {
  0% {
    transform: translateX(-50%) translateY(0px) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) translateY(10px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(20px) scale(1);
  }
}

</style>
