
---

# 自定义数据录入弹窗 — 完整实施方案 v4

> 基于对当前源码的逐文件核查（AppModal、CustomTab、CustomDataPanel、UserDataPage、router、MapLibre、API、SCSS 体系）修订。本版明确采用“弹窗方案”，第一版即依赖 4 个新增后端接口，不走 `/user/custom/all` 前端聚合过渡路线。

---

## 一、目标与范围

### 1.1 业务目标

在“地图-自定义”页中，废弃当前“逐条添加 / 批量添加”双入口的主入口形态，改为保留一个统一按钮“添加数据”，点击后打开一个专门服务于“用户自定义数据添加”的大弹窗。

该弹窗服务两类高频任务：

1. 用户围绕单个方言点持续补充多条资料
2. 用户围绕同一特征持续补充多个方言点，以便做地理语言学展示

### 1.2 必须保留的旧逻辑

以下旧能力必须原样保留，不因新弹窗接入而回归：

1. 个人数据管理页 `/auth/data` 保持不变
2. 地图右侧 `CustomDataPanel.vue` 的逐条添加逻辑保持不变
3. 旧的 `/user/custom/all`、`/user/custom/edit`、`/user/custom/batch-create`、`/user/custom/batch-delete` 继续服务旧页面
4. 用户在“查中古”“查音位”场景下顺手通过右侧面板新增数据的旧路径不变

### 1.3 本次实施边界

本次只做：

1. `CustomTab.vue` 主入口改造
2. 新增自定义录入弹窗及其内部组件树
3. 新增 4 个读取型后端接口的前端 API 封装
4. 新增轻量地图选点 / 地图预览组件
5. 接入新弹窗的增删改保存逻辑
6. 补全文案 i18n

本次不做：

1. 个人数据管理页重构
2. 地图右侧旧面板重构
3. 旧数据结构字段重命名
4. 把新弹窗做成独立路由页面
5. 用 `/user/custom/all` 替代新增聚合接口

---

## 二、推荐模式命名

用户可见命名建议最终采用：

1. `补充单点资料`
2. `制作特征分布`

理由：

- 比“按地点记录 / 按特征记录”更面向任务目标，而不是实现方式
- 能直接映射用户心智：
  - 模式1是在维护一个点
  - 模式2是在围绕一个特征扩点

内部状态值建议仍使用稳定英文值：

- `point`
- `feature`

即：

```js
const activeMode = ref('point') // 'point' | 'feature'
```

---

## 三、项目约束（必须写入方案并执行）

### 3.1 组件化约束

必须组件化，不允许把整个新弹窗全部堆在 `CustomTab.vue` 内。

建议组件树：

```text
src/main/components/map/
├── CustomTab.vue
└── custom-entry/
    ├── CustomDataEntryModal.vue
    ├── PointCentricMode.vue
    ├── FeatureCentricMode.vue
    ├── PointCardList.vue
    ├── PointDetailForm.vue
    ├── FeatureCardList.vue
    ├── FeatureDetailTable.vue
    ├── FeatureRecordEditorModal.vue
    └── MiniMapSelector.vue
```

### 3.2 i18n 约束

所有新增用户可见文案必须进入 i18n，不允许在模板中直接硬编码最终文案。

至少同步补充：

- `project/src/i18n/locales/zh-Hant/index.js`
- `project/src/i18n/locales/zh-CN/index.js`
- `project/src/i18n/locales/en/index.js`

允许在方案文档中用中文示意文案表达交互意图，但真实代码必须走 `t(...)`。

### 3.3 SCSS 约束

SCSS 优先复用现有公共风格，不新增无必要的平行视觉体系。

优先复用：

- `AppModal.vue`
- `.main-glass-panel`
- `.main-glass-button`
- 现有表单/按钮/下拉选择器语义
- 全局 scrollbar / close button / glass surface token

不建议：

- 为新弹窗单独发明一套完全脱离现有项目的视觉语言
- 为了一个页面去改造 `AppModal` 公共内部机制

### 3.4 组件复用约束

优先复用现有能力：

- `AppModal.vue`
- `RadioGroup.vue` 或现有按钮切换样式
- `SimpleSelectDropdown.vue`（若有合适场景）
- `HelpIcon.vue`（若需要说明）
- `mapStyle('gaode')`
- `batchMatch()` 用于地点自动补全
- `getRegions()` 用于地点分区辅助填充

