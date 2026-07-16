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

## 保留旧类名但不代表未接入

以下类名仍会被搜索命中，但多为语义块或局部样式钩子，不应仅因名称继续改动：

- `query-form vml-glass-panel`：页面级查询区外壳，内部已用 `vml-control-surface` 拆出控件容器。
- `controls` / `filter-row` / `search-controls`：局部样式钩子，若同一元素已带 `vml-control-surface` 或内部已有 `vml-control-field`，视为已接入。
- `map-controls`：地图悬浮工具条，已接入 `vml-control-surface`，但保留 overlay 定位与紧凑宽度。
- `settings-group` / `setting-row`：保留原语义类，同时叠加 `vml-control-surface` / `vml-setting-row`。

## 后续改动边界

- 优先补缺失的父容器，不要为了清理搜索命中而重命名语义类。
- 不要移除成熟业务逻辑或 API 参数组装。
- 删除局部 CSS 前，先确认对应行为已由 `vml-control-*` 覆盖，且不会影响移动端换行。
- `FilterableSelect.vue` 是底层组件，任何布局调整都应保持默认宽度、禁用态、loading 态和层级选择行为稳定。
