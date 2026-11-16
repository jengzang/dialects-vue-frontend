import { describe, expect, it } from 'vitest'
import { getVariantCandidates, areVariantEquivalent } from '@/main/utils/query/customVariant.js'

describe('custom variant matching', () => {
  it('matches either side of an uncertain variant pair', () => {
    expect(areVariantEquivalent('淸', '清')).toBe(true)
    expect(areVariantEquivalent('清', '淸')).toBe(true)
    expect(areVariantEquivalent('淸華', '清華')).toBe(true)
  })

  it('returns unique candidates without changing unrelated characters', () => {
    expect(getVariantCandidates('淸')).toEqual(expect.arrayContaining(['淸', '清']))
    expect(getVariantCandidates('A')).toEqual(['A'])
  })
})
