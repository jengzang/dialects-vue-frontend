# 自然村地名地图系统 - 前端 Agent 开发文档

## 1. 任务目标

你负责实现自然村地名地图查询系统前端。

核心目标：

> 使用 Vue3 + MapLibre 展示自然村空间分布，并支持点击地点获取官方详情。


---

# 2. 技术要求


技术栈：

- Vue3
- MapLibre GL
- Axios/fetch


---

# 3. 页面


路由：

```
/toponyms/map
```


页面：

```
ToponymsMap.vue
```


---

# 4. 页面结构


包含：

```
ExploreBar

MapContainer

ToponymDetail
```


---

# 5. 地图加载流程


页面打开：

```
mounted

↓

GET /api/toponyms/map

↓

获得全部自然村数据

↓

转换 GeoJSON

↓

MapLibre 加载

↓

显示点
```


---

# 6. 地图组件


组件：

```
ToponymMap.vue
```


负责：

- 初始化地图
- 添加 source
- 添加 layer
- marker 点击


---

# 7. 数据格式


后端返回 GeoJSON：

```json
{
"type":"FeatureCollection",
"features":[]
}
```


直接用于 MapLibre。


---

# 8. 点位交互


用户点击 marker：


流程：

```
click feature

↓

获取 properties.id

↓

调用民政部接口

↓

展示详情
```


---

# 9. 民政部详情接口


注意：

不要请求自己的后端。


直接：

```
POST

https://dmfw.mca.gov.cn/9095/stname/detailsPub
```


请求：

```json
{
"id":"地名ID"
}
```


---

返回：

```json
{
"area_name":"",
"city_name":"",
"old_name":""
}
```


---

# 10. 详情组件


组件：

```
ToponymDetail.vue
```


展示：


```
名称

所在地市

所在区县

历史地名

```


---

# 11. 搜索功能


第一版本：

不请求后端。


实现：

```
allToponyms

↓

filter(keyword)

↓

更新地图展示
```


---

组件：

```
ToponymSearch.vue
```


支持：

输入：

```
黄
```


过滤：

```
黄村
黄塘村
```


---

# 12. 地图性能


如果点很多：

优先：

- cluster
- symbol layer


不要为每个点创建大量 DOM marker。


推荐：

MapLibre layer。


---

# 13. 开发注意事项


不要实现：

- 后端详情接口调用
- 后端搜索接口调用
- bbox分页加载


原因：

产品第一版已经确定：

全量加载 + 前端交互。


---

# 14. 开发步骤


## Step 1

确认项目现有地图组件结构。


## Step 2

新增地图页面。


## Step 3

接入后端接口。


## Step 4

实现点点击。


## Step 5

接入民政部详情。


## Step 6

实现搜索。


---

# 15. 验收标准


满足：

- [ ] 地图正常显示
- [ ] 全部自然村点加载
- [ ] 点击点获取详情
- [ ] 民政部接口调用成功
- [ ] 搜索正常
- [ ] 大量点位不卡顿
