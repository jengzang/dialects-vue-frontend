import { ref, computed } from 'vue'

const TOOLTIP_HIDE_DELAY = 100
const TOUCH_AUTO_HIDE_DELAY = 1500

export function useTabTooltip() {
  const tooltip = ref({ visible: false, label: '', x: 0, y: 0 })

  let hideTimer = null

  const showTooltip = (target, label) => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    const rect = target.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const estimatedWidth = Math.min(target.querySelector('.label')?.scrollWidth + 24 || 100, 260)

    let x
    if (rect.right + 6 + estimatedWidth <= viewportWidth - 10) {
      x = rect.right + 6
    } else {
      x = rect.left - estimatedWidth - 6
    }

    tooltip.value = {
      visible: true,
      label,
      x,
      y: rect.top + rect.height / 2
    }
  }

  const handleMouseEnter = (event, label) => {
    const target = event.currentTarget
    const labelEl = target.querySelector('.label')
    if (!labelEl) return

    if (labelEl.scrollWidth <= labelEl.clientWidth) return

    showTooltip(target, label)
  }

  const handleMouseLeave = () => {
    hideTimer = setTimeout(() => {
      tooltip.value = { visible: false, label: '', x: 0, y: 0 }
    }, TOOLTIP_HIDE_DELAY)
  }

  const handleTouchStart = (event, label) => {
    const target = event.currentTarget
    const labelEl = target.querySelector('.label')
    if (!labelEl) return

    if (labelEl.scrollWidth <= labelEl.clientWidth) return

    showTooltip(target, label)

    hideTimer = setTimeout(() => {
      tooltip.value = { visible: false, label: '', x: 0, y: 0 }
    }, TOUCH_AUTO_HIDE_DELAY)
  }

  const tooltipStyle = computed(() => {
    if (!tooltip.value.visible) return { display: 'none' }
    return {
      position: 'fixed',
      top: tooltip.value.y + 'px',
      left: tooltip.value.x + 'px',
      transform: 'translateY(-50%)',
      maxWidth: '260px',
      zIndex: 10001
    }
  })

  return { tooltip, tooltipStyle, handleMouseEnter, handleMouseLeave, handleTouchStart }
}
