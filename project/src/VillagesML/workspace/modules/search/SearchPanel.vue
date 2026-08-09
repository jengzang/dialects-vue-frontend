<template>
  <div class="vml-glass-panel">
    <h3 class="villagesml-subtab-title">
      搜索特定自然村
      <HelpIcon
        content="支持關鍵詞模糊匹配（SQL LIKE '%keyword%'）和三級行政區（市→縣→鎮）聯動篩選"
        size="md"
        fontSize="16px"
        trigger="both"
      />
    </h3>
    <div class="vml-control-surface">
      <!-- Search Input -->
      <div class="search-input-group vml-control-row">
        <div class="vml-control-field">
          <input
            v-model="localKeyword"
            type="text"
            class="search-input vml-char-input"
            placeholder="搜尋村名..."
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="vml-control-actions">
          <button class="search-button solid-button" @click="handleSearch"><InlineIcon icon="🔍" />搜索
          </button>
        </div>
      </div>
    </div>

    <div class="vml-control-surface">
      <!-- Filters -->
      <div class="filters-row vml-control-row vml-control-row--center">
        <div class="vml-control-field">
          <FilterableSelect
            v-model="localFilters.city"
            level="city"
            :show-level-selector="false"
            placeholder="全部城市"
            @update:modelValue="handleCityChange"
          />
        </div>

        <div class="vml-control-field">
          <FilterableSelect
            v-model="localFilters.county"
            level="county"
            :parent="localFilters.city"
            :show-level-selector="false"
            :disabled="!localFilters.city"
            placeholder="全部區縣"
            @update:modelValue="handleCountyChange"
          />
        </div>

        <div class="vml-control-field">
          <FilterableSelect
            v-model="localFilters.township"
            level="township"
            :parent="townshipParent"
            :show-level-selector="false"
            :disabled="!canSelectTownship"
            placeholder="全部鄉鎮"
            @update:modelValue="handleSearch"
          />
        </div>

        <div class="vml-control-actions">
          <button class="clear-filters-button" @click="clearFilters" v-if="hasFilters"><InlineIcon icon="✕" />清除篩選
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed } from 'vue'
import { villagesMLStore } from '@/VillagesML/store/villagesMLStore.js'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { cityHasCounties } from '@/VillagesML/utils/regionPreload.js'

const emit = defineEmits(['search'])

// Local state
const localKeyword = ref(villagesMLStore.searchKeyword)
const localFilters = ref({ ...villagesMLStore.searchFilters })
const hasCounties = ref(true)  // 标记当前城市是否有区县

// Computed
const hasFilters = computed(() => {
  return localFilters.value.city || localFilters.value.county || localFilters.value.township
})

// 判断是否可以选择乡镇
const canSelectTownship = computed(() => {
  // 如果选择了区县，可以选择乡镇
  if (localFilters.value.county) return true

  // 如果选择了城市，且该城市没有区县，也可以选择乡镇
  if (localFilters.value.city && !hasCounties.value) return true

  return false
})

// 乡镇选择器的 parent
const townshipParent = computed(() => {
  // 如果有区县，parent 是区县
  if (localFilters.value.county) return localFilters.value.county

  // 如果没有区县但有城市，parent 是城市（用于东莞市、中山市等）
  if (localFilters.value.city && !hasCounties.value) return localFilters.value.city

  return null
})

// Methods
const handleSearch = () => {
  // console.log('[SearchPanel] handleSearch called with filters:', localFilters.value)
  villagesMLStore.searchKeyword = localKeyword.value
  villagesMLStore.searchFilters = { ...localFilters.value }
  emit('search')
}

const handleCityChange = async () => {
  localFilters.value.county = ''
  localFilters.value.township = ''

  // 检查该城市是否有区县（从预加载的数据中检查，无 API 请求）
  if (localFilters.value.city) {
    hasCounties.value = await cityHasCounties(localFilters.value.city)
  } else {
    hasCounties.value = true
  }

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

<style scoped lang="scss">
.vml-glass-panel {
  padding: 20px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md);
  background: var(--glass-50);
  backdrop-filter: blur(10px);
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--glass-70);
}

.search-button {
  padding: 12px 24px;
  max-width: 100px;
  white-space: nowrap;
}

.clear-filters-button {
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters-button:hover {
  background: rgba(var(--color-warning-rgb), 0.3);
}

@media (max-width: 768px) {
  .vml-glass-panel {
    padding: 14px;
  }

  .search-button {
    width: 100%;
  }
}
</style>
