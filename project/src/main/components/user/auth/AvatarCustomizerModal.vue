<template>
  <AppModal v-model="isModalOpen" :title="$t('auth.profile.avatar.modalTitle')" size="sm">
    <div class="avatar-config-modal">
      <!-- Preview section -->
      <div class="preview-section">
        <div class="preview-avatar" :style="avatarStyle">
          {{ avatarConfig.text }}
        </div>
        <p class="preview-tip">
          {{ $t('auth.profile.avatar.previewTip') }}
        </p>
      </div>

      <!-- Controls section -->
      <div class="config-controls">
        <!-- Text Input -->
        <div class="control-group">
          <label class="control-label">{{ $t('auth.profile.avatar.textLabel') }}</label>
          <input
            v-model="avatarConfig.text"
            type="text"
            maxlength="3"
            class="config-input"
            :placeholder="$t('auth.profile.avatar.textPlaceholder')"
          />
        </div>

        <!-- Shape Selector -->
        <div class="control-group">
          <label class="control-label">{{ $t('auth.profile.avatar.shapeLabel') }}</label>
          <div class="btn-group">
            <button
              type="button"
              class="config-btn"
              :class="{ active: avatarConfig.shape === 'circle' }"
              @click="avatarConfig.shape = 'circle'"
            >
              {{ $t('auth.profile.avatar.shapeCircle') }}
            </button>
            <button
              type="button"
              class="config-btn"
              :class="{ active: avatarConfig.shape === 'squircle' }"
              @click="avatarConfig.shape = 'squircle'"
            >
              {{ $t('auth.profile.avatar.shapeSquircle') }}
            </button>
            <button
              type="button"
              class="config-btn"
              :class="{ active: avatarConfig.shape === 'blob' }"
              @click="avatarConfig.shape = 'blob'"
            >
              {{ $t('auth.profile.avatar.shapeBlob') }}
            </button>
          </div>
        </div>

        <!-- Background Type and Glass Toggle -->
        <div class="control-group">
          <label class="control-label">{{ $t('auth.profile.avatar.bgTypeLabel') }}</label>
          <div class="bg-type-controls-inline">
            <div class="btn-group">
              <button
                type="button"
                class="config-btn"
                :class="{ active: avatarConfig.bgType === 'solid' }"
                @click="avatarConfig.bgType = 'solid'"
              >
                {{ $t('auth.profile.avatar.bgTypeSolid') }}
              </button>
              <button
                type="button"
                class="config-btn"
                :class="{ active: avatarConfig.bgType === 'gradient' }"
                @click="avatarConfig.bgType = 'gradient'"
              >
                {{ $t('auth.profile.avatar.bgTypeGradient') }}
              </button>
            </div>
            <CheckBox
              class="glass-toggle-label"
              :model-value="avatarConfig.glass"
              @update:modelValue="avatarConfig.glass = $event"
            >
              {{ $t('auth.profile.avatar.glassLabel') }}
            </CheckBox>
          </div>
        </div>

        <!-- Solid / Glass Tint Color Customizer -->
        <div v-if="avatarConfig.bgType === 'solid'" class="control-group">
          <label class="control-label">
            {{
              avatarConfig.glass
                ? $t('auth.profile.avatar.glassTintLabel')
                : $t('auth.profile.avatar.solidPresetLabel')
            }}
          </label>
          <div class="color-preset-grid">
            <button
              v-for="color in presetSolids"
              :key="color"
              type="button"
              class="color-dot"
              :style="{ backgroundColor: color }"
              :class="{ active: avatarConfig.bgColor === color }"
              @click="avatarConfig.bgColor = color"
            />
          </div>
          <div class="custom-color-picker">
            <span>{{ $t('auth.profile.avatar.customColorLabel') }}</span>
            <input v-model="avatarConfig.bgColor" type="color" />
          </div>
        </div>

        <!-- Gradient presets Customizer -->
        <div v-if="avatarConfig.bgType === 'gradient'" class="control-group">
          <label class="control-label">
            {{
              avatarConfig.glass
                ? $t('auth.profile.avatar.liquidGlassPresetLabel')
                : $t('auth.profile.avatar.gradientPresetLabel')
            }}
          </label>
          <div class="gradient-preset-grid">
            <button
              v-for="grad in presetGradients"
              :key="grad.name"
              type="button"
              class="gradient-bar"
              :style="{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }"
              :class="{
                active:
                  avatarConfig.gradientFrom === grad.from && avatarConfig.gradientTo === grad.to,
              }"
              @click="applyPresetGradient(grad)"
            >
              {{ $t(grad.name) }}
            </button>
          </div>
          <div class="custom-gradient-pickers">
            <div class="picker-item">
              <span>{{ $t('auth.profile.avatar.gradientStartColor') }}</span>
              <input v-model="avatarConfig.gradientFrom" type="color" />
            </div>
            <div class="picker-item">
              <span>{{ $t('auth.profile.avatar.gradientEndColor') }}</span>
              <input v-model="avatarConfig.gradientTo" type="color" />
            </div>
          </div>
        </div>

        <!-- Angle Slider (for gradient types) -->
        <div v-if="avatarConfig.bgType === 'gradient'" class="control-group">
          <div class="angle-slider">
            <span>{{
              $t('auth.profile.avatar.gradientAngle', { angle: avatarConfig.gradientAngle })
            }}</span>
            <input v-model.number="avatarConfig.gradientAngle" type="range" min="0" max="360" />
          </div>
        </div>

        <!-- Text Color Picker -->
        <div class="control-group">
          <label class="control-label">{{ $t('auth.profile.avatar.textColorLabel') }}</label>
          <div class="text-color-pickers">
            <button
              type="button"
              class="text-color-btn text-white"
              :class="{ active: avatarConfig.textColor === '#ffffff' }"
              @click="avatarConfig.textColor = '#ffffff'"
            >
              {{ $t('auth.profile.avatar.textColorWhite') }}
            </button>
            <button
              type="button"
              class="text-color-btn text-black"
              :class="{ active: avatarConfig.textColor === '#1d1d1f' }"
              @click="avatarConfig.textColor = '#1d1d1f'"
            >
              {{ $t('auth.profile.avatar.textColorBlack') }}
            </button>
            <div class="custom-text-color">
              <span>{{ $t('auth.profile.avatar.textColorCustom') }}</span>
              <input v-model="avatarConfig.textColor" type="color" />
            </div>
          </div>
        </div>

        <!-- Glow Effect Toggle -->
        <div class="control-group glow-toggle-group">
          <label class="control-label">{{ $t('auth.profile.avatar.glowLabel') }}</label>
          <CheckBox
            class="glow-checkbox"
            :model-value="avatarConfig.glow"
            @update:modelValue="avatarConfig.glow = $event"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="modal-footer-btn cancel-btn" @click="isModalOpen = false">
        {{ $t('auth.profile.avatar.btnCancel') }}
      </button>
      <button type="button" class="modal-footer-btn reset-btn" @click="resetAvatarConfig">
        {{ $t('auth.profile.avatar.btnReset') }}
      </button>
      <button type="button" class="modal-footer-btn save-btn" @click="saveAvatarConfig">
        {{ $t('auth.profile.avatar.btnSave') }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

// --- Local states ---
const isModalOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

let backupConfig = null;
let isSaved = false;

const presetSolids = [
  '#007aff', // Apple Blue
  '#34c759', // Apple Green
  '#ff9500', // Apple Orange
  '#ff2d55', // Apple Pink/Red
  '#af52de', // Apple Purple
  '#5856d6', // Apple Indigo
  '#ffcc00', // Apple Yellow
  '#8e8e93', // Apple Gray
];

const presetGradients = [
  { name: 'auth.profile.avatar.presetSunset', from: '#ff5e62', to: '#ff9966' },
  { name: 'auth.profile.avatar.presetOcean', from: '#00c6ff', to: '#0072ff' },
  { name: 'auth.profile.avatar.presetAurora', from: '#a18cd1', to: '#fbc2eb' },
  { name: 'auth.profile.avatar.presetSpring', from: '#11998e', to: '#38ef7d' },
  { name: 'auth.profile.avatar.presetMidnight', from: '#1e3c72', to: '#2a5298' },
  { name: 'auth.profile.avatar.presetPurple', from: '#7000ff', to: '#f100ff' },
];

const getDefaultConfig = () => {
  const username = props.user?.username || '';
  const initialText = username ? username.slice(0, 2).toUpperCase() : 'US';
  return {
    text: initialText,
    shape: 'circle',
    bgType: 'solid',
    glass: true,
    bgColor: '#ffffff',
    gradientFrom: '#007aff',
    gradientTo: '#00c6ff',
    gradientAngle: 145,
    textColor: '#005fd3',
    glow: true,
  };
};

const getLocalStorageKey = () => `avatar_config_${props.user?.id || 'default'}`;

const avatarConfig = ref({
  text: '',
  shape: 'circle',
  bgType: 'solid',
  glass: true,
  bgColor: '#ffffff',
  gradientFrom: '#007aff',
  gradientTo: '#00c6ff',
  gradientAngle: 145,
  textColor: '#005fd3',
  glow: true,
});

const loadAvatarConfig = () => {
  const key = getLocalStorageKey();
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migration for old config structures:
      if (parsed.bgType === 'glass') {
        parsed.bgType = 'solid';
        parsed.glass = true;
      } else if (parsed.bgType === 'liquid_glass') {
        parsed.bgType = 'gradient';
        parsed.glass = true;
      }
      avatarConfig.value = { ...getDefaultConfig(), ...parsed };
      return;
    } catch (e) {
      console.error('Failed to parse avatar config:', e);
    }
  }
  avatarConfig.value = getDefaultConfig();
};

