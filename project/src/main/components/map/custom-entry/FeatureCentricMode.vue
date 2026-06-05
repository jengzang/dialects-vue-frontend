<template>
  <div class="feature-mode-shell">
    <FeatureCardList
      v-if="view === 'list'"
      :items="featureItems"
      :loading="loading"
      :error-message="errorMessage"
      @select="handleSelectFeature"
      @create="handleCreateFeature"
      @retry="loadFeatures"
    />
    <FeatureDetailTable
      v-else
      :feature="selectedFeature"
      @back="handleBack"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getUserFeatures } from '@/api'
import FeatureCardList from './FeatureCardList.vue'
import FeatureDetailTable from './FeatureDetailTable.vue'

const loading = ref(false)
const errorMessage = ref('')
const featureItems = ref([])
const view = ref('list')
const selectedFeature = ref(null)

const loadFeatures = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getUserFeatures()
    featureItems.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error.message || '獲取特徵列表失敗'
    featureItems.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectFeature = (item) => {
  selectedFeature.value = item
  view.value = 'detail'
}

const handleCreateFeature = () => {
  selectedFeature.value = {
    '特徵': '',
    '聲韻調': ''
  }
  view.value = 'detail'
}

const handleBack = () => {
  selectedFeature.value = null
  view.value = 'list'
}

const handleSaved = async () => {
  await loadFeatures()
}

onMounted(() => {
  loadFeatures()
})
</script>

<style scoped lang="scss">
.feature-mode-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
