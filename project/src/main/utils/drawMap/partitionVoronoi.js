import { bbox, booleanIntersects, buffer, featureCollection, intersect, point, polygon, union } from '@turf/turf'
import { Delaunay } from 'd3-delaunay'
import { pickCategoryColor } from '@/main/config/colors/mapColors.js'

const FIELD_KEYS = {
  name: ['簡稱', '简称', '地點', '地点', 'name', 'location'],
  coordinate: ['經緯度', '经纬度', 'coordinates', 'coordinate', 'coord', 'lnglat', 'lonlat'],
  mapPartition: ['地圖集二分區', '地圖集分區', '地图集二分区', '地图集分区', 'mapPartition'],
  yindianPartition: ['音典分區', '音典分区', 'yindianPartition'],
  dialectIsland: ['方言島', '方言岛', 'dialectIsland'],
}

export const PARTITION_MODE_MAP = 'map'
export const PARTITION_MODE_YINDIAN = 'yindian'

export function getStringField(row, keys) {
  if (!row || typeof row !== 'object') return ''
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const value = row[key]
      return value === null || value === undefined ? '' : String(value).trim()
    }
  }
  return ''
}

export function parseCoordinate(value, row = {}) {
  const source = Array.isArray(value)
    ? value
    : String(value || '').split(/[,，\s]+/)
  const rawLng = row.lng ?? row.lon ?? row.longitude ?? row.x ?? source[0]
  const rawLat = row.lat ?? row.latitude ?? row.y ?? source[1]
  const lng = Number(rawLng)
  const lat = Number(rawLat)

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null
  return [lng, lat]
}

export function normalizePartitionParts(rawPath) {
  const parts = String(rawPath || '')
    .split('-')
    .map((item) => item.trim())
    .filter(Boolean)

  if (parts.length === 0) return []

  const normalizedParts = parts.slice(0, 3)
  while (normalizedParts.length < 3) {
    normalizedParts.push(normalizedParts[normalizedParts.length - 1])
  }
  return normalizedParts
}

export function getPartitionKeyFromParts(parts, level = 3) {
  const safeLevel = Math.min(Math.max(Number(level) || 3, 1), 3)
  return parts.slice(0, safeLevel).join('-')
}

export function getPartitionKey(item, level = 3) {
  const safeLevel = Math.min(Math.max(Number(level) || 3, 1), 3)
  if (safeLevel === 1) return item?.partitionLevel1 ?? ''
  if (safeLevel === 2) return item?.partitionLevel2 ?? ''
  return item?.partitionLevel3 ?? ''
}

export function getPartitionPath(row, partitionMode = PARTITION_MODE_MAP) {
  return partitionMode === PARTITION_MODE_YINDIAN
    ? getStringField(row, FIELD_KEYS.yindianPartition)
    : getStringField(row, FIELD_KEYS.mapPartition)
}

export function normalizePartitionPoint(row, options = {}) {
  const { partitionMode = PARTITION_MODE_MAP } = options
  const name = getStringField(row, FIELD_KEYS.name)
  const coordinate = parseCoordinate(getStringField(row, FIELD_KEYS.coordinate), row)
  const rawPartitionPath = getPartitionPath(row, partitionMode)
  const partitionParts = normalizePartitionParts(rawPartitionPath)

  if (!name || !coordinate || partitionParts.length === 0) return null

  return {
    name,
    coordinate,
    rawPartitionPath,
    partitionMode,
    partitionLevel1: getPartitionKeyFromParts(partitionParts, 1),
    partitionLevel2: getPartitionKeyFromParts(partitionParts, 2),
    partitionLevel3: getPartitionKeyFromParts(partitionParts, 3),
    isDialectIsland: getStringField(row, FIELD_KEYS.dialectIsland) === '1',
    raw: row,
  }
}

export function buildPartitionPoints(rows, options = {}) {
  const ignoredLocations = new Set(options.ignoredLocations ?? [])
  return (Array.isArray(rows) ? rows : [])
    .map((row) => normalizePartitionPoint(row, options))
    .filter((item) => item && !ignoredLocations.has(item.name))
}

