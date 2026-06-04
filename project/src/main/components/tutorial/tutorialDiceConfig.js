import { uiStore } from '@/main/store/store.js'

function createLocation(locations = ['廣州'], regions = [], regionUsing = 'yindian') {
  return {
    locations,
    regions,
    regionUsing,
  }
}

function createQueryTab2Payload() {
  return {
    card: '韻母',
    keys: ['攝'],
    valuesMap: {
      攝: ['通攝'],
    },
    loc: createLocation(['廣州'], ['廣府片'], 'yindian'),
  }
}

function createQueryTab3Payload() {
  return {
    card: '聲母',
    keys: ['清濁'],
    tab3InputValue: 'p',
    isTab3: true,
    loc: createLocation(['廣州'], ['廣府片'], 'yindian'),
  }
}

function createCompareTab1Payload() {
  return {
    group1Char: '天',
    group2Char: '地',
    feature: '聲母',
    loc: createLocation(['廣州'], ['廣府片'], 'yindian'),
  }
}

function createCompareTab2Payload() {
  return {
    current: {
      card: '韻母',
      keys: ['攝'],
      valueMap: {
        攝: ['止攝'],
      },
      excludeColumns: [],
    },
    group1Items: [
      {
        card: '韻母',
        keys: ['攝'],
        valueMap: {
          攝: ['止攝'],
        },
        excludeColumns: [],
      },
    ],
    group2Items: [
      {
        card: '韻母',
        keys: ['攝'],
        valueMap: {
          攝: ['遇攝'],
        },
        excludeColumns: [],
      },
    ],
    loc: createLocation(['廣州'], ['廣府片'], 'yindian'),
  }
}

function createCompareTab4Payload() {
  return {
    selectedToneClasses: [1, 3],
    loc: createLocation(['廣州'], ['廣府片'], 'yindian'),
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
      chars: '天地方言',
      loc: createLocation(['廣州'], ['廣府片'], 'yindian'),
    }),
  },
  'menu-query-zhonggu': {
    enabled: true,
    titleKey: 'tutorial.assist.experience.queryZhonggu.title',
    descriptionKey: 'tutorial.assist.experience.queryZhonggu.description',
    buttonKey: 'tutorial.assist.experience.queryZhonggu.button',
    target: 'query:tab2',
    when: shouldEnableCharacterDice,
    createPayload: createQueryTab2Payload,
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
    createPayload: createCompareTab2Payload,
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
