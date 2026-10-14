# 默认分区树实施计划

> 按已批准的 default-region-tree-design 逐步执行。执行者使用 test-driven-development；每步完成后独立 CR，再只提交该步文件。禁止依赖安装。

**Goal:** 默认树由后端生成，支持任意深度，以完整路径区分节点和查询范围。

**Architecture:** 现有 regions 数组改存完整路径，现有 /api/partitions 返回节点数组。默认树不混入用户数据；文本名称单独解析，歧义阻断。前端树只在整页刷新后更新。

**Tech Stack:** FastAPI、SQLite、SQLAlchemy、pytest/unittest、Vue 3、SCSS、Vitest。

根目录：前端 /Users/jengzang/CodeProject/dialects/dialects-vue-frontend；后端 /Users/jengzang/CodeProject/dialects/dialects-backend。

## 1. 后端默认树

- [x] 新增 tests/test_partition_tree.py，使用临时 SQLite 数据验证新根、六级、同名分支、原字、排除、排序、parent 与双模式。
- [x] 运行 .venv/bin/python -m pytest tests/test_partition_tree.py -q，确认未实现的新契约失败。
- [x] 新增 app/common/partition_policy.py 和 app/service/geo/partitions.py；修改 app/routes/geo/get_partitions.py。按完整路径逐段建 children，读取 get_query_db，返回 schema_version/region_mode/revision/max_depth/parent/nodes。
- [x] 运行上述测试，通过后检查 diff、编码、权限隔离；独立 CR、修正并只提交这些文件。

## 2. 后端路径查询和名称解析

- [x] 新增 tests/test_partition_paths.py，真实 SQLite/ORM 验证父级直接归属＋后代、同名、边界、通配符、纯地点与用户隔离；补名称解析契约测试。
- [x] 确认旧实现不能通过父级和重名测试。
- [x] 修改 app/service/geo/getloc_by_name_region.py：路径等值或带分隔符的前缀等值；实际使用 substr 等值，避免 LIKE 的通配符及 ASCII 大小写折叠。SQL 参数化且 ORM 同义，不再查任意名称段。
- [x] 在 partitions 服务/路由新增 POST /partitions/resolve；原文唯一候选定位，重名返回全部路径，默认与当前用户路径分开，user 候选仅属于音典。
- [x] 审计共享调用链和地区解析缓存，更新有关缓存的语义版本；既有测试中的非根名称改为测试数据对应的真实路径。
- [x] 运行新增测试及 notes、syllable_counts、cluster_location_filters、user_custom_read_apis 等相关回归；CR、修正并限定提交。既有 fixture 失败见下文。

## 3. 前端数据和默认选择器

- [x] 新增 tests/regionSelector.test.js 和 tests/partitionCache.test.js，以 Vue 实际挂载验证四级以上、重名、父子、确认/取消、列内点击、页面内缓存和并发。
- [x] 运行 project/node_modules/.bin/vitest run，确认旧代码缺少这些行为。
- [x] 修改 project/src/api/main/geo/LocationAndRegion.js 的 getPartitions(mode,parent)；修改现有 usePartitionCache，在模块内按 mode/身份缓存本页原始响应，合并同请求，不读旧 sessionStorage 树。
- [x] 修改 RegionSelector.vue，动态 columns/active path，children 直接读取；selected 仍是 string[]，选中/删除用 path。最短可区分标签＋完整 title；多列横滚、各列纵滚和固定确认栏。
- [x] 保持现有交互、共享视觉与 SCSS/mixins 约定；测试通过后 CR、修正、只提交本步。

## 4. 输入、主请求与预设

- [x] 先测试唯一名称解析、重名阻断、混合体系、用户额外路径、超限恢复和 preview/main payload 一致。
- [x] 修改 LocationAndRegionInput.vue 和 RegionInputMode.vue，保存 raw text 与 canonical tokens，已选 path 不重新作为 name 解析，异步令牌阻止旧结果回写。
- [x] 相关运行按钮实际接收 runDisabled；QueryPage、ComparePage、Countphos、ClusterInputPanel、Vocabulary、DivideTab、MapData 仍传 regions 完整路径数组。
- [x] 审计 tutorialDiceConfig 和恢复/跨页消息，预设迁移真实路径；需要持久化判别时添加 regions_semantics 或使用既有容器 version，不增加查询参数。
- [x] 运行相关 Vitest 回归，CR 后限定提交。

## 5. 旧详情页

