import { createApp, defineComponent, h, nextTick } from 'vue'
import { beforeEach, afterEach, it,expect,vi } from 'vitest'
const mocks=vi.hoisted(()=>({getAllCustomData:vi.fn(),batchUpdateCustomData:vi.fn(),batchDeleteCustomDataById:vi.fn(),saveCustomData:vi.fn(),showConfirm:vi.fn(),showWarning:vi.fn()}))
vi.mock('@/api',()=>mocks)
vi.mock('@/api/main/user/custom-data.js',()=>({getAllCustomData:mocks.getAllCustomData}))
vi.mock('@/main/store/store.js',()=>({userStore:{username:'user',isAuthenticated:true}}))
vi.mock('@/composables/data/useCustomDataPresence.js',()=>({invalidateCustomDataPresence:vi.fn(),markCustomDataExists:vi.fn()}))
vi.mock('@/utils/ui/message.js',()=>({...mocks,showError:vi.fn(),showSuccess:vi.fn()}))
vi.mock('vue-i18n',()=>({useI18n:()=>({t:(key,args)=>key+JSON.stringify(args||{}),locale:{value:'en'}})}))
vi.mock('vue-router',()=>({useRoute:()=>({query:{},fullPath:'/user'}),useRouter:()=>({push:vi.fn()}),onBeforeRouteLeave:vi.fn()}))
vi.mock('@/components/common/AppModal.vue',()=>({default:defineComponent({props:['modelValue'],setup:(props,{slots})=>()=>props.modelValue?h('section',{class:'test-modal'},[slots.default?.(),slots.footer?.()]):null})}))
vi.mock('@/components/selector/CheckBox.vue',()=>({default:defineComponent({props:['modelValue'],emits:['update:modelValue'],setup:(props,{emit})=>()=>h('input',{type:'checkbox',checked:props.modelValue,onChange:e=>emit('update:modelValue',e.target.checked)})})}))
import UserDataPage from '@/main/components/user/UserDataPage.vue'
const record={version:1,簡稱:'甲',音典分區:'區',經緯度:'113,23',聲韻調:'',特徵:'調',值:'55',說明:'',created_at:'2026-01-01T00:00:00Z'}
let app,host,vm
const flush=async()=>{for(let i=0;i<8;i++) await Promise.resolve();await nextTick()}
beforeEach(async()=>{
 vi.clearAllMocks();mocks.showConfirm.mockResolvedValue(true)
 mocks.getAllCustomData.mockResolvedValue({data:[{...record,id:1},{...record,id:2},{...record,id:3}],total:3})
 host=document.createElement('div');document.body.append(host);app=createApp(UserDataPage)
 for(const name of ['InlineIcon','BarIcon']) app.component(name,{render:()=>null})
 app.mount(host);vm=app._instance.setupState;await flush()
})
afterEach(()=>{app.unmount();host.remove()})
it('blocks the whole edit batch with one incomplete row and preserves draft on 422',async()=>{
 vm.selectedRecords=[1,2,3];vm.handleBatchEdit();await nextTick();vm.batchEditRows[1].值=' '
 await vm.submitBatchEdit();expect(mocks.batchUpdateCustomData).not.toHaveBeenCalled()
 expect(vm.batchEditRows).toHaveLength(3)
 vm.batchEditRows[1].值='new';mocks.batchUpdateCustomData.mockRejectedValueOnce({status:422,detail:{code:'validation_error',errors:[{row_index:1,field:'值',message:'server validation text'}]}})
 await vm.submitBatchEdit();expect(mocks.batchUpdateCustomData).toHaveBeenCalledTimes(1)
 expect(vm.batchEditRows[1].值).toBe('new');expect(vm.showBatchEditModal).toBe(true);await flush();expect(host.textContent).toContain('server validation text')
})
it('identifies same-timestamp records independently and locks before confirmation',async()=>{
 vm.selectedRecords=[2];vm.handleBatchEdit();expect(vm.batchEditRows[0].id).toBe(2)
 let confirm;mocks.showConfirm.mockImplementation(()=>new Promise(resolve=>{confirm=resolve}))
 const first=vm.submitBatchEdit();await vm.submitBatchEdit();expect(mocks.showConfirm).toHaveBeenCalledTimes(1)
 vm.batchEditRows[0].值='late change';confirm(true);mocks.batchUpdateCustomData.mockResolvedValue({updated_ids:[2]});await first
 expect(mocks.batchUpdateCustomData).toHaveBeenCalledTimes(1)
 expect(mocks.batchUpdateCustomData.mock.calls[0][0][0]).toMatchObject({id:2,version:1,值:'55'})
 expect(mocks.saveCustomData).not.toHaveBeenCalled()
})
it('does not clear delete selection on conflict and submits expected versions',async()=>{
 vm.selectedRecords=[2];mocks.batchDeleteCustomDataById.mockRejectedValue({status:409,detail:{code:'version_conflict'}})
 await vm.handleBatchDelete();expect(vm.selectedRecords).toEqual([2])
 expect(mocks.batchDeleteCustomDataById).toHaveBeenCalledWith([{id:2,version:1}])
})
it('requires an explicit merge and submits the latest version while retaining local values',async()=>{
 vm.selectedRecords=[2];vm.handleBatchEdit();vm.batchEditRows[0].值='my draft'
 mocks.batchUpdateCustomData.mockRejectedValueOnce({status:409,detail:{code:'version_conflict'}})
 await vm.submitBatchEdit();vm.mergeVersions([{...record,id:2,version:4,值:'server value'}])
 expect(vm.batchEditRows[0].值).toBe('my draft')
 mocks.batchUpdateCustomData.mockResolvedValueOnce({updated_ids:[2]});await vm.submitBatchEdit()
 expect(mocks.batchUpdateCustomData.mock.calls[1][0][0]).toMatchObject({id:2,version:4,值:'my draft'})
})
it('blocks 51 changes and safely confirms an unknown create with the identical body',async()=>{
 vm.batchRows=Array.from({length:51},()=>({...record,id:undefined,version:undefined}));await vm.submitBatchCreate()
 expect(mocks.saveCustomData).not.toHaveBeenCalled()
 vm.batchRows=[{...record,id:undefined,version:undefined}];mocks.saveCustomData.mockRejectedValueOnce(new TypeError('lost')).mockResolvedValueOnce({created_count:1,created:[{client_row_id:'a',id:8}]})
 await vm.submitBatchCreate();expect(vm.batchRows).toHaveLength(1);await vm.submitBatchCreate();expect(mocks.saveCustomData).toHaveBeenCalledTimes(1)
 await vm.retryMutation();expect(mocks.saveCustomData.mock.calls[0][0]).toEqual(mocks.saveCustomData.mock.calls[1][0]);expect(vm.batchRows).toEqual([])
})
it('does not repeat a confirmed write after a failed refresh',async()=>{
 vm.selectedRecords=[2];vm.handleBatchEdit();mocks.batchUpdateCustomData.mockResolvedValueOnce({updated_ids:[2]});mocks.getAllCustomData.mockRejectedValueOnce({message:'offline'})
 await vm.submitBatchEdit();expect(vm.showBatchEditModal).toBe(false);expect(mocks.batchUpdateCustomData).toHaveBeenCalledTimes(1)
 expect(vm.dataList).toHaveLength(3)
})
