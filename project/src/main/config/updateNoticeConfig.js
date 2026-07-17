export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '🏠',
            strong: '更新廣東省自然村機器學習數據',
            text: '重新劃分語義的類別，並優化各種聚類、特徵分析功能'
        },
        {
            icon: '👀',
            strong: '優化用戶體驗',
            text: '導航欄支持橫向滾動，增加主題色切換（藍色、綠色、淺色、深色）'
        },
        {
            icon: '📊',
            strong: '更新數據並增加文白讀展示',
            text: '文讀、白讀、多音字分別用不同的顏色展示，點擊也可以查看詳情'
        },


    ]
  return {
    version: 'v4.6.8',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-07-15',
    title: t('home.updateNotice.title'),
    items
  }
}
