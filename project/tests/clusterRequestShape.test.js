import { describe, expect, it } from 'vitest'

import {
  buildPreviewRequestDraft,
  createEmptyGroup,
  getGroupPathStrings
} from '../src/main/views/menu/cluster/clusterWorkspaceShared.js'

describe('cluster request shape contracts', () => {
  it('falls back to default path keys for legacy persisted groups without pathKeys', () => {
    expect(getGroupPathStrings({
      pathValueMap: {
        攝: ['假']
      }
    })).toEqual(['[假]{攝}'])
  })

  it('maps path_strings groups to preset source_mode while preserving path payload', () => {
    const group = {
      ...createEmptyGroup(),
      label: '攝',
      source_mode: 'path_strings',
      compare_dimension: 'final',
      pathKeys: ['攝'],
      pathValueMap: {
        攝: ['假']
      },
      resolvedCharsText: ''
    }

    const payload = buildPreviewRequestDraft({
      groups: [group],
      locations: ['杭州'],
      regions: [],
      region_mode: 'yindian',
      include_special_locations: false
    })

    expect(payload.groups).toEqual([
      {
        label: '攝',
        source_mode: 'preset',
        table_name: 'characters',
        path_strings: ['[假]{攝}'],
        compare_dimension: 'final'
      }
    ])
  })

  it('maps resolved_chars groups to preset source_mode while preserving resolved chars', () => {
    const group = {
      ...createEmptyGroup(),
      label: '自定字',
      source_mode: 'resolved_chars',
      compare_dimension: 'tone',
      resolvedCharsText: '東 冬 東'
    }

    const payload = buildPreviewRequestDraft({
      groups: [group],
      locations: [],
      regions: ['吳語'],
      region_mode: 'map',
      include_special_locations: true
    })

    expect(payload.groups).toEqual([
      {
        label: '自定字',
        source_mode: 'preset',
        resolved_chars: ['東', '冬'],
        compare_dimension: 'tone'
      }
    ])
    expect(payload.region_mode).toBe('map')
    expect(payload.include_special_locations).toBe(true)
  })
})
