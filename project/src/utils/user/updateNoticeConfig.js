export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '👀',
            strong: '完善網站簡介、開發歷程等',
            text: '詳細介紹網站的功能、發展曆史等，方便新用戶快速了解『方音圖鑑』。'
        },
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
    ]
  return {
    version: 'v5.2.3',
    dbVersion: '2026-09-30',
    lastUpdateDate: '2026-10-24',
    title: t('home.updateNotice.title'),
    items
  }
}
