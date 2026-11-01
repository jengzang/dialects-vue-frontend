<template>
  <canvas
    ref="canvas"
    class="blue-layout-background"
    aria-hidden="true"
  />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { drawBlueLayoutBackground, loadBlueBackgroundResources } from '@/utils/ui/blueLayoutBackground.js'

const canvas = ref(null)
const emit = defineEmits(['ready'])
let resources
let observer
let frame = 0
let disposed = false

function queueDraw() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    if (disposed || !resources || !canvas.value) return
    const { width, height } = canvas.value.getBoundingClientRect()
    if (!width || !height) return
    const style = getComputedStyle(canvas.value)
    const colors = Object.fromEntries(['dot'].map(key => [
      key, style.getPropertyValue(`--blue-background-${key}`).trim(),
    ]))
    drawBlueLayoutBackground(canvas.value, resources, width, height, colors, window.devicePixelRatio || 1)
    emit('ready', true)
  })
}

onMounted(async () => {
  observer = new ResizeObserver(queueDraw)
  observer.observe(canvas.value)
  window.addEventListener('resize', queueDraw, { passive: true })
  resources = await loadBlueBackgroundResources()
  if (!disposed) {
    if (resources) queueDraw()
    else emit('ready', false)
  }
})

onBeforeUnmount(() => {
  disposed = true
  emit('ready', false)
  cancelAnimationFrame(frame)
  observer?.disconnect()
  window.removeEventListener('resize', queueDraw)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.blue-layout-background {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
</style>
