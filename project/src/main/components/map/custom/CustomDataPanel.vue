<template>
  <Teleport to="body">
    <button v-if="shouldShowPanel" class="expand-button" :class="{ open: isPanelOpen }" @click="togglePanel">
      {{ isPanelOpen ? t('map.customDataPanel.buttons.collapse') : t('map.customDataPanel.buttons.expand') }}
    </button>

    <div v-if="shouldShowPanel" :class="['custom-data-panel', { open: isPanelOpen }]">
      <div v-if="isPanelOpen" class="panelContent">
        <h3 class="panel-title">{{ t('map.customDataPanel.title') }}</h3>

        <form @submit.prevent="handleSubmit" class="data-form">
          <div class="form-group">
            <label for="location-input">{{ t('map.customDataPanel.labels.location') }}<span class="required">*</span></label>
            <input
                id="location-input"
                v-model="formData.location"
                type="text"
                :placeholder="t('map.customDataPanel.placeholders.location')"
                autocomplete="off"
                @input="handleLocationInput"
                @blur="hideSuggestions"
            />
            <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-box">
              <div
                  v-for="item in suggestions"
                  :key="item"
                  class="suggestion-item"
                  @mousedown.prevent="selectSuggestion(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="region-input">
              <HelpIcon
                  :content="t('map.customDataPanel.helpText.region')"
                  size="sm"
                  placement="right"
                  icon="?"
                  icon-color="#007aff"
                  style="margin-right: 2px; vertical-align: bottom;"
              />
              {{ t('map.customDataPanel.labels.region') }}<span class="required">*</span>
            </label>
            <input
                id="region-input"
                v-model="formData.region"
                type="text"
                :placeholder="t('map.customDataPanel.placeholders.region')"
            />
          </div>

          <div class="form-group">
            <label for="coordinates-input">{{ t('map.customDataPanel.labels.coordinates') }}<span class="required">*</span></label>
            <input
                id="coordinates-input"
                v-model="formData.coordinates"
                type="text"
                :placeholder="t('map.customDataPanel.placeholders.coordinates')"
            />
          </div>

          <div class="form-group">
            <label for="feature-type-input">{{ t('map.customDataPanel.labels.featureType') }}<span class="required">*</span></label>
            <input
                id="feature-type-input"
                v-model="formData.featureType"
                type="text"
                :placeholder="t('map.customDataPanel.placeholders.featureType')"
                autocomplete="off"
                :readonly="formData.featureType.trim() !== ''"
            />
          </div>

          <div class="form-group">
            <label for="feature-field-input">{{ t('map.customDataPanel.labels.featureField') }}<span class="required">*</span></label>
            <input
                id="feature-field-input"
                v-model="formData.featureField"
                type="text"
                :placeholder="t('map.customDataPanel.placeholders.featureField')"
                :readonly="formData.featureField.trim() !== ''"
            />
          </div>

          <div class="form-group">
            <label for="value-input">
              <HelpIcon
                  :content="t('map.customDataPanel.helpText.value')"
                  size="sm"
                  placement="right"
                  icon="?"
                  icon-color="#007aff"
                  style="margin-right: 2px; vertical-align: bottom;"
              />
              {{ t('map.customDataPanel.labels.value') }}<span class="required">*</span></label>
            <input
                id="value-input"
                v-model="formData.value"
                type="text"
                :placeholder="t('map.customDataPanel.placeholders.value')"
            />
          </div>

          <div class="form-group">
            <label for="description-input">{{ t('map.customDataPanel.labels.description') }}</label>
            <textarea
                id="description-input"
                v-model="formData.description"
                :placeholder="t('map.customDataPanel.placeholders.description')"
                rows="3"
            />
          </div>

          <button type="submit" class="submit-btn">
            {{ t('map.customDataPanel.buttons.submit') }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { batchMatch, getRegions, submitCustomForm } from '@/api'
import { invalidateCustomDataPresence, markCustomDataExists } from '@/composables/custom/useCustomDataPresence.js'
import { showSuccess, showError, showWarning, showInfo } from '@/utils/message.js'
import { userStore, globalPayload, resultCache } from '@/main/store/store.js'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { formatCoord } from '@/utils/map/formatCoord.js'

const route = useRoute()
const { t } = useI18n()

const props = defineProps({
  mapClickCoordinates: {
    type: Object,
    default: null
  },
  selectedFeature: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit-success', 'panel-toggle'])

const isPanelOpen = ref(false)

const shouldShowPanel = computed(() => {
  const isMapTab = route.params.sub === 'view'
  if (!isMapTab) return false

  const sourceTab = globalPayload.value?._sourceTab || ''
  const hasQueryContext = sourceTab === 'tab1' || sourceTab === 'tab2' || sourceTab === 'tab4' || sourceTab === 'tab3'

  return hasQueryContext
})

const formData = reactive({
  location: '',
  region: '',
  coordinates: '',
  featureType: '',
  featureField: '',
  value: '',
  description: ''
})

const suggestions = ref([])
const showSuggestions = ref(false)

let debounceTimer = null

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
  emit('panel-toggle', isPanelOpen.value)
}

watch(() => props.mapClickCoordinates, (newVal) => {
  if (newVal && isPanelOpen.value) {
    formData.coordinates = formatCoord(newVal.lng, newVal.lat)
  }
})

watch(() => props.selectedFeature, (newFeature) => {
  if (!newFeature) return

  formData.featureField = newFeature

  if (resultCache.features && resultCache.features.length > 0) {
    formData.featureType = resultCache.features[0]
  } else {
    console.warn('⚠️ resultCache.features 为空，无法填入 featureType')
  }
}, { immediate: true })

watch(() => route.query.openPanel, (newVal) => {
  if (newVal === 'true' && !isPanelOpen.value) {
    isPanelOpen.value = true
    emit('panel-toggle', true)
  }
}, { immediate: true })

const handleLocationInput = () => {
  showSuggestions.value = false

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const query = formData.location.trim()
    if (!query) {
      suggestions.value = []
      showSuggestions.value = false
      return
    }

    try {
      const response = await batchMatch(query, false)

      if (response && response.length > 0) {
        const r = response[0]
        const items = r.items || []

        let values = Array.from(new Set(items))

        // 匹配成功时，不要过滤掉 query 本身；
        // 如果 query 在候选项中，就把它提到最前面
        if (r.success && values.includes(query)) {
          values = [
            query,
            ...values.filter(item => item !== query)
          ]
        }

        suggestions.value = values
        showSuggestions.value = suggestions.value.length > 0
      } else {
        suggestions.value = []
        showSuggestions.value = false
      }
    } catch (error) {
      console.error('地点匹配失败:', error)
      suggestions.value = []
      showSuggestions.value = false
    }
  }, 300)
}

