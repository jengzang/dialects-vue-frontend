<template>
  <div class="point-mode-shell">
    <PointCardList
      v-if="view === 'list'"
      :items="pointItems"
      :loading="loading"
      :error-message="errorMessage"
      @select="handleSelectPoint"
      @create="handleCreatePoint"
      @retry="loadPoints"
    />
    <PointDetailForm
      v-else
      :point="selectedPoint"
      @back="handleBack"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getUserPoints } from '@/api'
import PointCardList from './PointCardList.vue'
import PointDetailForm from './PointDetailForm.vue'

const loading = ref(false)
const errorMessage = ref('')
const pointItems = ref([])
const view = ref('list')
const selectedPoint = ref(null)

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
  selectedPoint.value = item
  view.value = 'detail'
}

const handleCreatePoint = () => {
  selectedPoint.value = null
  view.value = 'detail'
}

const handleBack = () => {
  view.value = 'list'
  selectedPoint.value = null
}

const handleSaved = async () => {
  await loadPoints()
  view.value = 'list'
  selectedPoint.value = null
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