### 3.5 兼容性约束

1. 新弹窗不得影响 `CustomDataPanel.vue` 显示条件
2. 新弹窗生命周期内不得写 `resultCache.mode`
3. 旧页面原有 API 使用方式不变
4. 旧右侧面板原有 API 使用方式不变
5. `CustomTab.vue` 改动必须最小化，避免顺带改动查询/帮助弹窗/现有搜索逻辑

### 3.6 中文与编码安全约束

本项目存在大量中文与繁体字段名：

- `簡稱`
- `音典分區`
- `經緯度`
- `聲韻調`
- `特徵`
- `值`
- `說明`

要求：

1. 不擅自改这些字段名
2. 不把中文文案批量改写成别的措辞
3. 编辑后必须重点 CR 中文内容与编码安全

---

## 四、现状核查结论

### 4.1 AppModal 尺寸机制

`AppModal.vue` 当前只有两档：

```js
const resolvedSize = computed(() => (props.size === 'lg' ? 'lg' : 'sm'))
```

因此大弹窗方案应采用：

```vue
<AppModal
  size="lg"
  width="90vw"
  max-height="90dvh"
/>
```

移动端收缩为：

- `width="96vw"`
- `max-height="92dvh"`

无需修改 `AppModal` 公共逻辑。

### 4.2 旧右侧面板显示条件

`CustomDataPanel.vue` 当前逻辑：

```js
const shouldShowPanel = computed(() => {
  const isMapTab = route.params.sub === 'view'
  if (!isMapTab) return false
  return resultCache.mode === '查中古' || resultCache.mode === '查音位'
})
```

因此：

- 新弹窗不应依赖 `resultCache.mode`
- 新弹窗也不能通过写 `resultCache.mode` 来控制自身入口或状态

### 4.3 路由现状

当前地图页路由：

- `/menu/map/view`
- `/menu/map/divide`
- `/menu/map/custom`

当前个人数据页路由：

- `/auth/data`

因为本次明确采用弹窗，不新增路由。

### 4.4 现有旧 CRUD 接口

当前已有：

- `GET /user/custom/all`
- `PUT /user/custom/edit`
- `POST /user/custom/batch-create`
- `DELETE /user/custom/batch-delete`

结论：

- 写接口可继续复用
- 读接口不足以支撑新弹窗的“点聚合 / 特征聚合 / 点详情 / 特征详情”四类读取需求
- 第一版直接引入 4 个新读取接口更合适，避免把聚合负担全部压在前端，也避免未来再返工

---

## 五、为什么第一版就新增四个接口

### 5.1 可以不用新接口吗？

技术上可以。理论上可以只拉 `/user/custom/all`，前端自己做聚合。

### 5.2 为什么本方案不采用 `/user/custom/all` 过渡

虽然可行，但不推荐，原因如下：

1. 新弹窗语义不是“全量明细表”，而是 4 类不同读取模型
2. 弹窗首次打开就全量拉取所有明细，不利于后续扩展
3. 点卡片/特征卡片的聚合规则散落在前端，后续维护成本高
4. 搜索、分页、最近更新时间、统计字段将来都需要后端支持
5. 第一版直接定义清楚读取接口，更符合长线产品形态

### 5.3 后端改动量判断

后端改动不算“极大”，但属于明确新增一组读取型能力：

1. 新增 4 个 GET 接口
2. 新增聚合查询与明细查询逻辑
3. 复用现有 JWT 鉴权
4. 不改写旧 CRUD 接口

所以本方案结论是：

- 第一版即使用完整四个新接口
- 不走 `/user/custom/all` 聚合过渡方案

---

## 六、真实数据字段与统一规则

### 6.1 明细记录字段（后端真实结构）

后端/store 实际字段（繁体中文）：

| 字段 | 说明 | 必填 |
|------|------|------|
| `簡稱` | 地点简称 | ✅ |
| `音典分區` | 分区 | ✅ |
| `經緯度` | 坐标字符串，格式 `lng,lat` | ✅ |
| `聲韻調` | 声韵调类型 | 可选 |
| `特徵` | 特征名 | ✅ |
| `值` | 特征值 | ✅ |
| `說明` | 备注 | 可选 |
| `created_at` | 主键（ISO 字符串） | 更新/删除依赖 |

