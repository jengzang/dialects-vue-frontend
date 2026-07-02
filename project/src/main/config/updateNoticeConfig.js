export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '⌨️',
            strong: '中古模式支持手動輸入',
            text: '可以在設置頁面中啟用“手動輸入”功能，然後在中古模式下直接輸入地位或漢字集合'
        },
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

    ]
  return {
    version: 'v4.6.0',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-07-02',
    title: t('home.updateNotice.title'),
    items
  }
}
