# Map Draw Voronoi 自定义数据接入方案（Superpower Plan）

> For Hermes: 这是一个研究先行、实现后续的前端方案文档。若后续进入实现，继续遵守 frontend-design / writing-plans 的边界：最小改动、显式责任划分、优先复用现有通用导入预览基建。

目标：在 map draw 的泰森多边形能力中，允许用户接入自己的表格数据，并通过通用 import 预览组件完成预览与列匹配；同时兼容官方数据与用户数据的组合使用。

架构结论：不要把这件事并入当前“导入普通地图图层”的通用 GeoJSON/KML/KMZ/CSV 图层导入链路，而是为 Voronoi 单独增加“数据源配置 + 表格预览映射”子流程。计算层继续复用 `partitionVoronoi.js`，数据接入层改造成“官方数据 + 用户自定义数据”统一归一化后再参与预览、计算、导出。

技术栈：Vue 3 SFC、现有 `TabularImportPreview.vue` / `useTabularImportPreview.js` / `useTabularImportFlow.js`、Map draw Voronoi 工具链、项目现有 i18n / glass UI / loading / scrollbar。

---

## 1. 已核实现状（基于当前代码）

### 1.1 Voronoi 入口与主控文件

主页面：
- `project/src/main/components/map/Tabs/MapDrawTab.vue`

Voronoi 面板：
- `project/src/main/components/map/Draw/panels/MapDrawVoronoiPanel.vue`

当前 Voronoi 子流程在 `MapDrawTab.vue` 内集中维护：
- 数据拉取
- 点预览
- 多边形计算
- 导出到 layer
- ignore points
- clip to national border
- progress overlay

这说明后续实现应继续让 `MapDrawTab.vue` 做 orchestration，不要把业务状态过度拆散。

### 1.2 当前官方数据并不是“只使用音典分区”

当前默认值确实是音典分区：
- `MapDrawTab.vue:659`
  - `const voronoiPartitionMode = ref(PARTITION_MODE_YINDIAN);`

但 Voronoi 面板已经支持两种官方分区字段模式切换：
- `MapDrawVoronoiPanel.vue:161-164`
  - `map`
  - `yindian`

而 `partitionVoronoi.js` 也明确支持两类分区字段：
- `mapPartition`
- `yindianPartition`

结论：
- 当前“官方数据源”只有一份接口来源
- 但该来源里已经支持用两种字段语义计算 Voronoi
- 因此不能说“官方只使用音典分区”
- 更准确的说法是：当前默认用音典分区，但用户可切换为地图集分区

### 1.3 当前官方数据来源是唯一接口源

`MapDrawTab.vue` 当前通过：
- `getLocationPartitions()`
- `usePartitionCache().getPartitionData(...)`

加载官方数据，然后进入：
- `normalizeVoronoiPoints()`
- `buildPartitionPoints(...)`

也就是说：
- 当前 Voronoi 点集不是来自地图当前 layer
- 不是来自用户上传数据
- 也不是多个来源合并
- 是固定官方接口数据

### 1.4 当前项目里“分区层级”的真实识别逻辑

当前 Voronoi 代码并不会去查询一个“权威层级树”来识别每个点属于几级分区，而是直接把分区字符串按 `-` 拆开。

核心逻辑在：
- `project/src/main/utils/drawMap/partitionVoronoi.js`

具体规则：
1. `getPartitionPath(row, partitionMode)`
   - 根据当前模式读取一列：
     - `mapPartition`
     - 或 `yindianPartition`
2. `normalizePartitionParts(rawPath)`
   - 直接：
     - `String(rawPath || '')`
     - `.split('-')`
     - `trim`
     - `filter(Boolean)`
3. 若拆出来的层级不足 3 段：
   - 不是报错
   - 而是重复最后一个非空层级补满到 3 段

当前代码等价于：
- 1 段：`A` -> `A / A / A`
- 2 段：`A-B` -> `A / A-B / A-B`
- 3 段：`A-B-C` -> `A / A-B / A-B-C`

然后分别生成：
- `partitionLevel1 = A`
- `partitionLevel2 = A-B`
- `partitionLevel3 = A-B-C`

结论：
- 当前 Voronoi 的“层级识别”完全依赖分区字符串中的 `-`
- 如果没有 `-`，当前逻辑会把单值视为 1 级，并自动复制补成 3 级
- 所以“用户上传的分区不带 `-` 能不能用”——答案是：按当前 Voronoi 逻辑，本来就可以用，只是会被视为单层级后自动补足

### 1.5 项目里其他分区相关代码是怎么做的

我额外核对了项目里其他分区相关逻辑，结论如下：

