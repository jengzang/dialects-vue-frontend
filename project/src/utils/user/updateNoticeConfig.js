export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '🎲',
            strong: '教程完善',
            text: '各個頁面均配備教程指引用戶操作，並且教程簡單校對過一遍了，不再是毫無價值的AI文章了。'
        },
        {
            icon: '👀',
            strong: '優化用戶體驗(首頁、導航欄)',
            text: '首頁增加地球和燈箱展示網站圖片，導航欄圖標與動畫優化，字體優化'
        },
        {
            icon: '📖',
            strong: '增加詞表展示、貢獻功能',
            text: '支持地圖、卡片、表格展示詞表；用戶可以申請編輯權限，參與詞表貢獻，支持線上更改'
        },
    ]
  return {
    version: 'v5.0.8',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-08-09',
    title: t('home.updateNotice.title'),
    items
  }
}