export function buildVillagePartitionPoints(villages) {
  return (Array.isArray(villages) ? villages : [])
    .filter(v => {
      if (!v || !v.name) return false
      if (!v.dialect || String(v.dialect).trim() === '') return false
      if (typeof v.longitude !== 'number' || typeof v.latitude !== 'number') return false
      if (Math.abs(v.longitude) > 180 || Math.abs(v.latitude) > 90) return false
      return true
    })
    .map(v => {
      const dialect = String(v.dialect).trim()
      const partitionParts = normalizePartitionParts(dialect)
      return {
        name: String(v.name).trim(),
        coordinate: [v.longitude, v.latitude],
        partitionMode: 'village',
        partitionLevel1: getPartitionKeyFromParts(partitionParts, 1),
        partitionLevel2: getPartitionKeyFromParts(partitionParts, 2),
        partitionLevel3: getPartitionKeyFromParts(partitionParts, 3),
        rawPartitionPath: dialect,
        raw: { name: v.name, dialect, _path: v._path },
      }
    })
}

export function buildPartitionPointFeatureCollection(points, level = 3, colorMap = {}) {
  return featureCollection(
    (Array.isArray(points) ? points : []).map((item) => {
      const partitionKey = getPartitionKey(item, level)
      const style = colorMap[partitionKey] ?? {}
      return point(item.coordinate, {
        ...style,
        name: item.name,
        partitionKey,
        partitionMode: item.partitionMode,
        partitionLevel1: item.partitionLevel1,
        partitionLevel2: item.partitionLevel2,
        partitionLevel3: item.partitionLevel3,
        rawPartitionPath: item.rawPartitionPath,
      })
    })
  )
}

export function buildPartitionColorMap(points, level = 3) {
  const keys = Array.from(new Set(
    (Array.isArray(points) ? points : []).map((item) => getPartitionKey(item, level)).filter(Boolean)
  )).sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN'))

  return keys.reduce((accumulator, key, index) => {
    const { stroke, pointColor, fill } = pickCategoryColor(index)
    accumulator[key] = {
      stroke,
      pointColor,
      pointStrokeColor: '#ffffff',
      pointRadius: 7,
      fill,
      fillOpacity: 0.32,
      strokeWidth: 2,
    }
    return accumulator
  }, {})
}

export function groupPartitionPoints(points, level = 3) {
  const groups = new Map()
  ;(Array.isArray(points) ? points : []).forEach((item) => {
    const key = getPartitionKey(item, level)
    if (!key) return
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return groups
}

function getSafeBbox(featureCollectionValue) {
  const [minLng, minLat, maxLng, maxLat] = bbox(featureCollectionValue)
  const lngPadding = minLng === maxLng ? 0.01 : 0
  const latPadding = minLat === maxLat ? 0.01 : 0

  // 大幅扩展包围盒，给 d3-delaunay 足够空间让外圈 cells 自然延伸，
  // 后续由逐点圆形裁剪决定最终外边界
  const padRatio = 1.0
  const halfLng = (maxLng - minLng) / 2
  const halfLat = (maxLat - minLat) / 2

  return [
    minLng - lngPadding - halfLng * padRatio,
    minLat - latPadding - halfLat * padRatio,
    maxLng + lngPadding + halfLng * padRatio,
    maxLat + latPadding + halfLat * padRatio,
  ]
}

function getPointCoordinate(feature) {
  const coordinate = feature?.geometry?.coordinates
  if (!Array.isArray(coordinate) || coordinate.length < 2) return null
  const lng = Number(coordinate[0])
  const lat = Number(coordinate[1])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

function getCoordinateKey(coordinate) {
  return coordinate.map((value) => Number(value).toFixed(8)).join(',')
}

function logVoronoiDiagnostics(pointCollection, skippedCells = []) {
  const invalidFeatures = []
  const coordinateGroups = new Map()

  ;(pointCollection?.features ?? []).forEach((feature, index) => {
    const coordinate = getPointCoordinate(feature)
    if (!coordinate) {
      invalidFeatures.push({ index, properties: feature?.properties ?? null, geometry: feature?.geometry ?? null })
      return
    }

    const coordinateKey = getCoordinateKey(coordinate)
    if (!coordinateGroups.has(coordinateKey)) {
      coordinateGroups.set(coordinateKey, [])
    }
    coordinateGroups.get(coordinateKey).push({
      index,
      name: feature.properties?.name,
      partitionKey: feature.properties?.partitionKey,
      coordinate,
    })
  })

  const duplicateCoordinates = Array.from(coordinateGroups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([coordinate, items]) => ({ coordinate, items }))

  if (invalidFeatures.length || duplicateCoordinates.length || skippedCells.length) {
    console.warn('[partitionVoronoi] diagnostics', {
      totalFeatures: pointCollection?.features?.length ?? 0,
      invalidFeatures,
      duplicateCoordinates,
      skippedCells,
    })
  }
}

function isValidVoronoiRing(coords) {
  return Array.isArray(coords)
    && coords.length >= 3
    && coords.every((coordinate) => Array.isArray(coordinate)
      && coordinate.length >= 2
      && Number.isFinite(Number(coordinate[0]))
      && Number.isFinite(Number(coordinate[1])))
}

function convexHull(points) {
  const sorted = [...points].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]))
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function createCirclePolygon(center, radius) {
  const n = 12
  const ring = []
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * 2 * Math.PI
    ring.push([center[0] + radius * Math.cos(a), center[1] + radius * Math.sin(a)])
  }
  ring.push(ring[0])
  return polygon([ring])
}

