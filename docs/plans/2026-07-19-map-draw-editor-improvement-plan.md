# Map Draw 编辑器问题调研与改造计划

> 本文只做调研、问题归因和实施计划，不修改现有页面代码。后续执行时按仓库要求逐步推进：每一步先检查工作区、只改当前步骤文件、实现后 `git diff` 做 CR、验证通过再单独提交。

**目标：** 把 `/menu/map/draw` 从“能画一些图形的工具页”提升到“可稳定编辑、可撤回、图层状态可信、导入导出不丢样式”的地图绘制工作台。

**推荐路线：** 先保留当前 MapLibre GL + `@mapbox/mapbox-gl-draw` 技术线，集中修复状态同步、样式属性、撤销重做和顶点/边编辑入口；不要第一步就替换绘制内核。等 P0/P1 问题收敛后，再评估是否迁移到 Terra Draw 或引入 Mapbox Draw custom modes。

---

## 0. 当前执行进度

截至当前分支 `codex/map-draw-editor-fixes`：

| 阶段 | 状态 | 相关提交 | 说明 |
| --- | --- | --- | --- |
| Step 0 调研契约测试 | 已完成 | `85c6c04f` | 已建立 `mapDrawEditorContracts.test.js`，覆盖样式、历史、编辑入口等关键 wiring。 |
| Step 1 图层隐藏稳定性 | 已完成 | `5233fd55` | Draw 启用 `userProperties`，活动图层隐藏通过样式过滤保持数据不丢。 |
| Step 2 撤销/重做 | 已完成 | `b76c82d4`、`f39d071b` | 已有 undo/redo、快捷键、历史恢复状态防护和 layer id seed 恢复。 |
| Step 3 显式编辑形状 | 已完成 | `8da76bdc` | 已暴露“编辑形状”入口，进入 Mapbox Draw `direct_select`。 |
| Step 4 要素级属性编辑 | 已完成 | `0ddde93c` | 工具面板新增要素列表；选中要素时只改该 feature，未选中时保留图层级编辑。 |
| 状态流测试加固 | 已完成 | `519399fa` | 新增 `EditableMapLibre` 可执行状态流测试，覆盖面板选择不进 direct edit、隐藏/锁定不可 direct edit、属性同步不重复提交 history。 |
| Step 6 底图切换生命周期 | 已完成 | `9ff38a12` | `EditableMapLibre` 监听 `style.load`，在底图样式重载后恢复 Draw 数据、readonly layers 和 preview layers，且不触发 history/data-change 事件。 |
| Step 7 图层管理易用性 | 部分完成 | `a3b10d90`、`9e0f5a92`、`43d828a4`、`91c5321f`、`7744c532`、`0e44785b`、`bc8bc098`、`eb1ab82c`、`add2e4fe` | 已支持复制图层、复制选中要素、删除图层确认、图层行显示几何/要素数/显示锁定状态、图层行内重命名、重命名失焦保存、选中要素移动到同类型可编辑图层，并阻止隐藏或锁定活动图层继续绘制/删除/清空。 |

已验证命令：

- `npm test -- editableMapLibreStateFlow.test.js mapDrawEditorContracts.test.js tests/utils/drawMap/history.test.js`
- `npx eslint src/main/components/map/EditableMapLibre.vue tests/editableMapLibreStateFlow.test.js --quiet`
- `git diff --check`
- `npm run build`

下一批建议按“小步提交”继续推进：

1. 完成 Step 7 剩余项：多选/批量操作的范围确认，优先考虑“多选要素后批量删除/移动到图层/批量显隐锁定”。
2. 做一个轻量 Step 8：未保存状态与自动草稿恢复提示。当前已有手动本地草稿，但还缺 dirty 提醒和自动恢复。
3. 再做 Step 5，将 layer mutation 逐步集中为工具函数；这一步会改变内部结构，应拆成多个小提交并先确认结构边界。
4. 最后评估高阶几何能力：吸附、矩形/圆、切割、拆分、合并、自定义模式或 Terra Draw 迁移。

---

## 1. GitHub 成熟项目调研结论

### 1.1 参考项目

本次参考了这些成熟开源项目或官方文档：

