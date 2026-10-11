import '../../env-config.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '../../styles/villagesml-entry.scss'
import i18n from '../../i18n'
import { initSeo } from '../../seo'
import { initializeUiPreferences } from '../../composables/core/uiPreferences.js'
import { initializeScrollbarHover } from '../../utils/ui/scrollbarHover.js'

const app = createApp(App)

initializeUiPreferences()
const disposeScrollbarHover = initializeScrollbarHover()
if (import.meta.hot) import.meta.hot.dispose(disposeScrollbarHover)

app.use(router)
app.use(i18n)
initSeo({ router, i18n })

app.mount('#app')