function buildConcaveHullRing(compIndices, validFeatures, delaunay, alpha) {
  const compSet = new Set(compIndices)
  const { triangles, halfedges } = delaunay
  const triCount = triangles.length / 3

  // 标记每个三角形是否属于该分量且 circumradius <= alpha
  const triKept = new Uint8Array(triCount)
  for (let t = 0; t < triCount; t += 1) {
    const a = triangles[t * 3]
    const b = triangles[t * 3 + 1]
    const c = triangles[t * 3 + 2]
    if (!compSet.has(a) || !compSet.has(b) || !compSet.has(c)) continue

    const pa = getPointCoordinate(validFeatures[a])
    const pb = getPointCoordinate(validFeatures[b])
    const pc = getPointCoordinate(validFeatures[c])
    if (!pa || !pb || !pc) continue

    const ab = Math.hypot(pb[0] - pa[0], pb[1] - pa[1])
    const bc = Math.hypot(pc[0] - pb[0], pc[1] - pb[1])
    const ca = Math.hypot(pa[0] - pc[0], pa[1] - pc[1])
    if (ab > alpha || bc > alpha || ca > alpha) continue

    const s = (ab + bc + ca) / 2
    const area = Math.sqrt(Math.max(0, s * (s - ab) * (s - bc) * (s - ca)))
    const circumR = area > 0 ? (ab * bc * ca) / (4 * area) : Infinity
    if (circumR <= alpha) triKept[t] = 1
  }

  // 收集边界半边：属于 kept 三角形但对边不属于（或无边）
  const boundaryHalfedges = []
  for (let e = 0; e < halfedges.length; e += 1) {
    const t = Math.floor(e / 3)
    if (!triKept[t]) continue
    const opp = halfedges[e]
    if (opp === -1 || !triKept[Math.floor(opp / 3)]) {
      boundaryHalfedges.push(e)
    }
  }

  if (boundaryHalfedges.length < 3) return null

  // 以半边起点为 key 建邻接表
  const edgeMap = new Map()
  for (const e of boundaryHalfedges) {
    const from = triangles[e]
    const to = triangles[Math.floor(e / 3) * 3 + (e % 3 + 1) % 3]
    const fp = getPointCoordinate(validFeatures[from])
    const tp = getPointCoordinate(validFeatures[to])
    if (!fp || !tp) continue
    if (!edgeMap.has(from)) edgeMap.set(from, [])
    edgeMap.get(from).push({
      vertex: to,
      angle: Math.atan2(tp[1] - fp[1], tp[0] - fp[0]),
    })
  }

  // 按角度排序邻接边
  for (const [, neighbors] of edgeMap) {
    neighbors.sort((a, b) => a.angle - b.angle)
  }

  // 找最左点作为起点
  let startV = boundaryHalfedges[0]
  let startP = null
  for (const e of boundaryHalfedges) {
    const v = triangles[e]
    const p = getPointCoordinate(validFeatures[v])
    if (p && (!startP || p[0] < startP[0] || (p[0] === startP[0] && p[1] < startP[1]))) {
      startV = v
      startP = p
    }
  }

  // 顺时针追踪外边界
  const ring = [[startP[0], startP[1]]]
  const visitedEdges = new Set()
  let curr = startV
  let prevAngle = Math.PI / 2

  for (let step = 0; step < boundaryHalfedges.length + 5; step += 1) {
    const neighbors = edgeMap.get(curr)
    if (!neighbors || neighbors.length === 0) break

    let best = null
    let bestTurn = -Infinity
    for (const n of neighbors) {
      if (n.vertex === curr) continue
      let turn = prevAngle - n.angle
      while (turn < 0) turn += 2 * Math.PI
      while (turn >= 2 * Math.PI) turn -= 2 * Math.PI
      const edgeKey = curr + ',' + n.vertex
      if (!visitedEdges.has(edgeKey) && turn > bestTurn) {
        bestTurn = turn
        best = n
      }
    }

    if (!best) break

    const edgeKey = curr + ',' + best.vertex
    visitedEdges.add(edgeKey)

    const nextP = getPointCoordinate(validFeatures[best.vertex])
    if (!nextP) break
    ring.push([nextP[0], nextP[1]])

    if (best.vertex === startV) break

    const currP = getPointCoordinate(validFeatures[curr])
    prevAngle = Math.atan2(nextP[1] - currP[1], nextP[0] - currP[0])
    curr = best.vertex
  }

  if (ring.length < 3) return null
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push([ring[0][0], ring[0][1]])
  }
  return ring
}

