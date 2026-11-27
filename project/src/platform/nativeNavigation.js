/**
 * Connects the Capacitor App back button to Vue Router when running in a native
 * WebView. Browser history remains the source of truth on web.
 */
export function initializeNativeBackButton(router, options = {}) {
  const globals = options.globals ?? (typeof window === 'undefined' ? {} : window)
  const appPlugin = options.appPlugin ?? globals?.Capacitor?.Plugins?.App
  if (!appPlugin || typeof appPlugin.addListener !== 'function') {
    return () => {}
  }

  let listener
  let disposed = false
  const handleBackButton = async ({ canGoBack } = {}) => {
    if (disposed) return
    if (canGoBack && router.currentRoute.value?.matched?.length > 0) {
      await router.back()
      return
    }
    if (typeof appPlugin.exitApp === 'function') {
      await appPlugin.exitApp()
    }
  }

  Promise.resolve(appPlugin.addListener('backButton', handleBackButton)).then(result => {
    listener = result
  })

  return () => {
    disposed = true
    listener?.remove?.()
  }
}
