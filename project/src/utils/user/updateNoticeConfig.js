export function getHomeUpdateNotice(t) {
    const items = [
        {   
            icon: '📖',
            strong: '詞表展示搜索樣式優化',
            text: '大幅重構頁面，並支持按照音典分區、地圖集分區篩選；增加詞表方言點詳情展示（包含調值、行政區劃等信息）。'
        },
        {
            icon: '🗂️',
            strong: '增加查注釋功能',
            text: '支持通過注釋或音標檢索字表'
        },
        {
            icon: '👀',
            strong: '優化用戶體驗',
            text: '增加頁腳導航欄、建議反饋入口、網站功能檢索、快速分享等。'
        },
    ]
  return {
    version: 'v5.2.1',
    dbVersion: '2026-09-30',
    lastUpdateDate: '2026-10-01',
    title: t('home.updateNotice.title'),
    items
  }
}
