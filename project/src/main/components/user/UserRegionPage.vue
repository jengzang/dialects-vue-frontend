<template>
  <div class="user-region-page">
    <div class="page-header liquid-panel">
      <button class="liquid-btn back-btn" type="button" @click="goBack">
        {{ t('common.button.back') }}
      </button>

      <div class="page-title-group">
        <h1 class="page-title">
          <span class="title-icon">🗂️</span>
          <span>{{ t('user.regionPage.title') }}</span>
        </h1>

        <div class="header-stats">
          <span class="header-stat">
            <span class="header-stat-label">{{ t('user.regionPage.stats.regionCount') }}</span>
            <span class="header-stat-value">{{ regions.length }}</span>
          </span>
          <span class="header-stat">
            <span class="header-stat-label">{{ t('user.regionPage.stats.locationCount') }}</span>
            <span class="header-stat-value">{{ totalLocations }}</span>
          </span>
        </div>
      </div>

      <div class="user-badge">{{ username }}</div>
    </div>

    <div class="toolbar liquid-panel">
      <div class="toolbar-actions">
        <button class="liquid-btn btn-primary" type="button" @click="openCreateModal">
          <span class="btn-icon">+</span>
          {{ t('user.regionPage.actions.create') }}
        </button>
        <button class="liquid-btn btn-secondary" type="button" @click="loadRegions">
          <span class="btn-icon">↻</span>
          {{ t('user.regionPage.actions.refresh') }}
        </button>
      </div>

      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('user.regionPage.searchPlaceholder')"
          class="search-input"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-container loading-state-base status-panel liquid-panel">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ t('common.label.loading') }}</p>
    </div>

    <div
      v-else-if="!loading && filteredRegions.length === 0"
      class="empty-state empty-state-base status-panel liquid-panel"
    >
      <div class="empty-icon">📭</div>
      <p class="empty-text">
        {{ searchQuery ? t('user.regionPage.empty.noMatch') : t('user.regionPage.empty.noRegions') }}
      </p>
      <button v-if="!searchQuery" class="liquid-btn btn-primary" type="button" @click="openCreateModal">
        {{ t('user.regionPage.empty.createFirst') }}
      </button>
    </div>

    <div v-else class="region-list">
      <div v-for="region in filteredRegions" :key="region.id" class="region-card liquid-panel">
        <div class="region-header">
          <div class="region-title-group">
            <h3 class="region-name">{{ region.region_name }}</h3>
            <span class="info-badge">
              {{
                t('user.regionPage.format.locationCount', {
                  count: region.location_count || region.locations?.length || 0
                })
              }}
            </span>
          </div>

          <div class="region-actions">
            <button
              class="btn-icon-action"
              type="button"
              :title="t('common.button.edit')"
              @click="openEditModal(region)"
            >
              ✏️
            </button>
            <button
              class="btn-icon-action danger"
              type="button"
              :title="t('common.button.delete')"
              :disabled="deletingRegions[region.region_name]"
              @click="deleteRegion(region.region_name)"
            >
              <span
                v-if="deletingRegions[region.region_name]"
                class="ui-loading--inline"
                aria-hidden="true"
              >
                ↻
              </span>
              <span v-else>🗑️</span>
            </button>
          </div>
        </div>

        <div class="region-info">
          <span v-if="region.created_at" class="info-date">
            {{ t('user.regionPage.format.createdAt', { date: formatDate(region.created_at) }) }}
          </span>
          <p v-if="region.description" class="region-description">
            {{ region.description }}
          </p>
        </div>

        <div class="region-locations">
          <span
            v-for="(loc, idx) in (region.locations || []).slice(0, 10)"
            :key="idx"
            class="location-tag"
          >
            {{ loc }}
          </span>
          <span v-if="(region.locations || []).length > 10" class="location-more">
            +{{ (region.locations || []).length - 10 }}
          </span>
        </div>
      </div>
    </div>

    <UserRegionEditPopup
      :visible="showEditModal"
      :form-state="{ editingRegion, locationInput }"
      :stats="{ availableLocations, treeSelectedCount, manualInputCount }"
      :ui-state="{ canSave, isSaving }"
      @close="closeEditModal"
      @save="saveRegion"
      @open-location-selector="openLocationSelector"
      @update:formState="({ editingRegion: nextRegion, locationInput: nextLocationInput }) => { editingRegion = nextRegion; locationInput = nextLocationInput }"
      @location-input="updateLocationsFromTextarea"
    />

    <PartitionInfoModal
      v-model="showPartitionModal"
      :data-state="{ partitionData, isLoading: isLoadingPartitions, errorMessage: partitionTreeError }"
      :selection-state="{ initialTab: 'map', autoEnableSelection, initialSelectedLocations: editingRegion.locations, maxSelection: CUSTOM_REGION_MAX_LOCATIONS }"
      @locations-selected="handleLocationsSelected"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { createOrUpdateCustomRegion, deleteCustomRegion, getLocationPartitions } from '@/api'
