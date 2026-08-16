import { computed } from 'vue'
import { useStorageState } from '@/composables/core/useStorageState.js'
import { createSingleFlight } from '@/composables/core/singleFlight.js'
import { getCustomCounts } from '@/api'
import { userStore } from '@/main/store/store.js'

const CUSTOM_DATA_EXISTS_KEY = 'custom-data-exists'
const CUSTOM_DATA_EXISTS_TTL = 24 * 60 * 60 * 1000

const {
  state: customDataExistsState,
  write: writeCustomDataExistsState,
  remove: removeCustomDataExistsState,
  read: readCustomDataExistsState,
} = useStorageState(CUSTOM_DATA_EXISTS_KEY, {
  defaultValue: null,
  ttl: CUSTOM_DATA_EXISTS_TTL,
})

const singleFlight = createSingleFlight()

export const hasKnownCustomData = computed(() => customDataExistsState.value === true)
export const customDataPresenceKnown = computed(() => customDataExistsState.value !== null)

export function markCustomDataExists(value = true) {
  writeCustomDataExistsState(Boolean(value))
}

export function invalidateCustomDataPresence() {
  removeCustomDataExistsState()
  singleFlight.reset()
}

export function syncCustomDataPresenceFromCounts(counts) {
  const total = Number(counts?.custom_data_total || 0)
  const hasData = total > 0
  writeCustomDataExistsState(hasData)
  return hasData
}

export async function ensureCustomDataPresence(options = {}) {
  const { force = false } = options

  if (!userStore.isAuthenticated) {
    return false
  }

  const cachedValue = force ? null : readCustomDataExistsState()
  if (cachedValue === true || cachedValue === false) {
    return cachedValue
  }

  if (force) {
    singleFlight.reset()
  }

  return singleFlight(async () => {
    try {
      const response = await getCustomCounts()
      if (response?.success === true) {
        return syncCustomDataPresenceFromCounts(response)
      }
      writeCustomDataExistsState(false)
      return false
    } catch (error) {
      removeCustomDataExistsState()
      throw error
    }
  })
}
