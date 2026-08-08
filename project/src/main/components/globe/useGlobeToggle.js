import { ref, watch } from 'vue'

const STORAGE_KEY = 'globe-mode'
const DEFAULT_MODE = 'globegl'

const mode = ref(
  typeof localStorage !== 'undefined'
    ? (localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE)
    : DEFAULT_MODE
)

watch(mode, (val) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, val)
  }
})

export function useGlobeToggle() {
  function toggle() {
    mode.value = mode.value === 'globegl' ? 'cobe' : 'globegl'
  }

  return { mode, toggle }
}
