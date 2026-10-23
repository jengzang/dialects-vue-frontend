import { afterEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/components/common/BarIcon.vue', () => ({
  default: defineComponent({ template: '<span />' }),
}))

let app
afterEach(() => {
  app?.unmount()
  document.body.innerHTML = ''
})

it('exposes selected filters and preserves results across search and view changes', async () => {
  const page = (await import('../src/main/views/explore/yangchun/YangChunExpressionsPage.vue')).default
  const host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(page)
  app.mount(host)
  await nextTick()

  const categoryButtons = [...host.querySelectorAll('[aria-label="熟语分类"] button')]
  const patterns = [...host.querySelectorAll('[aria-label="词形模式"] button')]
  const views = [...host.querySelectorAll('.yc-view-switch button')]
  expect(host.querySelectorAll('.yc-expression-card')).toHaveLength(7)
  expect(categoryButtons[0].getAttribute('aria-pressed')).toBe('true')

  categoryButtons.find((button) => button.textContent.trim() === '叠式词').click()
  patterns.find((button) => button.textContent.trim() === 'ABB').click()
  await nextTick()
  expect(host.querySelectorAll('.yc-expression-card')).toHaveLength(1)
  expect(host.querySelector('.yc-expression-card').textContent).toContain('湿漉漉')
  expect(patterns[2].getAttribute('aria-pressed')).toBe('true')
  expect(categoryButtons[0].getAttribute('aria-pressed')).toBe('false')

  views[1].click()
  await nextTick()
  expect(views[1].getAttribute('aria-pressed')).toBe('true')
  expect(host.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(host.querySelector('tbody').textContent).toContain('湿漉漉')

  const input = host.querySelector('input[type="search"]')
  input.value = '没有这个词'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  expect(host.querySelector('tbody').textContent).toContain('没有匹配条目')
  views[0].click()
  await nextTick()
  expect(host.querySelector('.yc-empty-state').textContent).toContain('没有匹配条目')

  input.value = '潮湿'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  expect(host.querySelectorAll('.yc-expression-card')).toHaveLength(1)
  expect(host.querySelector('.yc-expression-card').textContent).toContain('湿漉漉')
})
