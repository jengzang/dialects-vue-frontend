export function getHomeUpdateNotice(t) {
    const items = [
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
        {
            icon: '📊',
            strong: '更新數據並增加文白讀展示',
            text: '文讀、白讀、多音字分別用不同的顏色展示，點擊也可以查看詳情'
        },


    ]
  return {
    version: 'v4.7.0',
    dbVersion: '2026-06-22',
    lastUpdateDate: '2026-07-18',
    title: t('home.updateNotice.title'),
    items
  }
}
