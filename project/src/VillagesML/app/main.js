import '../../env-config.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '../../styles/villagesml-entry.scss'
import '../../utils/message.js'
import i18n from '../../i18n'
import { initSeo } from '../../seo'
import { initializeInterfaceMode } from '../../composables/core/uiPreferences.js'

const app = createApp(App)

initializeInterfaceMode()

app.use(router)
app.use(i18n)
initSeo({ router, i18n })

app.mount('#app')
