<template>
  <div class="villages-ml-page">
    <!-- Only show Dashboard -->
    <Dashboard />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// Lazy load Dashboard component
const Dashboard = defineAsyncComponent(() => import('@/VillagesML/dashboard/Dashboard.vue'))
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.villages-ml-page {
  @include flex-col;
  min-height: 92dvh;
  width: 98dvw;
  max-width: 1600px;
  margin: 0 auto;
  padding: 10px 20px;
  box-sizing: border-box;
}
</style>
