<template>
  <div class="button-group">
    <div v-for="key in availableKeys" :key="key" class="key-item">
      <button
        :class="['key-button', { active: modelValue.includes(key) }]"
        @click="toggleKey(key)"
      >
        {{ key }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  availableKeys: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  exclusiveRules: {
    type: Object,
    default: () => ({ groups: [] })
  },
  singleSelectKeys: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

function toggleKey(key) {
  let newList = [...props.modelValue]
  const index = newList.indexOf(key)

  if (index > -1) {
    // Remove the key
    newList.splice(index, 1)
  } else {
    // Handle exclusive logic
    props.exclusiveRules.groups.forEach(group => {
      if (group.includes(key)) {
        newList = newList.filter(item => !group.includes(item) || item === key)
      }
    })

    // Handle single select restriction
    if (props.singleSelectKeys.includes(key)) {
      newList = newList.filter(item => !props.singleSelectKeys.includes(item))
    }

    newList.push(key)
  }

  emit('update:modelValue', newList)
}
</script>

<style scoped>
.button-group {
  flex-wrap: wrap;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid var(--color-primary-hover);
}

.key-item {
  flex: 0 1 auto;
}

.key-button {
  padding: 8px 16px;
  border: 1px solid var(--color-primary-medium);
  border-radius: 12px;
  background: var(--glass-30);
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: 14px;
  margin: 5px;
}

@media(max-width: 600px) {
  .key-button {
    padding: 8px 10px;
    margin: 3px;
  }
}

.key-button.active {
  background: var(--color-primary-medium2);
  color: white;
  font-weight: 600;
}
</style>
