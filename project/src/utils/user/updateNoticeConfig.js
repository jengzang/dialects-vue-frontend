export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '👀',
            strong: '優化用戶體驗(首頁、導航欄)',
            text: '首頁增加燈箱展示網站圖片，導航欄圖標與動畫優化，字體優化'
        },
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
    ]
  return {
    version: 'v5.0.5',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-08-08',
    title: t('home.updateNotice.title'),
    items
  }
}
