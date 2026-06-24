export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '📊',
            strong: '更新數據並增加文白讀展示',
            text: '文讀、白讀、多音字分別用不同的顏色展示，點擊也可以查看詳情'
        },
        {
            icon: '🔢',
            strong: '優化“查音位”、“音值統計”頁面',
            text: '“查音位”支持匹配音節；“音值統計”頁面增加餅圖、柱狀圖、散點圖等'
        },
        {
            icon: '🆚',
            strong: '增加音值比較功能',
            text: '新增桑基圖可視化，支持多方言間的音值對比呈現'
        },

    ]
  return {
    version: 'v4.5.2',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-06-24',
    title: t('home.updateNotice.title'),
    items
  }
}
