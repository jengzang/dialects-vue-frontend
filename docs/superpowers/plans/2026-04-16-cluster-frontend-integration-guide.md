# Cluster 前端接入方案文档

日期：2026-04-16

适用范围：
- `GET/POST /api/tools/cluster/*`
- 旧 one-shot 聚类接口 `/jobs`
- 新 staged 分步接口 `/staged/*`

这份文档面向前端开发，目标是回答 4 个问题：
- 前端应该优先接哪套 API
- 每个 API 的作用是什么
- 每个请求体应该怎么传
- 前端应该如何轮询、缓存、处理过期和报错


## 1. 结论先行

推荐前端同时保留两条链路，但主流程建议切到 staged：

- 推荐主流程：`staged`
  - 适合“先预览，再确认，再继续”的交互
  - 能把一次大任务拆成 `preview -> prepare -> distance -> cluster`
  - 更适合多次试不同 `phoneme_mode`、不同聚类器参数
  - 更适合后续做跨用户复用和前端多步确认

- 保留旧流程：`/jobs`
  - 适合“一键直接运行”
  - 适合老页面兼容
  - 适合用户不想分步确认、只想马上看最终结果

推荐前端产品策略：

- 普通用户默认走 staged 向导式流程
- 高级用户或“快速运行”按钮可以直接走 `/jobs`


## 2. 两套 API 的本质区别

### 2.1 `/jobs` 是一步式

前端一次把完整请求发给后端：

1. 后端解析地点和 group
2. 后端直接完整计算
3. 前端轮询 `task_id`
4. 最后读取 `/jobs/{task_id}/result`

特点：
- 前端简单
- 适合直接跑
- 不适合“先准备、后试多个 mode / 多个算法”

### 2.2 `/staged` 是分步式

前端把大任务拆成 4 步：

1. `preview`
2. `prepare`
3. `distance`
4. `cluster`

每一步都返回下游所需的标识符：

- `prepare_hash`
- `distance_hash`
- `result_hash`

特点：
- 前端更灵活
- 一个 `prepare` 可以复用于多个 `phoneme_mode`
- 一个 `distance` 可以复用于多个聚类配置
- 更适合做“用户点击继续才进入下一步”

### 2.3 接口总表

| 类型 | 接口 | 作用 | 前端是否推荐 |
|---|---|---|---|
| one-shot | `POST /api/tools/cluster/jobs` | 创建一步式聚类任务 | 保留 |
| one-shot | `GET /api/tools/cluster/jobs/{task_id}` | 轮询任务状态 | 必需 |
| one-shot | `GET /api/tools/cluster/jobs/{task_id}/result` | 读取一步式最终结果 | 必需 |
| one-shot | `DELETE /api/tools/cluster/jobs/{task_id}` | 删除任务记录 | 可选 |
| staged | `POST /api/tools/cluster/staged/preview` | 解析输入并生成 `prepare_hash` | 必需 |
| staged | `POST /api/tools/cluster/staged/prepare` | 启动或复用 prepare 阶段 | 必需 |
| staged | `POST /api/tools/cluster/staged/distances` | 启动或复用某个 `phoneme_mode` 的 distance 阶段 | 必需 |
| staged | `POST /api/tools/cluster/staged/clusters` | 启动或复用最终 cluster 阶段 | 必需 |
| staged | `GET /api/tools/cluster/staged/results/{result_hash}` | 读取 staged 最终结果 | 必需 |

当前 staged 没有单独的删除接口。
前端如果不再需要某个 `prepare_hash / distance_hash / result_hash`，只需要丢弃本地状态即可，服务端会按 TTL 自动清理。


## 3. 核心概念

### 3.1 `group`

一个 `group` 可以理解为：

“取一组汉字，并在某个音系维度上比较所有地点。”

例如：
- 16 摄聚类时，通常就是 16 个 `group`
- 每个 `group` 对应一个摄
- 每个 `group` 会有自己的字表
- 每个 `group` 还会指定比较 `initial/final/tone` 中的哪一个

### 3.2 `compare_dimension`

可选值：
- `initial`
- `final`
- `tone`

