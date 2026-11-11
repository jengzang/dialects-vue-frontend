import '../../env-config.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '../../styles/villagesml-entry.scss'
import i18n, { loadLocaleMessages } from '../../i18n'
import { initSeo } from '../../seo'
import { initializeUiPreferences } from '../../composables/core/uiPreferences.js'
import { initializeScrollbarHover } from '../../utils/ui/scrollbarHover.js'

await loadLocaleMessages(i18n.global.locale.value)
const app = createApp(App)

initializeUiPreferences()
const disposeScrollbarHover = initializeScrollbarHover()
if (import.meta.hot) import.meta.hot.dispose(disposeScrollbarHover)

app.use(router)
app.use(i18n)
initSeo({ router, i18n })

app.mount('#app')