// 归一化点坐标数组(过滤非法值),泰森多边形与等值线图共用
function normalizeCoordinates(coordinates) {
  return (coordinates || [])
    .map((c) => (Array.isArray(c) && c.length >= 2
      && Number.isFinite(Number(c[0]))
      && Number.isFinite(Number(c[1])))
      ? [Number(c[0]), Number(c[1])]
      : null)
    .filter(Boolean)
}

// 计算每个点往外扩张的半径 radius(由 expandFactor 控制)。
// 等值线图用它扩展网格 bbox 以容纳边界;泰森多边形则按原始逻辑自行计算 radius。
export function computeVoronoiRadius(coordinates, expandFactor = 0.3) {
  const coords = normalizeCoordinates(coordinates)
  if (coords.length < 2) return 0.1

  const features = coords.map((c) => point(c))
  const delaunay = Delaunay.from(
    features,
    (f) => f.geometry.coordinates[0],
    (f) => f.geometry.coordinates[1],
  )
  const n = coords.length

  // 每个点与 Delaunay 邻居的中位距离 → globalMedian → radius
  const neighborDists = []
  for (let i = 0; i < n; i += 1) {
    const pi = coords[i]
    const dists = []
    for (const j of delaunay.neighbors(i)) {
      const pj = coords[j]
      dists.push(Math.hypot(pi[0] - pj[0], pi[1] - pj[1]))
    }
    neighborDists.push(dists.length ? dists.sort((a, b) => a - b)[Math.floor(dists.length / 2)] : 0)
  }

  const globalMedian = (() => {
    const sorted = neighborDists.filter((d) => d > 0).sort((a, b) => a - b)
    if (!sorted.length) return 0.1
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  })()

  return globalMedian * (0.05 + expandFactor * 8) * 2
}