含义：
- `initial`：比较声母
- `final`：比较韵母
- `tone`：比较声调

这是按 `group` 设置的，不是全局统一字段。

### 3.3 `phoneme_mode`

可选值：
- `intra_group`
- `anchored_inventory`
- `shared_request_identity`

这是“地点之间怎么计算语言距离”的模式，不是聚类器本身。

含义简述：
- `intra_group`
  - 只看当前请求 group 内部的对应关系与同音结构
- `anchored_inventory`
  - 在 `intra_group` 基础上，再加入该维度库存分布约束
- `shared_request_identity`
  - 在 `intra_group` 基础上，再加入“整个请求范围内的共享模式”约束

### 3.4 `algorithm`

可选值：
- `agglomerative`
- `dbscan`
- `kmeans`
- `gmm`

推荐默认：
- `agglomerative`

### 3.5 标识符的含义

- `task_id`
  - 后台任务 id
  - 用于轮询任务进度
  - `/jobs` 和 staged 的 `prepare/distance/cluster` 都会返回它

- `prepare_hash`
  - 一次“标准化输入”对应的准备阶段标识
  - 后续 `distance` 阶段直接依赖它

- `distance_hash`
  - 一次 `prepare + phoneme_mode` 对应的距离矩阵标识
  - 后续 `cluster` 阶段直接依赖它

- `result_hash`
  - 一次 `distance + clustering` 对应的最终结果标识
  - 可直接用于读取最终结果

推荐前端状态管理：

- staged 页面至少缓存：
  - `requestDraft`
  - `prepare_hash`
  - `distance_hash_by_mode`
  - `result_hash_by_mode_and_config`
  - `latest_task_id`

补充说明：

- `task_id` 是临时后台任务 id，不等于 staged 资源 id
- staged 的真正资源标识是：
  - `prepare_hash`
  - `distance_hash`
  - `result_hash`
- `progress` 的数值区间是 `0 ~ 100`，不是 `0 ~ 1`
- staged 当前是“无 session”设计
  - 前端不需要维护 `session_id`
  - 只需要维护 hash 和当前 task_id


## 4. 共有请求字段说明

下面这些字段是 cluster 请求的公共字段。

### 4.1 `locations`

类型：
- `string[]`

含义：
- 用户直接指定要聚类的地点简称列表

示例：

```json
{
  "locations": ["北京", "天津", "苏州"]
}
```

说明：
- 前端可以传原始地点输入
- 后端会做地点标准化匹配
- 如果一个输入最终没匹配到，会在 `location_resolution` 里体现

### 4.2 `regions`

类型：
- `string[]`

含义：
- 按分区批量选择地点

示例：

```json
{
  "regions": ["江淮官话", "吴语"]
}
```

### 4.3 `region_mode`

类型：
- `"yindian"` 或 `"map"`

含义：
- `regions` 字段按哪一套分区体系解释

推荐默认：

```json
{
  "region_mode": "yindian"
}
```

### 4.4 `include_special_locations`

类型：
- `boolean`

含义：
- 是否保留特殊点

推荐默认：

```json
{
  "include_special_locations": false
}
```

前端建议：
- 默认关闭
- 只在高级选项里让用户手动打开

### 4.5 `groups`

类型：
- `ClusterGroupRequest[]`

至少要有一个 group。

每个 group 至少需要：
- `label`
- `source_mode`
- 字表来源字段
- `compare_dimension`


## 5. `group` 如何传参

前端现在推荐优先使用两种写法：

1. 直接给出 `resolved_chars`
2. 用 `path_strings` 复用 `/api/charlist` 的同一套条件语法

旧的 `filters` 仍兼容，但不推荐再作为主路径。

### 5.1 推荐写法 A：直接传 `resolved_chars`

适用场景：
- 前端已经拿到一批明确汉字
- 前端自己做过字表选择
- 用户手动录入了一组字

示例：

```json
{
  "label": "假摄",
  "source_mode": "custom",
  "resolved_chars": ["家", "麻", "车", "蛇"],
  "compare_dimension": "final"
}
```

这是最稳、最直接的写法。

### 5.2 推荐写法 B：传 `path_strings`

