<template>
  <div class="vocabulary-manage-page">
    <section class="content-area">
      <div class="locations-mode main-glass-panel">
        <div class="locations-head">
          <div>
            <h3>{{ t('words.wordList.locations.title') }}</h3>
            <p>{{ t('words.wordList.locations.desc') }}</p>
          </div>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="loadVocabularyLocations">
            {{ t('words.wordList.locations.refresh') }}
          </button>
        </div>

        <div v-if="locationsLoadError" class="empty-state empty-state-base">
          <p>{{ locationsLoadError }}</p>
        </div>

        <div v-else-if="isLoadingLocations" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
        </div>

        <div v-else class="locations-list">
          <article v-for="location in locationRows" :key="`${location.user_id || ''}-${location.location_name}`" class="location-item">
            <div class="location-item-head">
              <div>
                <strong>{{ location.location_name }}</strong>
                <p>{{ location.location_label || location.location_name }}</p>
              </div>
              <button class="main-glass-button" data-variant="primary" type="button" @click="handleSaveLocation(location)">
                {{ t('words.wordList.locations.save') }}
              </button>
            </div>
            <div class="locations-edit-grid">
              <label v-for="field in locationEditFields" :key="field.key" class="upload-field">
                <span>{{ field.label }}</span>
                <input v-model="location[field.key]" type="text" />
              </label>
            </div>
          </article>
        </div>
        <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVocabularyLocations, updateVocabularyLocation } from '@/api'

const { t } = useI18n()

const isLoadingLocations = ref(false)
const locationsLoadError = ref('')
const locationsStatusText = ref('')

const locationRows = ref([])

const locationEditFields = computed(() => [
  { key: 'coordinates', label: t('words.wordList.upload.coordinates') },
  { key: 'province', label: t('words.wordList.upload.province') },
  { key: 'city', label: t('words.wordList.upload.city') },
  { key: 'county', label: t('words.wordList.upload.county') },
  { key: 'town', label: t('words.wordList.upload.town') },
  { key: 'administrative_village', label: t('words.wordList.upload.administrativeVillage') },
  { key: 'natural_village', label: t('words.wordList.upload.naturalVillage') },
  { key: 'yindian_region', label: t('words.wordList.upload.yindianRegion') },
  { key: 'atlas_region', label: t('words.wordList.upload.atlasRegion') },
])

async function loadVocabularyLocations() {
  isLoadingLocations.value = true
  locationsLoadError.value = ''

  try {
    const response = await getVocabularyLocations({ page: 1, page_size: 200 })
    locationRows.value = Array.isArray(response.locations)
      ? response.locations.map((location) => ({ ...location }))
      : []
  } catch (error) {
    locationsLoadError.value = error.message || '獲取詞表地點信息失敗'
    locationRows.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

async function handleSaveLocation(location) {
  if (!location?.location_name) {
    return
  }

  const payload = Object.fromEntries(
    locationEditFields.value.map((field) => [field.key, String(location[field.key] || '').trim()])
  )
  const params = location.user_id ? { user_id: location.user_id } : {}
  locationsStatusText.value = ''

  try {
    await updateVocabularyLocation(location.location_name, payload, params)
    locationsStatusText.value = t('words.wordList.locations.saveSuccess')
    await loadVocabularyLocations()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.saveFailed')
  }
}

onMounted(() => {
  loadVocabularyLocations()
})
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
