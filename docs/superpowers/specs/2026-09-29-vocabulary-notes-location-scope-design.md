# 词表字表注释模式：前端地点范围设计

## 状态

已确认，等待用户审阅拆分后的前端、后端两份设计说明。详细实施计划必须在两份设计均获确认后再写。

本说明只定义前端职责。`GET /api/notes`、数据库关联、FTS5 和服务边界由后端仓库的 `docs/superpowers/specs/2026-09-29-vocabulary-notes-api-design.md` 定义。

## 目标与范围

在 `/vocabulary/view?tab=card` 的顶部控件中保留默认开启的“词表”开关。关闭后进入“字表注释”模式：按 IPA 和注释搜索，并以卡片展示后端返回的 `notes` 原始行。

本设计只增加字表注释模式；既有词表的搜索、筛选、表格、地图、路由和视觉行为必须保持不变。

字表注释模式的地点范围复用 `LocationAndRegionInput.vue`。用户可以输入地点、切换地图集/音典分区、使用现有个人自定义分区，并在组件中查看解析后的地点清单。地点编辑只更新草稿范围；只有点击“刷新结果”才重新请求 notes。

## 已确认的前端决定

| 主题 | 决定 |
| --- | --- |
| 路由 | `source=character-notes` 代表字表注释模式；缺少或未知 `source` 保持原词表。该模式强制 `tab=card`，隐藏父级 `page-tab-navigation`。 |
| 卡片 | `location_name`、`character`、`ipa`、`notes` 分别展示地点、汉字、IPA、注释；无标准词/释义行。IPA 有值时必须显示；地点只显示，不打开旧词表地点详情。 |
| 搜索字段 | 仅 `pronunciation`（IPA）和 `detail`（注释）。字段设置与词表模式隔离；空选择代表两者。 |
| 空关键词 | 不调用 notes 接口，显示“请输入搜索词”。 |
| 空地点范围 | 允许，表示全库搜索。 |
| 地点与分区 | 可同时选择并保持现有并集语义；完全复用当前地图集/音典顶层树和同名裸标签并集语义，不补树、不改路径值。 |
| 地点限额 | notes 模式不限制显式地点数、解析后地点数或分区详情弹窗的选择数；其他组件使用者保留原有上限。 |
| 刷新 | `/api/get_locs/` 只更新地点预览；用户点击“刷新结果”后才应用草稿范围、回到第 1 页并请求 notes。 |

## 页面与控件

1. `VocabularyViewPage.vue` 根据路由 `source` 持有词表和字表注释两套独立的结果、分页、错误、加载及字段偏好状态。进入字表注释模式时关闭词表的位置/行政区、标准词和地图专属筛选控件；离开时不清空词表状态。
2. `VocabularyTopControls.vue` 在字表注释模式显示来源开关、关键词输入、IPA/注释字段设置和 `LocationAndRegionInput`。不显示地点详情入口、旧地点/省市筛选、标准词选择和词表专用搜索模式。
3. `LocationAndRegionInput` 仍显示现有地点预览、分区详情弹窗和个人自定义分区。notes 使用新的 opt-in 属性允许空范围并跳过所有地点限额；默认值继续保护其他页面。
4. 预览之后显示“刷新结果”。草稿与已应用范围不同且当前解析成功时，显示“地点选择已变更，刷新后生效”。刷新前保留当前卡片。

## 草稿与已应用范围

页面维护两个范围对象：

```text
draftScope   // 当前输入且已由最新 /get_locs/ 解析确认的选择
appliedScope // 当前 /api/notes 请求冻结使用的选择
```

`draftScope` 的请求参数形状如下：

```text
{
  locations: [手动地点及自定义分区展开后的显式地点],
  regions: [已选系统分区标签],
  region_mode: 'map' | 'yindian',
  has_scope: true | false
}
```

- 输入组件保持 300ms 的 `/api/get_locs/` 防抖，用于数量、地点清单和分区预览；它不触发 notes 搜索。
- 组件新增 `locationsResolved` 事件，在最新一次成功解析后提供原始选择、最终地点、地点分区信息及 `has_scope`。组件用请求序号丢弃过期 `/get_locs/` 响应。
- 空范围不请求 `/api/get_locs/`，但发出成功的空范围事件，清除旧预览并允许刷新。`has_scope` 为 `false`。
- 显式选择但解析为零地点时，`has_scope` 仍为 `true`。刷新仍把原始选择传给 `/api/notes`；前端绝不因最终地点数组为空而省略范围参数或改为全库。
- 点击刷新后复制 `draftScope` 到 `appliedScope`、重置页码、使旧 notes 请求失效。关键词非空时立即搜索；空关键词只应用范围并显示提示。
- 关键词/字段的正常防抖搜索始终使用 `appliedScope`，即使 `draftScope` 正处于未刷新的脏状态。

## `/api/notes` 前端合同

前端将 `appliedScope` 原样编码为可重复的 `locations`、`regions` 和 `region_mode` 参数，并发送：

```http
GET /api/notes?q=文白&search_fields=pronunciation,detail&locations=广州&regions=珠三角&region_mode=yindian&page=1&page_size=50
```

- 不带 `locations` 和 `regions` 时代表全库范围；有任一范围参数时不能由前端把它删掉。
- `search_fields` 只允许 `pronunciation`、`detail`；空选择由客户端以两字段或后端的 `all` 语义表达。
- `page` 从 1 开始；默认每页 50，前端不能请求大于 200 的页大小。
- 期望响应为 `{ items, total, page, page_size }`，每个项目包含 `id`、`location_name`、`character`、`ipa`、`notes`。
- 卡片“加载更多”只以相同 `appliedScope` 请求下一页；加载期间禁止重复触发。

后端只参考 `/api/search_chars` 的地点/分区行为，不直接复用其路由或查询编排函数；这一约束由后端设计和测试保证。

## 请求与显示状态

- `/api/get_locs/`、notes 首次搜索和“加载更多”各有独立请求序号。切换来源、刷新、修改关键词/字段或销毁页面后，过期响应不能覆盖当前状态。
- `/api/get_locs/` 未完成或报错时禁用刷新；空范围和零解析范围的成功状态允许刷新。
- 总数为零显示“无匹配结果”；关键词为空显示“请输入搜索词”。
- notes 行按后端的原始 `id` 作为 Vue key；前端不按展示文本去重。

## 前端验收与测试

- 默认词表及其原有筛选不变；字表注释强制卡片并隐藏父级页签导航。
- 卡片完整显示地点、汉字、IPA、注释，无标准词/释义行；相同展示值而不同 `id` 的行都显示。
- 空范围、地点、地图集分区、音典分区、地点与分区并集、个人自定义分区均只有在刷新后生效。
- 草稿范围变化不改变当前结果；刷新重置页码；关键词/字段变化只用已应用范围。
- 覆盖空范围、零解析范围、`/get_locs/` 失败、`/get_locs/` 与 notes 的乱序响应、加载更多和模式切换。
- notes 模式跳过三类地点限制；其他 `LocationAndRegionInput` 使用者仍保留原限制。

## 非目标

- 不补齐或重构当前地图集/音典顶层树。
- 不把裸标签选择改为完整路径选择。
- 不改变既有词表、`/api/search_chars` 或其他页面的地点限额。
- 不在前端实现数据库选择、FTS5、分区到简称的解析逻辑。