1. 音典树 / 交互式分区选择器
- `RegionSelector.vue`
- `LocationAndRegionInput.vue`
- `usePartitionCache.js`

这里的思路是：
- `map` 模式走静态树
- `yindian` 模式走 `getPartitions()` 获取分区树
- 然后按树结构做级联选择

这套逻辑适合“从系统分区树里选区域”，不适合 Voronoi 用户上传表格的自由分区值解析。

原因：
- 用户上传文件里的分区值未必完全命中音典树节点
- 也未必一定来自系统现有树
- 强行用树去校验会让自定义数据接入过于严格

2. 其他从分区字符串建树的逻辑
- `PartitionInfoModal.vue`

这里同样是：
- `partitionStr.split('-')`
- 按拆分结果构造树

说明项目里另一条成熟思路也是：
- 把带 `-` 的分区字符串视为层级路径
- 没有额外做更复杂的智能识别

结论：
- 对 Voronoi 自定义数据来说，沿用“按 `-` 识别层级”的规则最符合当前项目现状
- 不建议在 v1 引入新的复杂层级推断器

### 1.6 当前项目里已有通用“表格预览 + 列匹配”基建

现有通用组件：
- `project/src/components/import/TabularImportPreview.vue`

现有 composable：
- `project/src/composables/import/useTabularImportPreview.js`
- `project/src/composables/import/useTabularImportFlow.js`

现有映射工具：
- `project/src/utils/import/columnMapping.js`

这套基建已经支持：
- sheet 切换
- header row 选择
- 自动匹配列
- 手动修正映射
- diagnostics
- loading
- preview table
- 通用 i18n 文案结构（`common.importPreview.*`）
- 通用滚动样式（`ui-scrollbar`）
- 通用 loading 样式（`ui-loading--inline` / `ui-loading--page`）

结论：
- 用户上传 Voronoi 自定义表格数据时，应直接复用这套基建
- 不应重新引入新的 spreadsheet viewer 库
- 也不应自己再造一套局部 preview UI

### 1.5 当前 draw tab 里已有文件导入，但不适合直接承载本需求

现有 layer import：
- `MapDrawTab.vue` 的 `handleImportAsNewLayer()`
- 走 `readImportedLayerFile()` -> `splitFeatureCollectionByGeometryType()`

支持：
- `.json`
- `.geojson`
- `.kml`
- `.kmz`
- `.csv`

但其目标是：
- 把文件作为地图几何图层导入
- CSV 只要能识别经纬度即可
- 不做 Voronoi 分区字段匹配
- 不做表格预览与列业务映射

结论：
- 这条链路应保留为“地图图层导入”
- Voronoi 自定义数据导入应是独立子流程

---

## 2. 本次需求对齐后的关键结论

### 2.1 用户上传数据的核心要求

用户自定义数据并不要求长得像官方接口原始返回结构。

只要满足 Voronoi 计算所需的最小语义即可：
- 点位名称
- 经纬度（可为合列，或 lng/lat 分列）
- 至少一种可用分区列
  - 地图集分区，或
  - 音典分区

并通过通用 import 预览组件完成：
- 预览
- 列匹配
- 错误提示 / diagnostics

### 2.2 是否必须显式做“三种模式”？

不需要在 UI 上强行塑造成一个笨重的“三模式单选器”。

更自然的建模是两层：

第一层：用户是否上传自定义数据
- 无
- 有

第二层：是否同时使用官方数据
- 使用
- 不使用

于是业务上自然得到三种组合态：
1. 无自定义 + 使用官方 -> 仅官方
2. 有自定义 + 不使用官方 -> 仅自定义
3. 有自定义 + 使用官方 -> 官方 + 自定义

因此推荐：
- 底层状态仍然可以抽象成组合态
- 但前端交互不要做成硬编码的“三模式选择器”
- UI 上只要做成：
  - 自定义数据是否已上传
  - 是否使用官方数据（checkbox / switch）
即可

这样更符合用户心智，也比 `official-only / custom-only / hybrid` 的显式术语更轻。

### 2.3 官方数据语义与自定义数据语义要统一到同一个规范化入口

无论最终来源是：
- 只有官方
- 只有自定义
- 两者并用

都必须在进入 Voronoi 预览 / 计算前，统一成同一种 normalized point row 结构。

不要在后面的：
- preview points
- calculate
- export
- ignore

里写三套分叉逻辑。

---

## 3. 推荐的产品/交互方案

## 3.1 Voronoi 数据源采用“两层控制”

在 `MapDrawVoronoiPanel.vue` 中新增一个“数据源”分组。

