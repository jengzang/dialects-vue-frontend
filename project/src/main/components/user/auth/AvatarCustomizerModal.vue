<template>
  <AppModal
    v-model="isModalOpen"
    :title="$t('auth.profile.avatar.modalTitle')"
    size="sm"
  >
    <div class="avatar-config-modal">
      <!-- Preview section -->
      <div class="preview-section">
        <div
          class="preview-avatar"
          :style="avatarStyle"
        >
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
          >
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
          </div>
        </div>

        <!-- Background Type -->
        <div class="control-group">
          <label class="control-label">{{ $t('auth.profile.avatar.bgTypeLabel') }}</label>
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
            <button
              type="button"
              class="config-btn"
              :class="{ active: avatarConfig.bgType === 'glass' }"
              @click="avatarConfig.bgType = 'glass'"
            >
              {{ $t('auth.profile.avatar.bgTypeGlass') }}
            </button>
            <button
              type="button"
              class="config-btn"
              :class="{ active: avatarConfig.bgType === 'liquid_glass' }"
              @click="avatarConfig.bgType = 'liquid_glass'"
            >
              {{ $t('auth.profile.avatar.bgTypeLiquidGlass') }}
            </button>
          </div>
        </div>

        <!-- Solid / Glass Tint Color Customizer -->
        <div
          v-if="avatarConfig.bgType === 'solid' || avatarConfig.bgType === 'glass'"
          class="control-group"
        >
          <label class="control-label">
            {{ avatarConfig.bgType === 'glass' ? $t('auth.profile.avatar.glassTintLabel') : $t('auth.profile.avatar.solidPresetLabel') }}
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
            <input
              v-model="avatarConfig.bgColor"
              type="color"
            >
          </div>
        </div>

        <!-- Gradient presets Customizer -->
        <div
          v-if="avatarConfig.bgType === 'gradient' || avatarConfig.bgType === 'liquid_glass'"
          class="control-group"
        >
          <label class="control-label">
            {{ avatarConfig.bgType === 'liquid_glass' ? $t('auth.profile.avatar.liquidGlassPresetLabel') : $t('auth.profile.avatar.gradientPresetLabel') }}
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
              <input
                v-model="avatarConfig.gradientFrom"
                type="color"
              >
            </div>
            <div class="picker-item">
              <span>{{ $t('auth.profile.avatar.gradientEndColor') }}</span>
              <input
                v-model="avatarConfig.gradientTo"
                type="color"
              >
            </div>
          </div>
        </div>

        <!-- Angle Slider (for gradient & liquid glass types) -->
        <div
          v-if="avatarConfig.bgType === 'gradient' || avatarConfig.bgType === 'liquid_glass'"
          class="control-group"
        >
          <div class="angle-slider">
            <span>{{ $t('auth.profile.avatar.gradientAngle', { angle: avatarConfig.gradientAngle }) }}</span>
            <input
              v-model.number="avatarConfig.gradientAngle"
              type="range"
              min="0"
              max="360"
            >
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
              <input
                v-model="avatarConfig.textColor"
                type="color"
              >
            </div>
          </div>
        </div>

        <!-- Glow Effect Toggle -->
        <div class="control-group glow-toggle-group">
          <label class="control-label">{{ $t('auth.profile.avatar.glowLabel') }}</label>
          <input
            v-model="avatarConfig.glow"
            type="checkbox"
            class="glow-checkbox"
          >
        </div>
      </div>
    </div>
    <template #footer>
      <button
        type="button"
        class="modal-footer-btn cancel-btn"
        @click="isModalOpen = false"
      >
        {{ $t('auth.profile.avatar.btnCancel') }}
      </button>
      <button
        type="button"
        class="modal-footer-btn reset-btn"
        @click="resetAvatarConfig"
      >
        {{ $t('auth.profile.avatar.btnReset') }}
      </button>
      <button
        type="button"
        class="modal-footer-btn save-btn"
        @click="saveAvatarConfig"
      >
        {{ $t('auth.profile.avatar.btnSave') }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AppModal from '@/components/common/AppModal.vue';

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
    bgType: 'glass',
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
  bgType: 'glass',
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
  emit('saved');
  isModalOpen.value = false;
};

