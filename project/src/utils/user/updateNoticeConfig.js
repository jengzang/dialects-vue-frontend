export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '👀',
            strong: '音節統計、熱力圖、等值線圖',
            text: '音節統計增加完整音節統計，並可繪製音節總數等值線圖，地圖-分區圖增加熱力圖，地點詳情彈窗可以直接跳轉查看音系、演化、音節統計等。'
        },
        {
            icon: '🎲',
            strong: '教程完善與優化用戶體驗',
            text: '各個頁面均配備教程指引用戶操作，並且教程簡單校對過一遍了，不再是毫無價值的AI文章了。'
        },
        {
            icon: '📖',
            strong: '增加詞表展示、貢獻功能',
            text: '支持地圖、卡片、表格展示詞表；用戶可以申請編輯權限，參與詞表貢獻，支持線上更改'
        },
    ]
  return {
    version: 'v5.1.0',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-08-13',
    title: t('home.updateNotice.title'),
    items
  }
}
