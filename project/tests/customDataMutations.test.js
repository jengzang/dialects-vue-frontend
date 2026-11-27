import { describe, it, expect } from 'vitest'
import { buildPointMutations, validateRows, formatCustomDataTime } from '@/utils/user/customDataMutations.js'
const record = { id: 1, 簡稱: '甲', 音典分區: '區', 經緯度: '113,23', 聲韻調: '', 特徵: '調', 值: '55', 說明: '' }
it('accepts records without versions and sends only IDs and editable fields', () => {
  const row = {...record}
  const checked = validateRows([row])
  expect(checked.errors).toEqual([])
  expect(checked.items).toEqual([row])
  expect(validateRows([{...record,version:2}]).items).toEqual([row])
  expect(buildPointMutations([], {}, [{id:1}]).deletes).toEqual([{id:1}])
})
describe('custom data atomic validation', () => {
  it('rejects every incomplete existing row instead of filtering', () => {
    expect(validateRows([record, { ...record, id: 2, 值: ' ' }]).errors).toEqual(expect.arrayContaining([expect.objectContaining({row_index: 1, field: '值'})]))
  })
  it('ignores only completely blank new rows', () => {
    expect(validateRows([{}], { creates: true }).items).toEqual([])
    expect(validateRows([{ 說明: 'only note' }], { creates: true }).errors.length).toBeGreaterThan(0)
  })
  it('bounds batches and rejects duplicate identities and invalid coordinates', () => {
    expect(validateRows(Array.from({ length: 50 }, (_, i) => ({...record,id:i+1}))).errors).toEqual([])
    expect(validateRows(Array.from({ length: 51 }, (_, i) => ({...record,id:i+1}))).errors[0].messageKey).toBe('limit')
    expect(validateRows([record,record]).errors.some(e => e.messageKey === 'duplicate')).toBe(true)
    expect(validateRows([{...record, 經緯度:'181,23'}]).errors.some(e => e.field === '經緯度')).toBe(true)
  })
  it('includes changes to location and region in point updates with id', () => {
    for (const base of [{簡稱:'乙',音典分區:'區',經緯度:'113,23'}, {簡稱:'甲',音典分區:'新區',經緯度:'113,23'}]) {
      const result = buildPointMutations([{ ...record, recordId:1, clientRowId:'a', original:record }], base, [])
      expect(result.updates).toHaveLength(1)
      expect(result.updates[0]).toMatchObject({id:1,...base})
    }
  })
  it('counts creates, updates and deletes together and supports deleting every old row', () => {
    const deletes=Array.from({length:50},(_,i)=>({id:i+1}))
    expect(buildPointMutations([], {}, deletes).deletes).toHaveLength(50)
    expect(() => buildPointMutations([{...record, id:undefined, clientRowId:'new'}], record, deletes)).toThrow()
  })
  it('renders invalid and timezone timestamps safely', () => {
    expect(formatCustomDataTime('nonsense')).toBe('-')
    expect(formatCustomDataTime('')).toBe('-')
    expect(formatCustomDataTime('2026-01-01T12:00:00.123456Z','en-US','UTC')).toBe(formatCustomDataTime('2026-01-01 12:00:00.123456','en-US','UTC'))
    expect(formatCustomDataTime('2026-01-01T14:00:00+02:00','en-US','UTC')).toBe(formatCustomDataTime('2026-01-01T12:00:00Z','en-US','UTC'))
  })
})
it('does not invent coordinate-only changes from formatting differences', () => {
  const original={...record,經緯度:'113,23'}
  const result=buildPointMutations([{...record,recordId:1,clientRowId:'a',original}],{簡稱:'甲',音典分區:'區',經緯度:'113.000000,23.000000'},[])
  expect(result.updates).toEqual([])
})
it('normalizes server detail row errors without losing their messages', async () => {
  const { customDataRowErrors }=await import('@/utils/user/customDataMutations.js')
  expect(customDataRowErrors({status:422,detail:{errors:[{row_index:2,field:'值',message:'too long'}]}})).toEqual([{row_index:2,field:'值',message:'too long'}])
})
