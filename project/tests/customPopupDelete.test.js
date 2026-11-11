import { it, expect, vi } from 'vitest'
import { createCustomPopupDelete, popupDeleteItems } from '@/utils/user/customPopupDelete.js'

it('keeps every grouped custom ID and version and rejects ambiguous or oversized groups', () => {
  expect(popupDeleteItems({customRecords:[{id:1,version:2},{id:2,version:4}]})).toEqual([{id:1,version:2},{id:2,version:4}])
  expect(popupDeleteItems({id:8,version:3})).toEqual([{id:8,version:3}])
  for (const item of [{created_at:'same'}, {id:1}, {customRecords:Array.from({length:51},(_,i)=>({id:i+1,version:1}))}, {customRecords:[{id:1,version:1},{id:1,version:2}]}]) {
    expect(()=>popupDeleteItems(item)).toThrow()
  }
})

it('locks before confirmation and sends one bounded atomic delete snapshot', async () => {
  let resolveConfirm
  const confirm=vi.fn(()=>new Promise(resolve=>{resolveConfirm=resolve}))
  const remove=vi.fn().mockResolvedValue({success:true,deleted_ids:[1]})
  const state=createCustomPopupDelete({confirm,remove})
  const item={id:1,version:2}
  const pending=state.deleteItem(item)
  await state.deleteItem(item)
  expect(confirm).toHaveBeenCalledTimes(1)
  expect(confirm.mock.calls[0][1]).toBe(1)
  item.version=7
  resolveConfirm(true)
  await pending
  expect(remove).toHaveBeenCalledExactlyOnceWith([{id:1,version:2}])
  expect(state.isSaving.value).toBe(false)
})

it('preserves conflicts, releases lock and never refreshes after failed deletion', async () => {
  const error={status:409,detail:{code:'version_conflict'}}
  const remove=vi.fn().mockRejectedValue(error)
  const state=createCustomPopupDelete({confirm:async()=>true,remove})
  await expect(state.deleteItem({id:1,version:1})).rejects.toBe(error)
  expect(state.isSaving.value).toBe(false)
})

it('shows the exact grouped deletion count and preserves all records on cancellation', async()=>{
  const confirm=vi.fn().mockResolvedValue(false)
  const remove=vi.fn()
  const state=createCustomPopupDelete({confirm,remove})
  const item={customRecords:[{id:1,version:2},{id:2,version:3}]}
  expect(await state.deleteItem(item)).toBeNull()
  expect(confirm).toHaveBeenCalledWith(item,2)
  expect(remove).not.toHaveBeenCalled()
  expect(state.isSaving.value).toBe(false)
})