### 6.2 统一坐标格式化

新增：

`src/utils/map/formatCoord.js`

```js
export const formatCoord = (lng, lat) => `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)}`
```

要求：

1. 新弹窗内部禁止自行散落实现坐标格式化
2. 旧右侧面板如存在相同逻辑，可在无行为变化前提下逐步复用此函数

### 6.3 前端内部稳定 key 规则

虽然接口明细仍以 `created_at` 作为记录主键，但前端列表层必须明确稳定 key：

- 方言点聚合 key：`pointKey = 簡稱 + '||' + 音典分區`
- 特征聚合 key：`featureKey = 特徵 + '||' + (聲韻調 || '')`

用于：

- 卡片 `:key`
- 本地选择状态
- 去重判断
- 行内冲突判断

---

## 七、组件树与文件清单

```text
src/main/components/map/
├── CustomTab.vue                       ← 改造：只保留“添加数据”按钮并挂载弹窗
│
└── custom-entry/
    ├── CustomDataEntryModal.vue        ← 弹窗容器（模式切换 + 子视图挂载）
    ├── PointCentricMode.vue            ← 模式1容器
    ├── FeatureCentricMode.vue          ← 模式2容器
    ├── PointCardList.vue               ← 模式1卡片列表
    ├── PointDetailForm.vue             ← 模式1详情编辑
    ├── FeatureCardList.vue             ← 模式2卡片列表
    ├── FeatureDetailTable.vue          ← 模式2表格页
    ├── FeatureRecordEditorModal.vue    ← 模式2单行编辑弹窗
    └── MiniMapSelector.vue             ← 小地图（点选 / 单点预览 / 多点预览）

src/api/main/user/
└── custom-entry.js                     ← 新增：4个新读接口

src/utils/map/
└── formatCoord.js                      ← 新增：统一坐标格式化
```

补充导出：

- `src/api/index.js`
- 如需要：`src/api/main/user/index.js`

补充 i18n：

- `project/src/i18n/locales/zh-Hant/index.js`
- `project/src/i18n/locales/zh-CN/index.js`
- `project/src/i18n/locales/en/index.js`

---

## 八、CustomTab.vue 改造（最小改动）

### 8.1 改造目标

只改两处：

1. 原有“逐条添加 / 批量添加”双按钮入口替换为一个统一按钮“添加数据”
2. 在组件内部挂载新弹窗组件

### 8.2 模板改动示意

```vue
<div class="button-group">
  <button
    class="action-btn add-entry-btn"
    @click="openEntryModal"
    :disabled="!userStore.isAuthenticated"
  >
    {{ t('map.customTab.buttons.addData') }}
  </button>
</div>

<CustomDataEntryModal v-model="isEntryModalOpen" />
```

### 8.3 script 改动示意

```js
import CustomDataEntryModal from './custom-entry/CustomDataEntryModal.vue'

const isEntryModalOpen = ref(false)

const openEntryModal = () => {
  if (!userStore.isAuthenticated) {
    showWarning(t('map.customTab.validation.loginFirst'))
    requireAuth()
    return
  }
  isEntryModalOpen.value = true
}
```

### 8.4 兼容要求

以下必须保留不动：

- `handleAddSingle()`
- `handleAddBatch()`
- 原帮助弹窗

即：

- 旧方法可以暂时保留为未使用状态
- 旧逻辑路径不删除，只是不再作为地图-自定义页主入口暴露

---

## 九、CustomDataEntryModal.vue — 弹窗容器

### 9.1 职责

1. 控制弹窗显隐
2. 控制两种模式切换
3. 承载 header、关闭按钮、模式切换
4. 使用 `KeepAlive` 保证弹窗打开期间切模式不丢状态
5. 关闭弹窗后重置子状态

### 9.2 推荐模板结构

