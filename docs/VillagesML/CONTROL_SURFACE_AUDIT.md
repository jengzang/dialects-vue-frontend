# VillagesML 控件容器接入清单

本文档记录 VillagesML 查询、筛选、设置与工具条控件的统一容器接入状态，避免后续仅因旧类名命中而重复改动。

## 统一类职责

- `vml-control-surface`：控件区域的直接父容器，提供独立背景、边框、圆角与内边距。
- `vml-control-row`：控件行布局，负责换行、对齐和控件间距。
- `vml-control-field`：单个输入/选择控件的包裹层，负责弹性宽度与移动端占位。
- `vml-control-field--compact`：短输入、数字框、级别选择等紧凑控件。
- `vml-control-actions`：查询、清空、执行等按钮组。
- `vml-setting-row` / `vml-setting-label` / `vml-setting-control`：设置型表单行。

## 已接入的主要模块

- 搜索与村庄详情：`SearchPanel.vue`、`VillageDeepDive.vue`
- 语义分析：`SemanticIndices.vue`、`SemanticComposition.vue`、`SemanticNgrams.vue`、`SemanticSubcategories.vue`、`SemanticCategories.vue`、`SemanticDetailToolbar.vue`
- 模式分析：`PatternFrequency.vue`、`PatternStructural.vue`、`PatternTendency.vue`、`NgramExplore.vue`、`NgramStats.vue`
- 区域分析：`RegionSimilarity.vue`、`RegionalVectors.vue`、`RegionalAggregates.vue`、`CategoryTendency.vue`
- 空间分析：`SpatialIntegration.vue`、`SpatialClustersTab.vue`、`SpatialVisualizationTab.vue`、`SpatialMap.vue`、`HotspotMap.vue`、`SpatialHotspotsTab.vue`
- 字符分析：`CharacterSignificance.vue`、`CharacterEmbeddings.vue`、`CharacterNetwork.vue`、`RegionSelectorPanel.vue`
- ML：`FeatureExtraction.vue`、`SubsetAnalysis.vue`、`ClusteringSettingsPanel.vue`、clustering shared 设置面板
- 工作区与系统：`VillagesMLWorkspace.vue` 顶部数据集选择器、`SystemInfo.vue` 表统计筛选工具条

## 保留旧类名但不代表未接入

以下类名仍会被搜索命中，但多为语义块或局部样式钩子，不应仅因名称继续改动：

- `query-form vml-glass-panel`：页面级查询区外壳，内部已用 `vml-control-surface` 拆出控件容器。
- `controls` / `filter-row` / `search-controls` / `cluster-controls` / `clustering-controls`：局部样式钩子，若同一元素已带 `vml-control-surface` 或内部已有 `vml-control-field`，视为已接入。
- `map-controls`：地图悬浮工具条，已接入 `vml-control-surface`，但保留 overlay 定位与紧凑宽度。
- `settings-group` / `setting-row`：保留原语义类，同时叠加 `vml-control-surface` / `vml-setting-row`。
- `dataset-selector` / `header-controls`：顶层或面板标题区工具条，已接入轻量 `vml-control-row` / `vml-control-field` / `vml-control-actions`，不额外套完整 surface。
- `selector-content` / `filter-content`：面板内容区语义类，不是控件行；其中实际输入、筛选、按钮已由内层 `vml-control-*` 承接。
- `detail-toolbar` / `region-selector-panel` / `controls-panel`：页面或面板级结构类，内部控件已接入；保留这些类用于标题、间距、图表或面板布局。

## 页面级视觉验收

2026-07-19 已用本地 `npm run dev:web -- --host 127.0.0.1` 对以下高风险页进行桌面与窄屏验收：

- `RegionSimilarity`
- `FeatureExtraction`
- `SubsetAnalysis`
- `SpatialIntegration`
- `PatternFrequency`
- `SystemInfo`

验收结论：

- 桌面与 390px 窄屏均未发现 control surface 横向溢出。
- 查询、执行、清空等按钮未出现文本挤压。
- `FilterableSelect` 触发宽度在桌面和窄屏均正常；下拉菜单在窄屏未超出视口。
- 窄屏下部分 control surface 高度增加来自字段垂直换行，属于预期响应式堆叠，不视为过度变厚。

视觉验收期间还修复了三个阻止 VillagesML 页面和区域下拉正常加载的缺失导入：

- `BarConfig.js` 引入 `buildCurrentVillagesMLPath`
- `regionPreload.js` 引入 `getCurrentVillagesMLDataset`
- `useVillagesCache.js` 引入 `buildVillagesCacheKey` 与 `getCurrentVillagesMLDataset`

## 局部 CSS 清理状态

- `FeatureExtraction.vue`：删除已由 `vml-control-field` / `vml-control-field > label` 覆盖的局部 `min-width` 与 label 颜色规则。
- `SubsetAnalysis.vue`：删除已由 `vml-control-row` / `vml-control-actions` 覆盖的局部 flex、gap、wrap 与移动端列布局规则；保留筛选列宽比例、面板间距和聚类特征特殊布局。
- 地图 overlay、图表工具条、设置型面板、页面级 `query-form` 外壳未继续清理，避免误伤定位、图表尺寸和页面语义结构。

## 后续改动边界

- 优先补缺失的父容器，不要为了清理搜索命中而重命名语义类。
- 不要移除成熟业务逻辑或 API 参数组装。
- 删除局部 CSS 前，先确认对应行为已由 `vml-control-*` 覆盖，且不会影响移动端换行。
- `FilterableSelect.vue` 是底层组件，任何布局调整都应保持默认宽度、禁用态、loading 态和层级选择行为稳定。
- 当前清单已进入最终状态；后续只在 visual QA 发现真实布局问题时继续改具体组件。
