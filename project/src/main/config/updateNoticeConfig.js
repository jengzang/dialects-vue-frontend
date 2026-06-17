export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '📊',
            strong: '增加音值比較功能',
            text: '新增桑基圖可視化，支持多方言間的音值對比呈現'
        },
        {
            icon: '🗺️',
            strong: '新增地圖繪製功能',
            text: '支持手動繪製點、線、面等圖層，也可根據泰森多邊形自動計算方言分布圖，並支持導出圖層、圖片等功能（功能測試中）'
        },
        {
            icon: '👤',
            strong: '優化用戶自定義數據頁面',
            text: '優化「地圖 -> 自定義」用戶個人數據創建於展示'
        }
    ]
  return {
    version: 'v4.4.8',
    lastUpdateDate: '2026-06-15',
    title: '🎊 ' + t('home.updateNotice.title'),
    items
  }
}
