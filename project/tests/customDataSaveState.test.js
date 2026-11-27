import { it, expect, vi } from 'vitest'
import { useCustomDataSave } from '@/main/composables/useCustomDataSave.js'
it('locks before confirmation, deep copies and safely repeats the same unknown request', async () => {
  let release
  const confirm = () => new Promise(resolve => { release=resolve })
  const bodies=[]
  let first=true
  const send=vi.fn(async body=>{bodies.push(JSON.parse(JSON.stringify(body))); if(first){first=false;throw new TypeError('lost response')} return {created_count:1} })
  const state=useCustomDataSave(send)
  const draft={creates:[{client_row_id:'a',值:'55'}],updates:[],deletes:[]}
  const pending=state.save(draft,{confirm})
  expect(state.isSaving.value).toBe(true)
  await state.save(draft)
  expect(send).not.toHaveBeenCalled()
  draft.creates[0].值='new'
  release(true)
  await pending
  expect(state.status.value).toBe('unknown')
  await state.save(draft)
  expect(bodies[1]).toEqual(bodies[0])
  expect(bodies[0].creates[0].值).toBe('55')
  expect(state.status.value).toBe('succeeded')
})
it('preserves structured errors and blocks unknown replay after receipt expiry', async () => {
  const error={status:404,detail:{code:'record_unavailable',current_records:[{id:1}]}}
  const state=useCustomDataSave(async()=>{throw error})
  await state.save({updates:[{id:1}],creates:[],deletes:[]})
  expect(state.status.value).toBe('failed')
  expect(state.error.value).toEqual(error)
})
it('refuses to resend an unknown request after 24 hours and keeps the original snapshot', async () => {
  const send=vi.fn().mockRejectedValue(new TypeError('connection lost'))
  const state=useCustomDataSave(send)
  await state.save({creates:[{client_row_id:'draft'}],updates:[],deletes:[]})
  const snapshot=state.getSnapshot()
  const now=Date.now();const clock=vi.spyOn(Date,'now').mockReturnValue(now+24*60*60*1000+1)
  try {
    await state.save({creates:[{client_row_id:'new intent'}]})
    expect(send).toHaveBeenCalledTimes(1)
    expect(state.error.value.detail.code).toBe('receipt_expired')
    expect(state.getSnapshot()).toBe(snapshot)
    expect(state.prepareMerge()).toBe(false)
    expect(state.reset()).toBe(false)
  } finally {clock.mockRestore()}
})
it('keeps an unknown original outcome locked after a rejected replay gate and reuses the original key', async () => {
  const send=vi.fn().mockRejectedValueOnce(new TypeError('lost')).mockRejectedValueOnce({status:429,detail:{code:'rate_limited'}}).mockResolvedValueOnce({created_count:1})
  const state=useCustomDataSave(send)
  await state.save({creates:[{client_row_id:'a'}],updates:[],deletes:[]})
  await state.save({creates:[{client_row_id:'changed'}]})
  expect(state.status.value).toBe('unknown')
  expect(state.locked.value).toBe(true)
  expect(state.reset()).toBe(false)
  await state.save({})
  expect(send.mock.calls[2][0]).toEqual(send.mock.calls[0][0])
})