- [x] 检索 public/detail/js 中所有 /partitions、regions、parent 和名称匹配消费者，并测试旧页树/传值/请求链。
- [x] 迁移 inputpanel.js、mappanel.js、process_data.js、main.js、get_vue.js、Extrapanel.js 和 public/config.js 的活跃引用；不删除旧页或改无关业务。
- [x] Vue 与旧页传递 path-v2 语义，旧名称经解析；新树按 children 遍历，parent 使用完整路径。
- [x] 静态检查和浏览器验证后 CR、限定提交。

## 6. 全局验收

- [x] 全局搜索确认无活跃 STATIC_REGION_TREE/top_yindian、旧树格式或末级名称查询传参遗漏。用户确认本次不扩展绘图、着色和泰森多边形层级，这些固定三级消费者保留。
- [x] 运行前后端相关回归和前端完整 Vitest；使用本地 Vite build，避免 npm run build 更新用户 sitemap。
- [x] 实测桌面和竖屏多列滚动、确认栏、同名选择；父级范围、超限恢复与实际请求阻断另由回归测试验证。
- [x] 最终独立 CR，处理发现的问题并提交；协调部署清单保持前后端和旧页同版，不在开发步骤中部署。

任务完成时把本清单对应项标为完成并记录提交与验证；若发现新业务歧义，列出具体选项向用户询问，继续不依赖回答的工作。

## 2026-10-15 实施记录

本地开发完成，未推送、未部署。默认树与查询支持任意深度；绘图层级扩展经用户确认延期。两体系共享完全相同路径时，以用户明确选择的体系为准。地图体系查询个人数据时，先取得地点范围，并保留用户显式输入的个人地点；不把地图集路径当作用户音典字段查询。

| 步骤 | 仓库 | 提交 |
| --- | --- | --- |
| 默认树 | 后端 | 7aade05 |
| 路径谓词、解析与缓存 | 后端 | b015a07 |
| 动态选择器与页面缓存 | 前端 | d950df03 |
| 输入、实际执行阻断与预设 | 前端 | 6020b9e7 |
| 旧详情页 | 前端 | 8c0eecd1 |
| 全局传参与范围收尾 | 前端 | 674916fa |

各步均完成独立 CR、diff 与编码检查。最终 CR 发现的地图个人地点预览遗漏已修复并补测试。用户原有 staged/unstaged 文件没有加入这些提交。

### 最终验证

- 后端：`.venv/bin/python -m pytest tests/test_partition_tree.py tests/test_partition_paths.py tests/test_notes_service.py tests/test_cluster_location_filters.py tests/test_user_custom_read_apis.py -q`：49 passed。
- 前端：10 个相关测试文件共 75 passed，覆盖 selector、partitionCache、输入解析、用户查询传参、旧页、聚类恢复、notes 与现有 composables。
- 全量 Vitest：694 passed、76 failed，30 个失败测试文件（57 个失败 suite）。保留用户无关修改，仅将本任务源码及测试退回 `d26d59bd` 的隔离基线为 658 passed、76 failed；失败断言集合和失败文件集合一致，没有新增失败。既有失败包含旧目录 import、源代码约定和 lint 等；不在本次修复范围。
- 变更源码 lint 尚有 RegionSelector 原本存在的两处 `route` 未定义；已用改动前源码确认，未将其作为本次修复。
- 后端扩大回归中的 syllable_counts 七项 fixture/data 失败、phonology_multitable 一项缺少音節 fixture 均已核对为原有问题；本次相关 49 项回归通过。
- 直接执行现有 Vite build，输出至 `.tmp/region-build`：通过，49.20 秒。保留已有大 chunk 和第三方模块 browser externalization 提示。
- 浏览器：真实 RegionSelector 本地挂载在 1280×800、390×844 下验证七列、横向/纵向滚动、100 个标签及固定确认栏；旧详情页使用实际 inputpanel 逻辑及现有 CSS 的本地测试页，在两种尺寸下验证四列、完整路径和重名选择。没有访问生产环境。
- `git diff --check`、修改文件严格 UTF-8 检查通过；未安装依赖。

完整测试与构建日志留在本地 ignored 的 `project/.tmp/region-*`，不加入源码提交。

### 协调发布清单（发布时执行）

- 同版发布后端接口、Vue 静态资源、public/detail 资源和仍在分发的客户端；旧 regions/树协议不再兼容。
- 发布前只读审计生产分区路径的空段、段内空白与实际类别；不迁移真实数据或新增分区表。
- 旧名称草稿经过解析，重名由用户确认；失效完整路径保留提示，不自动改选。
- 后端比较地点解析缓存采用 path-v2 语义版本。默认树只在整页刷新后重新获取；发布后提示使用者刷新页面。
- 保留前后端配套版本用于一起回滚。生产数据审计、发布和回滚演练尚未执行。
