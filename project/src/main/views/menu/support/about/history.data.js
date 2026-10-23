// 按作者提供的日期与原文记录；月份信息不补造具体日。
// 只为有现存页面入口的功能添加内链；短名称按所在记录消除歧义。
const featureLinks = {
  '按中古地位整理声韵特征': '/menu/query/zhonggu',
  '分析音位的中古来源': '/menu/query/yinwei',
  '查中古': '/menu/query/zhonggu',
  '查音位': '/menu/query/yinwei',
  '查音系': '/menu/pho/matrix',
  '查字': '/menu/query/char',
  '查调': '/menu/query/tone',
  '细分查询': '/menu/result',
  '结果页面': '/menu/result',
  '分区绘图': '/menu/map/divide',
  '地图': '/menu/map/view',
  '阳春自然村展示': '/explore/yc/villages',
  '阳春口语词展示页面': '/explore/yc/words',
  '右侧面板': '/menu/map/view?openPanel=true',
  '资料来源': '/menu/source',
  '自然村': '/menu/villages',
  '语保': '/menu/yubao',
  '词表': '/menu/vocabulary/view',
  '字表检查': '/explore/tools/check',
  '粤拼转ipa': '/explore/tools/jyut2ipa',
  '字表合并': '/explore/tools/merge',
  '广东省自然村树状图': '/explore/villages/gd',
  '中古汉字树状图': '/explore/char-class?tab=zhonggu',
  '语保1000词': '/menu/yubao?tab=vocabulary',
  '50句': '/menu/yubao?tab=grammar',
  '音节统计': '/menu/pho/count',
  '音素分类': '/menu/pho/custom',
  '语保地图展示': '/menu/yubao',
  'Praat': '/explore/tools/praat',
  '按行政区划、分区等逐一查看或选择地点': '/menu/query/zhonggu?openPartitionInfo=true',
  '自定义分区': '/auth/regions',
  '自然村机器学习子系统': '/explore/villages/ml',
  '首页': '/',
  '切换语言': '/menu/settings',
  '韵书演化分析': '/menu/pho/evolution',
  '汉字字集': '/explore/char-class?tab=zhonggu',
  '上古、中古、近古': '/explore/char-class?tab=shanggu',
  '音值比较': '/menu/compare/phonetic',
  '自定义地图': '/menu/map/custom',
  '地图绘制': '/explore/gis',
  '整体音节': '/menu/pho/count',
  '音系查询': '/menu/pho/matrix',
  '同音字汇': '/menu/pho/matrix',
  '等值线图': '/menu/map/view',
  '主题色': '/menu/settings',
  '字表注释': '/menu/vocabulary/view?source=character-notes'
}

const footerActions = {
  '反馈建议': 'feedback',
  '功能入口': 'features',
  '分享': 'share'
}

const externalLinks = {
  '旧版网站': 'https://dialects.yzup.top/detail/'
}

const contextualLinks = {
  '2026.1.29': { '表格': '/explore/villages/table' },
  '2026.3.5': {
    '汉字': '/menu/compare/char',
    '中古': '/menu/compare/zhonggu',
    '调类比较': '/menu/compare/tone'
  }
}