import PartitionInfoModal from '@/main/components/geo/PartitionInfoModal.vue'
import UserRegionEditPopup from '@/main/components/user/popups/UserRegionEditPopup.vue'
import { CUSTOM_REGION_MAX_LOCATIONS } from '@/main/config/constants.js'
import { useCustomRegionStore } from '@/main/store/customRegionStore'
import { useAsyncData } from '@/composables/core/useAsyncData.js'
import { showConfirm, showError, showSuccess, showWarning } from '@/utils/message.js'
import { usePartitionCache } from '@/composables/domain/usePartitionCache.js'

const { t, locale } = useI18n()
const { getPartitionData } = usePartitionCache()
const router = useRouter()
const route = useRoute()

const { invalidateCache, refresh } = useCustomRegionStore()

const regions = ref([])
const searchQuery = ref('')
const showEditModal = ref(false)
const editingRegion = ref({
  region_name: '',
  locations: [],
  description: ''
})
const isSaving = ref(false)
const deletingRegions = ref({})
const locationInput = ref('')
const username = computed(() => route.query.username || t('user.regionPage.usernameFallback'))
const hasShownCustomRegionLimitWarning = ref(false)

const showPartitionModal = ref(false)
const partitionData = ref([])
const partitionTreeError = ref('')
const autoEnableSelection = ref(false)
const regionsQuery = useAsyncData({
  initialValue: []
})
const partitionQuery = useAsyncData({
  initialValue: []
})
const loading = regionsQuery.loading
const isLoadingPartitions = partitionQuery.loading

const availableLocations = computed(() => {
  if (!partitionData.value || partitionData.value.length === 0) {
    return new Set()
  }

  const locations = partitionData.value
    .map((row) => row['簡稱'])
    .filter((name) => name && name.trim())

  return new Set(locations)
})

const totalLocations = computed(() => {
  const uniqueLocations = new Set()
  regions.value.forEach((region) => {
    ;(region.locations || []).forEach((loc) => uniqueLocations.add(loc))
  })
  return uniqueLocations.size
})

const filteredRegions = computed(() => {
  if (!searchQuery.value) return regions.value

  const query = searchQuery.value.toLowerCase()
  return regions.value.filter((region) => region.region_name.toLowerCase().includes(query))
})

const canSave = computed(() => (
  editingRegion.value.region_name.trim() &&
  editingRegion.value.locations.length > 0 &&
  editingRegion.value.locations.length <= CUSTOM_REGION_MAX_LOCATIONS
))

const customRegionLocationLimitExceeded = computed(
  () => editingRegion.value.locations.length > CUSTOM_REGION_MAX_LOCATIONS
)

const getCustomRegionLocationLimitExceededMessage = (count) => (
  t('user.regionPage.messages.customRegionLocationLimitExceeded', {
    limit: CUSTOM_REGION_MAX_LOCATIONS,
    count
  })
)

const showCustomRegionLocationLimitWarning = (count) => {
  if (!hasShownCustomRegionLimitWarning.value) {
    hasShownCustomRegionLimitWarning.value = true
    showWarning(getCustomRegionLocationLimitExceededMessage(count))
  }
}