适用场景：
- 前端已有 `/api/charlist` 的查询构造器
- 想和 `/api/charlist` 命中同一套缓存
- 想按 characters 表条件动态取字

关键点：
- `path_strings` 和 `/api/charlist` 使用同一套语法
- 后端会复用同一套 key 生成逻辑与解析逻辑
- 这也是当前推荐的“标准格式”

语法核心是：

```text
[值]{欄位}
```

示例：

```json
{
  "label": "知组三等",
  "source_mode": "preset",
  "table_name": "characters",
  "path_strings": ["[知]{組}[三]{等}"],
  "compare_dimension": "final"
}
```

另一个多条件例子：

```json
{
  "label": "庄组",
  "source_mode": "preset",
  "table_name": "characters",
  "path_strings": ["[莊]{組}"],
  "compare_dimension": "initial"
}
```

前端建议：
- 直接复用你们现有 `/api/charlist` 的 path builder
- 不要为 cluster 再单独发明一套 query 格式

### 5.3 兼容写法 C：旧 `filters`

适用场景：
- 老前端还没迁移
- 已有页面仍然只会传结构化条件

示例：

```json
{
  "label": "假摄",
  "source_mode": "preset",
  "table_name": "characters",
  "filters": {
    "攝": ["假"]
  },
  "compare_dimension": "final"
}
```

说明：
- 后端仍兼容
- 但前端新页面不要继续主推这一种

### 5.4 可选字段

#### `group_weight`

类型：
- `number`

默认：
- `1.0`

作用：
- 多个 group 合并距离时的权重

#### `use_phonetic_values`

类型：
- `boolean`

默认：
- `false`

作用：
- 是否在 group 内引入数值化音值信息

#### `phonetic_value_weight`

类型：
- `number`

默认：
- `0.2`

范围：
- `0.0 ~ 1.0`

作用：
- 数值化音值在 group 距离中的权重


## 6. one-shot `/jobs` 接入说明

### 6.1 创建任务

接口：

```http
POST /api/tools/cluster/jobs
```

请求体：
- 完整 cluster 请求
- 必须包含 `clustering`

示例：

```json
{
  "groups": [
    {
      "label": "假摄",
      "source_mode": "custom",
      "resolved_chars": ["家", "麻", "车", "蛇"],
      "compare_dimension": "final"
    }
  ],
  "locations": ["北京", "天津", "苏州"],
  "regions": [],
  "region_mode": "yindian",
  "include_special_locations": false,
  "clustering": {
    "algorithm": "agglomerative",
    "phoneme_mode": "intra_group",
    "n_clusters": 10,
    "linkage": "average",
    "random_state": 42
  }
}
```

返回：

```json
{
  "task_id": "cluster_xxx",
  "status": "pending",
  "progress": 0,
  "message": "聚类任务已创建",
  "summary": {}
}
```

### 6.2 轮询任务状态

接口：

```http
GET /api/tools/cluster/jobs/{task_id}
```

返回重点字段：
- `status`
  - `pending`
  - `processing`
  - `completed`
  - `failed`
- `progress`
- `message`
- `summary`
- `execution_time_ms`
- `performance`

前端建议：
- 每 `500ms ~ 1000ms` 轮询一次
- `completed` 后停止轮询
- `failed` 后停止轮询并展示 `message`
- `progress` 直接按百分比显示即可

### 6.3 读取最终结果

接口：

```http
GET /api/tools/cluster/jobs/{task_id}/result
```

返回结构：
- `summary`
- `location_resolution`
- `groups`
- `assignments`
- `metrics`
- `metadata`

前端常用字段：

- `summary.cluster_count`
- `summary.effective_location_count`
- `assignments`
  - 每个地点对应的 `cluster_id`
  - 以及展示字段：
    - `province`
    - `city`
    - `county`
    - `town`
    - `coordinates`
    - `yindian_region`
    - `map_region`
- `metadata.performance`
  - 用于展示后端各阶段耗时


## 7. staged 接入说明

staged 是当前推荐主流程。

推荐前端步骤：

