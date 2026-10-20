import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import RecentQueryPills from '../src/components/common/RecentQueryPills.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key, params) => params?.summary || key }) }))
let app
afterEach(() => { app?.unmount(); document.body.innerHTML = '' })

describe('recent query pills', () => {
  it('preserves quick-fill controls and emits detached conditions only on an enabled history click', async () => {
    const snapshot = { chars: '山', loc: { locations: ['廣州'] } }
    const restore = vi.fn()
    const disabled = ref(false)
    app = createApp({ render: () => h(RecentQueryPills, {
      entries: [{ summary: '山 · 廣州', snapshot }], disabled: disabled.value, onRestore: restore,
    }, () => h('button', { id: 'existing-quick-start' }, 'Quick start')) })
    app.mount(document.body.appendChild(document.createElement('div')))
    expect(document.querySelector('#existing-quick-start')).not.toBeNull()
    const button = document.querySelector('.pill-btn--history')
    expect(button.title).toBe('山 · 廣州')
    expect(restore).not.toHaveBeenCalled()
    button.click()
    expect(restore).toHaveBeenCalledTimes(1)
    restore.mock.calls[0][0].loc.locations.push('北京')
    expect(snapshot.loc.locations).toEqual(['廣州'])
    disabled.value = true
    await nextTick()
    button.click()
    expect(restore).toHaveBeenCalledTimes(1)
  })
})
