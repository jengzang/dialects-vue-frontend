export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '📊',
            strong: '增加音值比較功能',
            text: '新增桑基圖可視化，支持多方言間的音值對比呈現'
        },
        {
            icon: '👤',
            strong: '優化用戶個人資訊頁面',
            text: '全新升級個人中心，新增用戶頭像自定义與展示功能'
        },
        {
            icon: '🗺️',
            strong: '優化用戶自定義數據頁面',
            text: '優化「地圖 -> 自定義」用戶個人數據創建於展示'
        }
    ]
  return {
    version: 'v4.4.7',
    lastUpdateDate: '2026-06-09',
    title: '🎊 ' + t('home.updateNotice.title'),
    items
  }
}