1. 用户配置输入
2. 调 `preview`
3. 用户确认后调 `prepare`
4. 用户选择 `phoneme_mode` 后调 `distance`
5. 用户选择聚类器参数后调 `cluster`
6. 读取 `result_hash`
7. 显示结果

### 7.1 第一步：preview

接口：

```http
POST /api/tools/cluster/staged/preview
```

请求体：
- 与 one-shot 基本一样
- 但 **不需要** `clustering`

示例：

```json
{
  "groups": [
    {
      "label": "假摄",
      "source_mode": "preset",
      "table_name": "characters",
      "path_strings": ["[假]{攝}"],
      "compare_dimension": "final"
    }
  ],
  "locations": ["北京", "天津", "苏州"],
  "regions": [],
  "region_mode": "yindian",
  "include_special_locations": false
}
```

返回：

```json
{
  "prepare_hash": "xxxx",
  "preview": {
    "group_count": 1,
    "group_char_counts": {},
    "requested_location_count": 3,
    "matched_location_count": 3,
    "filtered_special_location_count": 0,
    "unique_char_count": 20,
    "requested_dimensions": ["final"],
    "estimated_pair_count": 3,
    "estimated_dense_matrix_mb": 0.0
  },
  "prepare_ready": false,
  "preview_expires_at": 1776308270.19
}
```

前端用途：
- 展示“这次任务大概多大”
- 保存 `prepare_hash`
- 让用户确认是否继续

推荐前端处理：
- 把 `prepare_hash` 放到页面状态里
- 把 `preview` 直接渲染成预估信息
- 用户点“继续准备”时再进下一步

### 7.2 第二步：prepare

接口：

```http
POST /api/tools/cluster/staged/prepare
```

请求体：

```json
{
  "prepare_hash": "xxxx"
}
```

返回：

```json
{
  "task_id": "cluster_xxx",
  "stage": "prepare",
  "status": "pending",
  "progress": 0,
  "message": "prepare 任务已创建",
  "prepare_hash": "xxxx",
  "cache_hit": false,
  "cache_source": "none"
}
```

然后继续轮询：

```http
GET /api/tools/cluster/jobs/{task_id}
```

完成后会看到：
- `status = completed`
- `performance.load_rows_ms`
- `performance.encode_ms`
- 以及 prepare 阶段摘要

前端建议：
- 把 `prepare` 看作“准备基础材料”
- 一个 `prepare_hash` 后面可以派生多个 `distance`

### 7.3 第三步：distance

接口：

```http
POST /api/tools/cluster/staged/distances
```

请求体：

```json
{
  "prepare_hash": "xxxx",
  "phoneme_mode": "intra_group"
}
```

返回：

```json
{
  "task_id": "cluster_xxx",
  "stage": "distance",
  "status": "pending",
  "progress": 0,
  "message": "intra_group distance 任务已创建",
  "prepare_hash": "xxxx",
  "distance_hash": "yyyy",
  "cache_hit": false,
  "cache_source": "none"
}
```

然后轮询：

```http
GET /api/tools/cluster/jobs/{task_id}
```

完成后会拿到：
- `distance_hash`
- `execution_time_ms`
- `performance.distance_matrix_ms`
- 某些 mode 还会有：
  - `inventory_profiles_ms`
  - `bucket_models_ms`

前端建议：
- `distance_hash` 按 `phoneme_mode` 分开保存
- UI 上允许用户切换 mode
- 已经算过的 mode 不要重复请求

### 7.4 第四步：cluster

接口：

```http
POST /api/tools/cluster/staged/clusters
```

请求体：

```json
{
  "distance_hash": "yyyy",
  "clustering": {
    "algorithm": "agglomerative",
    "n_clusters": 10,
    "linkage": "average",
    "random_state": 42
  }
}
```

如果 `algorithm = dbscan`：
- 不要传 `n_clusters`
- 要传 `eps`、`min_samples`

返回：

```json
{
  "task_id": "cluster_xxx",
  "stage": "cluster",
  "status": "pending",
  "progress": 0,
  "message": "cluster 任务已创建",
  "prepare_hash": "xxxx",
  "distance_hash": "yyyy",
  "result_hash": "zzzz",
  "cache_hit": false,
  "cache_source": "none"
}
```

