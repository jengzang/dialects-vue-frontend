import { ref, computed } from 'vue'
import { getCustomRegions } from '@/api'
import { useStorageState } from '@/composables/core/useStorageState.js'

// 自定义分区缓存 Store
const customRegions = ref([])
const loading = ref(false)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // localStorage 缓存 7 天
const CUSTOM_REGIONS_STORAGE_KEY = 'customRegions'
const customRegionsStorage = useStorageState(CUSTOM_REGIONS_STORAGE_KEY, {
  defaultValue: [],
  ttl: CACHE_DURATION,
  serializer: {
    parse(raw) {
      const parsed = JSON.parse(raw)

      if (
        parsed &&
        !Object.prototype.hasOwnProperty.call(parsed, 'value') &&
        Array.isArray(parsed.data) &&
        typeof parsed.timestamp === 'number'
      ) {
        return {
          value: parsed.data,
          expiresAt: parsed.timestamp + CACHE_DURATION
        }
      }

      return parsed
    },
    stringify(value) {
      return JSON.stringify(value)
    }
  }
})

export const customRegionStore = () => {
  // 获取自定义分区（带缓存）
  const fetchCustomRegions = async (regionName = null, forceRefresh = false) => {
    console.log('🔍 fetchCustomRegions 调用:', { regionName, forceRefresh, memoryLength: customRegions.value.length })

    // 如果是获取单个分区详情，不使用缓存
    if (regionName) {
      console.log('📦 获取单个分区详情，不使用缓存')
      loading.value = true
      try {
        return await getCustomRegions(regionName)
      } finally {
        loading.value = false
      }
    }

    // 如果不是强制刷新，先检查内存缓存
    if (!forceRefresh && customRegions.value.length > 0) {
      console.log('✅ 使用内存缓存')
      return { success: true, regions: customRegions.value }
    }

    // 如果内存没有，尝试从 localStorage 恢复
    if (!forceRefresh) {
      console.log('🔄 尝试从 localStorage 恢复...')
      const restored = restoreFromLocalStorage()
      if (restored) {
        console.log('✅ 从 localStorage 恢复成功，数量:', customRegions.value.length)
        return { success: true, regions: customRegions.value }
      } else {
        console.log('❌ localStorage 没有有效缓存')
      }
    }

    // 如果正在加载，等待加载完成
    if (loading.value) {
      console.log('⏳ 正在加载中，等待...')
      return new Promise((resolve) => {
        const checkLoading = setInterval(() => {
          if (!loading.value) {
            clearInterval(checkLoading)
            resolve({ success: true, regions: customRegions.value })
          }
        }, 100)
      })
    }

    // 发起请求
    console.log('🌐 发起 API 请求...')
    loading.value = true
    try {
      const data = await getCustomRegions()
      customRegions.value = data.regions || []

      console.log('✅ API 请求成功，数量:', customRegions.value.length)

      // 存入 localStorage（7天有效）
      customRegionsStorage.write(customRegions.value)

      console.log('💾 已保存到 localStorage')

      return data
    } finally {
      loading.value = false
    }
  }

  // 从 localStorage 恢复缓存
  const restoreFromLocalStorage = () => {
    try {
      const cached = localStorage.getItem(CUSTOM_REGIONS_STORAGE_KEY)
      console.log('📂 localStorage 内容:', cached ? '有数据' : '无数据')

      if (cached) {
        const restoredRegions = customRegionsStorage.read()
        const parsed = JSON.parse(cached)
        const timestamp = typeof parsed?.timestamp === 'number'
          ? parsed.timestamp
          : (typeof parsed?.expiresAt === 'number' ? parsed.expiresAt - CACHE_DURATION : Date.now())
        const age = Date.now() - timestamp
        const ageInMinutes = Math.floor(age / 1000 / 60)

        console.log('⏳ 缓存年龄:', ageInMinutes, '分钟')
        console.log('📳 缓存数据量:', restoredRegions?.length || 0)

        if (Array.isArray(restoredRegions)) {
          customRegions.value = restoredRegions
          console.log('✅ 缓存有效，已恢复')
          return true
        }
      }
    } catch (error) {
      console.error('❌ 恢复自定义分区缓存失败:', error)
      customRegionsStorage.remove()
    }
    return false
  }

  // 清除缓存（用户创建/修改/删除分区后调用）
  const invalidateCache = () => {
    console.log('🗑️ 清除缓存')
    customRegions.value = []
    customRegionsStorage.remove()
  }

  // 手动刷新（用户点击刷新按钮）
  const refresh = async () => {
    console.log('🔄 手动刷新：先删除旧缓存')
    // 先删除旧缓存
    invalidateCache()
    // 再请求新数据（会自动写入新缓存）
    console.log('🔄 手动刷新：请求新数据')
    return await fetchCustomRegions()
  }

  return {
    customRegions: computed(() => customRegions.value),
    loading: computed(() => loading.value),
    fetchCustomRegions,
    restoreFromLocalStorage,
    invalidateCache,
    refresh
  }
}
