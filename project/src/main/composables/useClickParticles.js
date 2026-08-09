import { onMounted, onBeforeUnmount, watch } from 'vue'
import { currentColorTheme, COLOR_THEME_DARK, COLOR_THEME_GREEN } from '@/composables/core/uiPreferences.js'

const LIGHT_COLORS = [
  '#ff8f00', '#ff6d00', '#ffab00', '#ffc107', '#ffd54f',
  '#ff7043', '#ff9e40', '#ffd700', '#ffe082', '#ffcc80',
]

const DARK_COLORS = [
  '#e0e0e0', '#b0bec5', '#80cbc4', '#4dd0e1', '#fff',
  '#90a4ae', '#b0e0e6', '#ffffff', '#cfd8dc', '#a0d2db',
]

let colors = [...LIGHT_COLORS]
const isDark = () => [COLOR_THEME_DARK, COLOR_THEME_GREEN].includes(currentColorTheme.value)

const sparks = []

function createSparks(x, y) {
  const count = 16
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 5 + 3
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: Math.random() * 0.015 + 0.012,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

let canvas = null
let ctx = null
let animId = null

function initCanvas() {
  canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  document.body.appendChild(canvas)
  resize()
}

function resize() {
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawStar(cx, cy, outerR, innerR, rotation) {
  const spikes = 4
  let rot = Math.PI / 2 * 3 + rotation
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerR)
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
    rot += step
  }
  ctx.closePath()
  ctx.fill()
}

function tick() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]
    s.x += s.vx
    s.y += s.vy
    s.vy += 0.04
    s.life -= s.decay

    if (s.life <= 0) {
      sparks.splice(i, 1)
      continue
    }

    ctx.globalAlpha = s.life
    ctx.fillStyle = s.color
    drawStar(s.x, s.y, s.size, s.size * 0.4, s.life * Math.PI * 2)
  }

  animId = requestAnimationFrame(tick)
}

function onClick(e) {
  if (!canvas) return
  const tag = e.target.tagName
  if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(tag)) return
  if (e.target.closest('[data-no-particles]')) return

  createSparks(e.clientX, e.clientY)
}

export function useClickParticles() {
  colors = isDark() ? [...DARK_COLORS] : [...LIGHT_COLORS]

  watch(currentColorTheme, (val) => {
    colors = [COLOR_THEME_DARK, COLOR_THEME_GREEN].includes(val)
      ? [...DARK_COLORS]
      : [...LIGHT_COLORS]
  })

  onMounted(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return
    initCanvas()
    tick()
    window.addEventListener('click', onClick)
    window.addEventListener('resize', resize)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('click', onClick)
    window.removeEventListener('resize', resize)
    if (canvas) {
      canvas.remove()
      canvas = null
    }
  })
}