const resetCustomRegionLocationLimitWarning = () => {
  hasShownCustomRegionLimitWarning.value = false
}

const syncCustomRegionLocationLimitWarningState = (count) => {
  if (count > CUSTOM_REGION_MAX_LOCATIONS) {
    showCustomRegionLocationLimitWarning(count)
    return
  }

  resetCustomRegionLocationLimitWarning()
}

const forceShowCustomRegionLocationLimitWarning = (count) => {
  resetCustomRegionLocationLimitWarning()
  showWarning(getCustomRegionLocationLimitExceededMessage(count))
}

const treeSelectedCount = computed(() => {
  const allLocations = locationInput.value
    .split(/\s+/)
    .map((loc) => loc.trim())
    .filter((loc) => loc.length > 0)

  const uniqueLocations = new Set(allLocations)
  return [...uniqueLocations].filter((loc) => availableLocations.value.has(loc)).length
})

const manualInputCount = computed(() => {
  const allLocations = locationInput.value
    .split(/\s+/)
    .map((loc) => loc.trim())
    .filter((loc) => loc.length > 0)

  const uniqueLocations = new Set(allLocations)
  return [...uniqueLocations].filter((loc) => !availableLocations.value.has(loc)).length
})

const goBack = () => {
  router.back()
}

const loadRegions = async () => {
  await regionsQuery.load(() => refresh(), {
    onSuccess: (data) => {
      regions.value = data.regions || []

      if (regions.value.length > 0) {
        showSuccess(
          t('user.regionPage.messages.loadSuccessCount', { count: regions.value.length })
        )
      } else {
        showWarning(t('user.regionPage.messages.noRegionsWarning'))
      }
    },
    onError: (error) => {
      showError(t('user.regionPage.messages.loadFailed', { message: error.message }))
    }
  })
}

const fetchPartitionData = async () => {
  partitionTreeError.value = ''
  await partitionQuery.load(() => getPartitionData(() => getLocationPartitions()), {
    onSuccess: (data) => {
      partitionData.value = data
    },
    onError: (error) => {
      console.error('Failed to fetch partition data:', error)
      partitionTreeError.value = t('user.regionPage.messages.partitionDataFailed')
    }
  })
}

const updateLocationsFromTextarea = () => {
  const inputLocations = locationInput.value
    .split(/\s+/)
    .map((loc) => loc.trim())
    .filter((loc) => loc.length > 0)

  editingRegion.value.locations = [...new Set(inputLocations)]
  syncCustomRegionLocationLimitWarningState(editingRegion.value.locations.length)
}

const syncLocationsToTextarea = () => {
  locationInput.value = editingRegion.value.locations.join(' ')
}

const openCreateModal = () => {
  editingRegion.value = {
    region_name: '',
    locations: [],
    description: ''
  }
  locationInput.value = ''
  showEditModal.value = true
  resetCustomRegionLocationLimitWarning()

  if (partitionData.value.length === 0) {
    fetchPartitionData()
  }
}

