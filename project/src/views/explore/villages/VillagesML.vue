<template>
  <div class="villages-ml-page">
    <!-- Only show Dashboard -->
    <Dashboard />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// Lazy load Dashboard component
const Dashboard = defineAsyncComponent(() => import('@/components/villagesML/system/Dashboard.vue'))
</script>

<style scoped>
.villages-ml-page {
  display: flex;
  flex-direction: column;
  height: 92dvh;
  width: 98dvw;
  max-width: 1600px;
  margin: 0 auto;
  padding: 10px 20px;
  box-sizing: border-box;
  overflow: auto;
}
</style>