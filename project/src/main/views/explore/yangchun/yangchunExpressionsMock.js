export const yangchunExpressionCategories = [
  { id: 'all', label: '全部', description: '查看所有示例条目' },
  { id: 'reduplication', label: '叠式词', description: 'AABB、ABB、AAB、ABAB 等形式' },
  { id: 'xiehouyu', label: '歇后语', description: '带有后半截解释的固定说法' },
  { id: 'farmProverb', label: '农谚', description: '节气、农事与生活经验' },
  { id: 'idiom', label: '惯用语', description: '日常口语里的固定搭配' },
]

export const yangchunExpressionPatterns = ['全部', 'AABB', 'ABB', 'AAB', 'ABAB', '歇后语', '农谚', '惯用语']

export const yangchunExpressionItems = [
  {
    id: 'mock-aabb-1',
    category: 'reduplication',
    pattern: 'AABB',
    expression: '密密麻麻',
    pronunciation: '示例音：mat mat maa maa',
    meaning: '数量很多、排列很密。',
    example: '山路边个草密密麻麻。',
    area: '阳春白话通用示例',
    tags: ['形容状态', '叠式词'],
    source: '示例',
    note: '示例条目，等待真实采录资料补全。',
  },
  {
    id: 'mock-abb-1',
    category: 'reduplication',
    pattern: 'ABB',
    expression: '湿漉漉',
    pronunciation: '示例音：sap luk luk',
    meaning: '形容潮湿、带水。',
    example: '落完雨条路湿漉漉。',
    area: '春中白话示例',
    tags: ['天气', '形容状态'],
    source: '示例',
    note: '用于验证 ABB 分类与搜索。',
  },
  {
    id: 'mock-aab-1',
    category: 'reduplication',
    pattern: 'AAB',
    expression: '慢慢行',
    pronunciation: '示例音：maan maan haang',
    meaning: '慢一点走，也可作提醒语气。',
    example: '路滑，慢慢行。',
    area: '阳春白话通用示例',
    tags: ['动作', '提醒'],
    source: '示例',
    note: 'AAB 类先收动作短语，后续可按真实资料调整。',
  },
  {
    id: 'mock-abab-1',
    category: 'reduplication',
    pattern: 'ABAB',
    expression: '商量商量',
    pronunciation: '示例音：soeng loeng soeng loeng',
    meaning: '再讨论一下。',
    example: '呢件事返去商量商量。',
    area: '阳春白话通用示例',
    tags: ['动作', '商议'],
    source: '示例',
    note: '用于验证 ABAB 分类。',
  },
  {
    id: 'mock-xhy-1',
    category: 'xiehouyu',
    pattern: '歇后语',
    expression: '灶头边讲古',
    pronunciation: '示例音',
    meaning: '形容随口讲旧事、讲故事。',
    example: '佢又喺灶头边讲古。',
    area: '阳春生活语境示例',
    tags: ['歇后语', '生活场景'],
    source: '示例',
    note: '具体后半截等待真实资料补充。',
  },
  {
    id: 'mock-farm-1',
    category: 'farmProverb',
    pattern: '农谚',
    expression: '春寒雨多，田头慢做',
    pronunciation: '示例音',
    meaning: '提醒春季低温多雨时农事不宜急进。',
    example: '老人话春寒雨多，田头慢做。',
    area: '阳春农事示例',
    tags: ['农谚', '天气'],
    source: '示例',
    note: '示例条目，等待真实农谚资料补全。',
  },
  {
    id: 'mock-idiom-1',
    category: 'idiom',
    pattern: '惯用语',
    expression: '转屋下',
    pronunciation: '示例音：zyun uk haa',
    meaning: '回家。',
    example: '天黑喇，转屋下。',
    area: '春西白话参考项示例',
    tags: ['惯用语', '家屋'],
    source: '示例',
    note: '春西白话相关文章提到“转屋下”类词汇。',
  },
]

export function normalizeYangchunExpressionItem(item = {}, index = 0) {
  const rawTags = item.tags
  const tags = Array.isArray(rawTags)
    ? rawTags.filter(Boolean).map((tag) => String(tag))
    : rawTags
      ? [String(rawTags)]
      : []

  return {
    id: item.id || `expression-${index}`,
    category: item.category || '',
    pattern: item.pattern || '',
    expression: item.expression || '',
    pronunciation: item.pronunciation || '',
    meaning: item.meaning || '',
    example: item.example || '',
    area: item.area || '',
    tags,
    source: item.source || '',
    note: item.note || '',
  }
}

export const normalizedYangchunExpressionItems = yangchunExpressionItems.map(normalizeYangchunExpressionItem)