| 项目 | 定位 | 对本页有价值的能力 |
| --- | --- | --- |
| [mapbox/geojson.io](https://github.com/mapbox/geojson.io) | 浏览器端空间数据编辑器 | 点/线/面/矩形/圆绘制，属性编辑，表格批量编辑，多格式导入导出，快捷键，URL 预加载，多选与空间操作 |
| [mapbox/mapbox-gl-draw](https://github.com/mapbox/mapbox-gl-draw) | 当前绘制内核 | `simple_select`、`direct_select`、点线面绘制、删除、合并/拆分 Multi*、自定义模式、自定义样式 |
| [Mapbox Draw API](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md) | 当前内核 API 文档 | 明确 `direct_select` 支持顶点拖拽、删除顶点、点击 midpoint 添加顶点；`userProperties` 会把业务属性加 `user_` 前缀暴露给样式 |
| [Mapbox Draw custom modes](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/MODES.md) | 当前内核扩展路径 | 可通过 custom modes 增加切割、矩形、圆、旋转/缩放、吸附、pinning 等 |
| [geoman-io/leaflet-geoman](https://github.com/geoman-io/leaflet-geoman) | 专业 Leaflet 几何编辑插件 | Draw/Edit/Drag/Cut/Rotate/Split/Scale/Measure/Snap/Pin Layers，说明成熟绘制工具的编辑面远超过“新建 + 删除” |
| [JamesLMilner/terra-draw](https://github.com/JamesLMilner/terra-draw) | 跨 MapLibre/Mapbox/Leaflet/OpenLayers 的绘制内核 | 多地图适配器、集中 drawing logic、多模式、内建 undo/redo 结构与键盘快捷键 |
| [umap-project/umap](https://github.com/umap-project/umap) | 完整地图制作产品 | 多图层地图制作、嵌入、持久化、撤销日志/编辑 journal，偏产品层能力 |

### 1.2 成熟地图绘制前端通常包括什么

成熟绘制页的基础能力可以分成六层：

1. **绘制与选择**
   - 点、线、面绘制。
   - 矩形、圆、自由绘制等快捷几何。
   - 单选、多选、框选。
   - 已绘制要素可再次进入编辑状态。

2. **几何编辑**
   - 拖动整个要素。
   - 拖动顶点。
   - 点击边上的 midpoint 新增顶点。
   - 选中顶点后删除顶点。
   - 线/面切割、拆分、合并。
   - 可选：吸附、共享边 pinning、旋转、缩放、测量。

3. **历史与安全操作**
   - undo / redo 按钮。
   - `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`、`Ctrl+Y` 快捷键。
   - 删除、清空、导入、恢复草稿都进入历史栈。
   - 当前是否可撤销/重做要有 UI 状态。

4. **图层管理**
   - 新建、导入、删除、复制、重命名。
   - 显示/隐藏、锁定/解锁。
   - 图层排序，且排序和视觉层级一致。
   - 活动图层与只读图层边界清楚。
   - 被隐藏或锁定的图层不参与误选、误编辑。

5. **属性与数据编辑**
   - 要素属性编辑，而不仅是图层属性编辑。
   - 批量属性编辑。
   - 表格视图检查属性。
   - 导入导出时不破坏已有业务字段。

6. **导入、导出、草稿与恢复**
   - GeoJSON / KML / KMZ / CSV 等导入。
   - GeoJSON / 图片导出。
   - 本地草稿/自动恢复。
   - 导入失败诊断、坐标字段识别、空数据提示。

---

## 2. 当前 `map/draw` 已有功能

当前主入口是：

- `project/src/main/views/menu/MapPage.vue`
- `project/src/main/components/map/Tabs/MapDrawTab.vue`
- `project/src/main/components/map/EditableMapLibre.vue`

已具备：

1. **登录保护**
   - 未登录时展示登录提示。

2. **基础绘制**
   - 点图层、线图层、面图层。
   - 选择、删除选中、清空当前活动图层。
   - 重置视图、地图全屏。

3. **多图层**
   - 添加图层。
   - 导入为新图层。
   - 图层选择。
   - 图层上移/下移/置顶/置底。
   - 图层显示/隐藏。
   - 图层锁定/解锁。
   - 图层删除。
   - 全部显示/全部隐藏。

4. **样式和属性**
   - 图层名。
   - 线条颜色、宽度。
   - 面填充色、透明度。
   - 点颜色、描边色、半径。
   - 图层级 `visible` / `locked`。

5. **导入导出**
   - 导入 `.json`、`.geojson`、`.kml`、`.kmz`、`.csv`。
   - MultiPoint / MultiLineString / MultiPolygon 会拆成基础点线面图层。
   - 当前图层导出 GeoJSON。
   - 全部图层合并导出 GeoJSON。
   - PNG 图片导出，支持当前视图、选中图层、选中要素、自定义框选、尺寸、zoom、是否包含底图/绘制图层。

6. **本地草稿**
   - IndexedDB 草稿列表。
   - 保存为新草稿。
   - 更新草稿。
   - 恢复草稿。
   - 删除草稿。
   - 兼容旧 localStorage 草稿迁移。

7. **Voronoi**
   - 官方点位加载。
   - 自定义 xlsx/xls/csv 点位导入。
   - 官方数据与自定义数据组合。
   - 地图集分区/音典分区切换。
   - 忽略点选择。
   - 字段合并。
   - 点预览、多边形预览。
   - 导出为多个面图层。
   - 可选国界裁剪。

---

## 3. 当前明确缺失的能力

### 3.1 P0/P1 缺失

1. **撤销/重做**
   - 当前没有 undo / redo 状态，也没有键盘快捷键。
   - 删除、清空、导入、恢复草稿、图层属性修改后都不可撤回。

2. **可发现的顶点/边编辑入口**
   - `mapbox-gl-draw` 本身有 `direct_select`，但当前 UI 只有“选择”按钮。
   - 用户不知道“再点一次要素/顶点”才能进入细节编辑。
   - 没有“编辑形状/编辑顶点”模式按钮。
   - 没有提示“点击边上 midpoint 可插入顶点，再拖动顶点即可调整某一条边”。

3. **要素级属性编辑**
   - 当前工具面板标题叫“图层属性”，数据源也是 `activeLayer`。
   - 选中某个 feature 后，并没有展示该 feature 的属性表单。
   - 因此用户很难对单个面、单条线、单个点设置名称/样式/可见性/锁定。

4. **图层状态可靠性**
   - 当前隐藏/显示依赖 layer state、feature properties、Draw internal source、readonly source 多处同步。
   - active layer 和 readonly layer 的渲染路径不同，容易造成“有时能隐藏，有时隐藏不了”。

### 3.2 P2 缺失

1. **图层复制/重命名独立入口**
   - 目前能改图层名，但入口混在绘图工具属性面板里。

2. **多选和批量操作**
   - 目前没有明确多选 UI。
   - 没有批量删除、批量移动到图层、批量属性编辑。

3. **吸附与边界质量工具**
   - 没有 snapping。
   - 没有共享边 pinning。
   - 没有切割/拆分面。
   - 没有合并面或线。

4. **数据表格视图**
   - 导入后不能像 geojson.io 那样用表格检查和批量编辑属性。

5. **自动草稿/未保存提示**
   - 现在是手动本地草稿。
   - 没有 dirty 状态、离开页面提醒、自动保存恢复。

---

## 4. 已有功能的具体问题与根因

### 4.1 隐藏图层不稳定

**现象：**

- 非活动图层隐藏较容易生效。
- 活动图层有时隐藏后又出现，或切换图层/底图/编辑状态后表现不一致。

**代码证据：**

- 活动图层由 Mapbox Draw 内部 source 渲染：
  - `EditableMapLibre.vue` 初始化 Draw：`draw.value = new MapboxDraw(...)`
  - `MapDrawTab.vue` 通过 `activeLayerFeatureCollection` 把当前活动图层传给 Draw。
- 非活动图层由只读 GeoJSON source 渲染：
  - `EditableMapLibre.vue` 的 `buildReadonlyLayerDescriptors()` / `syncReadonlyLayerDescriptor()`。
- `toggleLayerVisibility()` 会改 layer.visible，也会把 `visible` 写入每个 feature properties，然后调用 `syncActiveLayerToMap()` 和 `syncReadonlyLayers()`。
- Draw 自定义样式直接读取 `['get', 'visible']`、`['get', 'stroke']`、`['get', 'fill']` 等字段。
- 但 `@mapbox/mapbox-gl-draw` 默认 `userProperties: false`；如果开启，则样式里拿到的是 `user_visible`、`user_stroke` 这类前缀字段。当前初始化没有配置 `userProperties`。

**根因判断：**

1. 当前样式属性读取方式和 Draw 的用户属性机制不匹配。
2. 活动图层和只读图层不是同一套 source/layer 渲染机制。
3. 隐藏活动图层时通过 `deleteAll()` / `set()` 反复重灌 Draw 数据，会干扰选中状态和 direct_select 状态。
4. `watch(() => [props.modelValue, props.activeLayer?.visible], ..., { deep: true })` 对深层变化过于敏感，可能在用户编辑时触发重灌。

### 4.2 无法编辑面图层某一条边

**现象：**

- 用户想调整某个面的某一条边，但页面没有明确操作入口。
- 只能看到绘制、选择、删除等按钮。

**代码证据：**

- `EditableMapLibre.vue` 暴露了 `selectFeature(featureId)`，内部会进入 `direct_select`。
- 但 `MapDrawTab.vue` 没有使用 `editableMapRef.value?.selectFeature?.(...)` 让用户从图层或要素列表进入 direct_select。
- `MapDrawToolsPanel.vue` 只有 `simple_select`、`draw_point`、`draw_line_string`、`draw_polygon` 三类模式按钮，没有“编辑顶点/边”的显式按钮。
- 面板的属性编辑对象是 `activeLayer`，不是 `selectedFeature`。

**根因判断：**

1. 几何编辑能力被内核隐藏在 `direct_select` 交互里，但产品层没有暴露。
2. 当前没有 feature list，所以用户无法稳定选择“某一个面”。
3. 当前没有 vertex/edge 状态说明，也没有 midpoint 插入顶点提示。

### 4.3 无法撤回

**现象：**

- 绘制错误、拖错点、删错图层、清空后不可撤回。

**代码证据：**

- 全仓库当前 map draw 相关代码没有 `undo` / `redo` / `history`。
- `deleteSelected()` 直接 `draw.trash()`。
- `clearAll()` 直接 `draw.deleteAll()`。
- `handleDeleteLayer()` 直接 `layers.value.splice(...)`。
- `handleRestoreLocal()` 直接 `applyDraftState(...)`。

**根因判断：**

1. 缺少统一 workbench 历史栈。
2. 当前 layer state 和 Draw internal state 分离，没有一个“提交变更”的单一入口。
3. 程序化 Draw API 默认不总是触发对应事件，不能只靠 `draw.create/update/delete` 捕获全部历史。

### 4.4 图层编辑和要素编辑混在一起

**现象：**

- 面板里写“图层属性”，实际用户选中地图上的某个图形后可能期待编辑该图形。
- 图层名、颜色、隐藏、锁定改的是整个 active layer，所有 feature 都跟着变。

**代码证据：**

- `selectedFeatureProperties = computed(() => activeLayer.value ?? null)`。
- `updateSelectedFeatureProperty()` 修改 `activeLayer.value[key]`，再把同一属性写入所有 feature。

**根因判断：**

1. UI 命名和数据模型不够清楚。
2. 缺少 `selectedFeature` computed。
3. 缺少“图层属性”和“选中要素属性”两个明确编辑区。

### 4.5 样式属性导入导出会制造噪声

**现象风险：**

- 导入后所有 feature 都会被补默认样式、`updatedAt`。
- 每次 normalize 都会刷新 `updatedAt`，导致 diff/导出内容有非业务变化。

**代码证据：**

- `normalizeFeatureCollection()` 对每个 feature 注入默认样式和 `updatedAt: new Date().toISOString()`。
- 导出 GeoJSON 前也调用 `normalizeFeatureCollection()`。

**根因判断：**

1. normalize 同时承担“输入兜底”和“导出序列化”，职责偏重。
2. `updatedAt` 不是用户显式编辑产生的稳定字段。

### 4.6 底图切换后的图层恢复风险

**现象风险：**

- MapLibre `setStyle()` 会重建 style，所有自定义 sources/layers 都需要等 style load 后重挂。

**代码证据：**

- `EditableMapLibre.vue` 监听的是 `styledata` 后 `syncReadonlyLayers()`。
- 仓库已有测试曾要求其他地图组件从 `styledata` 改成 `style.load`，说明这是项目内反复出现过的生命周期问题。

**根因判断：**

1. `styledata` 可能过早或多次触发。
2. 当前只同步 readonly/preview layers，Draw 自身 layers 在 style 切换后的稳定性也需要实测。

---

## 5. 改造策略

### 推荐方案：渐进修复当前内核

第一阶段继续使用 MapLibre GL + `@mapbox/mapbox-gl-draw`：

- 风险最小。
- 不影响当前 Voronoi、导入导出、图片导出、本地草稿。
- 可优先修复用户已经明确感知的问题。
- 后续仍可通过 custom modes 加 snapping、cut/split、rectangle/circle。

不推荐第一步直接迁移到 Terra Draw 或 Leaflet-Geoman：

- Terra Draw 对 MapLibre 友好，但迁移会触及整个 EditableMapLibre 的事件、样式、导入导出、预览和图片导出链路。
- Leaflet-Geoman 功能很强，但项目当前地图栈是 MapLibre，迁移成本更高。
- 当前最痛的问题不是“内核完全不能做”，而是“状态层、UI 暴露和历史栈没建好”。

---

## 6. 分步实施计划

### Step 0：补充可回归的调研测试

**目标：** 先用轻量测试锁定当前问题形态，避免后续修复引入回退。

**文件：**

- 新增：`project/tests/mapDrawEditorContracts.test.js`
- 只读核对：
  - `project/src/main/components/map/EditableMapLibre.vue`
  - `project/src/main/components/map/Tabs/MapDrawTab.vue`
  - `project/src/main/components/map/Draw/panels/MapDrawToolsPanel.vue`

**测试点：**

- Draw 初始化必须显式设置业务属性样式策略。
- 工具面板必须出现 undo / redo 入口。
- 工具面板必须出现编辑形状/顶点入口。
- `MapDrawTab` 必须有集中历史提交入口，而不是各操作直接改 `layers` 后结束。

**验证：**

- `npm test -- mapDrawEditorContracts.test.js`
- `npm run lint`

**提交建议：**

- `test: add map draw editor contract coverage`

### Step 1：修复 Draw 样式属性和图层隐藏同步

**目标：** 先让“隐藏/显示”稳定可信。

**文件：**

- 修改：`project/src/main/components/map/EditableMapLibre.vue`
- 修改：`project/src/main/components/map/Tabs/MapDrawTab.vue`

**做法：**

1. 给 Draw 初始化补 `userProperties: true`。
2. 将 Draw styles 中所有业务属性读取改为 `user_*`：
   - `stroke` -> `user_stroke`
   - `strokeWidth` -> `user_strokeWidth`
   - `fill` -> `user_fill`
   - `fillOpacity` -> `user_fillOpacity`
   - `visible` -> `user_visible`
   - `pointRadius` -> `user_pointRadius`
   - `pointColor` -> `user_pointColor`
   - `pointStrokeColor` -> `user_pointStrokeColor`
3. readonly/preview layers 继续读普通 properties，不改外部 GeoJSON 数据结构。
4. 隐藏 active layer 时避免把真实 `featureCollection` 清掉，只同步 Draw 视图。
5. 切换 active layer、显示/隐藏、全显/全隐后，验证 Draw source 和 readonly source 都刷新。

**验收：**

- 活动图层隐藏后地图上立即不可见。
- 切换到底图再切回，隐藏状态仍保持。
- 切换活动图层后，隐藏状态仍保持。
- 非活动图层隐藏/显示仍正常。
- 导出全部图层不因为隐藏状态丢失真实数据。

**提交建议：**

- `fix: stabilize map draw layer visibility`

### Step 2：建立 workbench 历史栈，支持撤销/重做

**目标：** 所有危险操作可撤回，先覆盖用户最痛路径。

**文件：**

- 新增：`project/src/main/utils/drawMap/history.js`
- 修改：`project/src/main/components/map/Tabs/MapDrawTab.vue`
- 修改：`project/src/main/components/map/Draw/panels/MapDrawToolsPanel.vue`
- 修改 locale：
  - `project/src/i18n/locales/zh-CN/map.json`
  - `project/src/i18n/locales/zh-Hant/map.json`
  - `project/src/i18n/locales/en/map.json`

**历史栈模型：**

- snapshot 内容：
  - `layers`
  - `activeLayerId`
  - `currentStyleKey`
  - `selectedFeatureId`
  - 必要的 panel open state 可先不进入历史。
- 操作入口：
  - `commitHistory(label)`：变更前保存当前 snapshot。
  - `undo()`：当前状态入 redo，恢复 undo 栈顶部。
  - `redo()`：当前状态入 undo，恢复 redo 栈顶部。
  - `clearHistory()`：恢复草稿后清理或保留需明确，建议恢复草稿作为一个可撤回操作。
- 栈上限：50。

**必须纳入历史的操作：**

- 创建图层。
- 导入图层。
- 删除图层。
- 图层排序。
- 图层显示/隐藏。
- 图层锁定/解锁。
- 修改图层属性。
- 绘制 create/update/delete。
- 删除选中。
- 清空当前图层。
- Voronoi 导出到图层。
- 恢复本地草稿。

**快捷键：**

- macOS：`Meta+Z` undo，`Meta+Shift+Z` redo。
- Windows/Linux：`Ctrl+Z` undo，`Ctrl+Shift+Z` 或 `Ctrl+Y` redo。
- 输入框聚焦时不拦截。

**验收：**

- 画一个面后 undo 可移除，redo 可恢复。
- 拖动面顶点后 undo 可恢复原坐标。
- 删除选中后 undo 可恢复。
- 清空后 undo 可恢复。
- 删除图层后 undo 可恢复 active layer 和数据。
- 隐藏图层后 undo/redo 能切换可见性。

**提交建议：**

- `feat: add undo redo for map draw workbench`

### Step 3：显式暴露“编辑形状/顶点”模式

**目标：** 让用户能稳定进入面边界编辑，不靠隐性点击技巧。

**文件：**

- 修改：`project/src/main/components/map/EditableMapLibre.vue`
- 修改：`project/src/main/components/map/Tabs/MapDrawTab.vue`
- 修改：`project/src/main/components/map/Draw/panels/MapDrawToolsPanel.vue`
- 修改 locale 三套 map.json。

**做法：**

1. 新增工具按钮：`编辑形状` / `Edit Shape`。
2. 当前有选中 feature 且 geometry 不是 Point 时，点击按钮调用：
   - `draw.changeMode('direct_select', { featureId })`
3. 当前没有选中 feature 时，按钮 disabled，并展示简短提示。
4. 在 `draw.modechange` 中同步真实 mode 到 `currentMode`，不能只依赖外部按钮点击。
5. `deleteSelected()` 在 direct_select 下保留 Mapbox Draw 默认语义：
   - 选中顶点时删除顶点。
   - simple_select 下删除整个 feature。
6. 新增说明文案：
   - 选中面后进入编辑形状。
   - 拖动顶点可调整边界。
   - 点击边上的中点可插入顶点。

**验收：**

- 选中一个面后可点击“编辑形状”。
- 面边界出现顶点和 midpoint。
- 拖动两个相邻顶点后，对应边位置变化。
- 点击 midpoint 后新增顶点。
- 删除顶点可撤回。

**提交建议：**

- `feat: expose direct shape editing in map draw`

### Step 4：拆清“图层属性”和“要素属性”

**目标：** 避免用户以为在改单个面，实际改了整个图层。

**文件：**

- 修改：`project/src/main/components/map/Tabs/MapDrawTab.vue`
- 修改：`project/src/main/components/map/Draw/panels/MapDrawToolsPanel.vue`
- 修改：`project/src/main/components/map/Draw/panels/MapDrawLayersPanel.vue`
- 修改 locale 三套 map.json。

**做法：**

1. `MapDrawToolsPanel` 中分成两个 section：
   - 当前图层属性。
   - 选中要素属性。
2. 新增 `selectedFeature` computed：
   - 优先从 Draw 内部 `draw.get(selectedFeatureId)` 拿 active feature。
   - fallback 从 `activeLayer.featureCollection.features` 查找。
3. 要素属性修改只调用 `updateFeatureProperties(featureId, patch)`。
4. 图层属性修改仍可批量应用默认样式，但按钮文案要明确：
   - “应用到图层内所有图形”
5. 如果当前无选中要素，展示“选择一个图形后可编辑单个图形属性”。

**验收：**

- 改图层颜色会影响整层。
- 改选中要素颜色只影响单个 feature。
- 改选中要素名称不会改图层名。
- 导出 GeoJSON 保留单个 feature 的属性差异。

**提交建议：**

- `feat: separate layer and feature editing in map draw`

### Step 5：统一 layer state 变更入口

**目标：** 降低状态不同步概率，给后续功能打基础。

**文件：**

- 新增或修改：`project/src/main/utils/drawMap/layers.js`
- 修改：`project/src/main/components/map/Tabs/MapDrawTab.vue`

**做法：**

把这些操作集中成纯函数或小工具：

- `createDrawLayer(geometryType, options)`
- `replaceLayerFeatureCollection(layers, layerId, featureCollection)`
- `patchLayer(layers, layerId, patch, options)`
- `patchLayerFeatures(layers, layerId, patch)`
- `moveLayer(layers, layerId, targetIndex)`
- `removeLayer(layers, layerId)`
- `sanitizeWorkbenchState(state)`

**验收：**

- 现有功能行为不变。
- 每个 layer mutation 都可以在调用前后接入 history。
- `MapDrawTab.vue` 内不再到处直接 `splice` / 深层改 `featureCollection`。

**提交建议：**

- `refactor: centralize map draw layer mutations`

### Step 6：底图切换和绘制层生命周期加固

**当前状态：** 已完成，提交 `9ff38a12`。

**目标：** 底图切换后所有绘制层、预览层、hover、选中态可恢复。

**文件：**

- 修改：`project/src/main/components/map/EditableMapLibre.vue`
- 修改测试：`project/tests/editableMapLibreStateFlow.test.js`

**做法：**

1. `setStyle()` 后以 `style.load` 为主重挂 readonly/preview layers。
2. 明确 Draw control 在 style 切换后是否需要 `draw.set(currentActiveCollection)`。
3. 避免 `styledata` 多次触发造成重复 addLayer 异常。
4. preview hover 只在 preview source/layer 确认可用后绑定。

**验收：**

- 创建两个图层，隐藏一个，切换底图后 hidden readonly layer 的 source/layer 可恢复。
- Voronoi 预览层切换底图后 preview source/layer 可恢复，不出现半挂状态。
- 底图切换恢复 Draw/readonly/preview 图层时不触发 `before-features-change` 或 `features-change`，不会制造撤销历史。

**提交建议：**

- `fix: restore map draw layers after style changes`

### Step 7：补齐图层管理易用性

**目标：** 让添加、编辑、排序和删除图层更可控。

**文件：**

- 修改：`project/src/main/components/map/Draw/panels/MapDrawLayersPanel.vue`
- 修改：`project/src/main/components/map/Tabs/MapDrawTab.vue`
- 修改 locale 三套 map.json。

**做法：**

1. 图层行显示：
   - 几何类型。
   - feature 数量。
   - visible/locked 状态图标。
   - active 状态。
2. 增加图层重命名的就地入口，或保留在图层属性区但在图层行加“编辑”入口。
3. 删除图层前确认。
4. hidden layer 禁止成为误编辑目标；如果隐藏 active layer，自动退回 simple_select 并清空选中态。
5. locked layer 若为 active，允许查看但不允许进入 draw/direct_select。

**验收：**

- 用户能明确知道当前编辑的是哪一层。
- 隐藏图层后不能误选误改。
- 锁定图层后不能新增/移动/删点，但仍可显示和导出。

**提交建议：**

- `feat: improve map draw layer management`

### Step 8：导入导出数据清洁

**目标：** 不让 normalize 产生不必要的字段噪声。

**文件：**

- 修改：`project/src/main/utils/drawMap/export.js`
- 修改相关测试。

**做法：**

1. 拆分：
   - `normalizeImportedFeatureCollection()`
   - `normalizeDrawFeatureCollection()`
   - `serializeFeatureCollectionForExport()`
2. 不在每次 normalize 时刷新 `updatedAt`。
3. 仅在用户真实编辑 feature 时写入更新时间；如果当前没有业务需要，可移除导出时强制写 `updatedAt` 的行为。
4. 导出时保留原始业务字段，不把 UI 内部字段无脑覆盖外部字段。

**验收：**

- 导入后立即导出，不应出现每次不同的 `updatedAt`。
- 原 GeoJSON 业务字段保持。
- 样式字段仍能正常驱动页面显示。

**提交建议：**

- `fix: reduce map draw export property churn`

### Step 9：可选增强评估

**目标：** 在核心体验稳定后再决定是否扩展复杂编辑能力。

候选方向：

1. **继续 Mapbox Draw custom modes**
   - 矩形、圆、cut/split polygon、snapping、rotate/scale。
   - 优点：沿用当前技术栈。
   - 缺点：第三方 custom modes 质量不一，需要逐个验证。

2. **迁移 Terra Draw**
   - 优点：支持 MapLibre adapter，有 undo/redo 设计，现代 drawing logic 较集中。
   - 缺点：会重写 `EditableMapLibre` 大部分交互层，影响 Voronoi/导入导出/图片导出。

3. **只做业务定制，不追求 GIS 完整编辑器**
   - 优点：最小改动，适合方言区划标注。
   - 缺点：切割、吸附、共享边等专业能力仍缺失。

建议等 Step 1-8 完成后再做这一步评估。

---

## 7. 验证矩阵

后续每一步至少覆盖：

| 场景 | 必测点 |
| --- | --- |
| 新建点/线/面图层 | 图层创建、active layer、默认样式、绘制模式 |
| 面编辑 | 选中面、进入编辑形状、拖顶点、插入顶点、删顶点 |
| 隐藏显示 | active layer、readonly layer、全显全隐、底图切换后保持 |
| 锁定 | 不能编辑但可显示/导出 |
| 撤销重做 | 绘制、移动顶点、删除、清空、导入、图层排序、隐藏显示 |
| 导入 | GeoJSON/KML/KMZ/CSV、Multi* 拆分、空文件/无支持几何 |
| 导出 | 当前图层、全部图层、图片导出、选中图层/选中要素范围 |
| 草稿 | 保存、更新、恢复、删除、恢复后可继续编辑 |
| Voronoi | 点预览、多边形预览、导出到图层、忽略点、字段合并 |
| i18n/编码 | zh-CN、zh-Hant、en 文案；中文和 emoji 不被转义或损坏 |

推荐命令：

```bash
cd project
npm test -- mapDrawEditorContracts.test.js
npm test
npm run lint
npm run build
```

---

## 8. 风险与注意事项

1. **不要把 active layer 的真实数据为了隐藏而清空。**
   - 隐藏是视图状态，不是数据删除。

2. **不要把图层属性编辑误做成要素属性编辑。**
   - 两者必须在 UI 和数据入口上分开。

3. **不要大改路由或目录结构。**
   - 本需求只针对 `map/draw` 页面，不涉及路由重组。

4. **谨慎修改 i18n。**
   - 三套 locale 都要补齐。
   - 保留现有中文原文和 emoji。

5. **每个步骤都要单独 CR。**
   - 尤其检查是否改动了非 draw 页地图组件。
   - 检查 GeoJSON 导出字段是否出现非预期变化。

---

## 9. 优先级总结

建议执行顺序：

1. P0：样式属性和隐藏/显示稳定。
2. P0：undo/redo 历史栈。
3. P1：显式编辑形状/顶点入口。
4. P1：拆清图层属性和要素属性。
5. P1：统一 layer mutation，减少同步问题。
6. P1：底图切换生命周期加固。
7. P2：图层管理易用性。
8. P2：导入导出数据清洁。
9. P3：评估 custom modes 或 Terra Draw 迁移。

这样能最先解决用户已经明确提出的痛点：不能稳定编辑面边界、不能撤回、图层隐藏不可信、添加/编辑图层体验混乱。
