export function getHomeUpdateNotice(t) {
    const items = [
        {
            icon: '🗺️',
            strong: '地圖渲染速度加快',
            text: '優化渲染大量點的performance，減少卡頓的情況'
        },
        {
            icon: '👀',
            strong: '增加背景圖和主題切換；完善開發歷程等',
            text: '支持藍、綠、紅三種主題色，和日間、夜間、系統三種模式切換。詳細介紹網站的功能、發展曆史等，方便新用戶快速了解『方音圖鑑』。'
        },
        {   
            icon: '📖',
            strong: '詞表展示搜索樣式優化',
            text: '支持記住上次查詢選擇的地點；大幅重構頁面，並支持按照音典分區、地圖集分區篩選。'
        },
    ]
  return {
    version: 'v5.2.7',
    dbVersion: '2026-09-30',
    lastUpdateDate: '2026-11-02',
    title: t('home.updateNotice.title'),
    items
  }
}