const openEditModal = (region) => {
  editingRegion.value = {
    id: region.id,
    region_name: region.region_name,
    locations: [...(region.locations || [])],
    description: region.description || ''
  }
  locationInput.value = (region.locations || []).join(' ')
  showEditModal.value = true
  resetCustomRegionLocationLimitWarning()

  if (partitionData.value.length === 0) {
    fetchPartitionData()
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  locationInput.value = ''
  resetCustomRegionLocationLimitWarning()
  editingRegion.value = {
    region_name: '',
    locations: [],
    description: ''
  }
}

const saveRegion = async () => {
  if (customRegionLocationLimitExceeded.value) {
    forceShowCustomRegionLocationLimitWarning(editingRegion.value.locations.length)
    return
  }

  if (!canSave.value) return

  isSaving.value = true
  try {
    const data = {
      region_name: editingRegion.value.region_name.trim(),
      locations: editingRegion.value.locations,
      description: editingRegion.value.description?.trim() || ''
    }

    if (!editingRegion.value.id) {
      const existingRegion = regions.value.find((region) => region.region_name === data.region_name)

      if (existingRegion) {
        const confirmed = await showConfirm(
          t('user.regionPage.messages.duplicateConfirmMessage', {
            name: data.region_name
          }),
          {
            title: t('user.regionPage.messages.duplicateConfirmTitle'),
            confirmText: t('user.regionPage.messages.duplicateConfirmAction'),
            cancelText: t('common.button.cancel')
          }
        )

        if (!confirmed) {
          isSaving.value = false
          return
        }
      }
    }

    await createOrUpdateCustomRegion(data)
    showSuccess(
      editingRegion.value.id
        ? t('user.regionPage.messages.updateSuccess')
        : t('user.regionPage.messages.createSuccess')
    )

    invalidateCache()

    closeEditModal()
    await loadRegions()
  } catch (error) {
    showError(t('user.regionPage.messages.saveFailed', { message: error.message }))
  } finally {
    isSaving.value = false
  }
}

const deleteRegion = async (regionName) => {
  const confirmed = await showConfirm(
    t('user.regionPage.messages.deleteConfirmMessage', { name: regionName }),
    {
      title: t('user.regionPage.messages.deleteConfirmTitle'),
      confirmText: t('common.button.delete'),
      cancelText: t('common.button.cancel')
    }
  )

  if (!confirmed) return

  deletingRegions.value[regionName] = true
  try {
    await deleteCustomRegion(regionName)
    showSuccess(t('user.regionPage.messages.deleteSuccess'))

    invalidateCache()

    await loadRegions()
  } catch (error) {
    showError(t('user.regionPage.messages.deleteFailed', { message: error.message }))
  } finally {
    delete deletingRegions.value[regionName]
  }
}

const openLocationSelector = () => {
  autoEnableSelection.value = true
  showPartitionModal.value = true
}

const handleLocationsSelected = (locations) => {
  if (locations.length > CUSTOM_REGION_MAX_LOCATIONS) {
    forceShowCustomRegionLocationLimitWarning(locations.length)
    return
  }

  editingRegion.value.locations = locations
  syncLocationsToTextarea()
  resetCustomRegionLocationLimitWarning()
  showPartitionModal.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return ''

  const formattedStr = (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+') && !/-\d{2}:?\d{2}$/.test(dateString))
    ? (dateString.includes('T') ? dateString + 'Z' : dateString.replace(' ', 'T') + 'Z')
    : dateString

  const date = new Date(formattedStr)
  const currentLocale = locale.value === 'en' ? 'en-US' : locale.value

  return new Intl.DateTimeFormat(currentLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

watch(showPartitionModal, (isVisible) => {
  if (!isVisible) {
    autoEnableSelection.value = false
  }
})

onMounted(() => {
  void loadRegions()
})
</script>


$region-text: var(--text-deep);
$region-muted: var(--text-tertiary);
$region-soft: var(--text-slate-light);
$region-accent: var(--color-primary);
$region-danger: var(--color-error-light);
$region-success: var(--color-success);
$region-border: rgba(148, 163, 184, 0.22);
$region-glass-border: rgba(255, 255, 255, 0.58);

@mixin glass-panel($radius: 24px, $padding: 18px) {
  position: relative;
  padding: $padding;
  border: 1px solid $region-glass-border;
  border-radius: $radius;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.4)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.3));
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.12),
    0 8px 22px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 -1px 0 rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
}

@mixin control-glass {
  border: 1px solid rgba(255, 255, 255, 0.58);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.38)),
    rgba(255, 255, 255, 0.54);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 8px 22px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
}

@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 9px 16px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    opacity 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.985);
  }

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
    pointer-events: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.18),
      0 10px 26px rgba(15, 23, 42, 0.12);
  }
}

