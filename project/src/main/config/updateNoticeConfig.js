export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '🏠',
            strong: '更新廣東省自然村機器學習數據',
            text: '重新劃分語義的類別，並優化各種聚類、特徵分析功能'
        },
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


    ]
  return {
    version: 'v4.6.5',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-07-13',
    title: t('home.updateNotice.title'),
    items
  }
}