```vue
<AppModal
  :model-value="modelValue"
  size="lg"
  width="90vw"
  max-height="90dvh"
  :close-on-backdrop="false"
  @update:modelValue="handleVisibleChange"
>
  <template #header>
    <div class="entry-modal-header">
      <h3 class="entry-modal-title">{{ t('map.customEntry.title') }}</h3>

      <div class="mode-switcher" role="group" :aria-label="t('map.customEntry.modeGroupLabel')">
        <button
          class="mode-btn"
          :class="{ active: activeMode === 'point' }"
          @click="activeMode = 'point'"
        >
          {{ t('map.customEntry.modes.point') }}
        </button>
        <button
          class="mode-btn"
          :class="{ active: activeMode === 'feature' }"
          @click="activeMode = 'feature'"
        >
          {{ t('map.customEntry.modes.feature') }}
        </button>
      </div>

      <button class="close-btn close-btn-lg close-btn-inline" @click="closeModal">×</button>
    </div>
  </template>

  <KeepAlive>
    <PointCentricMode v-if="activeMode === 'point'" key="point" />
    <FeatureCentricMode v-else key="feature" />
  </KeepAlive>
</AppModal>
```

### 9.3 状态策略

- 弹窗打开期间切换模式：保留已编辑状态
- 弹窗关闭后重新打开：清空弹窗内局部状态，重建实例

因此推荐：

- `CustomTab.vue` 中用 `v-if` 或 key 重建弹窗实例
- 或在 `CustomDataEntryModal.vue` 内显式监听关闭事件，执行 reset

推荐实现：关闭时 reset，避免不必要的组件销毁闪烁。

---

## 十、MiniMapSelector.vue — 小地图组件

### 10.1 组件目标

该组件不是复用完整业务地图 `MapLibre.vue`，而是做一个轻量嵌入地图组件，服务三种场景：

1. 新增地点时的可点击选点
2. 单点详情时的单点只读预览
3. 特征详情时的多点只读分布预览

### 10.2 建议 props

```js
const props = defineProps({
  coord: { type: Array, default: null },
  points: { type: Array, default: () => [] },
  visible: { type: Boolean, default: true },
  readonly: { type: Boolean, default: false },
  mode: { type: String, default: 'picker' } // 'picker' | 'single-preview' | 'multi-preview'
})
```

### 10.3 设计原则

1. 固定高度 `300px`
2. 完全复用 `mapStyle('gaode')`
3. 不使用业务弹窗 Popup
4. 优先使用 DOM Marker
5. 通过 `overflow: hidden` 限制地图渲染边界

### 10.4 三种显示模式

#### picker

- 点击地图后更新 `coord`
- 显示一个亮点 marker

#### single-preview

- 根据 `coord` 显示单点
- marker 上可带地点文字
- 禁止点击改点

#### multi-preview

- 根据 `points` 渲染多点
- 支持当前高亮点特殊样式
- 默认禁用点选，仅展示分布

### 10.5 关键样式要求

- 容器圆角
- canvas 不外溢
- marker 风格参考当前地图主界面的点位感受
- 移动端高度降为 `220px`

---

## 十一、模式1：补充单点资料（PointCentricMode）

### 11.1 用户目标

适用于：

- 用户已有一个方言点，想继续往这个点下加多条特征
- 用户想新增一个新的方言点，并一次性录入多条资料

### 11.2 状态机

```js
const view = ref('list')
const selectedPoint = ref(null)
```

- `list`：方言点卡片列表
- `detail`：单点编辑页

### 11.3 视图A：PointCardList.vue

数据来源：

- `GET /user/custom/points`

#### 顶部工具栏

左侧：
- 搜索框（本地过滤或后端关键字搜索扩展位）

右侧：
- `+ 新增方言点`

#### 卡片内容

每张卡片展示：

- `簡稱`
- `音典分區`
- `feature_count`
- `last_updated`（可选轻量展示）

#### 卡片点击行为

- 进入 `PointDetailForm.vue`
- 调用 `GET /user/custom/data-by-point`

#### 空态

- 无数据：显示“暂无方言点，点击右上角新增”
- 接口失败：toast + 重试按钮

### 11.4 视图B：PointDetailForm.vue

分两种情形：

#### 情形A：编辑已有地点

顶部：
- 返回
- 当前地点标题

正文：
- 小地图单点预览（只读）
- 多条特征记录编辑表单

每行结构：

- `聲韻調`
- `特徵`
- `值`
- `說明`
- 删除按钮

