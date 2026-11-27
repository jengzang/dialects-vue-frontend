import { it,expect,vi } from 'vitest'
vi.mock('@/api/auth/httpClient.js',()=>({api:vi.fn()}))
import { api } from '@/api/auth/httpClient.js'
import { batchUpdateCustomData,batchDeleteCustomDataById,saveCustomData,getAllCustomData } from '@/api/main/user/custom-data.js'
it('uses atomic ID transport and preserves structured errors',async()=>{
 const items=[{id:1}]
 await batchUpdateCustomData(items)
 expect(api).toHaveBeenLastCalledWith('/user/custom/batch-update',expect.objectContaining({method:'PUT',body:{items},showError:false}))
 await batchDeleteCustomDataById(items)
 expect(api).toHaveBeenLastCalledWith('/user/custom/batch-delete-by-id',expect.objectContaining({method:'DELETE',body:{items}}))
 const body={request_id:'key',creates:[]};await saveCustomData(body)
 expect(api).toHaveBeenLastCalledWith('/user/custom/save',expect.objectContaining({method:'POST',body}))
 const error={status:404,detail:{code:'record_unavailable'}};api.mockRejectedValueOnce(error)
 await expect(getAllCustomData()).rejects.toBe(error)
})
