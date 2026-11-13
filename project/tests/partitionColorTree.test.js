import { createApp, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import PartitionColorTreeItem from '../src/main/components/TableAndTree/PartitionColorTreeItem.vue'

describe('partition color tree', () => {
  it('expands parents and emits full leaf paths when choosing colors', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const edits = []
    const app = createApp({ render: () => h(PartitionColorTreeItem, {
      node: { path: '粤语', label: '粤语', children: [{ path: '粤语-台山', label: '台山', children: [] }] },
      colors: new Map([['粤语-台山', '#123456']]),
      onColorChange: (...args) => edits.push(args),
    }) })
    app.mount(host)
    expect(host.querySelector('input')).toBeNull()
    host.querySelector('button').click()
    await nextTick()
    const picker = host.querySelector('input[type="color"]')
    expect(picker.value).toBe('#123456')
    picker.value = '#abcdef'
    picker.dispatchEvent(new Event('input', { bubbles: true }))
    expect(edits).toEqual([['粤语-台山', '#abcdef']])
    app.unmount()
    host.remove()
  })
})