// 从点坐标与给定 radius 构建裁剪边界(泰森多边形与等值线图共用)。
// 每个点往外扩张 radius,小分量取圆并集,大分量取 hull+buffer,
// 得到「与点保持一定距离」的外边界。
export function buildVoronoiClipBoundary(coordinates, radius) {
  const coords = normalizeCoordinates(coordinates)
  if (coords.length < 2) return { boundary: null, radius: 0.1 }

  const features = coords.map((c) => point(c))
  const delaunay = Delaunay.from(
    features,
    (f) => f.geometry.coordinates[0],
    (f) => f.geometry.coordinates[1],
  )
  const n = coords.length

  const alpha = radius * 3

  // BFS 找连通分量(Delaunay 边 < 2*radius 视为连通)
  const compVisited = new Uint8Array(n)
  const components = []
  for (let i = 0; i < n; i += 1) {
    if (compVisited[i]) continue
    const comp = []
    const queue = [i]
    compVisited[i] = 1
    while (queue.length > 0) {
      const idx = queue.shift()
      comp.push(idx)
      const pi = coords[idx]
      for (const j of delaunay.neighbors(idx)) {
        if (compVisited[j]) continue
        const pj = coords[j]
        if (Math.hypot(pi[0] - pj[0], pi[1] - pj[1]) < 2 * radius) {
          compVisited[j] = 1
          queue.push(j)
        }
      }
    }
    components.push(comp)
  }

  // 对每个分量:大分量 hull+buffer,小分量圆并集
  const boundaries = []
  for (const comp of components) {
    if (comp.length < 3) {
      for (const i of comp) boundaries.push(createCirclePolygon(coords[i], radius))
    } else if (comp.length <= 30) {
      const compCircles = comp.map((i) => createCirclePolygon(coords[i], radius))
      try {
        const merged = union(featureCollection(compCircles))
        if (merged) boundaries.push(merged)
      } catch {
        boundaries.push(...compCircles)
      }
    } else {
      const compPoints = comp.map((i) => coords[i])
      const concaveRing = buildConcaveHullRing(comp, features, delaunay, alpha)
      if (concaveRing && concaveRing.length >= 4) {
        try {
          const buf = buffer(polygon([concaveRing]), radius, { units: 'degrees' })
          if (buf) { boundaries.push(buf); continue }
        } catch { /* fallback */ }
      }
      const hull = convexHull(compPoints)
      if (hull.length >= 3) {
        const hullRing = [...hull, hull[0]]
        try {
          const buf = buffer(polygon([hullRing]), radius, { units: 'degrees' })
          if (buf) boundaries.push(buf)
        } catch {
          for (const p of hull) boundaries.push(createCirclePolygon(p, radius))
        }
      }
    }
  }

  let boundary = null
  if (boundaries.length === 1) {
    boundary = boundaries[0]
  } else if (boundaries.length > 1) {
    try {
      boundary = union(featureCollection(boundaries))
    } catch {
      boundary = featureCollection(boundaries)
    }
  }

  return { boundary, radius }
}

