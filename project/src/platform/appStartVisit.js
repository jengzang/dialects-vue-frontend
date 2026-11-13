export async function reportAppStart(runtime, base, send = fetch) {
  if (runtime.container !== 'native-webview' || !['ios', 'android'].includes(runtime.family)) return

  try {
    await send(`${base}/logs/visits/app-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: runtime.family }),
    })
  } catch {
    // Statistics must not interrupt app startup.
  }
}
