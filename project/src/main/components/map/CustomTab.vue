<template>
  <div class="custom-tab-container">
    <div class="page-content-stack">
      <!-- Header Area -->
      <div class="page-footer">
        <h3 style="margin: 0">
          {{ t('map.customTab.title') }}
        </h3>
        <div class="header-actions">
          <button
            type="button"
            class="help-icon-head"
            :title="t('map.customTab.buttons.help')"
            :aria-label="t('map.customTab.buttons.help')"
            @click="openHelpModal"
          >
            {{ t('map.customTab.buttons.help') }}
          </button>
          <button
            v-if="userStore.isAuthenticated"
            class="action-btn add-entry-btn-sm"
            @click="openEntryModal"
          >
            {{ t('map.customTab.buttons.addData') }}
          </button>
        </div>
      </div>

      <!-- Login Warning if not authenticated -->
      <div
        v-if="!userStore.isAuthenticated"
        class="auth-warning-container"
      >
        <div class="auth-warning-card">
          <div class="auth-warning-icon">
            🔒
          </div>
          <p class="auth-warning-text">
            {{ t('map.customTab.validation.loginFirst') || '请先登录以查看 and 管理您的个人语料特征数据' }}
          </p>
          <button
            class="enter-btn"
            @click="handleLogin"
          >
            {{ t('map.customTab.labels.login') }}
          </button>
        </div>
      </div>

      <!-- Main Tree and Search Interface if authenticated -->
      <div
        v-else
        class="interactive-search-layout"
      >
        <!-- Feature Search / Filtering -->
        <div class="feature-search-section">
          <div class="label-row">
            <label
              for="featureSearch"
              class="query-label"
            >
              {{ t('map.customTab.labels.featureSearch') || '过滤特征' }}
            </label>
            <span
              v-if="userTotalCount === 0"
              class="data-count-badge hint"
            >
              {{ t('map.customTab.badges.noData') }}
            </span>
            <span
              v-else
              class="data-count-badge success"
            >
              {{ t('map.customTab.badges.dataCount', { count: userTotalCount }) }}
            </span>
          </div>
          <div class="search-input-wrapper">
            <span class="search-emoji-icon">🔍</span>
            <input
              id="featureSearch"
              v-model="searchQuery"
              type="text"
              :placeholder="t('map.customTab.placeholders.featureSearch') || '输入特征或分类进行过滤...'"
              class="feature-search-input"
            >
            <button 
              v-if="searchQuery" 
              class="clear-search-btn" 
              type="button" 
              @click="searchQuery = ''"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Collapsible Tree Selector -->
        <div class="tree-selector-container">
          <div
            v-if="loadingFeatures"
            class="tree-loading-state"
          >
            <span class="spinner-icon">⏳</span> {{ t('customEntry.featureDetail.loading') || '加载特征列表中...' }}
          </div>
          <div
            v-else-if="userFeatures.length === 0"
            class="tree-empty-state"
          >
            <div class="empty-state-icon">
              📂
            </div>
            <p class="empty-state-title">
              {{ t('customEntry.featureList.emptyTitle') || '暂无个人特征数据' }}
            </p>
            <p class="empty-state-text">
              {{ t('customEntry.featureList.emptyText') || '点击右上角“录入数据”开始记录吧！' }}
            </p>
            <button
              class="action-btn primary-btn inline-btn"
              @click="openEntryModal"
            >
              {{ t('map.customTab.buttons.addData') }}
            </button>
          </div>
          <div
            v-else-if="Object.keys(groupedFeatures).length === 0"
            class="tree-empty-state"
          >
            <p class="empty-state-text">
              {{ t('map.customTab.messages.noMatch') || '没有找到匹配的特征' }}
            </p>
          </div>
          <div
            v-else
            class="tree-categories-list"
          >
            <div 
              v-for="(features, category) in groupedFeatures" 
              :key="category" 
              class="tree-category-node"
              :class="{ collapsed: !expandedCategories[category] }"
            >
              <!-- Category Header -->
              <button 
                class="category-header-btn" 
                type="button" 
                @click="toggleCategory(category)"
              >
                <span class="arrow-indicator">▶</span>
                <span class="category-name">{{ category }}</span>
                <span class="category-count-badge">{{ features.length }}</span>
              </button>

              <!-- Category Leaf Nodes (Features) -->
              <div
                v-show="expandedCategories[category]"
                class="category-children-container"
              >
                <button
                  v-for="item in features"
                  :key="item.feature_key || `${item['特徵']}-${item['聲韻調']}`"
                  class="feature-leaf-node"
                  type="button"
                  @click="selectFeatureItem(item)"
                >
                  <span class="feature-name">{{ item['特徵'] || item.feature }}</span>
                  <span class="feature-count-badge">{{ t('customEntry.featureList.pointCount', { count: item.location_count || 0 }) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Management Links -->
        <div class="management-footer">
          <button
            class="flat-link-btn"
            type="button"
            @click="goToDataManager"
          >
            ⚙️ {{ t('map.customTab.helpModal.sections.customCollection.items.manage.label') || '管理我的所有自定义数据' }}
          </button>
        </div>
      </div>

      <!-- Divider / Usage Info Link -->
      <div class="divider">
        <span>{{ t('map.customTab.divider') }}</span>
      </div>

      <div class="help-trigger-wrapper">
        <span
          class="help-trigger"
          @click="openHelpModal"
        >
          {{ t('map.customTab.helpTrigger') }}
        </span>
      </div>
    </div>

    <CustomDataEntryModal v-model="isEntryModalOpen" />
    <!-- 帮助弹窗 -->
    <AppModal
      :model-value="isHelpModalOpen"
      size="lg"
      :title="t('map.customTab.helpModal.title')"
      :close-label="t('common.button.close')"
      @update:model-value="closeHelpModal"
    >
      <div class="help-content">
        <div class="help-section">
          <h4 class="section-title">
            🌟 {{ t('map.customTab.helpModal.sections.overview.title') }}
          </h4>
          <ul class="help-list">
            <li
              v-for="item in helpOverviewItems"
              :key="item.key"
            >
              <strong>{{ item.label }}</strong>{{ item.text }}
            </li>
          </ul>
        </div>

        <div
          class="help-section"
          style="border-left: 4px solid #007aff"
        >
          <h4 class="section-title">
            🎨 {{ t('map.customTab.helpModal.sections.fieldGuide.title') }}
          </h4>
          <ul class="help-list">
            <li
              v-for="item in helpFieldGuideItems"
              :key="item.key"
            >
              <strong>{{ item.label }}</strong>{{ item.text }}
            </li>
          </ul>
          <div class="example-hint">
            <ul>
              <li
                v-for="example in helpFieldGuideExamples"
                :key="example"
              >
                {{ example }}
              </li>
            </ul>
          </div>
          <div class="table-container">
            <table class="example-table">
              <thead>
                <tr>
                  <th style="min-width: 60px">
                    簡稱
                  </th>
                  <th style="min-width: 40px">
                    分區
                  </th>
                  <th style="min-width: 90px">
                    經緯度
                  </th>
                  <th style="min-width: 50px">
                    聲韻調
                  </th>
                  <th style="min-width: 30px">
                    特徵
                  </th>
                  <th style="min-width: 40px">
                    值
                  </th>
                  <th style="min-width: 60px">
                    說明
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="highlight-location">
                    陽春圭崗
                  </td>
                  <td class="highlight-region">
                    嶺南
                  </td>
                  <td class="highlight-geo">
                    111.742615,22.35676
                  </td>
                  <td>韻母</td>
                  <td><strong>豪</strong></td>
                  <td><span class="value-tag">ɐu</span></td>
                  <td class="note-text">
                    個人田調
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="help-section"
          style="border-left: 4px solid #007aff"
        >
          <h4 class="section-title">
            💫 {{ t('map.customTab.helpModal.sections.customCollection.title') }}
          </h4>
          <p class="help-paragraph">
            {{ t('map.customTab.helpModal.sections.customCollection.intro') }}
          </p>
          <ul class="help-list">
            <li
              v-for="item in helpCollectionItems"
              :key="item.key"
            >
              <strong>{{ item.label }}</strong>{{ item.text }}
            </li>
          </ul>
          <div class="example-hint">
            <ul>
              <li
                v-for="note in helpCollectionNotes"
                :key="note"
              >
                {{ note }}
              </li>
            </ul>
          </div>
          <div class="table-container">
            <table class="example-table">
              <thead>
                <tr>
                  <th style="min-width: 60px">
                    簡稱
                  </th>
                  <th style="min-width: 30px">
                    分區
                  </th>
                  <th style="min-width: 70px">
                    經緯度
                  </th>
                  <th style="min-width: 50px">
                    聲韻調
                  </th>
                  <th style="min-width: 30px">
                    特徵
                  </th>
                  <th style="min-width: 40px">
                    值
                  </th>
                  <th style="min-width: 60px">
                    說明
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    rowspan="5"
                    class="highlight-location"
                  >
                    陽春雙滘
                  </td>
                  <td
                    rowspan="10"
                    class="highlight-region"
                  >
                    2025田調
                  </td>
                  <td
                    rowspan="5"
                    class="highlight-geo"
                  >
                    111.332451,<br>22.109056
                  </td>
                  <td>韻母</td>
                  <td><strong>止·精組·開</strong></td>
                  <td><span class="value-tag">ei/i</span></td>
                  <td class="note-text">
                    兩讀
                  </td>
                </tr>
                <tr>
                  <td>聲母</td>
                  <td><strong>來</strong></td>
                  <td><span class="value-tag">l</span></td>
                  <td class="note-text" />
                </tr>
                <tr>
                  <td>調值</td>
                  <td><strong>陰去</strong></td>
                  <td><span class="value-tag">53</span></td>
                  <td class="note-text">
                    可能是受涯話影響
                  </td>
                </tr>
                <tr>
                  <td>詞彙</td>
                  <td><strong>昨天</strong></td>
                  <td><span class="value-tag">從日</span></td>
                  <td class="note-text">
                    ʦuŋ21 ȵɐt51
                  </td>
                </tr>
                <tr>
                  <td>詞彙</td>
                  <td><strong>玩耍</strong></td>
                  <td><span class="value-tag">嬲</span></td>
                  <td class="note-text">
                    liɛu53
                  </td>
                </tr>
                <tr>
                  <td
                    rowspan="5"
                    class="highlight-location"
                  >
                    阳春合水
                  </td>
                  <td
                    rowspan="5"
                    class="highlight-geo"
                  >
                    111.856357,<br>22.289037
                  </td>
                  <td>韻母</td>
                  <td><strong>止·精組·開</strong></td>
                  <td><span class="value-tag">ei</span></td>
                  <td class="note-text">
                    兩陽的特點
                  </td>
                </tr>
                <tr>
                  <td>泥來母</td>
                  <td><strong>來母</strong></td>
                  <td><span class="value-tag">l</span></td>
                  <td class="note-text" />
                </tr>
                <tr>
                  <td>調值</td>
                  <td><strong>陰去</strong></td>
                  <td><span class="value-tag">33</span></td>
                  <td class="note-text" />
                </tr>
                <tr>
                  <td>詞彙</td>
                  <td><strong>昨天</strong></td>
                  <td><span class="value-tag">撞日</span></td>
                  <td class="note-text">
                    tsoŋ53 ŋɐt53
                  </td>
                </tr>
                <tr>
                  <td>詞彙</td>
                  <td><strong>玩耍</strong></td>
                  <td><span class="value-tag">耍</span></td>
                  <td class="note-text">
                    ʃa323
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="help-section"
          style="border-left: 4px solid #007aff"
        >
          <h4 class="section-title">
            💡 {{ t('map.customTab.helpModal.sections.dailyUsage.title') }}
          </h4>
          <p class="help-paragraph">
            {{ t('map.customTab.helpModal.sections.dailyUsage.intro') }}
          </p>
          <ul
            class="help-list"
            style="margin-top: 8px"
          >
            <li>
              📁 <strong>「分區」即文件夾：</strong>比如填入
              <code>我的探店地圖</code>（「聲韻調」可留空）。
            </li>
            <li>
              🏷️ <strong>「特徵」即分類：</strong>比如填入 <code>咖啡館</code>、<code>火鍋店</code>
              或 <code>燒烤攤</code>。
            </li>
            <li>
              📍
              <strong>「簡稱」即名字：</strong>可以填入景點/店鋪名稱（如<code>時光咖啡館</code>）。
            </li>
            <li>✅️ <strong>「值」即標記：</strong>可以填入評分（如<code>9分</code>）或簡介。</li>
          </ul>

          <div class="usage-diagram">
            <div class="usage-level region-level">
              <div class="level-icon">
                📂
              </div>
              <div class="level-content">
                <div class="field-tag">
                  {{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.label') }}
                </div>
                <div class="usage-text">
                  {{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.text') }}
                </div>
                <div class="usage-example">
                  {{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.example') }}
                </div>
              </div>
            </div>

            <div class="connector-line">
              ⬇️ {{ t('map.customTab.helpModal.sections.dailyUsage.connectors.regionToLocation') }}
            </div>

            <div class="usage-level location-level">
              <div class="level-icon">
                📍
              </div>
              <div class="level-content">
                <div class="field-tag">
                  {{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.label') }}
                </div>
                <div class="usage-text">
                  {{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.text') }}
                </div>
                <div class="usage-example">
                  {{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.example') }}
                </div>
              </div>
            </div>

            <div class="connector-line">
              ⬇️ {{ t('map.customTab.helpModal.sections.dailyUsage.connectors.locationToData') }}
            </div>

            <div class="usage-level data-level">
              <div class="level-group">
                <div class="sub-level feature-box">
                  <div class="level-icon-sm">
                    🏷️
                  </div>
                  <div>
                    <div class="field-tag-sm">
                      {{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.label') }}
                    </div>
                    <div class="usage-text-sm">
                      {{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.text') }}
                    </div>
                    <div class="usage-example-sm">
                      {{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.example') }}
                    </div>
                  </div>
                </div>

                <div class="arrow-right">
                  👉
                </div>

                <div class="sub-level value-box">
                  <div class="level-icon-sm">
                    💬
                  </div>
                  <div>
                    <div class="field-tag-sm">
                      {{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.label') }}
                    </div>
                    <div class="usage-text-sm">
                      {{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.text') }}
                    </div>
                    <div class="usage-example-sm">
                      {{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.example') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p
            class="example-hint"
            style="margin: 0"
          >
            ✨ {{ t('map.customTab.helpModal.sections.dailyUsage.result') }}
          </p>
        </div>

        <div
          class="help-section"
          style="border-left: 4px solid #007aff"
        >
          <h4 class="section-title">
            📍 {{ t('map.customTab.helpModal.sections.steps.title') }}
          </h4>
          <ul class="help-list">
            <li
              v-for="item in helpStepsItems"
              :key="item.key"
            >
              <strong>{{ item.label }}</strong>{{ item.text }}
            </li>
          </ul>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthGuard } from '@/composables/router/useAuthGuard.js';
import CustomDataEntryModal from '@/main/components/map/custom-entry/CustomDataEntryModal.vue';
import { getAllCustomData, getUserFeatures } from '@/api';
import {
  userStore,
  resultCache,
  mapStore,
} from '@/main/store/store.js';
import { showSuccess, showWarning } from '@/utils/message.js';
import AppModal from '@/components/common/AppModal.vue';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { requireAuth } = useAuthGuard();

// 帮助弹窗相关 computed
const helpOverviewItems = computed(() => [
  {
    key: 'privateSpace',
    label: t('map.customTab.helpModal.sections.overview.items.privateSpace.label'),
    text: t('map.customTab.helpModal.sections.overview.items.privateSpace.text'),
  },
  {
    key: 'mapRendering',
    label: t('map.customTab.helpModal.sections.overview.items.mapRendering.label'),
    text: t('map.customTab.helpModal.sections.overview.items.mapRendering.text'),
  },
]);
const helpFieldGuideItems = computed(() => [
  {
    key: 'feature',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.feature.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.feature.text'),
  },
  {
    key: 'value',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.value.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.value.text'),
  },
  {
    key: 'featureType',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.featureType.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.featureType.text'),
  },
  {
    key: 'location',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.location.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.location.text'),
  },
  {
    key: 'region',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.region.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.region.text'),
  },
]);
const helpFieldGuideExamples = computed(() => [
  t('map.customTab.helpModal.sections.fieldGuide.examples.middleChinese'),
  t('map.customTab.helpModal.sections.fieldGuide.examples.personalCorpus'),
]);
const helpCollectionItems = computed(() => [
  {
    key: 'region',
    label: t('map.customTab.helpModal.sections.customCollection.items.region.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.region.text'),
  },
  {
    key: 'featureType',
    label: t('map.customTab.helpModal.sections.customCollection.items.featureType.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.featureType.text'),
  },
  {
    key: 'feature',
    label: t('map.customTab.helpModal.sections.customCollection.items.feature.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.feature.text'),
  },
  {
    key: 'value',
    label: t('map.customTab.helpModal.sections.customCollection.items.value.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.value.text'),
  },
]);
const helpCollectionNotes = computed(() => [
  t('map.customTab.helpModal.sections.customCollection.notes.scope'),
  t('map.customTab.helpModal.sections.customCollection.notes.search'),
  t('map.customTab.helpModal.sections.customCollection.notes.display'),
]);
const helpStepsItems = computed(() => [
  {
    key: 'mode',
    label: t('map.customTab.helpModal.sections.steps.items.mode.label'),
    text: t('map.customTab.helpModal.sections.steps.items.mode.text'),
  },
  {
    key: 'coordinates',
    label: t('map.customTab.helpModal.sections.steps.items.coordinates.label'),
    text: t('map.customTab.helpModal.sections.steps.items.coordinates.text'),
  },
  {
    key: 'save',
    label: t('map.customTab.helpModal.sections.steps.items.save.label'),
    text: t('map.customTab.helpModal.sections.steps.items.save.text'),
  },
]);

// 状态定义
const isHelpModalOpen = ref(false);
const isEntryModalOpen = ref(false);
const userTotalCount = ref(0);
const searchQuery = ref('');
const userFeatures = ref([]);
const loadingFeatures = ref(false);
const expandedCategories = ref({});

// 过滤特征
const filteredFeatures = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return userFeatures.value;
  return userFeatures.value.filter((item) => {
    const fName = String(item['特徵'] || item.feature || '').toLowerCase();
    const cat = String(item['聲韻調'] || item.phonology || '').toLowerCase();
    return fName.includes(query) || cat.includes(query);
  });
});

// 分组并排序分类
const groupedFeatures = computed(() => {
  const groups = {};
  filteredFeatures.value.forEach((item) => {
    const category = item['聲韻調'] || item.phonology || '未分类';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  });

  const getSortOrder = (cat) => {
    const c = cat
      .replace(/聲/g, '声')
      .replace(/韻/g, '韵')
      .replace(/調/g, '调')
      .replace(/詞/g, '词')
      .replace(/彙/g, '汇');
    if (c.includes('声母')) return 1;
    if (c.includes('韵母')) return 2;
    if (c.includes('声调')) return 3;
    if (c.includes('词汇')) return 4;
    if (c.includes('未分类') || c.includes('uncategorized')) return 99;
    return 10;
  };

  return Object.keys(groups)
    .sort((a, b) => getSortOrder(a) - getSortOrder(b))
    .reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
});

// 展开/收起分类
const toggleCategory = (category) => {
  expandedCategories.value[category] = !expandedCategories.value[category];
};

// 选择特征跳转
const selectFeatureItem = (item) => {
  const featureName = item['特徵'] || item.feature || '';
  const phonology = item['聲韻調'] || item.phonology || '';

  if (!featureName) return;

  // 清空原有地图数据
  mapStore.mergedData = [];
  resultCache.latestResults = [];
  mapStore.selectedFeature = '';
  resultCache.features = [];
  mapStore.mapData = null;

  router.replace({
    path: '/menu/map/view',
    query: {
      feature: featureName,
      phonology: phonology,
    },
  });

  showSuccess(t('map.customTab.messages.loading'));
};

// 管理数据页面
const goToDataManager = () => {
  if (!userStore.isAuthenticated) {
    showWarning(t('map.customTab.validation.loginFirst'));
    requireAuth();
    return;
  }
  router.push({
    path: '/auth/data',
    query: { username: userStore.username },
  });
};

// 获取特征和数据总量
const fetchUserFeatures = async () => {
  if (!userStore.isAuthenticated) {
    userFeatures.value = [];
    userTotalCount.value = 0;
    return;
  }

  loadingFeatures.value = true;
  try {
    const response = await getUserFeatures();
    userFeatures.value = Array.isArray(response?.data) ? response.data : [];

    const countResponse = await getAllCustomData();
    if (Array.isArray(countResponse?.data)) {
      userTotalCount.value = countResponse.data.length;
    }

    // 默认展开所有分类
    userFeatures.value.forEach((item) => {
      const category = item['聲韻調'] || item.phonology || '未分类';
      if (expandedCategories.value[category] === undefined) {
        expandedCategories.value[category] = true;
      }
    });
  } catch (error) {
    console.error('获取特征列表失败:', error);
  } finally {
    loadingFeatures.value = false;
  }
};

// 监听标签页状态，进入 custom 时重新获取
watch(
  () => route.params.sub,
  (newSub) => {
    if (newSub === 'custom') {
      fetchUserFeatures();
    }
  },
  { immediate: true }
);

// 监听登录状态变化
watch(
  () => userStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      fetchUserFeatures();
    } else {
      userFeatures.value = [];
      userTotalCount.value = 0;
    }
  }
);

// 监听数据录入面板关闭
watch(isEntryModalOpen, (isOpen) => {
  if (!isOpen) {
    fetchUserFeatures();
  }
});

// 弹窗辅助函数
const openHelpModal = () => {
  isHelpModalOpen.value = true;
};
const closeHelpModal = () => {
  isHelpModalOpen.value = false;
};
const handleLogin = () => {
  requireAuth();
};
const openEntryModal = () => {
  isEntryModalOpen.value = true;
};
</script>

<style scoped>
/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-entry-btn-sm {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.9), rgba(0, 81, 213, 0.9));
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 122, 255, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-entry-btn-sm:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 14px rgba(0, 122, 255, 0.35);
  background: linear-gradient(135deg, rgba(0, 122, 255, 1), rgba(0, 81, 213, 1));
}

.add-entry-btn-sm:active {
  transform: translateY(0);
}

/* Auth Warning Container */
.auth-warning-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  width: 100%;
  box-sizing: border-box;
}

.auth-warning-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  max-width: 360px;
  width: 100%;
}

.auth-warning-icon {
  font-size: 44px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  animation: floatIcon 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.auth-warning-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* Interactive Search Layout */
.interactive-search-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  margin-top: 15px;
}

/* Feature Search Section */
.feature-search-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.search-emoji-icon {
  position: absolute;
  left: 14px;
  font-size: 15px;
  color: #94a3b8;
  pointer-events: none;
}

.feature-search-input {
  width: 100%;
  padding: 11px 40px 11px 38px;
  font-size: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  color: #0f172a;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.feature-search-input:focus {
  border-color: rgba(0, 122, 255, 0.55);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.15s;
}

.clear-search-btn:hover {
  color: #475569;
}

/* Badges */
.data-count-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 20px;
  line-height: 1.2;
}

.data-count-badge.success {
  background-color: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.data-count-badge.hint {
  background-color: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

/* Tree Selector Container */
.tree-selector-container {
  width: 100%;
  min-height: 220px;
  max-height: 480px;
  overflow-y: auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
  padding: 12px;
  box-sizing: border-box;
}

/* Tree Loading & Empty States */
.tree-loading-state,
.tree-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px 10px;
  color: #64748b;
  font-size: 14px;
  height: 100%;
  box-sizing: border-box;
}

.tree-loading-state {
  gap: 12px;
}

.spinner-icon {
  font-size: 24px;
  animation: spin 1.5s linear infinite;
  display: inline-block;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-state-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.empty-state-title {
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.empty-state-text {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 16px 0;
  max-width: 260px;
  line-height: 1.5;
}

.inline-btn {
  font-size: 13px !important;
  padding: 6px 16px !important;
  border-radius: 16px !important;
}

/* Tree Categories List */
.tree-categories-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tree-category-node {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tree-category-node:hover {
  background: rgba(255, 255, 255, 0.55);
}

.category-header-btn {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  transition: all 0.2s;
}

.arrow-indicator {
  font-size: 8px;
  color: #94a3b8;
  margin-right: 10px;
  transition: transform 0.2s ease;
  transform: rotate(90deg);
}

.tree-category-node.collapsed .arrow-indicator {
  transform: rotate(0deg);
}

.category-name {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  flex: 1;
}

.category-count-badge {
  font-size: 10px;
  font-weight: 700;
  background: rgba(0, 122, 255, 0.08);
  color: #007aff;
  padding: 1.5px 6px;
  border-radius: 10px;
}

.category-children-container {
  padding: 4px 10px 10px 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.15);
}

/* Feature Leaf Node (Buttons) */
.feature-leaf-node {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 52px;
  box-sizing: border-box;
}

.feature-leaf-node:hover {
  background: #ffffff;
  border-color: #007aff;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.08);
  transform: translateY(-1.5px);
}

.feature-leaf-node:active {
  transform: translateY(0);
  background: rgba(240, 247, 255, 0.85);
}

.feature-leaf-node .feature-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  word-break: break-all;
  line-height: 1.35;
}

.feature-leaf-node .feature-count-badge {
  font-size: 9.5px;
  color: #64748b;
  font-weight: 500;
}

/* Management Footer */
.management-footer {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}

.flat-link-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #007aff;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.flat-link-btn:hover {
  background: rgba(0, 122, 255, 0.06);
  text-decoration: underline;
}

/* Action button styles (fallback for common buttons) */
.action-btn {
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.primary-btn {
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0051d5, #003db3);
}

.help-icon-head {
  width: auto;
  min-width: 24px;
  height: 24px;
  padding: 0 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #007aff;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border: none;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 4px 12px rgba(0, 122, 255, 0.15),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.help-icon-head:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.85));
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.5),
    0 6px 16px rgba(0, 122, 255, 0.25),
    0 0 0 0.5px rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}


/* 使用说明触发器 */
.divider {
  margin: 40px 0 12px;
  text-align: center;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: linear-gradient(to right, transparent, #7c7575, transparent);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  display: inline-block;
  padding: 0 12px;
  color: #353535;
  font-weight: bold;
  font-size: 17px;
  position: relative;
  z-index: 1;
}

/* 使用说明触发器 */
.help-trigger-wrapper {
  text-align: center;
  margin: 12px 0;
}

.help-trigger {
  font-size: 13px;
  color: #007aff;
  cursor: pointer;
  transition: opacity 0.2s;
  text-decoration: none;
}

.help-trigger:hover {
  opacity: 0.7;
  text-decoration: underline;
}

/* 帮助弹窗样式 */
.custom-tab-help-shell {
  position: relative;
  margin: calc(-1 * var(--modal-content-padding-top)) calc(-1 * var(--modal-content-padding-inline))
    calc(-1 * var(--modal-content-padding-bottom));
  padding: 30px;
}

.custom-tab-help-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.help-section {
  background: rgba(255, 255, 255, 0.5);
  padding: 15px;
  border-radius: 10px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #007aff;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-list li {
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

.help-list li strong {
  color: #333;
  font-weight: 600;
}

.help-paragraph {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .button-group {
    gap: 10px;
    flex-direction: column;
  }

  .action-btn {
    width: 90%;
  }

  .feature-search-container {
    max-width: 90%;
  }

  .custom-tab-help-shell {
    padding: 20px;
  }
}
/* 新增：標籤行布局 */
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 0 4px;
}

.query-label {
  margin-bottom: 0; /* 覆蓋原有 margin */
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 數據量徽章樣式 */
.data-count-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}
/* 未登錄：橘紅色系 */
.data-count-badge.warning {
  color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
  border-color: rgba(255, 149, 0, 0.2);
}

/* 暫無數據：灰色系 */
.data-count-badge.hint {
  color: #8e8e93;
  background: rgba(142, 142, 147, 0.1);
  border-color: rgba(142, 142, 147, 0.2);
}

/* 有數據：藍色系 */
.data-count-badge.success {
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.2);
}

/* 適配移動端 */
@media (max-aspect-ratio: 1/1) {
  .label-row {
    flex-direction: row; /* 移動端也保持一行，若文字太擁擠可改為 column */
  }
}

/* 表格容器 */
.table-container {
  overflow-x: auto; /* 確保移動端可以橫向滑動 */
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  margin-bottom: 8px;
}

/* 表格本體 */
.example-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px; /* 稍微調小字體以容納更多列 */
  text-align: left;
  min-width: 500px; /* 防止在手機上擠成一團 */
}

/* 表頭 */
.example-table th {
  background-color: #f5f7fa;
  color: #333;
  font-weight: 600;
  padding: 8px 6px;
  border-bottom: 2px solid #d9d9d9;
  white-space: nowrap;
}

/* 單元格 */
.example-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #eee;
  border-right: 1px solid #f0f0f0;
  color: #555;
  vertical-align: middle;
}

/* 去掉最後一列邊框 */
.example-table td:last-child {
  border-right: none;
}

/* 重點列高亮 */
.highlight-location {
  color: #333;
  font-weight: 700;
  background-color: #fffcf5; /* 淺黃背景 */
}

.highlight-region {
  color: #007aff;
  font-weight: 600;
  background-color: #f0f7ff; /* 淺藍背景 */
}

.highlight-geo {
  font-family: monospace;
  font-size: 11px;
  color: #888;
  background-color: #fafafa;
}

/* 值標籤 */
.value-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #0050b3;
  font-weight: bold;
}

/* 說明文字 */
.note-text {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

/* 提示塊 */
.example-hint {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.03);
  padding: 8px 12px;
  border-radius: 6px;
}

.example-hint ul {
  margin: 0;
  padding-left: 18px;
}

.example-hint li {
  margin-bottom: 4px;
}
/* --- 日常應用層級圖樣式 --- */

.usage-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 10px;
  border-radius: 12px;
}

/* 通用層級卡片 */
.usage-level {
  display: flex;
  align-items: center;
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

/* 各層級配色 */
.region-level {
  border-left: 5px solid #007aff;
} /* 藍色 */
.location-level {
  border-left: 5px solid #ff9500;
} /* 橘色 */
.data-level {
  border-left: 5px solid #34c759; /* 綠色 */
  flex-direction: column;
  padding: 10px;
}

/* 圖標 */
.level-icon {
  font-size: 24px;
  margin-right: 15px;
  width: 30px;
  text-align: center;
}

/* 內容區 */
.level-content {
  flex: 1;
}

/* 字段標籤 (如：分區) */
.field-tag {
  font-weight: 700;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.usage-text {
  font-size: 13px;
  color: #555;
  margin-bottom: 4px;
}

.usage-example {
  font-size: 12px;
  color: #007aff;
  background: rgba(0, 122, 255, 0.08);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  font-family: monospace;
}

/* 連接線 */
.connector-line {
  font-size: 12px;
  color: #999;
  font-weight: bold;
  margin: 8px 0;
  position: relative;
}

/* 第三層：左右佈局 (特徵 -> 值) */
.level-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sub-level {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px;
  background: #f5fcf5; /* 淺綠背景 */
  border-radius: 6px;
}

.feature-box {
  margin-right: 5px;
}
.value-box {
  margin-left: 5px;
}

.level-icon-sm {
  font-size: 18px;
  margin-right: 8px;
}
.field-tag-sm {
  font-weight: 700;
  font-size: 12px;
  color: #2e7d32;
}
.usage-text-sm {
  font-size: 11px;
  color: #555;
}
.usage-example-sm {
  font-size: 11px;
  color: #2e7d32;
  font-family: monospace;
  margin-top: 2px;
  font-weight: bold;
}

.arrow-right {
  color: #999;
  font-size: 14px;
  margin: 0 4px;
}

/* Dropdown 样式 */
.dropdown-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 6px 0;
  position: absolute;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 80px;
  max-height: 40dvh;
  overflow: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item.active {
  background-color: #e6f0ff;
  color: #02469e;
  font-weight: bold;
}

.dropdown-item:hover {
  background-color: #e6f0ff;
}
</style>
