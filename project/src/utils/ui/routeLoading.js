import { ref } from 'vue'

export const isRouteLoading = ref(false)

let hideTimer = null

export function showRouteLoading() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  isRouteLoading.value = true
}

export function hideRouteLoading() {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  hideTimer = setTimeout(() => {
    isRouteLoading.value = false
    hideTimer = null
  }, 120)
}
