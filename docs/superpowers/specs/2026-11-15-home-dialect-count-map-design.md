# 首页方言点统计地图设计

## 目标

在首页“下载应用”区域下方增加一张方言点地图，显示所有有方言数据且有坐标的点。每个点上方显示地名，下方显示该地点在 `dialects` 表中的行数。地图固定使用音典分区配色，并显示点数与总条目数。

## 数据与接口

build 在生成 `dialects_admin.db` / `dialects_user.db` 后，按 `簡稱` 对对应 `dialects` 表执行 `COUNT(*)`，并将结果与对应 `query_admin.db` / `query_user.db` 的地点元数据写入 `counts` 表。字段为 `簡稱`、`條目數`、`經緯度`、`音典分區`、`地圖集二分區`。构建时用事务替换完整表，避免半成品数据。

backend 新增只读 `GET /api/dialect-counts`，通过 `get_query_db` 选择 user/admin 数据库，读取 `counts` 并返回 `total_points`、`total_entries` 和 points 列表。接口不改变现有 SQL count 接口。

frontend 在首页下载区域下方请求该接口，复用词表地图的 MapLibre 标记表现，但隐藏右上角 controls，固定使用音典分区色彩。

## 兼容性

现有查询、词表页面和 `/sql/query/count` 保持不变。未登录/普通用户使用 user 数据，管理员使用 admin 数据，沿用现有 `get_query_db` 规则。

## 验证

build 测试 counts 表生成、重复行计数、坐标和分区回填；backend 测试接口响应、数据库选择和空数据；frontend 测试接口响应映射、地图标签数据和控制区隐藏，并运行现有 lint/build 或相关测试。
