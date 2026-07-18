export function resolveHoverDetailCardPosition({
  clientX,
  clientY,
  cardWidth = 340,
  cardHeight = 420,
  offset = 20,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
}) {
  let left = clientX + offset
  let top = clientY + offset

  if (left + cardWidth > viewportWidth) {
    left = clientX - cardWidth - offset
  }

  if (top + cardHeight > viewportHeight) {
    top = viewportHeight - cardHeight - offset
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
}
