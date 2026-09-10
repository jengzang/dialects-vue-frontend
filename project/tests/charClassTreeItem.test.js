import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(
  resolve(process.cwd(), 'src/main/components/TableAndTree/CharTreeItem.vue'),
  'utf8'
)

describe('CharTreeItem leaf presentation', () => {
  it('uses the node leaf state for the icon instead of treating chars as child folders', () => {
    expect(componentSource).toContain(
      "const isLeafNode = computed(() => props.node?.isLeaf === true && !props.node?._lazy)"
    )
    expect(componentSource).toContain(":icon=\"isLeafNode ? '✍️' : '📁'\"")
  })
})
