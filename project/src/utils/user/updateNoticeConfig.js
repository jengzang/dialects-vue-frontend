export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '📊',
            strong: '更新方言數據庫',
            text: '方言點數量增加至3126個，總條目933万條。'
        },
        {
            icon: '📚',
            strong: '同音字匯，查詢支持複製導出',
            text: '音系頁面增加同音字匯格式展示，地點詳情彈窗也可以直接查看同音字匯；查字、查中古、查音位、查調均支持複製、導出功能'
        },
        {
            icon: '👀',
            strong: '優化用戶體驗',
            text: '增加頁腳導航欄、建議反饋入口、網站功能檢索、快速分享等。'
        },
    ]
  return {
    version: 'v5.1.5',
    dbVersion: '2026-09-07',
    lastUpdateDate: '2026-09-07',
    title: t('home.updateNotice.title'),
    items
  }
}