建议交互元素：

1. 官方数据开关
- 文案：使用官方分区数据
- 默认：开启（保持当前行为不变）

2. 自定义数据入口
- 若尚未上传：
  - 按钮：上传自定义数据
- 若已上传：
  - 显示文件名 / 已匹配状态 / 可用点数
  - 按钮：重新选择
  - 按钮：清除自定义数据
  - 按钮：查看预览与匹配

3. 结果态解释
- 若仅官方：当前使用官方数据
- 若仅自定义：当前仅使用自定义数据
- 若两者并用：当前将官方数据与自定义数据共同参与 Voronoi 计算

### 3.2 约束规则

1. 官方开关关闭 + 没有自定义数据
- 不允许进入计算
- 面板展示空状态提示

2. 自定义数据已上传但未完成映射
- 不允许把自定义数据纳入计算
- 应保留预览入口与 diagnostics 提示

3. 自定义数据已映射完成 + 官方关闭
- 直接按仅自定义数据计算

4. 自定义数据已映射完成 + 官方开启
- 以“官方 + 自定义”合并后计算

---

## 4. 数据模型方案

## 4.1 Voronoi 自定义导入 schema

建议使用业务语义 schema，而不是强制用户文件字段名固定。

推荐 schema：

1. `name`
- 必填
- 语义：点位名称
- aliases：
  - `簡稱`
  - `简称`
  - `地點`
  - `地点`
  - `name`
  - `location`

2. `coordinate`
- 非必填
- 语义：经纬度合列
- aliases：
  - `經緯度`
  - `经纬度`
  - `coordinates`
  - `coordinate`
  - `coord`
  - `lnglat`
  - `lonlat`

3. `lng`
- 非必填
- 语义：经度分列
- aliases：
  - `lng`
  - `lon`
  - `longitude`
  - `x`
  - `经度`

4. `lat`
- 非必填
- 语义：纬度分列
- aliases：
  - `lat`
  - `latitude`
  - `y`
  - `纬度`

5. `mapPartition`
- 非必填
- 语义：地图集分区列
- aliases：
  - `地圖集二分區`
  - `地圖集分區`
  - `地图集二分区`
  - `地图集分区`
  - `mapPartition`

6. `yindianPartition`
- 非必填
- 语义：音典分区列
- aliases：
  - `音典分區`
  - `音典分区`
  - `yindianPartition`

### 4.1.1 分区层级识别规则（与当前项目保持一致）

自定义数据的分区层级识别，不引入新的“智能识别器”，而是显式沿用当前项目已有规则：
- 按 `-` 把分区字符串视为层级路径
- 再补足到 3 级

规则如下：
1. 若值为 `A-B-C`
   - level1 = `A`
   - level2 = `A-B`
   - level3 = `A-B-C`
2. 若值为 `A-B`
   - level1 = `A`
   - level2 = `A-B`
   - level3 = `A-B`
3. 若值为 `A`
   - level1 = `A`
   - level2 = `A`
   - level3 = `A`

这与 `partitionVoronoi.js` 当前逻辑一致。

### 4.1.2 用户上传分区“不带 -”时怎么办

答案：v1 直接支持，而且不需要额外发明新规则。

因为当前 Voronoi 逻辑本来就允许：
- 单层级分区值
- 自动补足到 3 级

因此对于用户上传数据：
- 如果分区列值不带 `-`
- 则视为“只有一个层级名”
- 自动扩展成 3 级同名链

例如：
- `粤西`
  -> `partitionLevel1 = 粤西`
  -> `partitionLevel2 = 粤西`
  -> `partitionLevel3 = 粤西`

这既兼容当前算法，也符合项目现有处理风格。

### 4.1.3 是否需要再额外“补充三级分区”

需要区分两种语义：

1. 算法层面的“补足到三级”
- 需要
- 当前项目已经这么做
- 也是建议继续沿用的规则

2. 语义层面的“猜出更细的真实官方三级路径”
- 不建议
- 当前项目没有现成稳定逻辑
- 也无法从任意用户自定义值可靠推断出官方完整三级树路径

因此本方案建议：
- 只做结构补足
- 不做语义猜测
- 也不强制自定义分区值必须命中系统树

这点要写进实现与文档，避免后续误解为“用户给一个一级名，系统应该自动补出真实二级/三级官方分区”。

## 4.2 自定义数据有效性规则

不是所有字段都静态 required，而是按实际使用条件校验：

静态要求：
- `name` 必须有
- 坐标必须可解析：
  - `coordinate` 合列可用，或
  - `lng + lat` 分列可用

