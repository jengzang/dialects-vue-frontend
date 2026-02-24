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
      <FilterableSelect
        v-model="localFilters.city"
        level="city"
        :show-level-selector="false"
        placeholder="全部城市"
        @update:modelValue="handleCityChange"
      />

      <FilterableSelect
        v-model="localFilters.county"
        level="county"
        :parent="localFilters.city"
        :show-level-selector="false"
        :disabled="!localFilters.city"
        placeholder="全部區縣"
        @update:modelValue="handleCountyChange"
      />

      <FilterableSelect
        v-model="localFilters.township"
        level="township"
        :parent="localFilters.county"
        :show-level-selector="false"
        :disabled="!localFilters.county"
        placeholder="全部鄉鎮"
        @update:modelValue="handleSearch"
      />

      <button class="clear-filters-button" @click="clearFilters" v-if="hasFilters">
        ✕ 清除篩選
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import FilterableSelect from '@/components/common/FilterableSelect.vue'

const emit = defineEmits(['search'])

// Local state
const localKeyword = ref(villagesMLStore.searchKeyword)
const localFilters = ref({ ...villagesMLStore.searchFilters })

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

const handleCityChange = () => {
  localFilters.value.county = ''
  localFilters.value.township = ''
  handleSearch()
}

const handleCountyChange = () => {
  localFilters.value.township = ''
  handleSearch()
}

const clearFilters = () => {
  localFilters.value = { city: '', county: '', township: '' }
  handleSearch()
}
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
  justify-content: center;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
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
