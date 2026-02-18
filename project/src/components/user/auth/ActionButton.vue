<template>
  <button
    :class="['btn-action', variant]"
    :disabled="disabled || loading"
    @click="$emit('click')"
    class="action-button"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <slot v-else></slot>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'danger', 'info', 'yellow', 'teal'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
.action-button {
  padding: 14px 18px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 180px;
  justify-content: center;
  margin: 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-action.blue {
  background-color: #007aff;
}

.btn-action.blue:hover:not(:disabled) {
  background-color: #005fcc;
}

.btn-action.green {
  background-color: #28a745;
}

.btn-action.green:hover:not(:disabled) {
  background-color: #1f8a36;
}

.btn-action.danger {
  background-color: darkred;
}

.btn-action.danger:hover:not(:disabled) {
  background-color: #a91f1f;
}

.btn-action.info {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.btn-action.info:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3, #5f3d8a);
}

.btn-action.yellow {
  background-color: #f39c12;
  color: #ffffff;
}

.btn-action.yellow:hover:not(:disabled) {
  background-color: #e67e22;
}

.btn-action.teal {
  background: linear-gradient(135deg, #5AC8FA, #4A9FD8);
  box-shadow: 0 4px 12px rgba(90, 200, 250, 0.3);
}

.btn-action.teal:hover:not(:disabled) {
  background: linear-gradient(135deg, #4AB8E8, #3A8FC6);
  box-shadow: 0 6px 16px rgba(90, 200, 250, 0.4);
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile responsive */
@media (max-aspect-ratio: 1/1) {
  .action-button {
    font-size: 18px;
    padding: 12px 20px;
  }
}
</style>
