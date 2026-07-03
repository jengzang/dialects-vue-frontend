<template>
  <div class="settings-panel">
    <!-- Module Selection -->
    <div class="setting-group">
      <label class="setting-label">{{ t('praat.settings.modules.label') }}</label>
      <div class="module-checkboxes">
        <CheckBox
          v-for="module in availableModules"
          :key="module.value"
          :model-value="localSettings.modules.includes(module.value)"
          :label="module.label"
          class="checkbox-option"
          @update:modelValue="toggleModule(module.value, $event)"
        />
      </div>
    </div>

    <!-- Resolution Presets (移到前面，更显眼) -->
    <div class="setting-group">
      <label class="setting-label">{{ t('praat.settings.resolutionPresets.label') }}</label>
      <div class="resolution-presets">
        <label class="radio-option" :class="{ active:
  currentResolutionMode === 'quick' }">
          <input
              type="radio"
              value="quick"
              v-model="currentResolutionMode"
              @change="applyResolutionPreset"
          >
          <span class="radio-label">
              <span class="radio-title">⚡ {{ resolutionPresets.quick.title }}</span>
              <span class="radio-desc">{{ resolutionPresets.quick.desc }}</span>
            </span>
        </label>

        <label class="radio-option" :class="{ active:
  currentResolutionMode === 'standard' }">
          <input
              type="radio"
              value="standard"
              v-model="currentResolutionMode"
              @change="applyResolutionPreset"
          >
          <span class="radio-label">
              <span class="radio-title">⚖️ {{ resolutionPresets.standard.title }}</span>
              <span class="radio-desc">{{ resolutionPresets.standard.desc }}</span>
            </span>
        </label>

        <label class="radio-option" :class="{ active:
  currentResolutionMode === 'high' }">
          <input
              type="radio"
              value="high"
              v-model="currentResolutionMode"
              @change="applyResolutionPreset"
          >
          <span class="radio-label">
              <span class="radio-title">💎 {{ resolutionPresets.high.title }}</span>
              <span class="radio-desc">{{ resolutionPresets.high.desc }}</span>
            </span>
        </label>
      </div>
      <p class="hint-text" style="margin-top: 0.5rem; color: #666;">
        {{ resolutionPresets[currentResolutionMode]?.description }}
      </p>
    </div>

    <!-- Pitch Settings -->
    <div v-if="localSettings.modules.includes('pitch')"
         class="setting-group">
      <label class="setting-label">{{ t('praat.settings.pitch.label') }}</label>
      <div class="param-grid">
        <div class="param-item">
          <label>{{ t('praat.settings.pitch.minF0') }}</label>
          <input type="number"
                 v-model.number="localSettings.pitch_options.f0_min" min="50" max="300" />
        </div>
        <div class="param-item">
          <label>{{ t('praat.settings.pitch.maxF0') }}</label>
          <input type="number"
                 v-model.number="localSettings.pitch_options.f0_max" min="200" max="800" />
        </div>
        <div class="param-item">
          <label>{{ t('praat.settings.pitch.timeStep') }}</label>
          <input
              type="number"
              v-model.number="localSettings.pitch_options.time_step"
              min="0.001"
              max="0.1"
              step="0.001"
              @input="onManualChange"
          />
          <span class="hint-text">{{ t('praat.settings.pitch.manualOverride') }}</span>
        </div>
      </div>
    </div>

    <!-- Formant Settings -->
    <div v-if="localSettings.modules.includes('formant')"
         class="setting-group">
      <label class="setting-label">{{ t('praat.settings.formant.label') }}</label>
      <div class="param-grid">
        <div class="param-item">
          <label>{{ t('praat.settings.formant.maxFormants') }}</label>
          <input type="number"
                 v-model.number="localSettings.formant_options.max_formants" min="3"
                 max="7" />
        </div>
        <div class="param-item">
          <label>{{ t('praat.settings.formant.maxFreq') }}</label>
          <label class="hint-text">{{ t('praat.settings.formant.maxFreqHint') }}</label>
          <input type="number"
                 v-model.number="localSettings.formant_options.max_freq_hz" min="3000"
                 max="8000" step="100" />
        </div>
        <div class="param-item">
          <label>{{ t('praat.settings.formant.timeStep') }}</label>
          <input
              type="number"
              v-model.number="localSettings.formant_options.time_step"
              min="0.001"
              max="0.1"
              step="0.001"
              @input="onManualChange"
          />
          <span class="hint-text">{{ t('praat.settings.formant.manualOverride') }}</span>
        </div>
      </div>
    </div>

    <!-- Intensity Settings -->
    <div v-if="localSettings.modules.includes('intensity')"
         class="setting-group">
      <label class="setting-label">{{ t('praat.settings.intensity.label') }}</label>
      <div class="param-grid">
        <div class="param-item">
          <label>{{ t('praat.settings.intensity.minPitch') }}</label>
          <input type="number"
                 v-model.number="localSettings.intensity_options.min_pitch" min="50"
                 max="200" />
        </div>
      </div>
    </div>

    <!-- Output Options -->
    <div class="setting-group">
      <label class="setting-label">{{ t('praat.settings.output.label') }}</label>
      <div class="param-grid">
        <div class="param-item">
          <label>{{ t('praat.settings.output.samplingRate') }}</label>
          <input
              type="number"
              :placeholder="t('praat.settings.output.samplingRatePlaceholder')"
              v-model.number="localSettings.output_options.downsample_hz"
              min="10"
              max="1000"
              @input="onManualChange"
          />
          <span class="hint-text">
              {{
                t('praat.settings.output.samplingRateHint', {
                  rate: localSettings.output_options.downsample_hz,
                  interval: (1000 / localSettings.output_options.downsample_hz).toFixed(1)
                })
              }}
            </span>
        </div>
      </div>
      <div class="checkbox-options">
        <CheckBox
          :model-value="localSettings.output_options.include_timeseries"
          :label="t('praat.settings.output.includeTimeseries')"
          class="checkbox-option"
          @update:modelValue="localSettings.output_options.include_timeseries = $event"
        />
        <CheckBox
          :model-value="localSettings.output_options.include_summary"
          :label="t('praat.settings.output.includeSummary')"
          class="checkbox-option"
          @update:modelValue="localSettings.output_options.include_summary = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch, ref, onMounted } from 'vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:settings'])
