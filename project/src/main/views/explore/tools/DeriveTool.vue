<template>
  <div class="derive-tool-page">
    <div class="glass-container glass-container-shell derive-tool-shell">
      <div class="derive-tool-placeholder">
        <p class="derive-tool-placeholder__text">当前页面仅为占位，功能尚未实现。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.derive-tool-page {
  min-height: 100vh;
  padding: clamp(24px, 4vw, 40px);
}

.derive-tool-shell {
  margin: 0 auto;
  padding: clamp(24px, 4vw, 40px);
}

.derive-tool-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.derive-tool-placeholder__text {
  font-size: 16px;
  color: rgba(var(--text-secondary-rgb), 0.48);
}
</style>
