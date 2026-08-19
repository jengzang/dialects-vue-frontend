export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '📚',
            strong: '同音字匯，查詢支持複製導出',
            text: '音系頁面增加同音字匯格式展示，地點詳情彈窗也可以直接查看同音字匯；查字、查中古、查音位、查調均支持複製、導出功能'
        },
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
    ]
  return {
    version: 'v5.1.2',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-08-17',
    title: t('home.updateNotice.title'),
    items
  }
}
