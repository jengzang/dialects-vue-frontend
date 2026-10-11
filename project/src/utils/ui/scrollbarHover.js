const expandedClass = 'ui-scrollbar--expanded'

// Native pseudo-state changes do not reliably resize the scrollbar gutter.
export function initializeScrollbarHover() {
  let expanded = null
  let dragging = false

  function setExpanded(element) {
    if (expanded === element) return
    if (expanded === document.documentElement) document.body?.classList.remove(expandedClass)
    expanded?.classList.remove(expandedClass)
    expanded = element
    expanded?.classList.add(expandedClass)
    // Blink can source the viewport scrollbar's pseudo styles from body.
    if (expanded === document.documentElement) document.body?.classList.add(expandedClass)
  }

  function scrollbarAtPointer(event) {
    for (let element = event.target; element instanceof Element; element = element.parentElement) {
      const root = element === document.documentElement
      if (!root && element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth) continue
      const style = getComputedStyle(element)
      if (style.scrollbarWidth === 'none') continue
      const borderLeft = root ? 0 : parseFloat(style.borderLeftWidth) || 0
      const borderRight = root ? 0 : parseFloat(style.borderRightWidth) || 0
      const borderTop = root ? 0 : parseFloat(style.borderTopWidth) || 0
      const borderBottom = root ? 0 : parseFloat(style.borderBottomWidth) || 0
      const rect = root
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
        : element.getBoundingClientRect()
      const scaleX = root ? 1 : rect.width / element.offsetWidth
      const scaleY = root ? 1 : rect.height / element.offsetHeight
      if (!scaleX || !scaleY) continue
      const x = (event.clientX - rect.left) / scaleX
      const y = (event.clientY - rect.top) / scaleY
      const width = root ? window.innerWidth : element.offsetWidth
      const height = root ? window.innerHeight : element.offsetHeight
      const vertical = width - element.clientWidth - borderLeft - borderRight
      const horizontal = height - element.clientHeight - borderTop - borderBottom
      const leftScrollbar = !root && element.clientLeft - borderLeft > 0
      const inVertical = vertical > 0 && element.scrollHeight > element.clientHeight
        && y >= borderTop && y < height - borderBottom
        && (leftScrollbar
          ? x >= borderLeft && x < borderLeft + vertical
          : x >= width - borderRight - vertical && x < width - borderRight)
      const inHorizontal = horizontal > 0 && element.scrollWidth > element.clientWidth
        && x >= borderLeft && x < width - borderRight
        && y >= height - borderBottom - horizontal && y < height - borderBottom
      if (inVertical || inHorizontal) return element
    }
    return null
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || dragging) return
    setExpanded(scrollbarAtPointer(event))
  }

  function onPointerDown(event) {
    if (event.pointerType === 'touch' || event.button !== 0) return
    setExpanded(scrollbarAtPointer(event))
    dragging = expanded !== null
  }

  function onPointerUp(event) {
    if (event.pointerType === 'touch' || event.button !== 0) return
    dragging = false
    setExpanded(scrollbarAtPointer(event))
  }

  function reset() {
    dragging = false
    setExpanded(null)
  }

  function onPointerLeave() {
    if (!dragging) reset()
  }

  document.addEventListener('pointermove', onPointerMove, { capture: true, passive: true })
  document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
  document.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
  document.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('pointercancel', reset, true)
  window.addEventListener('blur', reset)

  return () => {
    reset()
    document.removeEventListener('pointermove', onPointerMove, true)
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('pointerup', onPointerUp, true)
    document.removeEventListener('pointerleave', onPointerLeave)
    document.removeEventListener('pointercancel', reset, true)
    window.removeEventListener('blur', reset)
  }
}