.user-region-page {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: min(1180px, calc(100dvw - 32px));
  min-height: 75dvh;
  margin: 0 auto;
  padding: clamp(12px, 2vw, 24px);
  color: $region-text;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
      radial-gradient(circle at 12% 10%, rgba(0, 122, 255, 0.16), transparent 30%),
      radial-gradient(circle at 84% 14%, rgba(88, 86, 214, 0.14), transparent 32%),
      radial-gradient(circle at 70% 86%, rgba(52, 199, 89, 0.11), transparent 34%),
      linear-gradient(180deg, #f8fbff 0%, #eef4ff 48%, #f9fbff 100%);
  }

  &::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.28) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.22) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.32), transparent 72%);
  }
}

.liquid-panel {
  @include glass-panel;
}

.page-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;

  .page-title-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    gap: 8px;
  }

  .page-title {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    gap: 10px;
    margin: 0;
    color: $region-text;
    font-size: clamp(20px, 2.3vw, 28px);
    font-weight: 800;
    letter-spacing: -0.04em;
    white-space: nowrap;
  }

  .title-icon {
    display: inline-flex;
    filter: drop-shadow(0 8px 18px rgba(0, 122, 255, 0.2));
  }

  .header-stats {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 4px 10px;
    border: 1px solid rgba(255, 255, 255, 0.52);
    border-radius: 999px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.36)),
      rgba(0, 122, 255, 0.06);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.66),
      0 8px 18px rgba(0, 122, 255, 0.06);
  }

  .header-stat-label {
    color: $region-muted;
    font-size: 12px;
    font-weight: 750;
    line-height: 1;
    white-space: nowrap;
  }

  .header-stat-value {
    color: $region-accent;
    font-size: 16px;
    font-weight: 850;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .user-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 220px;
    min-height: 34px;
    padding: 6px 13px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 999px;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
    background:
      linear-gradient(135deg, rgba(0, 122, 255, 0.96), rgba(88, 86, 214, 0.88)),
      $region-accent;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 10px 24px rgba(0, 122, 255, 0.24);
  }
}

.liquid-btn {
  @include button-base;
}

.back-btn,
.btn-secondary {
  @include control-glass;

  color: $region-text;

  &:hover:not(:disabled) {
    border-color: rgba(0, 122, 255, 0.3);
    color: $region-accent;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.5)),
      rgba(0, 122, 255, 0.08);
  }
}

.back-btn:hover:not(:disabled) {
  transform: translateX(-2px);
}

.btn-primary {
  color: #fff;
  background:
    linear-gradient(135deg, rgba(0, 122, 255, 0.96), rgba(0, 81, 213, 0.92)),
    $region-accent;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 12px 28px rgba(0, 122, 255, 0.26);

  &:hover:not(:disabled) {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 16px 36px rgba(0, 122, 255, 0.34);
  }
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}


.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-box {
  flex: 1;
  max-width: 360px;
  min-width: 220px;
}

.search-input {
  @include control-glass;

  width: 100%;
  height: 42px;
  padding: 10px 15px;
  border-radius: 15px;
  color: $region-text;
  font-size: 14px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;

  &::placeholder {
    color: $region-soft;
  }

  &:focus {
    outline: none;
    border-color: rgba(0, 122, 255, 0.56);
    background: rgba(255, 255, 255, 0.84);
    box-shadow:
      0 0 0 4px rgba(0, 122, 255, 0.11),
      inset 0 1px 0 rgba(255, 255, 255, 0.76);
  }
}

.status-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  margin-top: 18px;
  text-align: center;
}

.loading-container {
  flex-direction: column;
  gap: 14px;
  color: $region-accent;

  p {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
}

.empty-state {
  flex-direction: column;
  gap: 12px;
  padding: 28px;
}

.empty-icon {
  font-size: 58px;
  filter: drop-shadow(0 12px 26px rgba(15, 23, 42, 0.12));
}

.empty-text {
  margin: 0;
  color: $region-muted;
  font-size: 15px;
  font-weight: 700;
}

.region-list {
  display: grid;
  gap: 14px;
}

.region-card {
  overflow: hidden;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background:
      radial-gradient(circle at 10% 0%, rgba(0, 122, 255, 0.12), transparent 32%),
      radial-gradient(circle at 92% 18%, rgba(52, 199, 89, 0.1), transparent 28%);
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 122, 255, 0.24);
    box-shadow:
      0 26px 76px rgba(15, 23, 42, 0.14),
      0 12px 28px rgba(0, 122, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.84);

    &::before {
      opacity: 1;
    }
  }
}

