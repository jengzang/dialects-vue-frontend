<template>
  <div class="user-avatar-editor">
    <div
      class="profile-avatar clickable-avatar"
      :style="avatarStyle"
      role="button"
      tabindex="0"
      :aria-label="t('auth.profile.avatar.editOverlay')"
      @click="open"
      @keydown.enter.prevent="open"
      @keydown.space.prevent="open"
    >
      {{ avatarConfig.text }}
      <div class="avatar-edit-overlay">
        <span class="edit-overlay-text">
          {{ t('auth.profile.avatar.editOverlay') }}
        </span>
      </div>
    </div>

    <AvatarCustomizerModal
      v-model="isModalOpen"
      :user="user"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AvatarCustomizerModal from './AvatarCustomizerModal.vue'

const { t } = useI18n()

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['saved'])

const isModalOpen = ref(false)

const open = () => {
  isModalOpen.value = true
}

defineExpose({
  open
})

const getDefaultConfig = () => {
  const username = props.user?.username || ''
  const initialText = username ? username.slice(0, 2).toUpperCase() : 'US'

  return {
    text: initialText,
    shape: 'circle',
    bgType: 'solid',
    glass: true,
    bgColor: '#ffffff',
    gradientFrom: 'var(--color-primary)',
    gradientTo: 'var(--color-primary-cyan)',
    gradientAngle: 145,
    textColor: 'var(--color-primary-hover)',
    glow: true
  }
}

const getLocalStorageKey = () => `avatar_config_${props.user?.id || 'default'}`

const avatarConfig = ref(getDefaultConfig())

const loadAvatarConfig = () => {
  const key = getLocalStorageKey()
  const saved = localStorage.getItem(key)

  if (saved) {
    try {
      const parsed = JSON.parse(saved)

      if (parsed.bgType === 'glass') {
        parsed.bgType = 'solid'
        parsed.glass = true
      } else if (parsed.bgType === 'liquid_glass') {
        parsed.bgType = 'gradient'
        parsed.glass = true
      }

      avatarConfig.value = {
        ...getDefaultConfig(),
        ...parsed
      }
      return
    } catch (error) {
      console.error('Failed to parse avatar config:', error)
    }
  }

  avatarConfig.value = getDefaultConfig()
}

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

const avatarStyle = computed(() => {
  const styles = {
    color: avatarConfig.value.textColor,
    borderRadius:
      avatarConfig.value.shape === 'circle'
        ? '50%'
        : avatarConfig.value.shape === 'blob'
          ? '60% 40% 30% 70% / 60% 30% 70% 40%'
          : '18px',
    fontWeight: '1000'
  }

  const isGlass = avatarConfig.value.glass

  if (avatarConfig.value.bgType === 'solid') {
    if (isGlass) {
      const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 255, g: 255, b: 255 }

      styles.background = `linear-gradient(145deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1))`

      if (avatarConfig.value.bgColor === '#ffffff') {
        styles.backdropFilter = 'blur(15px) saturate(150%)'
        styles.webkitBackdropFilter = 'blur(15px) saturate(150%)'
        styles.border = '3px solid var(--glass-40)'
      } else {
        styles.backdropFilter = 'blur(16px) saturate(160%)'
        styles.webkitBackdropFilter = 'blur(16px) saturate(160%)'
        styles.border = '2.5px solid var(--glass-50)'
      }
    } else {
      styles.background = avatarConfig.value.bgColor
    }
  } else if (avatarConfig.value.bgType === 'gradient') {
    if (isGlass) {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 }
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 }

      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.55), rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25))`
      styles.backdropFilter = 'blur(20px) saturate(190%)'
      styles.webkitBackdropFilter = 'blur(20px) saturate(190%)'
      styles.border = '2.5px solid var(--glass-50)'
    } else {
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, ${avatarConfig.value.gradientFrom}, ${avatarConfig.value.gradientTo})`
    }
  }

  if (avatarConfig.value.glow) {
    if (avatarConfig.value.bgType === 'solid') {
      if (isGlass) {
        if (avatarConfig.value.bgColor === '#ffffff') {
          styles.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08)'
        } else {
          const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 0, g: 122, b: 255 }

          styles.boxShadow = `0 8px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), inset 0 0 12px var(--glass-30)`
        }
      } else {
        const rgb = hexToRgb(avatarConfig.value.bgColor)

        if (rgb) {
          styles.boxShadow = `0 8px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), inset 0 0 8px var(--glass-20)`
        } else {
          styles.boxShadow =
            '0 8px 20px rgba(var(--color-primary-rgb), 0.3), inset 0 0 8px var(--glass-20)'
        }
      }
    } else if (avatarConfig.value.bgType === 'gradient') {
      if (isGlass) {
        const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 }
        const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 }

        styles.boxShadow = `0 10px 25px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 5px 15px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 2px 4px var(--glass-60), inset 0 -2px 4px rgba(0, 0, 0, 0.08)`
      } else {
        const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom)
        const rgbTo = hexToRgb(avatarConfig.value.gradientTo)

        if (rgbFrom && rgbTo) {
          styles.boxShadow = `0 8px 20px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 4px 12px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 0 8px var(--glass-20)`
        } else {
          styles.boxShadow =
            '0 8px 20px rgba(var(--color-primary-rgb), 0.3), inset 0 0 8px var(--glass-20)'
        }
      }
    }
  } else {
    if (isGlass) {
      if (avatarConfig.value.bgType === 'solid') {
        styles.boxShadow =
          avatarConfig.value.bgColor === '#ffffff'
            ? 'none'
            : 'inset 0 0 12px var(--glass-30)'
      } else if (avatarConfig.value.bgType === 'gradient') {
        styles.boxShadow =
          'inset 0 2px 4px var(--glass-60), inset 0 -2px 4px rgba(0, 0, 0, 0.08)'
      }
    } else {
      styles.boxShadow = 'none'
    }
  }

  return styles
})

const handleSaved = () => {
  loadAvatarConfig()
  emit('saved')
}

watch(
  () => props.user?.id,
  () => {
    loadAvatarConfig()
  }
)

onMounted(() => {
  loadAvatarConfig()
})
</script>


$primary-blue: var(--color-primary);
$secondary-blue: var(--color-primary-cyan);
$white: var(--text-white);

$avatar-size: 64px;
$avatar-size-landscape: 72px;

$avatar-transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
$overlay-transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
.user-avatar-editor {
  @include flex-center;

  display: inline-flex;
  flex-shrink: 0;
}

.profile-avatar {
  @include flex-center;

  width: $avatar-size;
  height: $avatar-size;
  color: $white;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, $primary-blue, $secondary-blue);
  border: 1.5px solid $white;
  border-radius: 50%;
  box-shadow:
    0 6px 16px rgba(var(--color-primary-rgb), 0.2),
    inset 0 0 8px var(--glass-20);
  transition: all $avatar-transition;

  @media (min-aspect-ratio: 1/1) {
    width: $avatar-size-landscape;
    height: $avatar-size-landscape;
    font-size: 24px;
  }
}

.clickable-avatar {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: all $avatar-transition;

  &:hover {
    transform: scale(1.08) rotate(2deg) !important;

    .avatar-edit-overlay {
      opacity: 1;

      .edit-overlay-text {
        transform: translateY(0);
      }
    }
  }

  &:active {
    transform: scale(0.96) !important;
  }

  .avatar-edit-overlay {
    @include flex-center;

    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    opacity: 0;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    transition: opacity $overlay-transition;

    .edit-overlay-text {
      color: $white;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      transform: translateY(4px);
      transition: transform $overlay-transition;
    }
  }
}
