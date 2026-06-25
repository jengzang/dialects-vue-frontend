import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useRouteQueryState(key, options = {}) {
  const {
    defaultValue = null,
    parse = (value) => value,
    serialize = (value) => value,
    replace = false,
    removeIf = (value) => value === null || value === undefined || value === '',
  } = options

  const route = useRoute()
  const router = useRouter()

  function normalizeFromRoute(value) {
    // 统一把 undefined / 空串 / parse 后无效值折叠回默认值，减少页面分支判断。
    if (value === undefined || value === null || value === '') {
      return defaultValue
    }

    const parsedValue = parse(value)
    if (parsedValue === undefined || parsedValue === null || parsedValue === '') {
      return defaultValue
    }

    return parsedValue
  }

  const state = ref(normalizeFromRoute(route.query[key]))

  watch(() => route.query[key], (value) => {
    const nextValue = normalizeFromRoute(value)
    // 只在 query 真正变化时同步本地状态，避免路由更新引起的无效回写。
    if (state.value !== nextValue) {
      state.value = nextValue
    }
  })

  function applyToQuery(nextQuery, value) {
    const serialized = serialize(value)

    if (removeIf(serialized)) {
      delete nextQuery[key]
    } else {
      nextQuery[key] = serialized
    }

    state.value = value
    return nextQuery
  }

  async function set(value) {
    const nextQuery = { ...route.query }

    applyToQuery(nextQuery, value)

    const navigation = {
      query: nextQuery,
    }

    if (replace) {
      // replace 常用于 tab/filter 同步，避免把每次内部切换都塞进浏览器历史。
      await router.replace(navigation)
      return
    }

    await router.push(navigation)
  }

  return {
    state,
    set,
    applyToQuery,
  }
}