动态要求：
- 若开启“使用地图集分区”路径，则自定义数据必须可提供 `mapPartition`
- 若开启“使用音典分区”路径，则自定义数据必须可提供 `yindianPartition`

注意：
当前官方 Voronoi 面板仍保留 `partitionMode` 选择（map / yindian）。
因此自定义数据也应跟随该模式校验对应列，而不是要求两个分区列都必须存在。

## 4.3 统一归一化后结构

无论官方还是自定义，进入 Voronoi 逻辑前统一转成：
- `name`
- `coordinate`
- `partitionMode`
- `partitionLevel1`
- `partitionLevel2`
- `partitionLevel3`
- `raw`
- 额外建议新增：
  - `sourceType`: `official` | `custom`
  - `sourceKey`: 稳定唯一键

为什么需要 `sourceType/sourceKey`：
- hybrid 模式下 ignore points 不能只靠 `name`
- 同名点、同坐标点会出现误伤
- 后续 diagnostics / 冲突提示也要区分来源

---

## 5. 组件与职责拆分

## 5.1 保持 `MapDrawTab.vue` 做 orchestration

`MapDrawTab.vue` 继续负责：
- 官方数据加载
- 自定义数据确认后的接入
- unified rows 计算
- Voronoi preview / calculate / export / ignore / progress

不建议把这些主流程拆到多个地方，否则当前已有的 Voronoi 状态管理会变散。

## 5.2 新增 Voronoi 专属导入 modal

建议新增：
- `project/src/main/components/map/Draw/modals/VoronoiDataImportModal.vue`

职责：
- 只负责表格文件导入的预览与列匹配
- 外层使用 `AppModal`
- 内层直接复用 `TabularImportPreview.vue`
- 输出“已确认的、自定义 Voronoi rows”

明确不负责：
- Voronoi 计算
- 导入为普通 map layer
- 通用图层导入替换
- 表格编辑

## 5.3 新增 Voronoi 专属 composable

建议新增：
- `project/src/composables/map/useVoronoiCustomDataImport.js`

职责：
- 定义 Voronoi schema
- 复用 `useTabularImportPreview`
- 复用 `useTabularImportFlow`
- 将 preview mapping 结果转换为自定义 normalized rows
- 提供 diagnostics
- 提供：
  - `open / close`
  - `loadPreview`
  - `confirmCustomRows`
  - `clearCustomRows`
  - `customImportSummary`
  - `customRowsConfirmed`

这样可以避免把表格导入细节堆进 `MapDrawTab.vue`。

---

## 6. 推荐的数据流

## 6.1 官方数据流（保留）

- 打开 Voronoi 面板
- 如需要则调用 `getLocationPartitions()`
- 缓存在 `usePartitionCache`
- 得到 `officialVoronoiRows`

## 6.2 自定义数据流（新增）

- 打开自定义导入 modal
- 用户选择 xlsx/xls/csv
- `TabularImportPreview` 进行：
  - parse
  - sheet 选择
  - header row 选择
  - mapping
  - diagnostics
- 用户点击确认
- composable 输出 `customVoronoiRowsConfirmed`

## 6.3 统一生效数据流

建议在 `MapDrawTab.vue` 中新增统一 computed：
- `voronoiEffectiveRows`

规则：
- 官方开关开，且有官方数据 -> 纳入
- 自定义已确认 -> 纳入
- 两者都满足 -> 合并

然后：
- `normalizeVoronoiPoints()` 改为吃 `voronoiEffectiveRows`
- `previewVoronoiPoints()` / `handleBuildVoronoi()` / `exportVoronoiToLayer()` / `confirmVoronoiExport()` / `buildVoronoiSelectionOptions()` 全都继续使用统一后的点集

这样后端/算法层几乎不需要感知“数据来源模式”的复杂性。

---

## 7. 关于“是否需要明确三种模式”的最终建议

最终建议：
- 业务上承认三种组合态存在
- UI 上不做“显式三模式下拉/单选器”
- 用两层状态表达：
  1. 是否有自定义数据
  2. 是否使用官方数据

原因：
1. 更符合你现在的想法
2. 用户心智更自然
3. 状态扩展性更好
4. 仍然能完整覆盖三种实际组合

对内可以保留一个 computed label，例如：
- `official-only`
- `custom-only`
- `hybrid`

但这只是内部派生状态，不需要作为主要 UI 控件暴露。

---

## 8. 关于“是否值得支持编辑”的结论

v1 明确不做编辑。

