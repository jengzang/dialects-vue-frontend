<template>
  <div class="search-panel glass-panel">
    <!-- Search Input -->
    <div class="search-input-group">
      <input
        v-model="localKeyword"
        type="text"
        class="search-input"
        placeholder="搜尋村名..."
        @input="handleSearchInput"
      />
      <button class="search-button glass-button" @click="handleSearch">
        🔍 搜尋
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <select v-model="localFilters.city" class="filter-select" @change="handleCityChange">
        <option value="">全部城市</option>
        <option v-for="city in cities" :key="city.name || city" :value="city.name || city">{{ city.name || city }}</option>
      </select>

      <select v-model="localFilters.county" class="filter-select" @change="handleCountyChange" :disabled="!localFilters.city">
        <option value="">全部區縣</option>
        <option v-for="county in counties" :key="county.name || county" :value="county.name || county">{{ county.name || county }}</option>
      </select>

      <select v-model="localFilters.township" class="filter-select" :disabled="!localFilters.county">
        <option value="">全部鄉鎮</option>
        <option v-for="township in townships" :key="township.name || township" :value="township.name || township">{{ township.name || township }}</option>
      </select>

      <button class="clear-filters-button" @click="clearFilters" v-if="hasFilters">
        ✕ 清除篩選
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { getRegionList } from '@/api'
import { showError } from '@/utils/message.js'

const emit = defineEmits(['search'])

// Local state
const localKeyword = ref(villagesMLStore.searchKeyword)
const localFilters = ref({ ...villagesMLStore.searchFilters })
const cities = ref([])
const counties = ref([])
const townships = ref([])

let searchTimeout = null

// Computed
const hasFilters = computed(() => {
  return localFilters.value.city || localFilters.value.county || localFilters.value.township
})

// Methods
const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 300)
}

const handleSearch = () => {
  villagesMLStore.searchKeyword = localKeyword.value
  villagesMLStore.searchFilters = { ...localFilters.value }
  emit('search')
}

const handleCityChange = async () => {
  localFilters.value.county = ''
  localFilters.value.township = ''
  townships.value = []

  if (localFilters.value.city) {
    try {
      counties.value = await getRegionList('county', localFilters.value.city)
    } catch (error) {
      showError('載入區縣列表失敗')
    }
  } else {
    counties.value = []
  }

  handleSearch()
}

const handleCountyChange = async () => {
  localFilters.value.township = ''

  if (localFilters.value.county) {
    try {
      townships.value = await getRegionList('township', localFilters.value.county)
    } catch (error) {
      showError('載入鄉鎮列表失敗')
    }
  } else {
    townships.value = []
  }

  handleSearch()
}

const clearFilters = () => {
  localFilters.value = { city: '', county: '', township: '' }
  counties.value = []
  townships.value = []
  handleSearch()
}

// Load cities on mount
onMounted(async () => {
  try {
    cities.value = await getRegionList('city')
  } catch (error) {
    showError('載入城市列表失敗')
  }
})
</script>

<style scoped>
.search-panel {
  padding: 20px;
  margin-bottom: 20px;
}

.search-input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.7);
}

.search-button {
  padding: 12px 24px;
  white-space: nowrap;
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-filters-button {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: rgba(243, 156, 18, 0.2);
  color: var(--color-warning);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters-button:hover {
  background: rgba(243, 156, 18, 0.3);
}
</style>