然后轮询：

```http
GET /api/tools/cluster/jobs/{task_id}
```

### 7.5 第五步：读取最终结果

接口：

```http
GET /api/tools/cluster/staged/results/{result_hash}
```

返回结构和 one-shot 的 `/jobs/{task_id}/result` 基本一致：
- `summary`
- `location_resolution`
- `groups`
- `assignments`
- `metrics`
- `metadata`

前端可以共用同一套结果展示组件。

补充：
- staged 和 one-shot 的结果展示层应该尽量共用
- 差别主要只在“前面怎么拿到结果”，不是“结果怎么渲染”


## 8. staged 推荐前端状态机

推荐把页面状态拆成：

```ts
type ClusterWizardState = {
  requestDraft: ClusterStagePreviewRequest
  prepareHash?: string
  prepareTaskId?: string
  distanceHashByMode: Record<string, string | undefined>
  distanceTaskIdByMode: Record<string, string | undefined>
  resultHashByKey: Record<string, string | undefined>
  resultTaskIdByKey: Record<string, string | undefined>
}
```

推荐页面步骤：

1. 输入页
2. preview 页
3. prepare 页
4. phoneme mode 选择页
5. clustering 参数页
6. 结果页

推荐交互：

- preview 后必须显式“继续”
- prepare 完成后才开放 distance
- distance 完成后才开放 cluster
- cluster 完成后才读取 result


## 9. 轮询建议

统一轮询接口：

```http
GET /api/tools/cluster/jobs/{task_id}
```

推荐轮询策略：
- 初始轮询间隔：`800ms`
- 大任务可退避到：`1500ms`
- 成功或失败立即停止

伪代码：

```ts
async function waitTask(taskId: string) {
  while (true) {
    const status = await api.get(`/api/tools/cluster/jobs/${taskId}`)
    if (status.status === 'completed') return status
    if (status.status === 'failed') throw new Error(status.message || '任务失败')
    await sleep(800)
  }
}
```


## 10. 错误处理规则

### 10.1 `404`

含义：
- `task_id` 不存在
- `prepare_hash` 不存在或已过期
- `distance_hash` 不存在或已过期
- `result_hash` 不存在或已过期

前端建议：
- 如果是 staged hash 失效
  - 提示“上一步结果已过期，需要重新执行”
- 不要盲目重试同一个 hash

推荐回退策略：

- `prepare_hash` 失效
  - 回到 `preview`
- `distance_hash` 失效
  - 回到 `distance`
- `result_hash` 失效
  - 回到 `cluster`
- `task_id` 失效但你还保留上游 hash
  - 可以直接重新发起当前阶段，不必整条链路重来

### 10.2 `409`

含义：
- 依赖的上一步还在处理中

前端建议：
- 提示用户继续等待
- 保持当前按钮 disabled

### 10.3 `422`

含义：
- 参数格式不合法
- group 配置缺字段
- `locations` 和 `regions` 同时为空
- `algorithm` 参数组合不合法

前端建议：
- 直接把错误提示回显到表单

### 10.4 `500`

含义：
- 后端执行失败

前端建议：
- 展示后端 message
- 提供“重新开始”按钮


## 11. 缓存与过期语义

前端必须知道 staged 不是永久存储。

### 11.1 `/jobs`

- `task_id` 完成后大约保留 `2h`
- 超期后再查会 `404`

### 11.2 staged

- `preview`: `0.5h`
- `prepare`: `3h`
- `distance`: `3h`
- `result`: `2h`

前端含义：
- `prepare_hash` 不是永久可用
- `distance_hash` 不是永久可用
- `result_hash` 也不是永久可用

推荐前端提示：

- 如果用户隔了很久才回来
  - 优先尝试直接读取
  - 若 `404`
    - 自动提示“已过期，需要重新执行上一步”

### 11.3 `cache_hit` 和 `cache_source`

这些字段是提示信息，不要把它当作业务必需逻辑。

前端用途：
- 调试面板
- 高级模式下展示“是否命中缓存”

不要依赖它做核心流程判断。

前端最稳的做法是：
- 永远以真实接口结果为准
- `cache_hit` 只作为提示，不作为分支条件


