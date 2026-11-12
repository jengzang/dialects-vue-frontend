import { createApp, h, nextTick, defineComponent } from 'vue'
import { beforeEach,afterEach,it,expect,vi } from 'vitest'
const mocks=vi.hoisted(()=>({saveCustomData:vi.fn(),batchUpdateCustomData:vi.fn(),getDataByPoint:vi.fn(),getDataByFeature:vi.fn(),getUserPoints:vi.fn(),batchMatch:vi.fn(),getRegions:vi.fn()}))
vi.mock('@/api',()=>mocks)
vi.mock('@/api/main/user/custom-data.js',()=>({getAllCustomData:vi.fn()}))
vi.mock('@/main/store/store.js',()=>({userStore:{username:'user'}}))
vi.mock('@/composables/data/useCustomDataPresence.js',()=>({ensureCustomDataPresence:vi.fn().mockResolvedValue(true),invalidateCustomDataPresence:vi.fn(),markCustomDataExists:vi.fn()}))
vi.mock('@/utils/ui/message.js',()=>({showConfirm:vi.fn().mockResolvedValue(true),showWarning:vi.fn()}))
vi.mock('vue-i18n',()=>({useI18n:()=>({t:(key,args)=>key+JSON.stringify(args||{})})}))
vi.mock('vue-router',()=>({onBeforeRouteLeave:vi.fn()}))
vi.mock('@/main/components/map/MiniMapSelector.vue',()=>({default:{render:()=>null}}))
vi.mock('@/components/common/AppModal.vue',()=>({default:defineComponent({props:['modelValue'],setup:(props,{slots})=>()=>props.modelValue?h('section',[slots.default?.(),slots.footer?.()]):null})}))
import PointDetailForm from '@/main/components/map/custom/point/PointDetailForm.vue'
import FeatureRecordEditorModal from '@/main/components/map/custom/feature/FeatureRecordEditorModal.vue'
const record={id:7,簡稱:'甲',音典分區:'區',經緯度:'113.000000,23.000000',聲韻調:'',特徵:'調',值:'55',說明:''}
let app,host,vm,onSaved
const flush=async()=>{for(let i=0;i<10;i++) await Promise.resolve();await nextTick()}
beforeEach(async()=>{
 vi.clearAllMocks();mocks.getDataByPoint.mockResolvedValue({data:[record]});mocks.getUserPoints.mockResolvedValue({data:[]})
 onSaved=vi.fn();host=document.createElement('div');document.body.append(host);app=createApp(PointDetailForm,{point:record,onSaved});app.component('InlineIcon',{render:()=>null});app.mount(host);vm=app._instance.setupState;await flush()
})
afterEach(()=>{app.unmount();host.remove()})
it('saves location-only changes once and keeps id',async()=>{
 vm.location='乙';mocks.saveCustomData.mockResolvedValue({created:[],updated_ids:[7],deleted_ids:[]})
 await vm.handleSave()
 expect(mocks.saveCustomData).toHaveBeenCalledTimes(1)
 expect(mocks.saveCustomData.mock.calls[0][0]).toMatchObject({updates:[{id:7,簡稱:'乙'}],creates:[],deletes:[]})
 expect(onSaved).toHaveBeenCalledTimes(1)
})
it('blocks cleared existing rows and preserves all draft/deletes after failed save',async()=>{
 vm.rows[0].值='';await vm.handleSave();expect(mocks.saveCustomData).not.toHaveBeenCalled()
 vm.rows[0].值='new';vm.addRow();vm.rows[1].特徵='new feature';vm.rows[1].值='new value';vm.removeRow(vm.rows[0].clientRowId)
 mocks.saveCustomData.mockRejectedValue({status:422,detail:{code:'invalid'}});await vm.handleSave()
 expect(vm.rows[0].值).toBe('new value');expect(vm.removedIds).toEqual([{id:7}]);expect(onSaved).not.toHaveBeenCalled()
})
it('replays lost response with same key/body while locked and emits saved once',async()=>{
 vm.rows[0].值='new';mocks.saveCustomData.mockRejectedValueOnce(new TypeError('lost')).mockResolvedValueOnce({created:[],updated_ids:[7],deleted_ids:[]})
 await vm.handleSave();expect(vm.locked).toBe(true);await vm.handleSave();expect(mocks.saveCustomData).toHaveBeenCalledTimes(1)
 await vm.retrySave();expect(mocks.saveCustomData.mock.calls[0][0]).toEqual(mocks.saveCustomData.mock.calls[1][0]);expect(onSaved).toHaveBeenCalledTimes(1)
})
it('drops a late detail read after a new location is selected',async()=>{
 let resolve;mocks.getDataByPoint.mockImplementationOnce(()=>new Promise(r=>{resolve=r}))
 const pending=vm.loadPointDetail({...record,簡稱:'舊'});await vm.loadPointDetail({...record,簡稱:'新'});resolve({data:[{...record,id:9,簡稱:'舊'}]});await pending
 expect(vm.location).toBe('新');expect(vm.rows[0].recordId).toBe(7)
})

it('feature editor updates by ID and keeps the modal and draft after failure',async()=>{
 app.unmount();host.innerHTML='';onSaved=vi.fn()
 app=createApp(FeatureRecordEditorModal,{modelValue:true,record,feature:{特徵:'調',聲韻調:''},onSaved});app.mount(host);vm=app._instance.setupState;await flush()
 vm.valueField='my value';mocks.batchUpdateCustomData.mockRejectedValueOnce({status:422,detail:{code:'invalid'}})
 await vm.handleSave();expect(vm.valueField).toBe('my value');expect(vm.isSaving).toBe(false);expect(onSaved).not.toHaveBeenCalled()
 expect(mocks.batchUpdateCustomData.mock.calls[0][0][0]).toMatchObject({id:7,值:'my value'})
})
it('feature editor creates through idempotent save and confirms the same lost response',async()=>{
 app.unmount();host.innerHTML='';onSaved=vi.fn()
 app=createApp(FeatureRecordEditorModal,{modelValue:true,record:null,feature:{特徵:'調',聲韻調:''},onSaved});app.mount(host);vm=app._instance.setupState;await flush()
 vm.location='乙';vm.region='區';await flush();vm.coord=[113,23];vm.valueField='new'
 mocks.saveCustomData.mockRejectedValueOnce(new TypeError('lost')).mockResolvedValueOnce({created_count:1})
 await vm.handleSave();expect(vm.locked).toBe(true);await vm.handleSave();expect(mocks.saveCustomData).toHaveBeenCalledTimes(1)
 await vm.retrySave();expect(mocks.saveCustomData.mock.calls[0][0]).toEqual(mocks.saveCustomData.mock.calls[1][0]);expect(onSaved).toHaveBeenCalledTimes(1)
})