function buildSafeVoronoiFeatureCollection(pointCollection, expandFactor = 0.3) {
  const originalFeatures = pointCollection?.features ?? []
  const validFeatures = []
  const filteredFeatures = []

  originalFeatures.forEach((feature, index) => {
    if (getPointCoordinate(feature)) {
      validFeatures.push(feature)
      return
    }
    filteredFeatures.push({
      index,
      name: feature?.properties?.name,
      partitionKey: feature?.properties?.partitionKey,
      geometry: feature?.geometry ?? null,
    })
  })

  if (validFeatures.length < 2) {
    logVoronoiDiagnostics(featureCollection(validFeatures), filteredFeatures.map((item) => ({
      ...item,
      reason: 'invalid-point-feature',
    })))
    return featureCollection([])
  }

  const safeBbox = getSafeBbox(featureCollection(validFeatures))
  const skippedCells = []

  let delaunay = null
  let voronoiDiagram = null
  try {
    delaunay = Delaunay.from(validFeatures, (feature) => getPointCoordinate(feature)[0], (feature) => getPointCoordinate(feature)[1])
    voronoiDiagram = delaunay.voronoi(safeBbox)
  } catch (error) {
    console.error('[partitionVoronoi] d3-delaunay voronoi failed', {
      error,
      safeBbox,
      validFeatureCount: validFeatures.length,
      invalidFeatureCount: filteredFeatures.length,
      sampleFeatures: validFeatures.slice(0, 20).map((feature, index) => ({
        index,
        name: feature.properties?.name,
        partitionKey: feature.properties?.partitionKey,
        coordinate: getPointCoordinate(feature),
        geometry: feature.geometry,
      })),
      filteredFeatures,
    })
    throw error
  }

  // 第一步：正常计算泰森多边形，同时记录每个 cell 离中心的最大距离
  const polygonFeatures = []
  const cellMaxDists = []
  const neighborDists = []
  for (let index = 0; index < validFeatures.length; index += 1) {
    const coords = voronoiDiagram?.cellPolygon(index)
    const sourceFeature = validFeatures[index]
    if (!isValidVoronoiRing(coords)) {
      skippedCells.push({
        index,
        reason: coords ? 'invalid-ring' : 'empty-cell',
        name: sourceFeature?.properties?.name,
        partitionKey: sourceFeature?.properties?.partitionKey,
        coordinate: sourceFeature ? getPointCoordinate(sourceFeature) : null,
      })
      continue
    }

    polygonFeatures.push(polygon([coords], sourceFeature?.properties ?? {}))

    // 记录该 cell 与 Delaunay 邻居的中位距离（用于计算扩张半径，仅统计有效 cell）
    const pi = getPointCoordinate(sourceFeature)
    const dists = []
    for (const j of delaunay.neighbors(index)) {
      const pj = getPointCoordinate(validFeatures[j])
      dists.push(Math.hypot(pi[0] - pj[0], pi[1] - pj[1]))
    }
    neighborDists.push(dists.length ? dists.sort((a, b) => a - b)[Math.floor(dists.length / 2)] : 0)

    // 计算 cell 到中心的最大距离（用于裁剪预过滤）
    let maxDist = 0
    for (let ci = 0; ci < coords.length; ci += 1) {
      const d = Math.hypot(coords[ci][0] - pi[0], coords[ci][1] - pi[1])
      if (d > maxDist) maxDist = d
    }
    cellMaxDists.push(maxDist)
  }

  // 未启用延伸 → 跳过裁剪，直接返回
  if (expandFactor < 0) {
    logVoronoiDiagnostics(featureCollection(validFeatures), [
      ...filteredFeatures.map((item) => ({ ...item, reason: 'invalid-point-feature' })),
      ...skippedCells,
    ])
    return featureCollection(polygonFeatures)
  }

  // 第二步：按原始逻辑计算扩张半径（仅统计有效 cell 的邻居中位距离）
  const globalMedian = (() => {
    const sorted = neighborDists.filter((d) => d > 0).sort((a, b) => a - b)
    if (!sorted.length) return 0.1
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  })()
  const radius = globalMedian * (0.05 + expandFactor * 8) * 2

  // 第三步：用连通分量构建裁剪边界（复用共享函数）
  const { boundary: clipBoundary } = buildVoronoiClipBoundary(
    validFeatures.map((feature) => getPointCoordinate(feature)).filter(Boolean),
    radius,
  )

  // 第四步：用并集边界裁剪
  let statInside = 0
  let statNoIntersect = 0
  let statIntersected = 0
  let statFailed = 0
  const clippedFeatures = clipBoundary
    ? polygonFeatures
      .map((cell, i) => {
        // cell 完全在自己的圆内 → 一定在 union 里
        if (cellMaxDists[i] <= radius) {
          statInside += 1
          return cell
        }
        let intersects = false
        try {
          intersects = booleanIntersects(cell, clipBoundary)
        } catch { /* JSTS may throw on degenerate geometry */ }
        if (!intersects) {
          statNoIntersect += 1
          return cell
        }
        try {
          const clipped = intersect(featureCollection([cell, clipBoundary]))
          if (clipped) {
            clipped.properties = cell.properties ?? {}
            statIntersected += 1
            return clipped
          }
        } catch { /* fall through */ }
        statFailed += 1
        return cell
      })
    : polygonFeatures

  console.log('[partitionVoronoi] component clip', {
    totalCells: polygonFeatures.length,
    radius,
    expandFactor,
    clipStats: `${statInside} inside, ${statNoIntersect} noIntersect, ${statIntersected} intersected, ${statFailed} failed`,
  })

  logVoronoiDiagnostics(featureCollection(validFeatures), [
    ...filteredFeatures.map((item) => ({ ...item, reason: 'invalid-point-feature' })),
    ...skippedCells,
  ])
  return featureCollection(clippedFeatures)
}

