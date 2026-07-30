export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '📖',
            strong: '增加詞表展示、貢獻功能',
            text: '支持地圖、卡片、表格展示詞表；用戶可以申請編輯權限，參與詞表貢獻，支持線上更改'
        },
        {
            icon: '🗺️',
            strong: '泰森多邊形繪圖完善',
            text: '支持豐富的篩選、合併、排除等規則，泰森多邊形外邊界支持滑塊選擇範圍；可直接從廣東省自然村頁面導出方言數據到泰森多邊形進行繪圖'
        },
        {
            icon: '👀',
            strong: '優化用戶體驗',
            text: '導航欄支持橫向滾動，增加主題色切換（藍色、綠色、淺色、深色）'
        },
    ]
  return {
    version: 'v5.0.0',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-07-31',
    title: t('home.updateNotice.title'),
    items
  }
}
