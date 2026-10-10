import { describe, expect, it } from 'vitest'
import { resolveTutorialDocument } from '../src/main/components/tutorial/tutorialMarkdown.js'

describe('GIS Simplified Chinese tutorial', () => {
  it('renders the existing tutorial entry with operational coverage', () => {
    const doc = resolveTutorialDocument('menu-map-draw', 'zh-CN')
    expect(doc.title).toBe('地图绘制')
    expect(doc.summary).toContain('文字标注')
    const host = document.createElement('div')
    host.innerHTML = doc.html
    const headings = [...host.querySelectorAll('h2')].map((heading) => heading.textContent)
    for (const heading of [
      '创建和管理图层', '绘制点、线和面', '选择对象与批量操作',
      '编辑顶点与精确坐标', '吸附与共享边界', '几何工具',
      '几何质量检查与修复', '样式、属性与数据表', '文字标注',
      '导入地图数据', '用泰森多边形制作方言分布图',
      '导出 GeoJSON', '导出 PNG 图片', '本地草稿与自动恢复',
      '视图与快捷键', '常见问题',
    ]) expect(headings).toContain(heading)
    expect(host.querySelector('pre code.language-csv')?.textContent).toContain('名称,经度,纬度')
    expect(host.querySelectorAll('ol').length).toBeGreaterThan(8)
    expect(host.querySelector('h1')).toBeNull()
    expect(doc.rawMarkdown).not.toContain('\uFFFD')
  })

  it('documents destructive operations, units and storage limitations', () => {
    const { rawMarkdown } = resolveTutorialDocument('menu-map-draw', 'zh-CN')
    for (const constraint of [
      '未登录时可以查看功能面板', '取消草图', '草图重做分支',
      '网格尺寸单位为经纬度的「度」', '缓冲距离（公里）',
      '替换主选中面', '每次最多 20 组',
      '不是云同步', '不保证「刷新永不丢失」',
      '计算边界不是已经证实的方言边界', '清空全部',
    ]) expect(rawMarkdown).toContain(constraint)
  })
})