底部：
- `+ 再添加一条`
- `取消`
- `保存`

#### 情形B：新增地点

比情形A额外多 3 个基础字段：

- `簡稱`
- `音典分區`
- `經緯度`（只读）

交互：

- `簡稱` 支持 `batchMatch()` 自动补全
- 若选中已有地点候选，可调用 `getRegions()` 辅助填充分区
- 点击地图后自动写入 `經緯度`

### 11.5 模式1 保存逻辑

```js
async function handleSave() {
  // 校验基础字段
  // 校验每一行至少 特徵 + 值 必填
  // 组装 records
  // 分流 create / edit / delete
}
```

分流规则：

1. 新增行：
   - 无 `created_at`
   - 进入 `batchCreateCustomData(records)`

2. 变更行：
   - 有 `created_at`
   - 内容变化后逐条 `editCustomData(record)`

3. 删除行：
   - 统一收集 `created_at`
   - `batchDeleteCustomData(createdAtList)`

### 11.6 模式1 边界条件

1. 坐标未选：禁止保存
2. 同一点下同一 `特徵 + 聲韻調` 重复：前端提示确认
3. 部分保存失败：用 `Promise.allSettled` 汇总结果
4. 已有地点坐标与当前编辑记录不一致：以前端加载到的该点主坐标为准，不开放在此处随意改点位

---

## 十二、模式2：制作特征分布（FeatureCentricMode）

### 12.1 用户目标

适用于：

- 用户围绕一个特征，持续增加多个地点记录
- 最终形成一个特征对应多个方言点的分布图

### 12.2 状态机

```js
const view = ref('list')
const selectedFeature = ref(null)
```

### 12.3 视图A：FeatureCardList.vue

数据来源：

- `GET /user/custom/features`

#### 顶部工具栏

左：搜索
右：`+ 新增特征`

#### 卡片内容

- `特徵`
- `聲韻調`
- `location_count`
- `last_updated`

#### 聲韻調标签颜色

建议：

| 聲韻調 | 颜色 |
|--------|------|
| 聲母 | `#e3f0ff / #007aff` |
| 韻母 | `#e8f8ef / #34c759` |
| 調值 | `#fff3e0 / #ff9500` |
| 詞彙 | `#f3e8ff / #af52de` |
| 其他 / 空 | `#f2f2f7 / #8e8e93` |

### 12.4 视图B：FeatureDetailTable.vue

顶部：
- 返回
- 当前特征标题
- `+ 新增地点记录`

主体：
- 小地图多点分布预览
- 表格列表

列建议：

- 地点
- 分区
- 坐标
- 值
- 说明
- 操作

### 12.5 编辑方式

点击“编辑”打开 `FeatureRecordEditorModal.vue`。

原因：

- 不在主大弹窗内做复杂的整行展开编辑，避免布局抖动
- 行编辑涉及地图选点，小二级弹窗更清晰

### 12.6 FeatureRecordEditorModal 职责

用于：

- 编辑已有单条记录
- 新增某个特征下的一条地点记录

字段：

- `地點`（自动补全）
- `分區`（辅助填充）
- `坐標`（只读）
- `值`
- `說明`
- 内嵌 `MiniMapSelector`

### 12.7 模式2 保存逻辑

- 有 `created_at`：`editCustomData(record)`
- 无 `created_at`：`batchCreateCustomData([record])`
- 删除：`batchDeleteCustomData([created_at])`

### 12.8 模式2 边界条件

1. 同一特征下同一点已存在：提示“是否覆盖现有记录”
2. 坐标未选：禁止保存
3. `GET /user/custom/data-by-feature` 必须区分 `feature + phonology`

---

## 十三、新 API 层设计（前端）

新增文件：

`src/api/main/user/custom-entry.js`

