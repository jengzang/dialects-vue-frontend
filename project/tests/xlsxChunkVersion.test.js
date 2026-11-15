// @vitest-environment node

import { expect, it } from 'vitest'
import viteConfig from '../vite.config.js'

it('versions the XLSX chunk independently of other stable chunks', async () => {
  const config = await viteConfig({ mode: 'production' })
  const filename = config.build.rollupOptions.output.chunkFileNames

  expect(filename({ name: 'xlsx' })).toBe('assets/[name]-v3.js')
  expect(filename({ name: 'echarts' })).toBe('assets/[name]-v2.js')
})
