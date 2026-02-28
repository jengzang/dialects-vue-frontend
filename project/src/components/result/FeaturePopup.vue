<template>
  <Teleport to="body">
    <div
        v-if="visible"
        class="popup-vue popup-animated"
        :style="{ position: 'fixed', top: `${position.top}px`, left: `${position.left}px`, zIndex: 999999 }"
        @click.stop
    >
      <div class="popup-content">
        <p>📍 地點: {{ data.location }}</p>
        <p>🧩 特征: {{ checkedFeatures }}</p>
        <p>🔍 查詢: {{ data.feature }} + (單擊按鈕選擇)</p>

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
import { parseFeatureString } from '@/utils/ResultTable.js';
import { resultCache } from '@/utils/store.js'

const props = defineProps(['visible', 'data', 'position']);
const emit = defineEmits(['close', 'confirm']);

const checkedFeatures = computed(() => {
  const features = resultCache.features || [];
  return features.length > 0 ? features.join('·') : '（無）';
});

const unmatchedFields = computed(() => {
  return parseFeatureString(props.data.feature).unmatched_fields || [];
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

.popup-content {
  font-family: 'Arial', sans-serif;
  color: #333;
  text-align: center;
}

.mini-button {
  margin-top: 2px;
  padding: 1px 2px;
  font-size: 11px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.mini-button:hover {
  background-color: #005fcc;
  transform: scale(1.2);
}

.mini-button-delete {
  margin-top: 2px;
  padding: 1px 2px;
  font-size: 11px;
  background-color: #8B0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.mini-button-delete:hover {
  background-color: #A52A2A;
  transform: scale(1.2);
}
</style>