const { t } = useI18n()

const availableModules = computed(() => ([
  { value: 'basic', label: t('praat.settings.modules.basic') },
  { value: 'pitch', label: t('praat.settings.modules.pitch') },
  { value: 'intensity', label: t('praat.settings.modules.intensity') },
  { value: 'formant', label: t('praat.settings.modules.formant') },
  { value: 'voice_quality', label: t('praat.settings.modules.voiceQuality') },
  { value: 'segments', label: t('praat.settings.modules.segments') },
  { value: 'spectrogram', label: t('praat.settings.modules.spectrogram') }
]))

const resolutionPresets = computed(() => ({
  quick: {
    time_step: 0.01,
    downsample_hz: 100,
    title: t('praat.settings.resolutionPresets.quick.title'),
    desc: t('praat.settings.resolutionPresets.quick.desc'),
    description: t('praat.settings.resolutionPresets.quick.description')
  },
  standard: {
    time_step: 0.005,
    downsample_hz: 200,
    title: t('praat.settings.resolutionPresets.standard.title'),
    desc: t('praat.settings.resolutionPresets.standard.desc'),
    description: t('praat.settings.resolutionPresets.standard.description')
  },
  high: {
    time_step: 0.002,
    downsample_hz: 500,
    title: t('praat.settings.resolutionPresets.high.title'),
    desc: t('praat.settings.resolutionPresets.high.desc'),
    description: t('praat.settings.resolutionPresets.high.description')
  }
}))

const localSettings = reactive(JSON.parse(JSON.stringify(props.settings)))

// 当前选中的模式
const currentResolutionMode = ref('standard')