const resetAvatarConfig = () => {
  avatarConfig.value = getDefaultConfig();
};

const applyPresetGradient = (grad) => {
  if (avatarConfig.value.bgType !== 'liquid_glass') {
    avatarConfig.value.bgType = 'gradient';
  }
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
    borderRadius: avatarConfig.value.shape === 'circle' ? '50%' : '18px',
    fontWeight: '1000',
  };

  if (avatarConfig.value.bgType === 'solid') {
    styles.background = avatarConfig.value.bgColor;
  } else if (avatarConfig.value.bgType === 'gradient') {
    styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, ${avatarConfig.value.gradientFrom}, ${avatarConfig.value.gradientTo})`;
  } else if (avatarConfig.value.bgType === 'glass') {
    const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 255, g: 255, b: 255 };
    // Frosted glass uses a fixed 145deg opacity-only gradient (same tint color, varying opacity) matching the logo-container
    styles.background = `linear-gradient(145deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1))`;
    if (avatarConfig.value.bgColor === '#ffffff') {
      // Exact style match to top-right logo-container
      styles.backdropFilter = 'blur(15px) saturate(150%)';
      styles.webkitBackdropFilter = 'blur(15px) saturate(150%)';
      styles.border = '3px solid rgba(255, 255, 255, 0.4)';
    } else {
      // Custom colored frosted glass tint
      styles.backdropFilter = 'blur(16px) saturate(160%)';
      styles.webkitBackdropFilter = 'blur(16px) saturate(160%)';
      styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
    }
  } else if (avatarConfig.value.bgType === 'liquid_glass') {
    const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
    const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
    styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.55), rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25))`;
    styles.backdropFilter = 'blur(20px) saturate(190%)';
    styles.webkitBackdropFilter = 'blur(20px) saturate(190%)';
    styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
  }

  if (avatarConfig.value.glow) {
    if (avatarConfig.value.bgType === 'solid') {
      const rgb = hexToRgb(avatarConfig.value.bgColor);
      if (rgb) {
        styles.boxShadow = `0 8px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
      } else {
        styles.boxShadow =
          '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
      }
    } else if (avatarConfig.value.bgType === 'gradient') {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom);
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo);
      if (rgbFrom && rgbTo) {
        styles.boxShadow = `0 8px 20px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 4px 12px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
      } else {
        styles.boxShadow =
          '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
      }
    } else if (avatarConfig.value.bgType === 'glass') {
      if (avatarConfig.value.bgColor === '#ffffff') {
        styles.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08)';
      } else {
        const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 0, g: 122, b: 255 };
        styles.boxShadow = `0 8px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25), inset 0 0 12px rgba(255, 255, 255, 0.3)`;
      }
    } else if (avatarConfig.value.bgType === 'liquid_glass') {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
      styles.boxShadow = `0 10px 25px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 5px 15px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)`;
    }
  } else {
    if (avatarConfig.value.bgType === 'glass') {
      styles.boxShadow = avatarConfig.value.bgColor === '#ffffff' ? 'none' : 'inset 0 0 12px rgba(255, 255, 255, 0.3)';
    } else if (avatarConfig.value.bgType === 'liquid_glass') {
      styles.boxShadow = 'inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)';
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

<style scoped lang="scss">
.avatar-config-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 4px;

  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.45);
    border-radius: 20px;
    border: 1px dashed rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 280px;
    box-sizing: border-box;

    .preview-avatar {
      width: 80px;
      height: 80px;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      border: 2.5px solid #ffffff;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .preview-tip {
      font-size: 12px;
      color: #86868b;
      margin: 0;
      font-weight: 550;
    }
  }

  .config-controls {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
      width: 100%;

      .control-label {
        font-size: 13px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.01em;
      }

      .config-input {
        width: 100%;
        padding: 10px 14px;
        font-size: 15px;
        font-weight: 500;
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        background: rgba(255, 255, 255, 0.8);
        box-sizing: border-box;
        transition: all 0.2s ease;
        outline: none;

        &:focus {
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
          background: #ffffff;
        }
      }

      .btn-group {
        display: flex;
        gap: 8px;
        width: 100%;

        .config-btn {
          flex: 1;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.6);
          color: #1d1d1f;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;

          &:hover {
            background: rgba(0, 0, 0, 0.03);
            border-color: rgba(0, 0, 0, 0.15);
          }

          &.active {
            background: #007aff;
            color: #ffffff;
            border-color: #007aff;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
          }
        }
      }

      .color-preset-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 8px;
        width: 100%;

        .color-dot {
          aspect-ratio: 1;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          padding: 0;

          &:hover {
            transform: scale(1.15);
            box-shadow:
              0 4px 8px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(0, 0, 0, 0.15);
          }

          &.active {
            transform: scale(1.2);
            box-shadow:
              0 0 0 2px #007aff,
              0 4px 8px rgba(0, 122, 255, 0.3);
            z-index: 1;
          }
        }
      }

      .custom-color-picker,
      .custom-text-color {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 4px;
        font-size: 13px;
        font-weight: 550;
        color: #86868b;

        input[type='color'] {
          -webkit-appearance: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          background: none;
          padding: 0;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;

          &::-webkit-color-swatch-wrapper {
            padding: 0;
          }

          &::-webkit-color-swatch {
            border: 2px solid #ffffff;
            border-radius: 50%;
          }

          &:hover {
            transform: scale(1.1);
          }
        }
      }

      .gradient-preset-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        width: 100%;

        .gradient-bar {
          padding: 12px 6px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
          text-align: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          &.active {
            border-color: #007aff;
            box-shadow:
              0 0 0 2px #007aff,
              0 6px 15px rgba(0, 122, 255, 0.35);
            transform: translateY(-2px) scale(1.03);
          }
        }
      }

      .custom-gradient-pickers {
        display: flex;
        gap: 16px;
        margin-top: 8px;
        width: 100%;

        .picker-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 550;
          color: #86868b;

          input[type='color'] {
            -webkit-appearance: none;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            background: none;
            padding: 0;
            box-shadow:
              0 0 0 1px rgba(0, 0, 0, 0.1),
              0 2px 6px rgba(0, 0, 0, 0.08);
            transition: transform 0.2s ease;

            &::-webkit-color-swatch-wrapper {
              padding: 0;
            }

            &::-webkit-color-swatch {
              border: 2px solid #ffffff;
              border-radius: 50%;
            }

            &:hover {
              transform: scale(1.1);
            }
          }
        }
      }

      .angle-slider {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        font-weight: 550;
        color: #86868b;
        margin-top: 8px;
        width: 100%;

        input[type='range'] {
          flex: 1;
          -webkit-appearance: none;
          background: rgba(0, 0, 0, 0.08);
          height: 6px;
          border-radius: 3px;
          outline: none;

          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.15);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            transition: transform 0.1s ease;

            &:active {
              transform: scale(1.2);
            }
          }
        }
      }

      .text-color-pickers {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;

        .text-color-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;

          &.text-white {
            background: #ffffff;
            color: #1d1d1f;
          }

          &.text-black {
            background: #1d1d1f;
            color: #ffffff;
          }

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }

          &.active {
            box-shadow:
              0 0 0 2px #007aff,
              0 4px 8px rgba(0, 122, 255, 0.25);
            border-color: #007aff;
          }
        }
      }

      &.glow-toggle-group {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        box-sizing: border-box;

        .glow-checkbox {
          width: 20px;
          height: 20px;
          accent-color: #007aff;
          cursor: pointer;
        }
      }
    }
  }
}

.modal-footer-btn {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: none;

  &.cancel-btn {
    background: rgba(0, 0, 0, 0.05);
    color: #48484a;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  }

  &.reset-btn {
    background: rgba(255, 59, 48, 0.1);
    color: #ff3b30;
    margin-right: auto;

    &:hover {
      background: rgba(255, 59, 48, 0.18);
    }
  }

  &.save-btn {
    background: #007aff;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);

    &:hover {
      background: #0063cc;
      box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