## 12. 结果数据如何展示

最终结果前端主要关心 4 块：

### 12.1 `summary`

适合放页面顶部摘要卡片：
- 算法
- `phoneme_mode`
- `cluster_count`
- `effective_location_count`

### 12.2 `assignments`

这是地图和表格的主数据源。

每项至少有：
- `location`
- `cluster_id`
- `province`
- `city`
- `county`
- `town`
- `coordinates`
- `yindian_region`
- `map_region`

推荐用途：
- 地图着色
- 表格列表
- 分簇统计

### 12.3 `groups`

这是 group 级别诊断数据。

推荐用途：
- 展示每个 group 的覆盖率
- 显示哪些 group 有 warning
- 给高级用户看为什么某些 group 效果不好

### 12.4 `metadata.performance`

推荐放到“高级信息 / 性能信息”折叠面板。

常见字段：
- `snapshot_ms`
- `load_rows_ms`
- `encode_ms`
- `inventory_profiles_ms`
- `bucket_models_ms`
- `distance_matrix_ms`
- `cluster_ms`
- `location_details_ms`


## 13. 前端推荐实现

### 13.1 推荐默认主流程

```text
用户配置输入
-> staged/preview
-> 展示预估信息
-> 用户点击继续
-> staged/prepare
-> 用户选择 phoneme_mode
-> staged/distances
-> 用户设置聚类参数
-> staged/clusters
-> staged/results/{result_hash}
```

### 13.2 推荐快速模式

```text
用户配置输入
-> POST /jobs
-> 轮询 /jobs/{task_id}
-> GET /jobs/{task_id}/result
```

### 13.3 推荐前端复用原则

- 结果展示组件：
  - one-shot 和 staged 共用
- 轮询组件：
  - staged prepare/distance/cluster 和 one-shot 共用
- group 编辑器：
  - 优先支持 `resolved_chars` 和 `path_strings`
- charlist 构造器：
  - 直接复用 `/api/charlist` 的现有实现


## 14. 前端不要做的事

- 不要把 `task_id` 当成永久 id
- 不要把 `prepare_hash / distance_hash / result_hash` 当成永久资源
- 不要为 cluster 重新发明一套 `path_strings` 语法
- 不要继续把旧 `filters` 作为新页面主路径
- 不要依赖 `cache_hit` 作为唯一业务判断


## 15. 建议前端落地顺序

1. 先接 `staged/preview`
2. 再接 `staged/prepare + /jobs/{task_id}` 轮询
3. 再接 `staged/distances`
4. 再接 `staged/clusters`
5. 最后让 staged 和 `/jobs` 共用结果展示页

这样接入风险最低。


## 16. 一组完整 staged 示例

### 16.1 preview

```json
{
  "groups": [
    {
      "label": "知组三等",
      "source_mode": "preset",
      "table_name": "characters",
      "path_strings": ["[知]{組}[三]{等}"],
      "compare_dimension": "final"
    },
    {
      "label": "庄组二等",
      "source_mode": "preset",
      "table_name": "characters",
      "path_strings": ["[莊]{組}[二]{等}"],
      "compare_dimension": "final"
    }
  ],
  "locations": ["北京", "天津", "济南", "苏州"],
  "regions": [],
  "region_mode": "yindian",
  "include_special_locations": false
}
```

### 16.2 prepare

```json
{
  "prepare_hash": "由 preview 返回"
}
```

### 16.3 distance

```json
{
  "prepare_hash": "由 preview 返回",
  "phoneme_mode": "shared_request_identity"
}
```

### 16.4 cluster

```json
{
  "distance_hash": "由 distance 返回",
  "clustering": {
    "algorithm": "agglomerative",
    "n_clusters": 8,
    "linkage": "average",
    "random_state": 42
  }
}
```


## 17. 最终建议

如果只记三条：

1. 新前端默认走 staged，不要再把旧 `/jobs` 当唯一主流程
2. group 字集来源优先用 `resolved_chars` 或 `path_strings`，不要再主推旧 `filters`
3. 前端一定要保存 `prepare_hash / distance_hash / result_hash`，不要每一步都重新从头跑
