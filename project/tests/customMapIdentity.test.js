import { beforeEach, it, expect, vi } from 'vitest'
vi.mock('@/api',()=>({getCustomData:vi.fn(),getDataByFeature:vi.fn()}))
vi.mock('@/main/store/store.js',()=>({globalPayload:{},queryStore:{},mapStore:{},resultCache:{features:['韻母']},userStore:{}}))
import { mergeBackendData } from '@/utils/map/MapData.js'

beforeEach(()=>vi.clearAllMocks())
it('keeps identity of grouped records even when timestamps and coordinates coincide',()=>{
  const rows=[1,2].map(id=>({id,version:id+1,簡稱:'甲地',聲韻調:'韻母',特徵:'流',值:id===1?'55':'66',maxValue:id===1?'55':'66',經緯度:[113,23],說明:'',created_at:'2026-01-01'}))
  const merged=[]
  mergeBackendData(rows,merged)
  expect(merged).toHaveLength(1)
  expect(merged[0].customRecords).toEqual([{id:1,version:2},{id:2,version:3}])
  expect(merged[0].value).toBe('55║66')
  expect(merged[0].id).toBe(1)
  expect(merged[0].version).toBe(2)
})

it('refuses partial grouped identity rather than deleting only the identified row', async()=>{
  const { popupDeleteItems } = await import('@/utils/user/customPopupDelete.js')
  const merged=[]
  mergeBackendData([
    {id:1,version:2,簡稱:'甲地',聲韻調:'韻母',特徵:'流',值:'55',maxValue:'55',經緯度:[113,23],說明:''},
    {簡稱:'甲地',聲韻調:'韻母',特徵:'流',值:'66',maxValue:'66',經緯度:[113,23],說明:''}
  ],merged)
  expect(()=>popupDeleteItems(merged[0])).toThrow()
})
