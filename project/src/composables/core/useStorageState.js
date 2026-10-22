import { ref, watch } from 'vue'
import { getPlatformStorage } from '@/platform/index.js'

function getStorage(storageType) {
  return getPlatformStorage(storageType)
}

export function useStorageState(key, options = {}) {
  const {
    defaultValue,
    storage = 'local',
    ttl = null,
    deep = true,
    serializer = JSON,
  } = options

  const storageApi = getStorage(storage)
  const state = ref(defaultValue)

  function cloneDefault() {
    // 默认值如果是对象/数组，要拷贝一份，避免多个调用方共享同一引用。
    if (defaultValue === null || defaultValue === undefined) {
      return defaultValue
    }

    if (typeof structuredClone === 'function') {
      return structuredClone(defaultValue)
    }

    return serializer.parse(serializer.stringify(defaultValue))
  }

  function read() {
    if (!storageApi) {
      state.value = cloneDefault()
      return state.value
    }

    try {
      const raw = storageApi.getItem(key)
      if (!raw) {
        state.value = cloneDefault()
        return state.value
      }

      const payload = serializer.parse(raw)

      if (ttl && payload?.expiresAt && payload.expiresAt < Date.now()) {
        // 过期数据直接清掉，调用方读到的始终是“可继续使用”的值。
        storageApi.removeItem(key)
        state.value = cloneDefault()
        return state.value
      }

      state.value = ttl ? payload.value : payload
      return state.value
    } catch {
      storageApi?.removeItem(key)
      state.value = cloneDefault()
      return state.value
    }
  }

  function write(value) {
    state.value = value

    if (!storageApi) {
      return
    }

    const payload = ttl
      ? {
          value,
          expiresAt: Date.now() + ttl,
        }
      : value

    storageApi.setItem(key, serializer.stringify(payload))
  }

  function remove() {
    storageApi?.removeItem(key)
    state.value = cloneDefault()
  }

  // 初始化时先做一次同步读取，这样页面创建后即可拿到缓存值。
  read()

  watch(state, (value) => {
    if (!storageApi) {
      return
    }

    const payload = ttl
      ? {
          value,
          expiresAt: Date.now() + ttl,
        }
      : value

    storageApi.setItem(key, serializer.stringify(payload))
  }, { deep })

  return {
    state,
    read,
    write,
    remove,
  }
}
