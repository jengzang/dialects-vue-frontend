import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/components/bar/NavBar.vue', 'utf8')
const collapseCode = source.slice(source.indexOf('const getMaxScrollableDistance'), source.indexOf('const updateLiquidGlassGlint'))

function createNavbar({ contentHeight, footerHeight, scrollY }) {
  const footer = document.createElement('footer')
  footer.dataset.appFooter = ''
  document.body.appendChild(footer)
  footer.getBoundingClientRect = () => ({ top: contentHeight - window.scrollY })
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: contentHeight + footerHeight })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: scrollY })
  window.matchMedia = () => ({ matches: true })
  const collapseProgress = { value: 0 }
  const viewportWidth = { value: 0 }
  const makeNavbar = new Function('collapseProgress', 'viewportWidth', `
    const NORMAL_COLLAPSE_START = 200, NORMAL_COLLAPSE_DISTANCE = 300
    const MANUAL_EXPAND_MIN_SCROLL = 250, MANUAL_COLLAPSE_DELAY = 50
    const MANUAL_COLLAPSE_DISTANCE = 200, MIN_SCROLLABLE_DISTANCE = 500
    let manualExpandScrollStart = null, lastCollapseScrollTop = null
    ${collapseCode}
    return { updateNavbarCollapse, expandNavbar }
  `)
  return { ...makeNavbar(collapseProgress, viewportWidth), collapseProgress, footer }
}

describe('mobile navbar footer scrolling', () => {
  it('does not collapse when only the footer makes the page scrollable', () => {
    const navbar = createNavbar({ contentHeight: 1000, footerHeight: 800, scrollY: 600 })
    navbar.updateNavbarCollapse()
    expect(navbar.collapseProgress.value).toBe(0)
    navbar.footer.remove()
  })

  it('does not advance manual recollapse while scrolling through the footer', () => {
    const navbar = createNavbar({ contentHeight: 1400, footerHeight: 800, scrollY: 750 })
    navbar.updateNavbarCollapse()
    navbar.expandNavbar()
    window.scrollY = 1100
    navbar.updateNavbarCollapse()
    expect(navbar.collapseProgress.value).toBe(0)
    navbar.footer.remove()
  })
})