原因：
1. 现有 `TabularImportPreview` 的职责边界非常清晰：preview + mapping
2. 这次需求的痛点是“列名不稳定 / 字段找不到 / 分区列对不上”，不是“需要改单元格内容”
3. 一旦支持编辑，会迅速把组件变成 mini spreadsheet editor，显著增加：
   - state complexity
   - dirty state 管理
   - 输入法/键盘交互
   - 校验时机
   - 保存语义
4. 当前项目里没有现成的通用表格编辑基建，这会明显扩大 scope

建议 v1 用以下方式替代编辑诉求：
- 更清晰的 schema 文案
- 更清晰的 diagnostics
- 明确指出缺失的是哪一列 / 哪类值
- 必要时允许用户“重新选文件”或“重新选 header row”

---

## 9. 风险与边界

## 9.1 hybrid 冲突风险

官方数据与自定义数据一起使用时，可能出现：
- 同名点
- 同坐标点
- 同点但分区不一致

v1 建议：
- 不自动 merge / dedupe
- 只做 warning diagnostics
- 先按并集参与计算

## 9.2 自定义分区值的语义边界

自定义分区值支持按 `-` 拆层级，并在层级不足时自动补足到 3 级；但这只是结构性补足，不代表系统会推断真实官方三级路径。

需要明确的边界：
- `A` -> `A/A/A`
- `A-B` -> `A/A-B/A-B`
- `A-B-C` -> `A/A-B/A-B-C`

不做的事情：
- 不根据音典树或地图集树去猜测 `A` 对应的官方二级/三级路径
- 不要求用户上传值必须命中当前系统树
- 不把“结构补足”误当成“官方语义补全”

如果后续产品真的要求“单层级名自动扩展成官方完整树路径”，那是单独的新需求，应基于明确映射表/树节点匹配策略另做设计，而不应混入本期 v1。

## 9.3 ignore points 不能长期只按 name 处理

当前 ignore 流程本质是按 `name` 去排除。若引入 hybrid：
- 同名不同源会误伤

因此实现阶段建议：
- normalized point 增加 `sourceKey`
- ignore state 最终迁移为按 `sourceKey` 记录
- UI 展示仍可用 name，但内部排除逻辑应更稳

## 9.3 不要污染现有普通图层导入语义

这次需求必须保持边界：
- `handleImportAsNewLayer()` 仍然是图层导入
- Voronoi 自定义数据导入只是 Voronoi 子流程
- 不要把表格预览、分区匹配、Voronoi 业务校验反塞进普通 layer import

---

## 10. 建议文件改动范围（实现期）

新增：
- `project/src/main/components/map/Draw/modals/VoronoiDataImportModal.vue`
- `project/src/composables/map/useVoronoiCustomDataImport.js`

修改：
- `project/src/main/components/map/Tabs/MapDrawTab.vue`
- `project/src/main/components/map/Draw/panels/MapDrawVoronoiPanel.vue`
- `project/src/main/utils/drawMap/partitionVoronoi.js`
- `project/src/i18n/locales/zh-Hant/map.json`
- `project/src/i18n/locales/zh-CN/map.json`
- `project/src/i18n/locales/en/map.json`

必要时少量补充：
- `project/src/i18n/locales/*/common.json`

---

## 11. 推荐实施顺序

### Phase 1：自定义数据导入链路打通
目标：先做到“仅自定义数据可计算 Voronoi”

内容：
- 新增 VoronoiDataImportModal
- 新增 useVoronoiCustomDataImport
- 复用通用 import preview 完成 mapping
- 生成 custom rows
- 官方数据开关可关闭

### Phase 2：官方 + 自定义统一数据源
目标：在不扩散算法分支的前提下支持组合使用

内容：
- `voronoiEffectiveRows`
- official/custom unified normalize
- summary / status 升级

### Phase 3：冲突提示与 ignore 身份增强
目标：补足 hybrid 下的稳定性

内容：
- sourceType / sourceKey
- duplicate / collision diagnostics
- ignore 从 `name` 迁移到 `sourceKey`

---

## 12. 最终建议（给实施者）

1. 官方数据不是“只能音典分区”，而是“默认音典分区，可切换地图集分区”
2. 用户上传数据的关键不是字段名固定，而是能通过通用 import preview 组件匹配到 Voronoi 所需语义列
3. UI 不必做生硬的“三模式选择器”；两层状态已经足够：
   - 是否有自定义数据
   - 是否使用官方数据
4. 实现边界要非常严格：
   - Voronoi 自定义数据导入 ≠ 普通 map layer 导入
   - preview + mapping 复用通用组件
   - v1 不做编辑
5. 计算层应继续复用 `partitionVoronoi.js`，重点改的是数据接入层与统一归一化层