function formatParts(entry) {
  const links = { ...featureLinks, ...contextualLinks[entry.date] }
  const actionsForEntry = entry.date === '2026.9.8' ? footerActions : {}
  const labels = [...Object.keys(links), ...Object.keys(actionsForEntry), ...Object.keys(externalLinks)]
    .sort((a, b) => b.length - a.length)
  const escapedLabels = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(v\\d+\\.\\d+\\.\\d+|${escapedLabels.join('|')})`, 'g')
  return entry.parts.flatMap(part => {
    if (typeof part !== 'string') return [part]
    return part.split(pattern).filter(Boolean).map(text => {
      if (/^v\d+\.\d+\.\d+$/.test(text)) return { version: text }
      if (actionsForEntry[text]) return { label: text, action: actionsForEntry[text] }
      if (externalLinks[text]) return { label: text, href: externalLinks[text] }
      if (links[text]) return { text, to: links[text] }
      return text
    })
  })
}

// 按日志内容识别重要更新：新增独立能力、关键架构迁移与正式上线。
// 不仅凭版本号或“上线”等关键词判断；理由集中保留，方便后续调整。
const importantUpdates = {
  '2025.7.25': '完成查中古、查音位等核心查询能力',
  '2025.8.1': '新增细分查询，扩展按中古地位整理声韵的能力',
  '2025.9.4': '查询与输入页面开始迁移到 Vue',
  '2025.9.5': '网站正式部署上线',
  '2026.1.11': '结果页面迁移到 Vue，查字与查调成为独立核心功能',
  '2026.1.15': '地图迁移到 Vue，分区绘图成为独立核心功能',
  '2026.1.16': '主站完成 Vue3 迁移',
  '2026.1.17': '新增阳春自然村展示',
  '2026.1.18': '新增阳春口语词展示页面',
  '2026.1.22': '完善用户自定义数据添加能力',
  '2026.1.23': '完成通用表格的展示、筛选与编辑等基础能力',
  '2026.1.27': '新增字表检查、粤拼转 IPA 和字表合并工具',
  '2026.1.29': '新增广东自然村及中古汉字树状图与表格',
  '2026.2.1': '新增语保词汇与句子资料查询',
  '2026.2.4': '新增查音系与音节统计',
  '2026.2.5': '新增音素分类',
  '2026.2.7': '新增语保资料地图展示',
  '2026.2.11': '新增 Praat 语音分析工具',
  '2026.2.19': '新增自定义分区',
  '2026.3.1': '新增自然村机器学习子系统',
  '2026.3.5': '新增汉字、中古、调类比较',
  '2026.3.18': '汉字字集页面独立',
  '2026.3.24': '新增繁体、简体和英文语言切换',
  '2026.4.3': '新增韵书演化分析',
  '2026.4.16': '汉字字集支持切换多本韵书',
  '2026.6.7': '新增音值比较',
  '2026.6.9': '自定义地图支持按地点和特征录入、查看',
  '2026.6.17': '新增在线 GIS 地图绘制工具',
  '2026.6.22': '查字、查中古、查音位、查音系增加文白读显示',
  '2026.6.24': '音节统计新增多种图表展示',
  '2026.7.31': '词表展示与协作平台正式上线',
  '2026.8.13': '音节统计支持整体音节，地图新增等值线图',
  '2026.8.17': '音系查询新增同音字汇展示与复制',
  '2026.9.30': '新增字表注释查询'
}

export const historyEntries = [
  { date: "2025.5", parts: ["整理湘赣粤土话的声韵地位特征时，缺乏实用工具，只得一份一份字表检索汉字，手动汇总到excel表格中，顿感无力。开始萌生了实现「按中古地位整理声韵特征」功能的想法。"] },
  { date: "2025.6.12", parts: ["实现了提取「汉字音典」开源字表的声韵调，并整理、汇总到excel表格中。当时仍处在Excel的舒适区中，成果也都只是通过xlsx或腾讯文档进行分享。"] },
  { date: "2025.7.15", parts: ["发现很多方言学者、民间爱好者，都有相同的需求，决心开发网站，帮助减少整理资料的时间，也降低音韵学的入门难度。"] },
  { date: "2025.7.25", parts: ["基础的前后端功能完成，以「按中古地位整理声韵特征」（查中古）、「分析音位的中古来源」（查音位）功能为主，查字、查调功能为辅。"] },
  { date: "2025.8.1", parts: ["增加了「细分查询」的功能，更细致地按地位整理声韵。"] },
  { date: "2025.8.2", parts: [{ href: 'https://zhuanlan.zhihu.com/p/1934345780199682731', label: '知乎文章' }, "（方言比较小站开发记录）发布，比我想象中热度要高很多。大家的支持让我更加坚定要尽快完善网站，并部署上线。"] },
  { date: "2025.8.4", parts: ["开始部署在内网v1.0.0"] },
  { date: "2025.8.18", parts: ["基于原生js的初版开发基本完成，分发exe供内测用户尝鲜。v1.0.5"] },
  { date: "2025.8.23", parts: ["完成后台管理系统 v1.1.0"] },
  { date: "2025.8.27", parts: ["购买域名并备案"] },
  { date: "2025.9.2", parts: ["购买服务器"] },
  { date: "2025.9.4", parts: ["引入vue作为查询、输入页面，但地图及结果展示仍由原生js承担。v1.2.0"] },
  { date: "2025.9.5", parts: ["正式部署！"] },
  { date: "2025.9.19", parts: ["感谢学艺术的同学帮忙设计图标、标题等，「方音圖鑑」总算有logo了。v1.3.0"] },
  { date: "2026.1.11", parts: ["结果页面迁移到Vue，查字、查调更为显著，不再作为辅助功能。v2.0.0"] },
  { date: "2026.1.15", parts: ["地图也迁移到Vue，分区绘图重要性提升，不再作为辅助功能。v2.0.5"] },
  { date: "2026.1.16", parts: ["原生js移至「旧版网站」入口，主站全部使用Vue3开发。v2.1.0"] },
  { date: "2026.1.17", parts: ["增加阳春自然村展示。v2.2.0"] },
  { date: "2026.1.18", parts: ["阳春口语词展示页面。v2.3.0"] },
  { date: "2026.1.22", parts: ["右侧面板完善，用于用户自定义数据添加 v2.4.0"] },
  { date: "2026.1.23", parts: ["通用表格组件完成（展示、筛选、编辑、替换等功能），为后续资料来源、自然村、语保、词表等页面打下坚实基础。v2.5.0"] },
  { date: "2026.1.27", parts: ["字表检查、粤拼转ipa、字表合并工具上线。v3.0.0 字表工具", { href: 'https://zhuanlan.zhihu.com/p/2001363637311381604', label: '知乎文章' }, "发布，这也是我时隔近半年再次在知乎发文"] },
  { date: "2026.1.29", parts: ["广东省自然村树状图、表格；中古汉字树状图（初始的汉字字集页面）。v3.1.0"] },
  { date: "2026.1.30", parts: ["完善地图弹窗功能，点击地图上的点均可查看明细 v3.1.2"] },
  { date: "2026.2.1", parts: ["语保1000词、50句正式上线。v3.2.0"] },
  { date: "2026.2.4", parts: ["查音系、音节统计功能上线。v3.3.0"] },
  { date: "2026.2.5", parts: ["音素分类功能上线。v3.3.5 ", { href: 'https://zhuanlan.zhihu.com/p/2002848348378521848', label: '知乎文章' }] },
  { date: "2026.2.7", parts: ["语保地图展示正式上线，同时缓存语保重复数据。v3.3.7 ", { href: 'https://zhuanlan.zhihu.com/p/2003637219919946701', label: '知乎文章' }] },
  { date: "2026.2.8", parts: ["查音系、音素分类页面增加参数，可直接转发链接分享（打开后直接就是当前查询地点）v3.3.8"] },
  { date: "2026.2.11", parts: ["Praat功能正式上线 v3.5.0"] },
  { date: "2026.2.17", parts: ["支持按行政区划、分区等逐一查看或选择地点 v3.5.2"] },
  { date: "2026.2.19", parts: ["自定义分区功能上线 v3.6.0"] },
  { date: "2026.3.1", parts: ["自然村机器学习子系统上线。v4.0.0"] },
  { date: "2026.3.5", parts: ["汉字、中古、调类比较功能上线。v4.1.0"] },
  { date: "2026.3.6", parts: ["增加首页 v4.1.2"] },
  { date: "2026.3.18", parts: ["「汉字字集」页面独立 v4.1.5"] },
  { date: "2026.3.24", parts: ["支持切换语言（繁体、简体、英文）；优化查询速度 v4.2.0"] },
  { date: "2026.4.3", parts: ["「韵书演化分析」功能上线 v4.3.0"] },
  { date: "2026.4.16", parts: ["「汉字字集」页面支持切换上古、中古、近古等多本韵书 v4.3.5"] },
  { date: "2026.6.7", parts: ["「音值比较」功能上线； v4.4.0"] },
  { date: "2026.6.9", parts: ["大幅改进「自定义地图」页面，支持按地点/特征录入、查看 v4.4.5"] },
  { date: "2026.6.17", parts: ["「地图绘制」（在线gis）工具上线 v4.5.0"] },
  { date: "2026.6.22", parts: ["查字、查中古、查音位、查音系等增加文白读显示 v4.5.2"] },
  { date: "2026.6.24", parts: ["「音节统计」增加饼图、柱状图、散点图、轮盘等展示。 v4.5.5"] },
  { date: "2026.7.2", parts: ["查中古、比较中古支持手动输入 v4.5.7"] },
  { date: "2026.7.12", parts: ["「设置」支持切换主题色 v4.5.8"] },
  { date: "2026.7.18", parts: ["「泰森多边形」绘制方言分布图完善，可由自然村数据直接导入 v4.6.0"] },
  { date: "2026.7.31", parts: ["词表展示、协作平台正式上线 v5.0.0"] },
  { date: "2026.8.9", parts: ["更新首页，增加地球、功能示例图片等。v5.0.5"] },
  { date: "2026.8.10", parts: ["完善各个页面的教程 v5.0.8"] },
  { date: "2026.8.13", parts: ["音节统计支持按「整体音节」统计，地图支持等值线图展示 v5.1.0"] },
  { date: "2026.8.17", parts: ["「音系查询」同音字汇展示上线，支持复制 v5.1.2"] },
  { date: "2026.9.8", parts: ["增加页脚，支持「反馈建议」「功能入口」「分享」等功能 v5.1.5"] },
  { date: "2026.9.30", parts: ["查询「字表注释」功能上线 v5.2.0"] },
  { date: "2026.10.22", parts: ["样式大幅优化，查询窗口更大，移动端顶栏自动收起 v5.2.2"] }
].map(entry => ({
  ...entry,
  important: Object.hasOwn(importantUpdates, entry.date),
  importanceReason: importantUpdates[entry.date] || '',
  displayParts: formatParts(entry),
  dateTime: entry.date.split('.').map((part, index) => index === 0 ? part : part.padStart(2, '0')).join('-')
}))

export const historyStages = [
  'V1 初步尝试 - 原生js页面',
  'V2 围绕音韵的核心查询功能 - Vue',
  'V3 快速迭代的核心拓展功能',
  'V4 稳步推进的功能创新',
  'V5 完善原有功能，改进用户体验'
].map((title, index) => ({ major: index + 1, title, entries: [] }))

// 未标版本的早期筹备记录归入 V1；其他无版本记录沿用所在阶段。
let currentMajor = 1
historyEntries.forEach(entry => {
  const release = entry.displayParts.find(part => part.version)
  if (release) currentMajor = Number(release.version.split('.')[0].slice(1))
  historyStages.find(stage => stage.major === currentMajor).entries.push(entry)
})
