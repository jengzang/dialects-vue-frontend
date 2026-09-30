import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('AppModal Flip to Detail transition', () => {
  it('uses Flip to Detail as its default transition and keeps an explicit name binding', () => {
    const source = readSource('src/components/common/AppModal.vue')

    expect(source).toContain("default: 'flip-to-detail'")
    expect(source).toContain(':name="transitionName"')
  })

  it('captures an active opener and prepares the flip on enter and leave', () => {
    const source = readSource('src/components/common/AppModal.vue')

    expect(source).toContain('document.activeElement')
    expect(source).toContain('@before-enter="prepareFlipEnter"')
    expect(source).toContain('@before-leave="prepareFlipLeave"')
    expect(source).toContain("'--flip-origin-x'")
    expect(source).toContain("'--flip-origin-y'")
    expect(source).toContain("'--flip-origin-scale'")
    expect(source).toContain('originElement?.isConnected')
    expect(source.match(/:role="dialogRole"/g)).toHaveLength(1)
  })

  it('defines reversible three-dimensional motion while compact mode suppresses animation globally', () => {
    const modal = readSource('src/components/common/AppModal.vue')
    const uiMode = readSource('src/styles/global/_ui-mode.scss')

    expect(modal).toContain('@keyframes flip-to-detail-enter')
    expect(modal).toContain('@keyframes flip-to-detail-leave')
    expect(modal).toContain('rotateY(180deg)')
    expect(modal).toContain('transform-style: preserve-3d')
    expect(modal).toContain('backface-visibility: hidden')
    expect(modal).toContain('.uses-flip-detail .panel {\n  transform: rotateY(180deg);')
    expect(uiMode).toContain(":root[data-ui-mode='compact'] *")
    expect(uiMode).toContain('animation: none !important;')
    expect(uiMode).toContain('transition: none !important;')
  })
})
