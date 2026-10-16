export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '🗂️',
            strong: '增加查注釋功能',
            text: '支持通過注釋或音標檢索字表'
        },
        {   
            icon: '📖',
            strong: '詞表展示優化、支持導出',
            text: '增加詞表方言點詳情展示（包含調值、行政區劃等信息），支持導出詞表為Excel文件，方便用戶在線編輯後與本地同步。'
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
