import { createApp, defineComponent, h } from 'vue'
import { it,expect,vi } from 'vitest'
const shared=vi.hoisted(()=>({state:null}))
vi.mock('vue-router',()=>({onBeforeRouteLeave:vi.fn()}))
vi.mock('vue-i18n',()=>({useI18n:()=>({t:key=>key})}))
vi.mock('@/components/common/AppModal.vue',()=>({default:defineComponent({setup:(_, {slots})=>()=>h('section',[slots.header?.(),slots.default?.()])})}))
vi.mock('@/main/components/map/custom/point/PointCentricMode.vue',async()=>{
 const {useCustomDataSave}=await import('@/main/composables/useCustomDataSave.js')
 return {default:defineComponent({setup(){shared.state=useCustomDataSave(async()=>{throw new TypeError('lost response')});return ()=>h('div')}})}
})
vi.mock('@/main/components/map/custom/feature/FeatureCentricMode.vue',()=>({default:{render:()=>null}}))
import CustomDataEntryModal from '@/main/components/map/custom/CustomDataEntryModal.vue'
it('blocks the outer close button, escape model update and mode changes while a child outcome is unknown',async()=>{
 const close=vi.fn();const host=document.createElement('div');document.body.append(host)
 const app=createApp(CustomDataEntryModal,{modelValue:true,'onUpdate:modelValue':close});app.mount(host)
 try {
  await shared.state.save({creates:[{client_row_id:'a'}],updates:[],deletes:[]})
  const body=shared.state.getSnapshot();const vm=app._instance.setupState
  vm.closeModal();vm.handleVisibleChange(false)
  expect(close).not.toHaveBeenCalled()
  expect(vm.modalSessionKey).toBe(0)
  expect([...host.querySelectorAll('.entry-mode-button')].every(button=>button.disabled)).toBe(true)
  expect(shared.state.getSnapshot()).toBe(body)
 } finally {app.unmount();host.remove()}
})