function mergePartitionCellFeatures(cellFeatures, partitionKey, level, groupPoints, style = {}) {
  const validFeatures = (cellFeatures ?? []).filter((feature) => feature && typeof feature === 'object')
  if (!validFeatures.length) return null

  let mergedFeature = null
  if (validFeatures.length === 1) {
    mergedFeature = validFeatures[0]
  } else {
    try {
      mergedFeature = union(featureCollection(validFeatures))
    } catch (error) {
      console.warn('[partitionVoronoi] union merge failed for partition', partitionKey, error.message)
      // fallback: return the individual features as a featureCollection
      mergedFeature = null
    }
  }

  if (!mergedFeature) return null

  return {
    ...mergedFeature,
    properties: {
      ...(mergedFeature.properties ?? {}),
      ...style,
      name: partitionKey,
      partitionKey,
      partitionLevel: level,
      pointCount: groupPoints.length,
    },
  }
}

export function calculatePartitionVoronoi(points, level = 3, colorMap = {}, expandRatio = 30) {
  const groups = groupPartitionPoints(points, level)
  const groupResults = {}
  const cellFeatures = []
  const partitionFeatures = []
  const pointCollection = buildPartitionPointFeatureCollection(points, level, colorMap)
  const polygonCollection = pointCollection.features.length >= 2
    ? buildSafeVoronoiFeatureCollection(pointCollection, (expandRatio ?? 30) / 100)
    : featureCollection([])

  ;(polygonCollection?.features ?? [])
    .filter((feature) => feature && typeof feature === 'object')
    .forEach((feature) => {
      const partitionKey = feature.properties?.partitionKey
      if (!partitionKey || !groups.has(partitionKey)) return
      const groupPoints = groups.get(partitionKey)
      const style = colorMap[partitionKey] ?? {}
      const styledFeature = {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          ...style,
          partitionKey,
          partitionLevel: level,
          pointCount: groupPoints.length,
        },
      }

      if (!groupResults[partitionKey]) {
        groupResults[partitionKey] = []
      }
      groupResults[partitionKey].push(styledFeature)
      cellFeatures.push(styledFeature)
    })

  groups.forEach((groupPoints, partitionKey) => {
    const features = groupResults[partitionKey] ?? []
    const style = colorMap[partitionKey] ?? {}
    const mergedFeature = mergePartitionCellFeatures(features, partitionKey, level, groupPoints, style)

    groupResults[partitionKey] = featureCollection(features)
    if (mergedFeature) {
      partitionFeatures.push(mergedFeature)
    }
  })

  return {
    groups: groupResults,
    cells: featureCollection(cellFeatures),
    merged: featureCollection(partitionFeatures),
  }
}

export function buildVoronoiSelectionOptions(points, level = 3) {
  const regionMap = new Map()
  const locationMap = new Map()

  ;(Array.isArray(points) ? points : []).forEach((item) => {
    const regionName = level === 1
      ? item.partitionLevel1
      : level === 2
        ? item.partitionLevel2
        : item.partitionLevel3

    if (!locationMap.has(item.name)) {
      locationMap.set(item.name, {
        name: item.name,
        recordCount: 0,
        regionNames: new Set(),
      })
    }
    const locationEntry = locationMap.get(item.name)
    locationEntry.recordCount += 1
    locationEntry.regionNames.add(regionName)

    if (!regionMap.has(regionName)) {
      regionMap.set(regionName, {
        name: regionName,
        rows: [],
        locations: new Set(),
        recordCount: 0,
      })
    }
    const regionEntry = regionMap.get(regionName)
    regionEntry.rows.push({ 簡稱: item.name })
    regionEntry.locations.add(item.name)
    regionEntry.recordCount += 1
  })

  return {
    regions: Array.from(regionMap.values()).map((item) => ({
      name: item.name,
      rows: item.rows,
      locationCount: item.locations.size,
      recordCount: item.recordCount,
    })),
    locations: Array.from(locationMap.values()).map((item) => ({
      name: item.name,
      recordCount: item.recordCount,
      regionNames: Array.from(item.regionNames),
    })),
  }
}
