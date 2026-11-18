export async function notifyNativeLaunchReady(platform, bridge, ready) {
  if (platform.container !== 'native-webview') return
  await ready()
  await bridge.hideLaunch()
}
