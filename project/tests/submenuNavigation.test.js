import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { isInternalAppNavigationTarget, navigatePlatformLink } from '../src/platform/navigation.js'

// Execute the actual component handler with a pending router, without mounting unrelated UI.
function loadHandler(component, bindings) {
  const source = readFileSync(resolve(process.cwd(), `src/components/bar/${component}.vue`), 'utf8')
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: 'submenu-navigation' })
  const declaration = script.scriptSetupAst
    .flatMap((node) => node.declarations || [])
    .find((node) => node.id.name === 'handleSubmenuClick')
  const expression = descriptor.scriptSetup.content.slice(declaration.init.start, declaration.init.end)
  return new Function(...Object.keys(bindings), `return (${expression})`)(...Object.values(bindings))
}

describe.each(['CommonBar', 'ExploreBar', 'SimpleSidebar'])('%s submenu navigation', (component) => {
  it.each([false, true])('closes immediately while navigation is pending (reject: %s)', async (rejectNavigation) => {
    let resolveRoute
    let rejectRoute
    const navigation = new Promise((resolve, reject) => {
      resolveRoute = resolve
      rejectRoute = reject
    })
    const activeSubmenu = ref('tools')
    const schema = {}
    const writeCommonBarMemory = vi.fn()
    const cancelCloseSubmenu = vi.fn()
    const router = { push: vi.fn(() => navigation) }
    const handler = loadHandler(component, {
      router,
      navigatePlatformLink,
      isInternalAppNavigationTarget,
      activeSubmenu,
      normalizedNavigationSchema: ref(schema),
      writeCommonBarMemory,
      cancelCloseSubmenu,
      closeSidebar: () => { activeSubmenu.value = null },
    })
    const result = handler({ path: '/explore/tools' })
    const error = new Error('route failed')
    // Attach rejection handling before settling the deferred navigation.
    const settled = Promise.resolve(result).then(() => null, (reason) => reason)
    try {
      expect(activeSubmenu.value).toBeNull()
      expect(router.push).toHaveBeenCalledWith('/explore/tools')
      if (component === 'CommonBar') {
        expect(writeCommonBarMemory).toHaveBeenCalledWith(schema, 'tools', '/explore/tools')
      }
      if (component === 'SimpleSidebar') expect(cancelCloseSubmenu).toHaveBeenCalledOnce()
    } finally {
      if (rejectNavigation) rejectRoute(error)
      else resolveRoute()
    }
    expect(await settled).toBe(rejectNavigation ? error : null)
  })
})