```js
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

export async function getUserPoints(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.keyword) query.append('keyword', params.keyword)
    return await api(`/user/custom/points${query.toString() ? `?${query.toString()}` : ''}`)
  } catch (error) {
    showError(error.message || '獲取方言點列表失敗')
    throw error
  }
}

export async function getUserFeatures(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.keyword) query.append('keyword', params.keyword)
    return await api(`/user/custom/features${query.toString() ? `?${query.toString()}` : ''}`)
  } catch (error) {
    showError(error.message || '獲取特徵列表失敗')
    throw error
  }
}

export async function getDataByPoint(location, region) {
  try {
    const query = new URLSearchParams()
    query.append('location', location)
    query.append('region', region)
    return await api(`/user/custom/data-by-point?${query.toString()}`)
  } catch (error) {
    showError(error.message || '獲取地點數據失敗')
    throw error
  }
}

export async function getDataByFeature(feature, phonology = '') {
  try {
    const query = new URLSearchParams()
    query.append('feature', feature)
    if (phonology) query.append('phonology', phonology)
    return await api(`/user/custom/data-by-feature?${query.toString()}`)
  } catch (error) {
    showError(error.message || '獲取特徵數據失敗')
    throw error
  }
}
```

并在：

- `src/api/index.js`
- 如需要 `src/api/main/user/index.js`

补充导出。

---

## 十四、后端接口需求（正式版）

### 接口 1：获取用户方言点聚合列表

```http
GET /user/custom/points
Auth: JWT Required
```

可选 query：

- `keyword`：按地点名/分区模糊搜索（可选，v1 若后端不做，也允许前端本地过滤）

建议返回：

```json
{
  "success": true,
  "data": [
    {
      "point_key": "陽春圭崗||嶺南",
      "簡稱": "陽春圭崗",
      "音典分區": "嶺南",
      "經緯度": "111.742615,22.356760",
      "feature_count": 12,
      "updated_at": "2026-06-05T10:00:00Z"
    }
  ],
  "total": 1
}
```

说明：

- 以 `(簡稱, 音典分區)` 为聚合 key
- `feature_count` 为该点下总记录数
- `updated_at` 为该点下最新记录时间
- 按 `updated_at DESC`

### 接口 2：获取用户特征聚合列表

```http
GET /user/custom/features
Auth: JWT Required
```

可选 query：

- `keyword`

建议返回：

```json
{
  "success": true,
  "data": [
    {
      "feature_key": "流攝||韻母",
      "特徵": "流攝",
      "聲韻調": "韻母",
      "location_count": 5,
      "updated_at": "2026-06-05T10:00:00Z"
    }
  ],
  "total": 1
}
```

说明：

- 以 `(特徵, 聲韻調)` 为聚合 key
- `location_count` 为去重后的地点数
- 按 `updated_at DESC`

### 接口 3：按地点获取该点全部记录

```http
GET /user/custom/data-by-point?location=陽春圭崗&region=嶺南
Auth: JWT Required
```

建议返回：

```json
{
  "success": true,
  "data": [
    {
      "簡稱": "陽春圭崗",
      "音典分區": "嶺南",
      "經緯度": "111.742615,22.356760",
      "聲韻調": "韻母",
      "特徵": "流攝",
      "值": "eu",
      "說明": "老派讀音",
      "created_at": "2026-06-01T10:00:00Z"
    }
  ]
}
```

说明：

- 必须同时传 `location + region`
- 明细层尽量直接沿用现有繁体字段，减少前端映射成本
- 可按 `created_at ASC` 或业务更合适顺序返回，但需保持稳定

### 接口 4：按特征获取全部地点记录

```http
GET /user/custom/data-by-feature?feature=流攝&phonology=韻母
Auth: JWT Required
```

建议返回：

```json
{
  "success": true,
  "data": [
    {
      "簡稱": "陽春圭崗",
      "音典分區": "嶺南",
      "經緯度": "111.742615,22.356760",
      "聲韻調": "韻母",
      "特徵": "流攝",
      "值": "eu",
      "說明": "",
      "created_at": "2026-06-01T10:00:00Z"
    }
  ]
}
```

说明：

- v1 就建议把 `phonology` 带上，避免同名特征跨类目混淆
- 若后端确认 `feature` 全局唯一，可容忍 `phonology` 可选，但前端接口层仍保留该参数位

### 现有接口保持不变

| 接口 | 用途 | 状态 |
|------|------|------|
| `POST /user/custom/batch-create` | 批量新增记录 | 保持不变 |
| `PUT /user/custom/edit` | 编辑单条记录 | 保持不变 |
| `DELETE /user/custom/batch-delete` | 批量删除记录 | 保持不变 |
| `GET /user/custom/all` | 个人数据管理页专用 | 保持不变 |

