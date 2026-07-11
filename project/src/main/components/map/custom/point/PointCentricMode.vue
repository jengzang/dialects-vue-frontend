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
import { useI18n } from 'vue-i18n'
import { getUserPoints } from '@/api'
import PointCardList from './PointCardList.vue'
import PointDetailForm from './PointDetailForm.vue'

const { t } = useI18n()

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
    errorMessage.value = error.message || t('customEntry.mode.pointLoadFailed')
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
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.point-mode-shell {
  @include flex-col;
  gap: $spacing-md;
}
</style>
