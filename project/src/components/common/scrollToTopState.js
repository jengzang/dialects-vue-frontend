import { ref } from 'vue'

// ScrollToTop 全局单例状态：后挂载的实例自动接管，卸载时恢复前一个
export const instanceStack = ref([])
let nextId = 0

export function registerInstance() {
  const uid = ++nextId
  instanceStack.value = [...instanceStack.value, uid]
  return uid
}

export function unregisterInstance(uid) {
  instanceStack.value = instanceStack.value.filter(id => id !== uid)
}

export function isTopOfStack(uid) {
  if (uid == null) return false
  const stack = instanceStack.value
  return stack.length > 0 && stack[stack.length - 1] === uid
}
