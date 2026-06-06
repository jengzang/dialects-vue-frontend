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
            text: '優化「地圖 -> 自定義」數據配置流程（目前功能仍在測試階段）'
        }
    ]
  return {
    version: 'v4.4.6',
    lastUpdateDate: '2026-06-07',
    title: '🎊 ' + t('home.updateNotice.title'),
    items
  }
}
