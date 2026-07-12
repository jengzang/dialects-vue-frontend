<template>
  <SimpleLayout />

  <RateLimitNotice />
  <GlobalToast />
  <GlobalConfirm />
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

import SimpleLayout from '../../layouts/SimpleLayout.vue'
import GlobalToast from '../../components/ToastAndHelp/GlobalToast.vue'
import GlobalConfirm from '../../components/ToastAndHelp/GlobalConfirm.vue'
import RateLimitNotice from '../../components/ToastAndHelp/RateLimitNotice.vue'
import { initOnlineTimeTracker, stopOnlineTimeTracker } from '../../utils/user/onlineTimeTracker.js'
import { getToken, initUserByToken } from '../../api/auth/auth.js'

onMounted(async () => {
  await initUserByToken()

  if (getToken()) {
    initOnlineTimeTracker()
  }
})

onBeforeUnmount(() => {
  stopOnlineTimeTracker()
})
</script>
