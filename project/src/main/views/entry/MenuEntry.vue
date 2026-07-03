<template>
  <div aria-hidden="true" style="display: none"></div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveLegacyMenuRoute } from '@/main/router/legacyRouteMap.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const route = useRoute()
const router = useRouter()

watch(
  () => route.fullPath,
  async () => {
    const currentLocale = resolveRouteLocale(route)
    const legacyTarget = resolveLegacyMenuRoute(route.query)
    if (legacyTarget) {
      await router.replace({
        path: buildLocalePath(currentLocale, legacyTarget.path),
        query: legacyTarget.query,
        hash: route.hash
      })
      return
    }

    if (route.path.endsWith('/menu')) {
      await router.replace({
        path: buildLocalePath(currentLocale, '/menu/query/zhonggu'),
        hash: route.hash,
      })
    }
  },
  { immediate: true }
)
</script>
