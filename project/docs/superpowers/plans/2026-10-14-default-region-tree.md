# 默认分区树实施计划

> 按已批准的 default-region-tree-design 逐步执行。执行者使用 test-driven-development；每步完成后独立 CR，再只提交该步文件。禁止依赖安装。

**Goal:** 默认树由后端生成，支持任意深度，以完整路径区分节点和查询范围。

**Architecture:** 现有 regions 数组改存完整路径，现有 /api/partitions 返回节点数组。默认树不混入用户数据；文本名称单独解析，歧义阻断。前端树只在整页刷新后更新。

**Tech Stack:** FastAPI、SQLite、SQLAlchemy、pytest/unittest、Vue 3、SCSS、Vitest。

根目录：前端 /Users/jengzang/CodeProject/dialects/dialects-vue-frontend；后端 /Users/jengzang/CodeProject/dialects/dialects-backend。

## 1. 后端默认树

- [ ] 新增 tests/test_partition_tree.py，使用临时 SQLite 数据验证新根、六级、同名分支、原字、排除、排序、parent 与双模式。
- [ ] 运行 .venv/bin/python -m pytest tests/test_partition_tree.py -q，确认未实现的新契约失败。
- [ ] 新增 app/common/partition_policy.py 和 app/service/geo/partitions.py；修改 app/routes/geo/get_partitions.py。按完整路径逐段建 children，读取 get_query_db，返回 schema_version/region_mode/revision/max_depth/parent/nodes。
- [ ] 运行上述测试，通过后检查 diff、编码、权限隔离；独立 CR、修正并只提交这些文件。

## 2. 后端路径查询和名称解析

- [ ] 新增 tests/test_partition_paths.py，真实 SQLite/ORM 验证父级直接归属＋后代、同名、边界、通配符、纯地点与用户隔离；补名称解析契约测试。
- [ ] 确认旧实现不能通过父级和重名测试。
- [ ] 修改 app/service/geo/getloc_by_name_region.py：region_column = P OR region_column LIKE escaped(P) + '-%'，SQL 参数化且 ORM 同义，不再查任意名称段。
- [ ] 在 partitions 服务/路由新增 POST /partitions/resolve；原文唯一候选定位，重名返回全部路径，默认与当前用户路径分开，user 候选仅属于音典。
- [ ] 审计共享调用链和地区解析缓存，更新有关缓存的语义版本；既有测试中的非根名称改为测试数据对应的真实路径。
- [ ] 运行新增测试及 notes、syllable_counts、cluster_location_filters、user_custom_read_apis 等相关回归；CR、修正并限定提交。

## 3. 前端数据和默认选择器

- [ ] 新增 tests/regionSelector.test.js 和 tests/partitionCache.test.js，以 Vue 实际挂载验证四级以上、重名、父子、确认/取消、列内点击、页面内缓存和并发。
- [ ] 运行 project/node_modules/.bin/vitest run，确认旧代码缺少这些行为。
- [ ] 修改 project/src/api/main/geo/LocationAndRegion.js 的 getPartitions(mode,parent)；修改现有 usePartitionCache，在模块内按 mode/身份缓存本页原始响应，合并同请求，不读旧 sessionStorage 树。
- [ ] 修改 RegionSelector.vue，动态 columns/active path，children 直接读取；selected 仍是 string[]，选中/删除用 path。最短可区分标签＋完整 title；多列横滚、各列纵滚和固定确认栏。
- [ ] 保持现有交互、共享视觉与 SCSS/mixins 约定；测试通过后 CR、修正、只提交本步。

## 4. 输入、主请求与预设

- [ ] 先测试唯一名称解析、重名阻断、混合体系、用户额外路径、超限恢复和 preview/main payload 一致。
- [ ] 修改 LocationAndRegionInput.vue 和 RegionInputMode.vue，保存 raw text 与 canonical tokens，已选 path 不重新作为 name 解析，异步令牌阻止旧结果回写。
- [ ] 相关运行按钮实际接收 runDisabled；QueryPage、ComparePage、Countphos、ClusterInputPanel、Vocabulary、DivideTab、MapData 仍传 regions 完整路径数组。
- [ ] 审计 tutorialDiceConfig 和恢复/跨页消息，预设迁移真实路径；需要持久化判别时添加 regions_semantics 或使用既有容器 version，不增加查询参数。
- [ ] 运行相关 Vitest 回归，CR 后限定提交。

## 5. 旧详情页

- [ ] 检索 public/detail/js 中所有 /partitions、regions、parent 和名称匹配消费者，并测试旧页树/传值/请求链。
- [ ] 迁移 inputpanel.js、mappanel.js、process_data.js、main.js、get_vue.js、Extrapanel.js 和 public/config.js 的活跃引用；不删除旧页或改无关业务。
- [ ] Vue 与旧页传递 path-v2 语义，旧名称经解析；新树按 children 遍历，parent 使用完整路径。
- [ ] 静态检查和浏览器验证后 CR、限定提交。

## 6. 全局验收

- [ ] 全局搜索确认无活跃 STATIC_REGION_TREE/top_yindian、旧树格式、末级名称传参或固定三级消费者遗漏。
- [ ] 运行前后端相关回归和前端完整 Vitest；使用本地 Vite build，避免 npm run build 更新用户 sitemap。
- [ ] 实测桌面和竖屏多列滚动、确认栏、同名删除、父级范围与超限恢复。
- [ ] 最终独立 CR，处理发现的问题并提交；协调部署清单保持前后端和旧页同版，不在开发步骤中部署。

任务完成时把本清单对应项标为完成并记录提交与验证；若发现新业务歧义，列出具体选项向用户询问，继续不依赖回答的工作。