const selectSuggestion = async (item) => {
  formData.location = item
  showSuggestions.value = false

  try {
    const response = await getRegions(item)
    if (response) {
      if (response['音典分區']) {
        formData.region = response['音典分區']
      } else {
        formData.region = t('map.customDataPanel.messages.regionNotFound')
      }
      if (response['經緯度']) {
        formData.coordinates = response['經緯度']
      }
    } else {
      formData.region = t('map.customDataPanel.messages.regionNotFound')
    }
  } catch (error) {
    console.error('获取分区失败:', error)
    formData.region = t('map.customDataPanel.messages.regionRequestFailed')
  }
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const validateForm = () => {
  if (!formData.location.trim()) {
    showWarning(t('map.customDataPanel.validation.locationRequired'))
    return false
  }
  if (!formData.region.trim()) {
    showWarning(t('map.customDataPanel.validation.regionRequired'))
    return false
  }
  if (!formData.coordinates.trim()) {
    showWarning(t('map.customDataPanel.validation.coordinatesRequired'))
    return false
  }
  if (!formData.featureType.trim()) {
    showWarning(t('map.customDataPanel.validation.featureTypeRequired'))
    return false
  }
  if (!formData.featureField.trim()) {
    showWarning(t('map.customDataPanel.validation.featureFieldRequired'))
    return false
  }
  if (!formData.value.trim()) {
    showWarning(t('map.customDataPanel.validation.valueRequired'))
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!userStore.isAuthenticated) {
    showWarning(t('map.customDataPanel.validation.loginRequired'))
    return
  }

  if (!validateForm()) {
    return
  }

  try {
    const payload = {
      location: formData.location.trim(),
      region: formData.region.trim(),
      coordinates: formData.coordinates.trim(),
      phonology: formData.featureType.trim(),
      feature: formData.featureField.trim(),
      value: formData.value.trim(),
      description: formData.description.trim() || null
    }

    const response = await submitCustomForm(payload)

    if (response.success) {
      markCustomDataExists(true)
      showSuccess(t('map.customDataPanel.messages.submitSuccess'))
      resetForm()
      emit('submit-success', response)
    } else {
      showError(t('map.customDataPanel.messages.submitFailed', { message: response.message }))
    }
  } catch (error) {
    console.error('提交失败:', error)
    showError(t('map.customDataPanel.messages.submitError', { error: error.message }))
  }
}

const resetForm = () => {
  formData.location = ''
  formData.region = ''
  formData.coordinates = ''
  // formData.featureType = ''
  // formData.featureField = ''
  formData.value = ''
  formData.description = ''
}
</script>

<style scoped>
/* 右侧面板容器 */
.custom-data-panel {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%) translateX(100%);
  width: 300px;
  max-height: 90vh;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.85)
  );
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 20px 0 0 20px;
  box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.15),
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.5);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9999;
  overflow-y: auto;
}