const saveAvatarConfig = () => {
  isSaved = true;
  localStorage.setItem(getLocalStorageKey(), JSON.stringify(avatarConfig.value));
  window.dispatchEvent(new CustomEvent('avatar-changed', { detail: { userId: props.user?.id } }));
  emit('saved');
  isModalOpen.value = false;
};

const resetAvatarConfig = () => {
  avatarConfig.value = getDefaultConfig();
};

const applyPresetGradient = (grad) => {
  avatarConfig.value.bgType = 'gradient';
  avatarConfig.value.gradientFrom = grad.from;
  avatarConfig.value.gradientTo = grad.to;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const avatarStyle = computed(() => {
  const styles = {
    color: avatarConfig.value.textColor,
    borderRadius:
      avatarConfig.value.shape === 'circle'
        ? '50%'
        : avatarConfig.value.shape === 'blob'
          ? '60% 40% 30% 70% / 60% 30% 70% 40%'
          : '18px',
    fontWeight: '1000',
  };

  const isGlass = avatarConfig.value.glass;

  if (avatarConfig.value.bgType === 'solid') {
    if (isGlass) {
      const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 255, g: 255, b: 255 };
      styles.background = `linear-gradient(145deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1))`;
      if (avatarConfig.value.bgColor === '#ffffff') {
        styles.backdropFilter = 'blur(15px) saturate(150%)';
        styles.webkitBackdropFilter = 'blur(15px) saturate(150%)';
        styles.border = '3px solid rgba(255, 255, 255, 0.4)';
      } else {
        styles.backdropFilter = 'blur(16px) saturate(160%)';
        styles.webkitBackdropFilter = 'blur(16px) saturate(160%)';
        styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
      }
    } else {
      styles.background = avatarConfig.value.bgColor;
    }
  } else if (avatarConfig.value.bgType === 'gradient') {
    if (isGlass) {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.55), rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25))`;
      styles.backdropFilter = 'blur(20px) saturate(190%)';
      styles.webkitBackdropFilter = 'blur(20px) saturate(190%)';
      styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
    } else {
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, ${avatarConfig.value.gradientFrom}, ${avatarConfig.value.gradientTo})`;
    }
  }

  if (avatarConfig.value.glow) {
    if (avatarConfig.value.bgType === 'solid') {
      if (isGlass) {
        if (avatarConfig.value.bgColor === '#ffffff') {
          styles.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08)';
        } else {
          const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 0, g: 122, b: 255 };
          styles.boxShadow = `0 8px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), inset 0 0 12px rgba(255, 255, 255, 0.3)`;
        }
      } else {
        const rgb = hexToRgb(avatarConfig.value.bgColor);
        if (rgb) {
          styles.boxShadow = `0 8px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
        } else {
          styles.boxShadow =
            '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
        }
      }
    } else if (avatarConfig.value.bgType === 'gradient') {
      if (isGlass) {
        const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
        const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
        styles.boxShadow = `0 10px 25px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 5px 15px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)`;
      } else {
        const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom);
        const rgbTo = hexToRgb(avatarConfig.value.gradientTo);
        if (rgbFrom && rgbTo) {
          styles.boxShadow = `0 8px 20px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 4px 12px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
        } else {
          styles.boxShadow =
            '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
        }
      }
    }
  } else {
    if (isGlass) {
      if (avatarConfig.value.bgType === 'solid') {
        styles.boxShadow =
          avatarConfig.value.bgColor === '#ffffff'
            ? 'none'
            : 'inset 0 0 12px rgba(255, 255, 255, 0.3)';
      } else if (avatarConfig.value.bgType === 'gradient') {
        styles.boxShadow =
          'inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)';
      }
    } else {
      styles.boxShadow = 'none';
    }
  }

  return styles;
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      loadAvatarConfig();
      backupConfig = JSON.parse(JSON.stringify(avatarConfig.value));
      isSaved = false;
    } else {
      if (!isSaved && backupConfig) {
        avatarConfig.value = JSON.parse(JSON.stringify(backupConfig));
      }
    }
  }
);

