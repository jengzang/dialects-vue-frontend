import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import ResultViewSwitcher from '../src/components/common/ResultViewSwitcher.vue'

let app
afterEach(() => {
  app?.unmount()
  document.body.innerHTML = ''
})

describe('shared result view switcher', () => {
  it('changes only the selected result view and exposes named icon buttons', async () => {
    const selected = ref('map')
    const host = document.createElement('div')
    document.body.append(host)
    app = createApp({ render: () => h(ResultViewSwitcher, {
      modelValue: selected.value,
      'onUpdate:modelValue': value => { selected.value = value },
    }) })
    app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {
      'zh-CN': { words: { wordList: { viewModes: { card: '卡片', map: '地图', table: '表格', label: '显示模式' } } } },
    } }))
    app.mount(host)
    const buttons = [...host.querySelectorAll('button')]
    expect(buttons).toHaveLength(3)
    expect(buttons.map(button => button.getAttribute('aria-label'))).toEqual(['表格', '卡片', '地图'])
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true')
    expect(buttons.every(button => button.querySelector('svg'))).toBe(true)
    buttons[0].click()
    await nextTick()
    expect(selected.value).toBe('table')
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false')
  })
})
