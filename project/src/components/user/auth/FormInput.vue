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

<style scoped>
.form-row {
  width: 100%;
  margin: 12px 0;
  display: flex;
  justify-content: center;
  position: relative;
}

.form-input {
  width: 100%;
  max-width: 320px;
  padding: 14px 16px;
  padding-right: 2em;
  font-size: 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.08);
  color: #333;
  outline: none;
  transition: all 0.3s ease;
}

.form-input::placeholder {
  color: #999;
}

.form-input:focus {
  box-shadow: 0 0 0 2px #007aff, 0 0 12px rgba(0, 122, 255, 0.2);
}

.form-input.has-error {
  box-shadow: 0 0 0 2px #ff3b30, 0 0 12px rgba(255, 59, 48, 0.2);
}

.input-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: transparent;
  font-size: 16px;
  pointer-events: none;
  user-select: none;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  transition: transform 0.2s ease;
}

.password-toggle:hover {
  transform: translateY(-50%) scale(1.1);
}

/* Mobile responsive */
@media (max-aspect-ratio: 1/1) {
  .form-input {
    font-size: 18px;
    padding: 16px;
    padding-right: 2.5em;
  }
}
</style>
