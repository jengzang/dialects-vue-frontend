// @vitest-environment node

import { describe, expect, it } from 'vitest'
import viteConfig from '../vite.config.js'

describe('XLSX chunk caching', () => {
  it('includes a content hash in the XLSX chunk filename', async () => {
    const config = await viteConfig({ mode: 'production' })
    const filename = config.build.rollupOptions.output.chunkFileNames({ name: 'xlsx' })

    expect(filename).toContain('[hash]')
  })
})
