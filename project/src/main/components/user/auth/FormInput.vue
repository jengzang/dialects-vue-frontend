<template>
  <div class="form-row">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="computedType"
      :placeholder="placeholder"
      :class="{ 'has-error': error }"
      class="form-input"
    />

    <!-- Icon overlay -->
    <span v-if="icon" class="input-icon">{{ icon }}</span>

    <!-- Password visibility toggle -->
    <span
      v-if="showPasswordToggle"
      @click="togglePasswordVisibility"
      class="password-toggle"
    >
      {{ passwordVisible ? '👁️' : '🙈' }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  showPasswordToggle: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])

const passwordVisible = ref(false)

const computedType = computed(() => {
  if (props.showPasswordToggle) {
    return passwordVisible.value ? 'text' : 'password'
  }
  return props.type
})

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}
</script>

```vue

$primary-color: var(--color-primary);
$error-color: #ff3b30;
$text-color: #333;
$placeholder-color: #999;
$control-right: 15px;
$transition-duration: 0.3s;
$glass-blur: 12px;

.form-row {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 12px 0;
}

.form-input {
  width: 100%;
  max-width: 320px;
  padding: 14px 2em 14px 16px;
  color: $text-color;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 12px;
  outline: none;
  box-shadow:
    inset 0 0 1px rgba(255, 255, 255, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur($glass-blur) saturate(180%);
  -webkit-backdrop-filter: blur($glass-blur) saturate(180%);
  transition: all $transition-duration ease;

  &::placeholder {
    color: $placeholder-color;
  }

  &:focus {
    box-shadow:
      0 0 0 2px $primary-color,
      0 0 12px rgba(0, 122, 255, 0.2);
  }

  &.has-error {
    box-shadow:
      0 0 0 2px $error-color,
      0 0 12px rgba(255, 59, 48, 0.2);
  }

  @media (max-aspect-ratio: 1/1) {
    padding: 16px 2.5em 16px 16px;
    font-size: 18px;
  }
}

.input-icon,
.password-toggle {
  position: absolute;
  top: 50%;
  right: $control-right;
  font-size: 16px;
  user-select: none;
  transform: translateY(-50%);
}

.input-icon {
  color: transparent;
  pointer-events: none;
}

.password-toggle {
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-50%) scale(1.1);
  }
}

```