---

## 十五、推荐返回结构约束

为了减少前端兼容成本，建议后端遵循：

1. 聚合接口：
   - 返回聚合字段（`point_key` / `feature_key` / 统计值）
   - 同时保留关键展示字段的繁体命名

2. 明细接口：
   - 尽量直接复用现有 CRUD 记录字段
   - 不要新造一套 `location/region/coordinate/feature/value/description` 英文模型给前端再映射

理由：

- 旧页面已经全面依赖繁体字段名
- 新弹窗写接口也仍然提交繁体字段
- 让明细查询和写操作字段一致，最稳

---

## 十六、失败态与加载态策略

### 16.1 加载态

- 初次列表加载：骨架屏 / loading
- 详情切换：局部 loading，不阻塞整个弹窗 header
- 保存中：按钮 loading + 禁止重复点击

### 16.2 失败态

- 列表接口失败：空态区显示错误提示 + 重试按钮
- 详情接口失败：toast + 留在上一视图
- 保存部分失败：用 `Promise.allSettled` 收集成功/失败条数，统一反馈

### 16.3 不采用的策略

本版不采用“接口 404 时仍显示骨架屏伪装加载中”的策略。

接口不存在 / 后端未部署时，应明确提示：

- 当前接口未就绪
- 请联系后端或稍后重试

---

## 十七、实施步骤（分步 + 每步 CR）

| Step | 工作内容 | 影响范围 |
|------|----------|----------|
| 1 | 修正并冻结本方案文档 | 文档 |
| 2 | 新建 `utils/map/formatCoord.js`；如适合，局部替换旧面板坐标格式化逻辑 | 工具函数 |
| 3 | 新建 `api/main/user/custom-entry.js`，补充 `api/index.js` 导出 | API 层 |
| 4 | 新建 `MiniMapSelector.vue`，验证点选、单点预览、多点预览 | 新组件 |
| 5 | 改造 `CustomTab.vue`，只替换入口按钮并挂载空壳弹窗 | 入口改造 |
| 6 | 实现 `CustomDataEntryModal.vue` 基础骨架（header / mode / reset 逻辑） | 弹窗主控 |
| 7 | 实现模式1列表 `PointCardList.vue`，接 `GET /user/custom/points` | 模式1-A |
| 8 | 实现模式1详情 `PointDetailForm.vue`，接 `GET /user/custom/data-by-point` + 写接口 | 模式1-B |
| 9 | 实现模式2列表 `FeatureCardList.vue`，接 `GET /user/custom/features` | 模式2-A |
| 10 | 实现模式2详情 `FeatureDetailTable.vue` + `FeatureRecordEditorModal.vue`，接 `GET /user/custom/data-by-feature` + 写接口 | 模式2-B |
| 11 | 补全 i18n 三语文案 | 国际化 |
| 12 | 全流程验证 + git diff CR，确认旧右侧面板和 `/auth/data` 不受影响 | 验收 |

---

## 十八、验收清单

### 18.1 交互验收

1. 地图-自定义页只显示一个“添加数据”按钮
2. 点击后打开大弹窗
3. 弹窗支持两种模式切换
4. 模式1可查看点卡片、编辑已有点、新增点
5. 模式2可查看特征卡片、编辑已有记录、新增地点记录
6. 小地图支持选点、单点预览、多点预览
7. 保存/删除后视图状态正确更新

### 18.2 兼容验收

1. `CustomDataPanel.vue` 旧逻辑仍可正常使用
2. `/auth/data` 旧逻辑仍可正常使用
3. `resultCache.mode` 不因新弹窗被污染
4. 旧地图页帮助弹窗不受影响

### 18.3 工程验收

1. 新增文案全部走 i18n
2. 样式优先复用公共 SCSS 语义
3. 无无意义大范围重构
4. `git diff` 中无无关文件改动
5. 中文与繁体字段无编码损坏

---

## 十九、最终决策摘要

本方案最终决策为：

1. 采用弹窗，不做新页面
2. 第一版即采用完整四个新读取接口
3. 不用 `/user/custom/all` 替代这四个接口
4. 旧 CRUD 和旧页面逻辑全部保留
5. 新实现必须组件化、i18n 化、SCSS 公共样式优先复用

---
