// Menu configuration for navigation system
// Supports two-level navigation: direct links and expandable submenus

export const menuConfig = {
  // Special: Return to query (only in SimpleSidebar)
  'query': {
    label: '查詢',
    icon: '🔍️',
    path: '/menu?tab=query',
    children: [
      {
        label: '查字',
        icon: '🔣', // 用这个比书本更像“工具”，或者用 📖
        path: '/menu?tab=query&sub=tab1'
      },
      {
        label: '查中古',
        icon: '📜', // 卷轴绝对是中古音韵的最佳代表
        path: '/menu?tab=query&sub=tab2'
      },
      {
        label: '查音位',
        icon: '🗣️', // 强调“口语/发音”
        path:'/menu?tab=query&sub=tab3'
      },
      {
        label: '查调',
        icon: '🎼', // 乐谱，比普通音符更具系统性，代表“平上去入”的音阶
        path:'/menu?tab=query&sub=tab4'
      },
    ],
    showIn: ['none'] // 只在 SimpleSidebar 中顯示
  },
  // Level 1: External link to old website
  'old-site': {
    label: '舊版網站',
    icon: '🕰️',
    path: '/detail', // Will be set dynamically using window.WEB_BASE
    external: true,
    children: null,
    // showIn: ['NavBar']
  },


  // Level 2: Expandable data submenu
  'data': {
    label: '音系',
    icon: '🧬',
    path: '/menu?tab=pho',
    children: [
      {
        label: '音系查詢',
        icon: '⚛️',
        path: '/explore?page=phonologyMatrix'
      },
      {
        label: '音素分類',
        icon: '📐',
        path: '/explore?page=phonologyCustom'
      },
      {
        label: '音節統計',
        icon: '🧮',
        path: '/explore?page=Countphos'
      },
      {
        label: '中古地位',
        icon: '✍️',
        path: '/explore?page=ZhongGu'
      },
    ],
    showIn: ['SimpleSidebar']
  },

  // Level 2: Expandable data submenu
  'words': {
    label: '詞句',
    icon: '📖',
    path: '/menu?tab=words',
    children: [
      {
        label: '語保詞彙',
        icon: '📖',
        path: '/explore?page=YuBao&sub=vocabulary'
      },
      {
        label: '語保語法',
        icon: '🗣️',
        path: '/explore?page=YuBao&sub=grammar'
      },
      {
        label: '陽春口語詞',
        icon: '💬',
        path: '/explore?page=ycSpoken'
      },
    ],
    showIn: ['SimpleSidebar']
  },

  // Level 2: Expandable villages submenu
  'villages': {
    label: '自然村',
    icon: '🏘️',
    path: '/menu?tab=villages',
    children: [
      {
        label: '廣東自然村',
        icon: '🏘️',
        path: '/explore?page=gdVillages'
      },
      {
        label: '機器學習',
        icon: '🤖',
        path: '/explore?page=VillagesML'
      },
      {
        label: '全粵村情表格',
        icon: '📈',
        path: '/explore?page=gdVillagesTable'
      },
      {
        label: '陽春自然村',
        icon: '🏠',
        path: '/explore?page=ycVillages'
      }
    ],
    showIn: ['SimpleSidebar']
  },
// Level 2: Expandable tools submenu
'tools': {
  label: '工具',
      icon: '🧰',
      path: '/menu?tab=tools',
      children: [
    {
      label: '字表工具',
      icon: '📝',
      path: '/explore?page=check'
    },
    {
      label: '粵拼轉IPA',
      icon: '🔤',
      path: '/explore?page=jyut2ipa'
    },
    {
      label: '字表合併',
      icon: '🔗',
      path: '/explore?page=merge'
    },
    {
      label: '聲學分析',
      icon: '👂️️',
      path: '/explore?page=praat'
    }
  ],
  showIn: ['SimpleSidebar']
},
  'check':{
    label: '字表工具',
    icon: '📝',
    path: '/explore?page=check',
    children: null,
    showIn: ['NavBar']
  },
  'jyut2ipa':{
    label: '粵拼轉IPA',
    icon: '🔤',
    path: '/explore?page=jyut2ipa',
    children: null,
    showIn: ['NavBar']
  },
  'merge':{
    label: '字表合併',
    icon: '🔗',
    path: '/explore?page=merge',
    children: null,
    showIn: ['NavBar']
  },
  'praat': {
    label: '聲學分析',
    icon: '👂️️',
    path: '/explore?page=praat',
    children: null,
    showIn: ['NavBar']
  },
  // Level 1: Direct navigation to Source page
  'source': {
    label: '資料源',
    icon: '📚',
    path: '/menu?tab=source',
    children:[
      {
        label: '字表來源',
        icon: '📝',
        path: '/menu?tab=source'
      },
      {
        label: '隱私政策',
        icon: '🔒',
        path: '/menu?tab=privacy'
      },
      {
        label: '提出建議',
        icon: '💬',
        path: '/menu?tab=about&sub=suggestion'
      },
      {
        label: '喜歡作者',
        icon: '❤️',
        path: '/menu?tab=about&sub=like'
      }
    ]
  },
  'about': {
    label: '關於網站',
    icon: '🌐️',
    path: '/menu?tab=about&sub=intro',
    children: null
  },
  'about_ontop': {
    label: '關於網站',
    icon: '🌐️',
    path: '/menu?tab=about&sub=intro',
    children:[
      {
        label: '簡介',
        icon: 'ℹ️',
        path: '/menu?tab=about&sub=intro'
      },
      {
        label: '感悟',
        icon: '🙏',
        path: '/menu?tab=about&sub=reflection'
      },
      {
        label: '提出建議',
        icon: '💬',
        path: '/menu?tab=about&sub=suggestion'
      },
      {
        label: '喜歡作者',
        icon: '❤️',
        path: '/menu?tab=about&sub=like'
      }
    ],
    showIn:['none']
  },

}
