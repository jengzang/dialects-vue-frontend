<template>
  <div
    v-if="state.error.value || state.status.value === 'unknown'"
    class="custom-data-save-notice glass-subpanel"
    role="alert"
  >
    <p>{{ notice }}</p>
    <p v-if="validationError">
      {{ t('user.customSafety.rowError', { row: validationError.row_index + 1, field: validationError.field, reason: validationError.message || t(`user.customSafety.${validationError.messageKey}`) }) }}
    </p>
    <button
      v-if="state.status.value === 'unknown' && retryable"
      type="button"
      class="glass-button"
      @click="$emit('retry')"
    >
      {{ t('user.customSafety.retry') }}
    </button>
    <button
      type="button"
      class="glass-button"
      :disabled="reading"
      @click="readCurrent"
    >
      {{ t('user.customSafety.reread') }}
    </button>
    <p v-if="readError">
      {{ t('user.customSafety.refreshFailed') }}
    </p>
    <div
      v-if="current !== null"
      class="save-comparison"
    >
      <div><strong>{{ t('user.customSafety.localDraft') }}</strong><pre>{{ state.getSnapshot() }}</pre></div>
      <div><strong>{{ t('user.customSafety.serverRecords') }}</strong><pre>{{ current }}</pre></div>
    </div>
    <button
      v-if="current !== null && state.status.value === 'unknown' && !state.getSnapshot()?.creates?.length"
      type="button"
      class="glass-button"
      @click="$emit('merge', current)"
    >
      {{ t('user.customSafety.merge') }}
    </button>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { customDataRowErrors } from '@/utils/user/customDataMutations.js'
import { getAllCustomData } from '@/api/main/user/custom-data.js'
const props = defineProps({state:{type:Object,required:true}, retryable:{type:Boolean,default:true}})
defineEmits(['retry','merge'])
const {t}=useI18n()
const current=ref(null),reading=ref(false),readError=ref(false)
const code=computed(()=>props.state.error.value?.detail?.code)
const validationError=computed(()=>customDataRowErrors(props.state.error.value)[0])
const notice=computed(()=>t(`user.customSafety.${code.value === 'receipt_expired' ? 'expired' : props.state.status.value === 'unknown' ? 'unknown' : props.state.error.value?.status === 404 ? 'unavailable' : 'failed'}`))
async function readCurrent(){
 reading.value=true;readError.value=false
 try {
  const response=await getAllCustomData()
  const snapshot=props.state.getSnapshot()
  const ids=new Set([...(snapshot?.updates||[]),...(snapshot?.deletes||[])].map(r=>r.id))
  const locations=new Set((snapshot?.creates||[]).map(r=>r.簡稱))
  current.value=(response.data||[]).filter(row=>ids.has(row.id)||locations.has(row.簡稱))
 } catch {readError.value=true} finally {reading.value=false}
}
</script>
<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
.custom-data-save-notice { padding:12px; margin:12px 0; }
.save-comparison { display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px; }
pre { white-space:pre-wrap;overflow:auto;max-height:300px;font-size:var(--font-size-12); }
</style>