watch(
  () => props.user?.id,
  () => {
    loadAvatarConfig();
  },
  { immediate: true }
);
</script>

```vue

$primary-blue: var(--color-primary);
$primary-blue-dark: #0063cc;
$text-primary: #1d1d1f;
$text-secondary: #86868b;
$text-button: #48484a;
$danger-color: #ff3b30;
$white: #fff;

$radius-sm: 8px;
$radius-md: 10px;
$radius-lg: 12px;
$radius-xl: 20px;

$transition-fast: 0.2s;
$transition-medium: 0.25s;
$transition-slow: 0.3s;
$smooth-easing: cubic-bezier(0.25, 0.8, 0.25, 1);

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin color-picker-input {
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 50%;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform $transition-fast ease;
  -webkit-appearance: none;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: 2px solid $white;
    border-radius: 50%;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.avatar-config-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 4px;
}

.preview-section {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 100%;
  max-width: 280px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: $radius-xl;
}

.preview-avatar {
  @include flex-center;

  width: 80px;
  height: 80px;
  font-size: 28px;
  font-weight: 700;
  border: 2.5px solid $white;
  transition: all $transition-slow $smooth-easing;
}

.preview-tip {
  margin: 0;
  color: $text-secondary;
  font-size: 12px;
  font-weight: 550;
}

.config-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.bg-type-controls-inline {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .btn-group {
    flex: 1;
    max-width: 220px;
  }
}

.glass-toggle-label {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  color: $text-primary;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  text-align: left;

  &.glow-toggle-group {
    box-sizing: border-box;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: $radius-lg;
  }
}

.control-label {
  color: $text-primary;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.config-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 14px;
  font-size: 15px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: $radius-lg;
  outline: none;
  transition: all $transition-fast ease;

  &:focus {
    background: $white;
    border-color: $primary-blue;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }
}

.btn-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.config-btn {
  @include flex-center;

  flex: 1;
  gap: 4px;
  padding: 10px 12px;
  color: $text-primary;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: $radius-md;
  transition: all $transition-fast $smooth-easing;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.15);
  }

  &.active {
    color: $white;
    background: $primary-blue;
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
  }
}

.color-preset-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  width: 100%;
}

.color-dot {
  padding: 0;
  aspect-ratio: 1;
  cursor: pointer;
  border: 2px solid $white;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  transition: all $transition-fast $smooth-easing;

  &:hover {
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(0, 0, 0, 0.15);
    transform: scale(1.15);
  }

  &.active {
    z-index: 1;
    box-shadow:
      0 0 0 2px $primary-blue,
      0 4px 8px rgba(0, 122, 255, 0.3);
    transform: scale(1.2);
  }
}

.custom-color-picker,
.custom-text-color {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 550;

  input[type="color"] {
    @include color-picker-input;
  }
}

.gradient-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
}

.gradient-bar {
  padding: 12px 6px;
  color: $white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: $radius-md;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: all $transition-medium $smooth-easing;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.active {
    border-color: $primary-blue;
    box-shadow:
      0 0 0 2px $primary-blue,
      0 6px 15px rgba(0, 122, 255, 0.35);
    transform: translateY(-2px) scale(1.03);
  }
}

.custom-gradient-pickers {
  display: flex;
  gap: 16px;
  width: 100%;
  margin-top: 8px;
}

.picker-item {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 550;

  input[type="color"] {
    @include color-picker-input;
  }
}

.angle-slider {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  margin-top: 8px;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 550;

  input[type="range"] {
    flex: 1;
    height: 6px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
      width: 18px;
      height: 18px;
      cursor: pointer;
      background: $white;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      transition: transform 0.1s ease;
      -webkit-appearance: none;

      &:active {
        transform: scale(1.2);
      }
    }
  }
}

.text-color-pickers {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.text-color-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: $radius-sm;
  transition: all $transition-fast ease;

  &.text-white {
    color: $text-primary;
    background: $white;
  }

  &.text-black {
    color: $white;
    background: $text-primary;
  }

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &.active {
    border-color: $primary-blue;
    box-shadow:
      0 0 0 2px $primary-blue,
      0 4px 8px rgba(0, 122, 255, 0.25);
  }
}

.modal-footer-btn {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: $radius-md;
  transition: all $transition-fast $smooth-easing;

  &.cancel-btn {
    color: $text-button;
    background: rgba(0, 0, 0, 0.05);

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  }

  &.reset-btn {
    margin-right: auto;
    color: $danger-color;
    background: rgba(255, 59, 48, 0.1);

    &:hover {
      background: rgba(255, 59, 48, 0.18);
    }
  }

  &.save-btn {
    color: $white;
    background: $primary-blue;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);

    &:hover {
      background: $primary-blue-dark;
      box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

```

