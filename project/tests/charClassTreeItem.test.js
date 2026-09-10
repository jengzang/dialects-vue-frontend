import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeCharClassTree } from '../src/main/utils/charClassTreeAdapter.js'

const componentSource = readFileSync(
  resolve(process.cwd(), 'src/main/components/TableAndTree/CharTreeItem.vue'),
  'utf8'
)

describe('CharTreeItem leaf presentation', () => {
  it('keeps named classification nodes expandable when they contain merged characters', () => {
    expect(componentSource).toContain(":icon=\"hasChildren ? '📁' : '✍️'\"")
    expect(componentSource).toContain('return hasLeafContent.value || hasChildNodes.value')
    expect(componentSource).toContain('v-else-if="hasDisplayName"')
  })

  it('merges leaf-level characters into one promoted content node', () => {
    const nodes = normalizeCharClassTree(
      {
        東: { 釋義: ['meaning east'] },
        冬: { 釋義: ['meaning winter'] },
      },
      {
        leafLevelColumnName: '漢字',
        leafData: { annotations: { columns: ['釋義'] } },
        collapseLeafLevel: true,
      }
    )

    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({
      name: '',
      chars: ['東', '冬'],
      annotations: ['meaning east', 'meaning winter'],
      children: [],
    })
  })
})
