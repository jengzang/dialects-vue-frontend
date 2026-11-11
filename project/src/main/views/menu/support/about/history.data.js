import zhCnAbout from '../../../../../i18n/locales/zh-CN/about.json'

const historyContent = zhCnAbout.history
const importantDates = new Set(Object.keys(historyContent.importanceReasons))

export const historyEntries = Object.keys(historyContent.entries).map(key => {
  const date = key.replaceAll('_', '.')

  return {
    date,
    important: importantDates.has(key),
    dateTime: date.split('.').map((part, index) => index === 0 ? part : part.padStart(2, '0')).join('-')
  }
})

export const historyStages = [1, 2, 3, 4, 5].map(major => ({ major, entries: [] }))
