<template>
  <div class="feature-aggregation-page">
    <h3 class="villagesml-subtab-title">
      區域分析 - 特徵聚合
      <HelpIcon content="多區域特徵統計聚合。一次性對比多個區域的語義畫像、Z分數、獨特後綴/字符、多樣性指標、結構畫像，支持 lift 顯著性判斷和跨區域標準差排名。" />
    </h3>

    <div v-if="!isAuthenticated" class="auth-warning">
      <span>此功能需要登錄</span>
      <button @click="goToAuth" class="solid-button small">前往登錄</button>
    </div>

    <!-- Controls -->
    <div v-if="isAuthenticated" class="vml-glass-panel">
      <div class="section">
        <h3>區域選擇</h3>
        <p class="section-description">選擇多個區域進行特徵聚合對比（選擇3個以上可以評估z-score）</p>

        <div class="selector-row">
          <label class="field-label">區域級別：</label>
          <SimpleSelectDropdown
            v-model="regionLevel"
            :options="levelOptions"
            :match-trigger-width="true"
            class="level-dropdown"
          />
          <FilterableSelect
            v-model="currentRegion"
            :level="regionLevel"
            :show-level-selector="false"
            placeholder="選擇或輸入區域名稱"
            class="region-input"
            @update:hierarchy="h => currentHierarchy = h"
          />
          <button
            class="solid-button primary"
            :disabled="!currentRegion || regionList.length >= 50"
            @click="addRegion"
          >
            添加
          </button>
        </div>

        <div v-if="regionList.length > 0" class="region-tags">
          <span v-for="(r, i) in regionList" :key="i" class="region-tag">
            {{ r.display }}
            <button class="tag-remove" @click="removeRegion(i)">×</button>
          </span>
        </div>
      </div>

      <div class="section">
        <h3>特徵選擇</h3>
        <div class="feature-toggles">
          <CheckBox :model-value="features.semantic_distribution" @update:model-value="features.semantic_distribution = $event">
            語義分布 (semantic_profile + z_scores)
          </CheckBox>
          <CheckBox :model-value="features.morphology_freq" @update:model-value="features.morphology_freq = $event">
            形態頻率 (suffixes + distinctive_suffixes)
          </CheckBox>
          <CheckBox :model-value="features.cluster_distribution" @update:model-value="features.cluster_distribution = $event">
            空間聚類分布
          </CheckBox>
          <CheckBox :model-value="features.distinctive_chars" @update:model-value="features.distinctive_chars = $event">
            獨特字符
          </CheckBox>
          <CheckBox :model-value="features.diversity_metrics" @update:model-value="features.diversity_metrics = $event">
            多樣性指標 (熵值)
          </CheckBox>
          <CheckBox :model-value="features.structure_profile" @update:model-value="features.structure_profile = $event">
            結構畫像
          </CheckBox>
        </div>
      </div>

      <div class="section query-row">
        <div class="topn-row">
          <label class="field-label">Top N：</label>
          <input
            type="number"
            v-model.number="topN"
            min="1"
            max="50"
            class="number-input"
          />
        </div>
        <button
          class="solid-button primary large"
          :disabled="regionList.length === 0 || loading"
          @click="runAggregation"
        >
          {{ loading ? '查詢中...' : '查詢' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isAuthenticated && loading" class="vml-glass-panel">
      <div class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Results -->
    <template v-if="isAuthenticated && aggregates && !loading">
      <div v-for="(region, ri) in aggregates" :key="ri" class="vml-glass-panel result-region">
        <div class="panel-header" @click="toggleRegion(ri)">
          <div>
            <h3>{{ region.region_name }}</h3>
            <span class="region-stats">共 {{ region.total_villages }} 個村莊，平均名稱長度 {{ region.avg_name_length }}</span>
          </div>
          <div class="panel-header-right">
            <span class="collapse-arrow">{{ expandedRegions.has(ri) ? '▼' : '▶' }}</span>
            <span class="region-index">{{ ri + 1 }} / {{ aggregates.length }}</span>
          </div>
        </div>

        <template v-if="expandedRegions.has(ri)">
        <!-- Semantic Profile -->
        <div v-if="region.semantic_profile" class="section">
          <h4>
            語義畫像
            <HelpIcon content="該區域各語義類別的佔比、全局佔比及 Lift 值。Lift > 1.5 表示該類別顯著高於全局均值（標綠），Lift < 0.67 表示顯著偏低（標紅）。" />
          </h4>
          <div class="simple-table-wrap">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>類別</th>
                  <th>數量</th>
                  <th>區域佔比</th>
                  <th>全局佔比</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(val, cat) in region.semantic_profile"
                  :key="cat"
                  :class="{
                    'row-high': val.lift > 1.5,
                    'row-low': val.lift < 0.67
                  }"
                >
                  <td>{{ SEMANTIC_CATEGORY_NAMES[cat] || cat }}</td>
                  <td>{{ val.count }}</td>
                  <td>{{ (val.pct ?? 0).toFixed(2) }}%</td>
                  <td>{{ (val.global_pct ?? 0).toFixed(2) }}%</td>
                  <td>
                    <span class="lift-badge" :class="liftClass(val.lift)">
                      {{ (val.lift ?? 1).toFixed(2) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Z-Scores -->
        <div v-if="region.z_scores && Object.keys(region.z_scores).length" class="section">
          <h4>
            跨區域 Z 分數
            <HelpIcon content="以標準差（Z-score）衡量該區域在各維度上偏離所有選中區域均值的程度。正值 = 高於均值（藍），負值 = 低於均值（紅）。至少需要 3 個區域才有統計意義。" />
          </h4>
          <div v-if="aggregates.length < 3" class="zscore-hint">
            提示：目前僅有 {{ aggregates.length }} 個區域，跨區域 Z 分數需至少 3 個區域才有對比意義。建議再添加一個區域。
          </div>
          <div class="zscore-list">
            <div v-for="item in zScoreBars(region.z_scores)" :key="item.key" class="zscore-item">
              <span class="zscore-label">{{ item.label }}</span>
              <div class="zscore-bar-track">
                <div
                  class="zscore-bar-fill"
                  :style="{
                    width: item.widthPct + '%',
                    background: item.val >= 0 ? 'var(--color-primary)' : 'var(--color-error)'
                  }"
                ></div>
              </div>
              <span class="zscore-value" :class="item.val >= 0 ? 'positive' : 'negative'">
                {{ item.val.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Suffixes -->
        <div v-if="region.suffixes && region.suffixes.length" class="section">
          <h4>
            後綴分布
            <HelpIcon content="該區域常見後綴的出現頻率和佔比，按數量降序排列。Lift > 1.5 表示該後綴在此區域顯著過表達。" />
          </h4>
          <div class="simple-table-wrap">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>後綴</th>
                  <th>數量</th>
                  <th>佔比</th>
                  <th>全局佔比</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in region.suffixes" :key="s.suffix">
                  <td>{{ s.suffix }}</td>
                  <td>{{ s.count }}</td>
                  <td>{{ (s.pct ?? 0).toFixed(2) }}%</td>
                  <td>{{ (s.global_pct ?? 0).toFixed(2) }}%</td>
                  <td>
                    <span class="lift-badge" :class="liftClass(s.lift)">
                      {{ (s.lift ?? 1).toFixed(2) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Distinctive Suffixes -->
        <div v-if="region.distinctive_suffixes && region.distinctive_suffixes.length" class="section">
          <h4>
            獨特後綴
            <HelpIcon content="相較全局最過表達的後綴（按 Lift 降序排列），反映該區域獨特的命名偏好，Lift 越高代表該後綴越集中在這個區域。" />
          </h4>
          <div class="simple-table-wrap">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>後綴</th>
                  <th>數量</th>
                  <th>佔比</th>
                  <th>全局佔比</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in region.distinctive_suffixes" :key="s.suffix">
                  <td>{{ s.suffix }}</td>
                  <td>{{ s.count }}</td>
                  <td>{{ (s.pct ?? 0).toFixed(2) }}%</td>
                  <td>{{ (s.global_pct ?? 0).toFixed(2) }}%</td>
                  <td>
                    <span class="lift-badge high">{{ (s.lift ?? 1).toFixed(2) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Distinctive Chars -->
        <div v-if="region.distinctive_chars && region.distinctive_chars.length" class="section">
          <h4>
            獨特字符
            <HelpIcon content="該區域最具區分度的字符（從 char_regional_analysis 表預計算），按 Lift + Z 分數排序，反映該區域特有或顯著偏好的漢字。" />
          </h4>
          <div class="simple-table-wrap">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>字符</th>
                  <th>Lift</th>
                  <th>Z 分數</th>
                  <th>頻率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in region.distinctive_chars" :key="c.char">
                  <td class="char-cell">{{ c.char }}</td>
                  <td>
                    <span class="lift-badge" :class="liftClass(c.lift)">
                      {{ (c.lift ?? 1).toFixed(2) }}
                    </span>
                  </td>
                  <td>{{ (c.z_score ?? 0).toFixed(2) }}</td>
                  <td>{{ (c.frequency ?? 0).toFixed(1) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Diversity -->
        <div v-if="region.diversity" class="section">
          <h4>
            多樣性指標
            <HelpIcon content="語義熵和後綴熵衡量命名多樣性——熵值越高表示該區域命名越多元、各類別分佈越均勻；熵值越低則少數類別佔絕對主導。獨立後綴數為該區域獨有的後綴種類數。" />
          </h4>
          <div class="metric-cards">
            <div class="metric-card">
              <span class="metric-value">{{ (region.diversity.semantic_entropy ?? 0).toFixed(3) }}</span>
              <span class="metric-label">語義熵</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ (region.diversity.suffix_entropy ?? 0).toFixed(3) }}</span>
              <span class="metric-label">後綴熵</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ region.diversity.unique_suffixes ?? 0 }}</span>
              <span class="metric-label">獨立後綴數</span>
            </div>
          </div>
        </div>

        <!-- Structure Profile -->
        <div v-if="region.structure_profile" class="section">
          <h4>
            結構畫像
            <HelpIcon content="名稱結構組成分析：含修飾語（前綴，如大小新舊）、含中心詞（詞根，如山水田）、含聚落詞（通名，如村莊屯）。百分比為該結構在區域內的出現比例。" />
          </h4>
          <div class="metric-cards">
            <div class="metric-card" v-if="region.structure_profile.has_modifier">
              <span class="metric-value">{{ (region.structure_profile.has_modifier.pct ?? 0).toFixed(1) }}%</span>
              <span class="metric-label">含修飾語 ({{ region.structure_profile.has_modifier.count }})</span>
            </div>
            <div class="metric-card" v-if="region.structure_profile.has_head">
              <span class="metric-value">{{ (region.structure_profile.has_head.pct ?? 0).toFixed(1) }}%</span>
              <span class="metric-label">含中心詞 ({{ region.structure_profile.has_head.count }})</span>
            </div>
            <div class="metric-card" v-if="region.structure_profile.has_settlement">
              <span class="metric-value">{{ (region.structure_profile.has_settlement.pct ?? 0).toFixed(1) }}%</span>
              <span class="metric-label">含聚落詞 ({{ region.structure_profile.has_settlement.count }})</span>
            </div>
          </div>
        </div>
        </template>
      </div>

      <!-- Cache hint -->
      <div v-if="fromCache" class="cache-hint">使用緩存數據</div>
    </template>

    <!-- Empty state -->
    <div v-if="isAuthenticated && !aggregates && !loading" class="vml-glass-panel empty-hint">
      <p>請選擇至少一個區域，然後點擊「查詢」</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { aggregateFeatures } from '@/api/index.js'
import { showError, showWarning } from '@/utils/message.js'
import { userStore } from '@/main/store/store.js'
import { SEMANTIC_CATEGORY_NAMES, SEMANTIC_FEATURE_KEYS } from '@/VillagesML/config/villagesML.js'
import { buildCurrentVillagesMLPath } from '@/VillagesML/utils/currentDataset.js'

const regionLevel = ref('county')
const currentRegion = ref('')
const currentHierarchy = ref(null)
const regionList = ref([])
const loading = ref(false)
const aggregates = ref(null)
const fromCache = ref(false)
const expandedRegions = ref(new Set())

const router = useRouter()
const isAuthenticated = computed(() => userStore.isAuthenticated)

const goToAuth = () => {
  router.push(buildCurrentVillagesMLPath({ query: { showAuth: 'true' } }))
}

const toggleRegion = (ri) => {
  const next = new Set(expandedRegions.value)
  if (next.has(ri)) {
    next.delete(ri)
  } else {
    next.add(ri)
  }
  expandedRegions.value = next
}

const features = reactive({
  semantic_distribution: true,
  morphology_freq: true,
  cluster_distribution: true,
  distinctive_chars: true,
  diversity_metrics: true,
  structure_profile: true
})

const topN = ref(10)

const levelOptions = [
  { label: '城市', value: 'city' },
  { label: '區縣', value: 'county' },
  { label: '鄉鎮', value: 'township' }
]

const addRegion = () => {
  if (!currentRegion.value || regionList.value.length >= 50) return

  const name = currentRegion.value
  const isDuplicate = regionList.value.some(r => r.name === name && r.level === regionLevel.value)
  if (isDuplicate) {
    showWarning('該區域已在列表中')
    return
  }

  regionList.value.push({
    name,
    level: regionLevel.value,
    display: name
  })
  currentRegion.value = ''
  currentHierarchy.value = null
}

const removeRegion = (index) => {
  regionList.value.splice(index, 1)
}

const runAggregation = async () => {
  if (regionList.value.length === 0) return

  loading.value = true
  aggregates.value = null

  try {
    const params = {
      region_level: regionLevel.value,
      region_names: regionList.value.map(r => r.name),
      features: { ...features },
      top_n: topN.value
    }

    const response = await aggregateFeatures(params)
    aggregates.value = response.aggregates || []
    fromCache.value = response.from_cache || false
  } catch (error) {
    showError(error.message || '特徵聚合查詢失敗')
  } finally {
    loading.value = false
  }
}

const ZSCORE_LABEL_MAP = {
  avg_name_length: '平均名稱長度',
  ...Object.fromEntries(
    SEMANTIC_FEATURE_KEYS.map(k => [`sem_${k}_pct`, SEMANTIC_CATEGORY_NAMES[k]])
  )
}

const zScoreBars = (scores) => {
  const entries = Object.entries(scores)
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.01)
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([key, val]) => ({
      key,
      val,
      label: ZSCORE_LABEL_MAP[key] || key,
      widthPct: (Math.abs(val) / maxAbs * 100).toFixed(1)
    }))
}

const liftClass = (lift) => {
  if (lift == null) return ''
  if (lift > 1.5) return 'high'
  if (lift < 0.67) return 'low'
  return ''
}
</script>

<style scoped lang="scss">
.feature-aggregation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-warning {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(var(--color-error-rgb), 0.1);
  border: 2px solid rgba(var(--color-error-rgb), 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-weight: 500;
}

.section {
  margin-bottom: 16px;

  h4 {
    text-align: center;
  }
}

.section-description {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.field-label {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .field-label {
    flex-shrink: 0;
  }

  .level-dropdown {
    flex-shrink: 0;
    max-width: 180px;
  }

  .region-input {
    flex: 1;
  }
}

.region-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.region-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
}

.tag-remove {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: var(--text-secondary);
  padding: 0;

  &:hover {
    color: var(--color-error);
  }
}

.feature-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.query-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.topn-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-input {
  width: 64px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  background: var(--bg-input);
  color: var(--text-primary);
}

.result-region {
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    cursor: pointer;
    user-select: none;

    &:hover {
      opacity: 0.85;
    }

    h3 {
      margin: 0;
    }
  }

  .panel-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .collapse-arrow {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .region-index {
    font-size: 13px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .region-stats {
    font-size: 13px;
    color: var(--text-secondary);
    display: block;
    margin-top: 2px;
  }

  h4 {
    font-size: 15px;
    margin: 0 0 8px 0;
    color: var(--text-primary);
  }
}

.simple-table-wrap {
  overflow-x: auto;
  margin-bottom: 8px;
}

.simple-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th, td {
    padding: 6px 10px;
    text-align: left;
    border-bottom: 1px solid var(--border-color-light, rgba(128, 128, 128, 0.2));
  }

  th {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .row-high {
    background: rgba(52, 199, 89, 0.08);
  }

  .row-low {
    background: rgba(255, 59, 48, 0.06);
  }

  .char-cell {
    font-size: 18px;
    font-weight: 600;
  }
}

.lift-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;

  &.high {
    color: #34c759;
    background: rgba(52, 199, 89, 0.12);
  }

  &.low {
    color: #ff3b30;
    background: rgba(255, 59, 48, 0.1);
  }
}

.zscore-hint {
  text-align: center;
  font-size: 13px;
  color: var(--color-warning, #f0a020);
  background: rgba(240, 160, 32, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.zscore-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.zscore-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zscore-label {
  width: 120px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.zscore-bar-track {
  flex: 1;
  height: 18px;
  border-radius: 4px;
  background: var(--bg-glass);
  overflow: hidden;
}

.zscore-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
  min-width: 2px;
}

.zscore-value {
  width: 56px;
  font-size: 13px;
  font-weight: 600;
  text-align: right;

  &.positive { color: var(--color-primary); }
  &.negative { color: var(--color-error); }
}

.metric-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  min-width: 100px;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.cache-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted, #888);
}

.empty-hint {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}
</style>
