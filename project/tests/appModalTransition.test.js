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

  it('uses the real pointer target only as the modal position origin', () => {
    const source = readSource('src/components/common/AppModal.vue')

    expect(source).toContain("document.addEventListener('pointerdown'")
    expect(source).toContain('lastPointerOrigin')
    expect(source).not.toContain('cloneNode(true)')
    expect(source).not.toContain('panel-front')
    expect(source).toContain('rotateY(180deg)')
  })

  it('keeps the original flex layout around the detail face', () => {
    const source = readSource('src/components/common/AppModal.vue')

    expect(source).toMatch(/\.panel \{\s+position: relative;\s+@include flex-col;/)
    expect(source).toMatch(/\.panel-detail \{[\s\S]*?@include flex-col;[\s\S]*?flex: 1;/)
  })

  it('does not hide the detail face behind the glass panel after the flip', () => {
    const source = readSource('src/components/common/AppModal.vue')

    expect(source).not.toContain('backface-visibility: hidden')
  })

  it('defines reversible three-dimensional motion while compact mode suppresses animation globally', () => {
    const modal = readSource('src/components/common/AppModal.vue')
    const uiMode = readSource('src/styles/global/_ui-mode.scss')

    expect(modal).toContain('@keyframes flip-to-detail-enter')
    expect(modal).toContain('@keyframes flip-to-detail-leave')
    expect(modal).toContain('rotateY(180deg)')
    expect(modal).toContain('perspective: 1200px')
    expect(modal).toContain('animation-duration: 0.8s')
    expect(uiMode).toContain(":root[data-ui-mode='compact'] *")
    expect(uiMode).toContain('animation: none !important;')
    expect(uiMode).toContain('transition: none !important;')
  })
})
