// 統計快照(音节/特征)与实时接口共用的位图解码与地点映射工具
// 位图是 base64 字符串,解出 ceil(locationsCount/8) 个字节,第 i 位(从 0 开始) = 地点 id i 是否覆盖,字节内低位在前

// 从位图解码出覆盖地点 id 数组
export function idsFromBitmap(bitmap, locationsCount) {
  const bytes = Uint8Array.from(atob(bitmap), (c) => c.charCodeAt(0))
  const ids = []
  for (let i = 0; i < locationsCount; i++) {
    if ((bytes[i >> 3] >> (i & 7)) & 1) ids.push(i)
  }
  return ids
}

// 把一条统计的 locations 归一化为地点名数组
// 实时接口 aggregated 里是 id 数组,快照文件里是 bitmap,两者统一转成地点名
export function resolveStatsLocations(stats, byId, locationsCount) {
  if (Array.isArray(stats?.locations)) {
    return stats.locations.map((id) => byId.get(Number(id))).filter(Boolean)
  }
  if (typeof stats?.bitmap === 'string' && locationsCount > 0) {
    return idsFromBitmap(stats.bitmap, locationsCount).map((id) => byId.get(id)).filter(Boolean)
  }
  return []
}
