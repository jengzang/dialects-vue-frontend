<template>
  <div class="route-bridge" aria-hidden="true"></div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const targetPath = computed(() => route.fullPath || '/')

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.location.replace(targetPath.value)
  }
})
</script>

<style scoped lang="scss">
.route-bridge {
  width: 0;
  height: 0;
}
</style>
