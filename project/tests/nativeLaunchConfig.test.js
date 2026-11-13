// @vitest-environment node
import { afterEach, expect, it } from 'vitest'
import { loadConfigFromFile } from 'vite'

const originalBase = process.env.VITE_WEB_BASE

afterEach(() => {
  if (originalBase === undefined) delete process.env.VITE_WEB_BASE
  else process.env.VITE_WEB_BASE = originalBase
})

it('uses the build backend for native launch reporting without adding a web asset', async () => {
  process.env.VITE_WEB_BASE = 'https://staging.example.test'
  for (const mode of ['ios', 'android', 'web']) {
    const { config } = await loadConfigFromFile({ command: 'build', mode })
    const plugin = config.plugins.find(item => item.name === 'native-launch-config')
    if (mode === 'web') {
      expect(plugin).toBeUndefined()
    } else {
      const files = []
      plugin.generateBundle.call({ emitFile: file => files.push(file) })
      expect(files).toEqual([expect.objectContaining({
        fileName: 'native-launch-config.json',
        source: JSON.stringify({ webBase: 'https://staging.example.test' }),
      })])
    }
  }
})
