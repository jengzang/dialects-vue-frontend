<template>
  <div class="location-quick-fill-list">
    <button
      v-for="location in QUICK_LOCATIONS"
      :key="location"
      type="button"
      class="pill-btn location-quick-fill"
      @click="emit('apply', location)"
    >
      <span>{{ location }}</span>
      <svg
        class="location-quick-fill__arrow"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </button>
  </div>
</template>

<script setup>
// 按需求固定使用繁體中文，不隨介面語言切換
const QUICK_LOCATIONS = ['北京', '上海', '廣州', '成都']

const emit = defineEmits(['apply'])
</script>

<style lang="scss" scoped>
.location-quick-fill-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 1.5dvh;
}

.location-quick-fill {
  gap: 3px;
}

.location-quick-fill__arrow {
  flex: 0 0 auto;
}
</style>
