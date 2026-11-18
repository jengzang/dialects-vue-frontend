// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { useTabTooltip } from '../src/composables/bar/useTabTooltip.js'

function targetWithLabel(nested, truncated) {
  const target = document.createElement('div')
  target.innerHTML = nested ? '<span class="label"><span class="label-text">Full label</span></span>' : '<span class="label">Full label</span>'
  const text = target.querySelector('.label-text') || target.querySelector('.label')
  Object.defineProperties(text, {
    scrollWidth: { value: truncated ? 100 : 50 },
    clientWidth: { value: 50 },
  })
  return target
}

describe('tab tooltip', () => {
  it('shows the full label when nested text is truncated on hover and touch', () => {
    for (const handler of ['handleMouseEnter', 'handleTouchStart']) {
      const tooltip = useTabTooltip()
      tooltip[handler]({ currentTarget: targetWithLabel(true, true) }, 'Full label')
      expect(tooltip.tooltip.value.label).toBe('Full label')
      expect(tooltip.tooltip.value.visible).toBe(true)
    }
  })

  it('keeps existing plain label behavior', () => {
    const tooltip = useTabTooltip()
    tooltip.handleMouseEnter({ currentTarget: targetWithLabel(false, false) }, 'Full label')
    expect(tooltip.tooltip.value.visible).toBe(false)
    tooltip.handleMouseEnter({ currentTarget: targetWithLabel(false, true) }, 'Full label')
    expect(tooltip.tooltip.value.visible).toBe(true)
  })
})
