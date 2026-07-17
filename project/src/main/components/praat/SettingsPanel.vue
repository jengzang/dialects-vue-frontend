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
      <p class="hint-text" style="margin-top: 0.5rem; color: var(--text-tertiary);">
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

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-hover: #0066cc;

$text-main: var(--color-text-primary);
$text-secondary: var(--color-text-secondary, var(--text-tertiary));
$text-radio-title: var(--text-dark);
$text-radio-desc: var(--text-tertiary);

$surface-light: var(--glass-30);
$surface-medium: var(--glass-60);
$surface-white: var(--glass-100);

$border-default: rgba(0, 0, 0, 0.1);
$active-background: rgba(var(--color-primary-rgb), 0.206);

$radius-control: var(--radius-md);
$transition-fast: 0.2s;
$transition-normal: 0.3s;

.settings-panel {
  padding: 1.5rem;
}

.setting-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--glass-40);

  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  display: block;
  margin-bottom: 0.75rem;
  color: $text-main;
  font-weight: 600;
}

/* 功能模块 */
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
  background: $surface-light;
  border-radius: $radius-control;
  cursor: pointer;
  transition: background $transition-normal ease;

  &:hover {
    background: $surface-medium;
  }
}

/* 分辨率预设 */
.resolution-presets {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.radio-option {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 10px;
  background: $surface-white;
  border: 2px solid $border-default;
  border-radius: var(--radius-sm2);
  cursor: pointer;
  transition:
    background $transition-fast ease,
    border-color $transition-fast ease,
    transform $transition-fast ease;

  input[type="radio"] {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }

  &:hover {
    border-color: var(--text-lightest);
    transform: translateY(-2px);
  }

  &.active {
    background: $active-background;
    border-color: $primary;

    &:hover {
      border-color: $primary-hover;
    }
  }

  .radio-label {
    @include flex-col;
    gap: 4px;
  }

  .radio-title {
    color: $text-radio-title;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .radio-desc {
    color: $text-radio-desc;
    font-size: 0.75rem;
  }
}

/* 参数输入 */
.param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.param-item {
  @include flex-col;
  gap: 0.5rem;

  label {
    color: $text-main;
    font-size: 0.9rem;
  }

  input[type="number"] {
    padding: 0.75rem;
    background: $surface-light;
    border: 1px solid var(--glass-40);
    border-radius: $radius-control;
    color: $text-main;
    font-size: 1rem;
    transition:
      background $transition-normal ease,
      border-color $transition-normal ease;

    &:focus {
      outline: none;
      background: $surface-medium;
      border-color: var(--color-primary);
    }
  }
}

.checkbox-options {
  @include flex-col;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.hint-text {
  display: block;
  margin-top: 0.25rem;
  color: $text-secondary;
  font-size: 0.75rem;
  font-style: italic;
}
</style>