const toggleModule = (moduleValue, checked) => {
  if (checked) {
    if (!localSettings.modules.includes(moduleValue)) {
      localSettings.modules.push(moduleValue)
    }
    return
  }
  localSettings.modules = localSettings.modules.filter(value => value !== moduleValue)
}

// 根据当前设置推断初始模式
const detectCurrentMode = () => {
  const currentTimeStep = localSettings.formant_options?.time_step ||
      0.005
  const currentDownsample = localSettings.output_options?.downsample_hz ||
      200

  if (currentTimeStep === 0.01 && currentDownsample === 100) {
    return 'quick'
  } else if (currentTimeStep === 0.002 && currentDownsample === 500) {
    return 'high'
  } else {
    return 'standard'
  }
}

// 初始化模式
currentResolutionMode.value = detectCurrentMode()

// 应用预设函数
const applyResolutionPreset = () => {
  const preset = resolutionPresets.value[currentResolutionMode.value]
  if (!preset) return

  // 1. 更新 formant time_step
  if (!localSettings.formant_options) {
    localSettings.formant_options = {}
  }
  localSettings.formant_options.time_step = preset.time_step

  // 2. 更新 pitch time_step
  if (localSettings.modules.includes('pitch')) {
    if (!localSettings.pitch_options) {
      localSettings.pitch_options = {}
    }
    // pitch 可以用稍大的步长
    localSettings.pitch_options.time_step = Math.min(preset.time_step * 2,
        0.01)
  }

  // 3. 🔑 关键：更新 output downsample_hz
  if (!localSettings.output_options) {
    localSettings.output_options = {}
  }
  localSettings.output_options.downsample_hz = preset.downsample_hz

  // console.log(`✅ 已应用 ${currentResolutionMode.value} 预设:`, {
  //   formant_time_step: preset.time_step,
  //   downsample_hz: preset.downsample_hz
  // })
}

// 手动修改时，切换到自定义模式（可选）
const onManualChange = () => {
  // 可以添加一个 'custom' 模式，或者保持当前模式
  console.log('⚠️ 用户手动修改了参数')
}

// 初始化时应用预设
onMounted(() => {
  applyResolutionPreset()
})

// 监听变化并同步到父组件
watch(localSettings, (newSettings) => {
  emit('update:settings', JSON.parse(JSON.stringify(newSettings)))
}, { deep: true })
</script>
<style scoped>
.settings-panel {
  padding: 1.5rem;
}

.setting-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.setting-group:last-child {
  border-bottom: none;
}

.setting-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

.mode-selector {
  display: flex;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--glass-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.radio-option:hover {
  background: var(--glass-medium);
  transform: translateY(-2px);
}

.radio-option input[type="radio"] {
  cursor: pointer;
}

.module-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--glass-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.checkbox-option:hover {
  background: var(--glass-medium);
}

.param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.param-item label {
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.param-item input[type="number"] {
  padding: 0.75rem;
  background: var(--glass-light);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.param-item input[type="number"]:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--glass-medium);
}

.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
/* 容器布局 */
.resolution-presets {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 隐藏原始 Radio 按钮，使用样式模拟 */
.radio-option {
  flex: 1;
  position: relative;
  border: 2px solid rgba(0,0,0,0.1); /* 边框 */
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  align-items: flex-start;
}

.radio-option input[type="radio"] {
  position: absolute;
  opacity: 0; /* 隐藏原生圆点 */
  width: 0;
  height: 0;
}

/* 选中状态 */
.radio-option.active {
  border-color: #007aff; /* 激活色 */
  background-color: rgba(0, 123, 255, 0.206);
}

.radio-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.radio-desc {
  font-size: 0.75rem;
  color: #666;
}

/* 鼠标悬停 */
.radio-option:hover {
  border-color: #999;
}
.radio-option.active:hover {
  border-color: #0066cc;
}

/* Hint text for format options */
.hint-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #666);
  margin-top: 0.25rem;
  font-style: italic;
  display: block;
}
</style>