.region-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.region-title-group {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  flex-wrap: wrap;
}

.region-name {
  margin: 0;
  color: $region-text;
  font-size: 18px;
  font-weight: 820;
  letter-spacing: -0.02em;
}

.region-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-icon-action {
  @include control-glass;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(0, 122, 255, 0.32);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.48)),
      rgba(0, 122, 255, 0.08);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.danger {
    border-color: rgba(255, 59, 48, 0.2);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.38)),
      rgba(255, 59, 48, 0.08);

    &:hover:not(:disabled) {
      border-color: rgba(255, 59, 48, 0.38);
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.44)),
        rgba(255, 59, 48, 0.13);
    }
  }
}

.ui-loading--inline {
  display: inline-flex;
  animation: region-spin 0.8s linear infinite;
}

@keyframes region-spin {
  to {
    transform: rotate(360deg);
  }
}

.region-info {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.info-badge,
.info-date,
.location-tag,
.location-more {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
  line-height: 1;
}

.info-badge {
  color: $region-accent;
  background: rgba(0, 122, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

.info-date {
  color: $region-muted;
  background: rgba(255, 255, 255, 0.44);
  border: 1px solid rgba(255, 255, 255, 0.52);
}

.region-description {
  flex-basis: 100%;
  margin: 0;
  color: var(--text-slate);
  font-size: 14px;
  line-height: 1.6;
}

.region-locations {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.location-tag {
  color: var(--text-slate);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.36)),
    rgba(15, 23, 42, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.48);
}

.location-more {
  color: $region-accent;
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.12);
}

@media (max-width: 768px) {
  .user-region-page {
    width: min(100%, calc(100dvw - 20px));
    padding: 12px;
  }

  .page-header {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    padding: 16px;
    text-align: center;

    .page-title-group {
      order: -1;
      grid-column: 1 / -1;
      gap: 7px;
    }

    .page-title {
      font-size: 20px;
      white-space: normal;
    }

    .header-stats {
      gap: 6px;
    }

    .header-stat {
      min-height: 26px;
      padding: 4px 9px;
    }

    .header-stat-label {
      font-size: 11px;
    }

    .header-stat-value {
      font-size: 15px;
    }

    .user-badge {
      justify-self: stretch;
      max-width: none;
    }
  }

  .back-btn {
    justify-self: start;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 14px;
  }

  .toolbar-actions {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .search-box {
    max-width: none;
    min-width: 0;
  }

  .search-input {
    height: 42px;
    font-size: 16px;
  }

  .region-card {
    padding: 16px;
  }

  .region-header {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .region-actions {
    align-self: flex-end;
  }

  .region-info {
    align-items: flex-start;
    flex-direction: column;
  }

  .info-date {
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .user-region-page {
    width: min(96dvw, calc(100dvw - 12px));
    padding: 8px;
  }

  .liquid-panel {
    border-radius: 18px;
  }

  .page-header,
  .toolbar,
  .region-card,
  .status-panel {
    padding: 14px;
  }

  .liquid-btn {
    width: 100%;
    min-height: 38px;
    padding-inline: 10px;
    font-size: 13px;
  }

  .back-btn {
    width: auto;
  }

  .page-title {
    font-size: 18px;
  }

  .page-header {
    .header-stats {
      width: 100%;
    }

    .header-stat {
      flex: 1 1 0;
      justify-content: center;
      min-width: 0;
      padding-inline: 8px;
    }

    .header-stat-label {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .region-name {
    font-size: 16px;
  }

  .region-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .btn-icon-action {
    width: 36px;
    height: 36px;
  }

  .empty-icon {
    font-size: 48px;
  }
}