.custom-data-panel.open {
  transform: translateY(-50%) translateX(0);
}

/* 展开/收起按钮（固定在屏幕右边缘） */
.expand-button {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border: none;
  border-radius: 12px 0 0 12px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* 比面板高一层 */
}

.expand-button:hover {
  background: linear-gradient(135deg, #0051d5, #003a99);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
  transform: translateY(-50%) translateX(-4px); /* 悬停时稍微向左移 */
}

.expand-button.open {
  right: 300px; /* 面板展开时，按钮移到面板左侧 */
}

/* 面板内容 */
.panelContent {
  padding: 12px;
  max-height: calc(90vh - 48px);
  overflow-y: auto;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
  text-align: center;
  margin:10px 0;
}

/* 表单样式 */
.data-form {
  display: flex;
  flex-direction: column;
  gap: 10px;              /* 增加间距以容纳 hint */
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: row;  /* 改为水平排列 */
  align-items: center;   /* 垂直居中对齐 */
  gap: 8px;              /* label 和 input 之间的间距 */
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #2c3e50);
  max-width: 60px;       /* 限定 label 最大宽度 */
  min-width: 60px;       /* 保持 label 宽度一致 */
  flex-shrink: 0;        /* 防止 label 被压缩 */
  text-align: right;     /* 右对齐，更整齐 */
}

.required {
  color: #ff3b30;
  margin-left: 2px;
}

.form-group input,
.form-group textarea {
  flex: 1;               /* 占据剩余空间 */
  padding: 8px 10px;     /* 略微减小 padding 以适应更紧凑的布局 */
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.form-group input[readonly] {
  background: rgba(240, 240, 240, 0.8);
  cursor: not-allowed;
  color: #666;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007aff;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.hint {
  position: absolute;
  bottom: -18px;         /* 放在 form-group 下方 */
  left: 88px;            /* 与 input 左对齐（80px label + 8px gap） */
  font-size: 11px;
  color: #8e8e93;
  white-space: nowrap;   /* 防止换行 */
}

/* 建议列表 */
.suggestions-box {
  position: absolute;
  top: 100%;
  left: 88px;            /* 与 input 左对齐（80px label + 8px gap） */
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: center;
  font-size: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.suggestion-item:hover {
  background: rgba(0, 122, 255, 0.1);
}

/* 提交按钮 */
.submit-btn {
  padding: 12px 24px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
  transition: all 0.3s ease;
  margin-top: 8px;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #30d158, #28cd4c);
  box-shadow: 0 6px 16px rgba(52, 199, 89, 0.4);
  transform: translateY(-2px);
}

.submit-btn:active {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 768px) {
  /* 移动端：面板占据大部分屏幕宽度 */
  .custom-data-panel {
    width: calc(100vw - 80px);
    max-width: none;
    border-radius: 16px 0 0 16px;
    top: 40%;
  }

  .panelContent {
    padding: 8px 6px;
    max-height: calc(90vh - 32px);
    overflow-y: auto;
  }

  .panel-title {
    font-size: 18px;
    margin-bottom: 16px;
  }

  /* 移动端按钮 */
  .expand-button {
    width: 40px;
    height: 40px;
    font-size: 20px;
    border-radius: 10px 0 0 10px;
    top: 40%;
  }

  .expand-button.open {
    right: calc(100vw - 80px);
  }

  .expand-button:hover {
    transform: translateY(-50%); /* 移动端不需要悬停位移效果 */
  }

  /* 移动端表单优化 */
  .data-form {
    gap: 8px;            /* 增加表单项之间的间距，因为有 hint */
  }

  .form-group {
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    max-width: 70px;     /* 移动端减小 label 宽度 */
    min-width: 70px;
  }

  .form-group input,
  .form-group textarea {
    font-size: 14px;
    padding: 8px;
  }

  .hint {
    font-size: 10px;
    left: 76px;          /* 调整为新的 label 宽度 + gap */
  }

  .suggestions-box {
    left: 76px;          /* 调整为新的 label 宽度 + gap */
    font-size: 14px;
  }

  .suggestion-item {
    padding: 10px;
  }

  /* 提交按钮移动端优化 */
  .submit-btn {
    padding: 12px 20px;
    font-size: 15px;
  }
}

/* 小屏幕手机优化 */
@media (max-width: 480px) {
  .custom-data-panel {
    width: calc(100vw - 50px);
    top: 40%;
  }

  .panelContent {
    padding: 6px 5px;
  }

  .panel-title {
    font-size: 16px;
  }

  .expand-button {
    width: 36px;
    height: 36px;
    font-size: 18px;
    top: 40%;
  }

  .expand-button.open {
    right: calc(100vw - 50px);
  }

  .form-group label {
    font-size: 12px;
    max-width: 60px;     /* 小屏幕进一步减小 label 宽度 */
    min-width: 60px;
  }

  .form-group input,
  .form-group textarea {
    font-size: 13px;
    padding: 6px 8px;
  }

  .hint {
    font-size: 10px;
    left: 66px;          /* 调整为新的 label 宽度 + gap */
  }

  .suggestions-box {
    left: 66px;
  }

  .submit-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}

/* 横屏模式优化 */
@media (max-height: 600px) and (orientation: landscape) {
  .custom-data-panel {
    max-height: 80dvh;
  }

  .panelContent {
    padding: 6px;
  }

  .panel-title {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .data-form {
    gap: 4px;
  }

  .form-group {
    gap: 6px;
  }

  .form-group label {
    font-size: 12px;
    max-width: 65px;
    min-width: 65px;
  }

  .form-group input,
  .form-group textarea {
    padding: 6px 8px;
  }

  .hint {
    font-size: 10px;
    left: 71px;
  }

  .suggestions-box {
    left: 71px;
  }

  .submit-btn {
    padding: 10px 20px;
    margin-top: 4px;
  }
}
</style>
