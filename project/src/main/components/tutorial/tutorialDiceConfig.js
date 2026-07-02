import { uiStore, zhongguInputMode } from '@/main/store/store.js'

function createLocation(locations = ['廣州'], regions = [], regionUsing = 'yindian') {
  return {
    locations,
    regions,
    regionUsing,
  }
}

// 從 keys + valueMap 計算 combinations（與 ZhongGuSelector 的 cross-product 邏輯一致）
function computeCombinations(keys, valueMap) {
  const validEntries = keys
    .map(key => ({ key, values: valueMap[key] }))
    .filter(e => e.values && e.values.length > 0)

  if (validEntries.length === 0) return []

  return validEntries.reduce((acc, entry) => {
    const next = []
    acc.forEach(path => {
      entry.values.forEach(val => {
        next.push(path + `[${val}]{${entry.key}}`)
      })
    })
    return next
  }, [''])
}

// 從 keys + valueMap 生成直接輸入文本（值鍵拼接，空格分隔）
function toDirectInputText(keys, valueMap) {
  const tokens = []
  for (const key of keys) {
    const values = valueMap[key] || []
    for (const val of values) {
      tokens.push(`${val}${key}`)
    }
  }
  return tokens.join(' ')
}

const presets_tab2 = [
  {
    card: '韻母',
    keys: ['攝'],
    values: { '攝': ['流', '深'] },
    loc: { locations: ['广州 梅縣 汕头'], regions: ['瓊崖'], regionUsing: 'yindian' }
  },
  {
    card: '聲母',
    keys: ['母'],
    values: { '母': ['精'] },
    loc: { locations: ['鬱林 北流'], regions: ['吳化','銅容'], regionUsing: 'yindian' }
  },
  {
    card: '聲調',
    keys: ['清濁','調'],
    values: { '清濁': ['次濁'] ,'調': ['上'] },
    loc: { locations: ['台山台城 新會會城 東莞橋頭'], regions: ['東江'], regionUsing: 'yindian' }
  },
  {
    card: '韻母',
    keys: ['攝', '等'],
    values: { '攝': ['蟹'], '等': ['一', '二', '三', '四'] },
    loc: { locations: ['南雄'], regions: ['韶州'], regionUsing: 'yindian' }
  },
  {
    card: '韻母',
    keys: ['攝'],
    values: { '攝': ['山'] },
    loc: { locations: ['博羅'], regions: ['四邑片'], regionUsing: 'map' }
  },
  {
    card: '聲母',
    keys: ['組', '等'],
    values: { '組': ['見'], '等': [ '二'] },
    loc: { locations: ['南京 鹽城 淮安 廬江'], regions: ['海泗'], regionUsing: 'yindian' }
  },
  {
    card: '韻母',
    keys: ['韻'],
    values: { '韻': ['豪'] },
    loc: { locations: ['銀川 天津 邢臺'], regions: ['魯中'], regionUsing: 'yindian' }
  },
  {
    card: '聲母',
    keys: ['組', '等'],
    values: { '組': ['知'], '等': [ '三'] },
    loc: { locations: ['髙安 修水'], regions: ['撫州'], regionUsing: 'yindian' }
  },
]

const presets_tab3 = [
  {
    card: '韻母',
    keys: ['攝'],
    tab3KeyInput: ['a'],
    loc: { locations: ['揭陽 饒平 永安 福州'], regions: ['莆仙'], regionUsing: 'yindian' }
  },
  {
    card: '聲母',
    keys: ['組'],
    tab3KeyInput: ['h'],
    loc: { locations: ['台山斗山墟 恩平 鶴山雅瑤 從化獅象'], regions: [''], regionUsing: 'yindian' }
  },
]

let diceIndex = 0

function createQueryTab2Payload() {
  const config = presets_tab2[diceIndex % presets_tab2.length]
  const valuesMap = {}
  if (config.values) {
    for (const k in config.values) {
      valuesMap[k] = [...config.values[k]]
    }
  }
  diceIndex++
  return {
    card: config.card,
    keys: [...config.keys],
    valuesMap,
    combinations: computeCombinations(config.keys, valuesMap),
    loc: createLocation(config.loc.locations, config.loc.regions, config.loc.regionUsing),
  }
}

function createQueryTab2DirectPayload() {
  const config = presets_tab2[diceIndex % presets_tab2.length]
  const valuesMap = {}
  if (config.values) {
    for (const k in config.values) {
      valuesMap[k] = [...config.values[k]]
    }
  }
  diceIndex++
  return {
    mode: 'direct',
    card: config.card,
    positionInput: toDirectInputText(config.keys, valuesMap),
    charInput: '',
    loc: createLocation(config.loc.locations, config.loc.regions, config.loc.regionUsing),
  }
}

function createQueryTab3Payload() {
  const config = presets_tab3[diceIndex % presets_tab3.length]
  diceIndex++
  return {
    card: config.card,
    keys: [...config.keys],
    isTab3: true,
    tab3InputValue: config.tab3KeyInput ? config.tab3KeyInput[0] : '',
    loc: createLocation(config.loc.locations, config.loc.regions, config.loc.regionUsing),
  }
}

function createCompareTab1Payload() {
  return {
    group1Char: '包',
    group2Char: '好',
    feature: '韻母',
    loc: createLocation(['台山'], ['珠江'], 'yindian'),
  }
}

