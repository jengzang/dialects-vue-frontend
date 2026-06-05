<template>
  <div class="point-mode-shell">
    <PointCardList
      :items="pointItems"
      :loading="loading"
      :error-message="errorMessage"
      @select="handleSelectPoint"
      @create="handleCreatePoint"
      @retry="loadPoints"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getUserPoints } from '@/api'
import PointCardList from './PointCardList.vue'

const loading = ref(false)
const errorMessage = ref('')
const pointItems = ref([])

const loadPoints = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getUserPoints()
    pointItems.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error.message || '獲取方言點列表失敗'
    pointItems.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectPoint = (item) => {
  console.log('selected point', item)
}

const handleCreatePoint = () => {
  console.log('create point')
}

onMounted(() => {
  loadPoints()
})
</script>

<style scoped lang="scss">
.point-mode-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
