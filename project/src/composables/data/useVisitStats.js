import { ref } from 'vue'
import { getTodayVisits, getTotalVisits, getVisitHistory } from '@/api/logs/index.js'

const VISIT_STATS_TTL_MS = 60 * 1000
const VISIT_HISTORY_TTL_MS = 5 * 60 * 1000
const VISIT_HISTORY_WINDOW_DAYS = 60
const VISIT_HISTORY_LIMIT = 9999

const todayVisits = ref(0)
const totalVisits = ref(0)
const visitHistory = ref([])

const visitStatsLoaded = ref(false)
const visitHistoryLoaded = ref(false)
const loadingVisitStats = ref(false)
const loadingVisitHistory = ref(false)

let visitStatsFetchedAt = 0
let visitHistoryFetchedAt = 0
let visitStatsPromise = null
let visitHistoryPromise = null

function isFresh(fetchedAt, ttl) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

function getVisitHistoryParams() {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - VISIT_HISTORY_WINDOW_DAYS)

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
    limit: VISIT_HISTORY_LIMIT
  }
}

function normalizeVisitHistory(data) {
  const dateMap = new Map()

  data?.data?.forEach(item => {
    const date = item.date
    if (!dateMap.has(date)) {
      dateMap.set(date, 0)
    }
    dateMap.set(date, dateMap.get(date) + item.count)
  })

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

async function fetchVisitStats() {
  if (visitStatsPromise) {
    return visitStatsPromise
  }

  loadingVisitStats.value = true
  visitStatsPromise = (async () => {
    try {
      const [todayData, totalData] = await Promise.all([
        getTodayVisits(),
        getTotalVisits()
      ])

      todayVisits.value = todayData?.today_visits || 0
      totalVisits.value = totalData?.total_visits || 0
      visitStatsLoaded.value = true
      visitStatsFetchedAt = Date.now()

      return {
        todayVisits: todayVisits.value,
        totalVisits: totalVisits.value
      }
    } finally {
      loadingVisitStats.value = false
      visitStatsPromise = null
    }
  })()

  return visitStatsPromise
}

async function fetchVisitHistory() {
  if (visitHistoryPromise) {
    return visitHistoryPromise
  }

  loadingVisitHistory.value = true
  visitHistoryPromise = (async () => {
    try {
      const data = await getVisitHistory(getVisitHistoryParams())
      visitHistory.value = normalizeVisitHistory(data)
      visitHistoryLoaded.value = true
      visitHistoryFetchedAt = Date.now()
      return visitHistory.value
    } finally {
      loadingVisitHistory.value = false
      visitHistoryPromise = null
    }
  })()

  return visitHistoryPromise
}

export async function ensureVisitStats(options = {}) {
  const { force = false } = options
  if (!force && (visitStatsLoaded.value && isFresh(visitStatsFetchedAt, VISIT_STATS_TTL_MS))) {
    return {
      todayVisits: todayVisits.value,
      totalVisits: totalVisits.value
    }
  }

  return fetchVisitStats()
}

export async function ensureVisitHistory(options = {}) {
  const { force = false } = options
  if (!force && (visitHistoryLoaded.value && isFresh(visitHistoryFetchedAt, VISIT_HISTORY_TTL_MS))) {
    return visitHistory.value
  }

  return fetchVisitHistory()
}

export function useVisitStats() {
  return {
    todayVisits,
    totalVisits,
    visitHistory,
    visitStatsLoaded,
    visitHistoryLoaded,
    loadingVisitStats,
    loadingVisitHistory,
    ensureVisitStats,
    ensureVisitHistory
  }
}