function createCompareTab2Payload() {
  const current = {
    card: '韻母',
    keys: ['攝'],
    valueMap: { 攝: ['止'] },
    excludeColumns: [],
  }
  const group1Item = {
    card: '韻母',
    keys: ['攝'],
    valueMap: { 攝: ['宕'] },
    excludeColumns: [],
  }
  const group2Item = {
    card: '韻母',
    keys: ['攝'],
    valueMap: { 攝: ['江'] },
    excludeColumns: [],
  }
  return {
    current: {
      ...current,
      combinations: computeCombinations(current.keys, current.valueMap),
    },
    group1Items: [
      {
        ...group1Item,
        combinations: computeCombinations(group1Item.keys, group1Item.valueMap),
      },
    ],
    group2Items: [
      {
        ...group2Item,
        combinations: computeCombinations(group2Item.keys, group2Item.valueMap),
      },
    ],
    loc: createLocation(['南寧'], ['鬱潯'], 'yindian'),
  }
}

function createCompareTab2DirectPayload() {
  const current = {
    card: '韻母',
    keys: ['攝'],
    valueMap: { 攝: ['止'] },
    excludeColumns: [],
  }
  const group1Item = {
    card: '韻母',
    keys: ['攝'],
    valueMap: { 攝: ['宕'] },
    excludeColumns: [],
  }
  const group2Item = {
    card: '韻母',
    keys: ['攝'],
    valueMap: { 攝: ['江'] },
    excludeColumns: [],
  }
  return {
    mode: 'direct',
    current: {
      type: 'direct',
      card: current.card,
      pathStrings: computeCombinations(current.keys, current.valueMap),
      chars: '',
      excludeColumns: current.excludeColumns,
    },
    group1Items: [{
      type: 'direct',
      card: group1Item.card,
      pathStrings: computeCombinations(group1Item.keys, group1Item.valueMap),
      chars: '',
      excludeColumns: group1Item.excludeColumns,
    }],
    group2Items: [{
      type: 'direct',
      card: group2Item.card,
      pathStrings: computeCombinations(group2Item.keys, group2Item.valueMap),
      chars: '',
      excludeColumns: group2Item.excludeColumns,
    }],
    loc: createLocation(['南寧'], ['鬱潯'], 'yindian'),
  }
}

function createCompareTab4Payload() {
  return {
    selectedToneClasses: [1, 5],
    loc: createLocation(['廣州 東莞'], ['廣中'], 'yindian'),
  }
}

function shouldEnableCharacterDice() {
  return uiStore.currentSubTab.query === 'tab2' || uiStore.currentSubTab.query === 'tab3'
}

export const tutorialDiceConfig = {
  'menu-query-char': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.queryChar.title',
    descriptionKey: 'tutorial.assist.experience.queryChar.description',
    buttonKey: 'tutorial.assist.experience.queryChar.button',
    target: 'query:tab1',
    createPayload: () => ({
      chars: '发财',
      loc: createLocation(['南京'], ['杭州小片', '上海小片', '蘇嘉湖小片'], 'map'),
    }),
  },
  'menu-query-zhonggu': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.queryZhonggu.title',
    descriptionKey: 'tutorial.assist.experience.queryZhonggu.description',
    buttonKey: 'tutorial.assist.experience.queryZhonggu.button',
    target: 'query:tab2',
    when: shouldEnableCharacterDice,
    createPayload: () => {
      if (zhongguInputMode.value === 'direct') {
        return createQueryTab2DirectPayload()
      }
      return createQueryTab2Payload()
    },
  },
  'menu-query-yinwei': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.queryYinwei.title',
    descriptionKey: 'tutorial.assist.experience.queryYinwei.description',
    buttonKey: 'tutorial.assist.experience.queryYinwei.button',
    target: 'query:tab3',
    when: shouldEnableCharacterDice,
    createPayload: createQueryTab3Payload,
  },
  'menu-query-tone': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.queryTone.title',
    descriptionKey: 'tutorial.assist.experience.queryTone.description',
    buttonKey: 'tutorial.assist.experience.queryTone.button',
    target: 'query:tab4',
    createPayload: () => ({
      loc: createLocation(['南京'], ['吳語'], 'map'),
    }),
  },
  'menu-compare-char': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.compareChar.title',
    descriptionKey: 'tutorial.assist.experience.compareChar.description',
    buttonKey: 'tutorial.assist.experience.compareChar.button',
    target: 'compare:tab1',
    createPayload: createCompareTab1Payload,
  },
  'menu-compare-zhonggu': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.compareZhonggu.title',
    descriptionKey: 'tutorial.assist.experience.compareZhonggu.description',
    buttonKey: 'tutorial.assist.experience.compareZhonggu.button',
    target: 'compare:tab2',
    createPayload: () => {
      if (zhongguInputMode.value === 'direct') {
        return createCompareTab2DirectPayload()
      }
      return createCompareTab2Payload()
    },
  },
  'menu-compare-tone': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.compareTone.title',
    descriptionKey: 'tutorial.assist.experience.compareTone.description',
    buttonKey: 'tutorial.assist.experience.compareTone.button',
    target: 'compare:tab4',
    createPayload: createCompareTab4Payload,
  },
}
