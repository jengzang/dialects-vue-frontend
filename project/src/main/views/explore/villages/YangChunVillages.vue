<template>
  <div class="glass-container glass-shell">
    <div class="header-section">
      <div class="title-row">
        <h1 style="margin: 0;font-size: 1.5em;"><BarIcon icon="🏕️" />{{ t('navigation.pageTitles.villages.yangChun') }}</h1>
        <RouterLink class="cross-link" :to="localeTo('/explore/yc/words')">{{ t('words.ycSpoken.name') }} →</RouterLink>
      </div>
      <p>{{ t('villages.pages.yangChun.source') }}</p>
    </div>

    <!-- Floating Search -->
    <FloatingSearch
      v-model="searchQuery"
      :placeholder="t('villages.pages.yangChun.searchPlaceholder')"
      :close-label="t('common.button.close')"
    />

    <div class="tree-content">
      <div v-if="displayData.length === 0" class="empty-state">
        {{ t('villages.pages.yangChun.noResults') }}
      </div>

      <TreeItem
          v-for="item in displayData"
          :key="item.id"
          :node="item"
          :search-query="searchQuery"
      />
    </div>
  </div>
</template>

<script setup>
import FloatingSearch from '@/components/common/FloatingSearch.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import TreeItem from '@/main/components/TableAndTree/TreeItem.vue';
import villageData from '@/assets/data/yc_villages.json';
const { t } = useI18n();
const route = useRoute();

// 數據標準化邏輯
let idCounter = 0;
const generateId = () => `node-${idCounter++}`;

const normalizeData = (data, name = 'Root') => {
  const children = [];

  if (Array.isArray(data)) {
    // 處理數組的情況 (最底層的村)
    data.forEach(item => {
      if (typeof item === 'string') {
        children.push({ id: generateId(), name: item, children: [] });
      } else {
        children.push(normalizeData(item, t('villages.pages.yangChun.unknownNode')));
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    // 處理對象的情況 (居委會、鎮級等)
    Object.keys(data).forEach(key => {
      const value = data[key];

      // 🔥 新增過濾邏輯：如果子內容為空，直接跳過 (不顯示該分類)
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isEmptyObject = typeof value === 'object' && value !== null && Object.keys(value).length === 0;

      // 只有「不為空」的時候，才處理並加入 children
      if (!isEmptyArray && !isEmptyObject) {
        children.push(normalizeData(value, key));
      }
    });
  }

  return {
    id: generateId(),
    name: name,
    children: children
  };
};

// 初始化數據
// 注意：根據你的 JSON 結構，你可能需要根據實際情況調整這裡取 children 的層級
// 假設 JSON 根就是 { "陂面镇": ... }
const initTree = () => {
  const normalized = normalizeData(villageData);
  return normalized.children;
};

const fullTreeData = ref(initTree());
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
let searchDebounceTimer = null;

watch(searchQuery, (val) => {
  clearTimeout(searchDebounceTimer);
  if (!val.trim()) {
    debouncedSearchQuery.value = '';
    return;
  }
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = val;
  }, 300);
});

// 修改 VillageMap.vue 中的 filterTree 函數
const filterTree = (nodes, query) => {
  return nodes.reduce((acc, node) => {
    // 1. 判斷自己是否匹配
    const selfMatch = node.name.toLowerCase().includes(query.toLowerCase());

    // 2. 遞歸過濾子節點
    let filteredChildren = [];
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTree(node.children, query);
    }

    // 3. 判斷是否有子節點匹配
    const hasChildMatch = filteredChildren.length > 0;

    if (hasChildMatch) {
      // 情況 A：子孫中有匹配項 (我是路徑)
      // 動作：必須保留，且必須自動展開 (_autoExpand: true)
      // 注意：這裡我們使用 filteredChildren (只顯示匹配的那條路徑)
      acc.push({
        ...node,
        children: filteredChildren,
        _autoExpand: true  // 🔥 關鍵：路徑節點要展開
      });
    } else if (selfMatch) {
      // 情況 B：我自己匹配到了，但子孫沒匹配 (或者沒搜子孫)
      // 動作：保留我自己，但默認折疊 (_autoExpand: false)
      // 注意：這裡我們恢復 node.children (原始完整數據)，
      // 這樣用戶點擊加號時，可以看到裡面所有的內容，而不是空的
      acc.push({
        ...node,
        children: node.children, // 🔥 關鍵：保留原始子數據供手動查看
        _autoExpand: false // 🔥 關鍵：雖然匹配了，但不主動展開
      });
    }

    return acc;
  }, []);
};

const displayData = computed(() => {
  const query = debouncedSearchQuery.value.trim();
  if (!query) return fullTreeData.value;
  return filterTree(fullTreeData.value, query);
});

const localeTo = (path) => buildLocalePath(resolveRouteLocale(route), path);

</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-primary: var(--text-primary);
$text-secondary: dimgrey;
$text-muted: var(--text-muted);
$button-blue: var(--color-primary-hover);
$transition-base: 0.3s;

.glass-container {
  @include flex-col;
  width: 60dvw;
  min-height: 95dvh;
  margin: 20px auto;
  background: var(--glass-70);
  color: $text-primary;

  @media (max-aspect-ratio: 1/1) {
    width: 90dvw;
  }
}

.header-section {
  padding: 20px 20px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  // background: var(--glass-30);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  p {
    margin: 0 0 12px;
    color: $text-secondary;
    font-size: 14px;
  }
}

.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}

.cross-link {
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.tree-content {
  padding: 16px;
}

.empty-state {
  padding: 40px 0;
  color: $text-muted;
  text-align: center;
}

/*
 * 当前模板中的跳转按钮已注释。
 * 保留样式，便于后续恢复。
 */
.village-link-btn {
  padding: 8px 6px;
  color: $button-blue;
  font-size: 1rem;
  font-weight: 1000;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(
    145deg,
    var(--glass-20),
    var(--glass-10)
  );
  border: 3px solid var(--glass-40);
  border-radius: 25px;
  box-shadow:
    0 6px 10px rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all $transition-base ease;

  &:hover {
    background: linear-gradient(
      145deg,
      var(--glass-50),
      var(--glass-30)
    );
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    transform: scale(1.05);
  }
}
</style>
