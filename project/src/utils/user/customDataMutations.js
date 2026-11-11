export const EDITABLE_FIELDS = ['簡稱', '音典分區', '經緯度', '聲韻調', '特徵', '值', '說明']
const REQUIRED = ['簡稱', '音典分區', '經緯度', '特徵', '值']
const LIMITS = { 簡稱: 200, 音典分區: 200, 經緯度: 100, 聲韻調: 100, 特徵: 200, 值: 4000, 說明: 4000 }
export const editableRecord = row => Object.fromEntries(EDITABLE_FIELDS.map(field => [field, String(row[field] ?? '').trim()]))
export const isEmptyNewRow = row => EDITABLE_FIELDS.every(field => !String(row[field] ?? '').trim())
export function validateRows(rows, { creates = false } = {}) {
  const errors = [], items = [], ids = new Set()
  rows.forEach((row, row_index) => {
    if (creates && isEmptyNewRow(row)) return
    const item = editableRecord(row)
    for (const field of EDITABLE_FIELDS) {
      if (REQUIRED.includes(field) && !item[field]) errors.push({ row_index, field, messageKey: 'required' })
      if ([...item[field]].length > LIMITS[field]) errors.push({ row_index, field, messageKey: 'length' })
    }
    const parts = item.經緯度.split(/[,，]/).map(value => value.trim())
    const [lng, lat] = parts.map(Number)
    if (parts.length !== 2 || parts.some(v => !v) || !Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) errors.push({ row_index, field: '經緯度', messageKey: 'coordinates' })
    if (!creates) {
      if (!Number.isSafeInteger(row.id) || row.id <= 0 || !Number.isSafeInteger(row.version) || row.version <= 0) errors.push({ row_index, field: 'id', messageKey: 'unavailable' })
      if (ids.has(row.id)) errors.push({ row_index, field: 'id', messageKey: 'duplicate' })
      ids.add(row.id)
      items.push({ id: row.id, version: row.version, ...item })
    } else items.push({ client_row_id: row.client_row_id || crypto.randomUUID(), ...item })
  })
  if (items.length > 50) errors.unshift({ row_index: 0, field: '', messageKey: 'limit' })
  return { items, errors }
}
export function customDataRowErrors(error) {
  const rows=error?.detail?.errors || error?.errors || []
  return rows.map(row=>({ ...row, row_index:Number.isInteger(row.row_index)?row.row_index:0, field:String(row.field || '') }))
}
function comparableField(row, field) {
  const value=String(row[field] ?? '').trim()
  return field === '經緯度' ? value.split(/[,，]/).map(Number).join(',') : value
}
export function buildPointMutations(rows, base, deletes) {
  const creates = [], updates = [], errors = []
  rows.forEach((row, index) => {
    const exists = row.recordId != null
    if (!exists && ['聲韻調','特徵','值','說明'].every(f => !String(row[f] ?? '').trim())) return
    const record = { ...row, ...base, id: row.recordId, client_row_id: row.clientRowId }
    const result = validateRows([record], { creates: !exists })
    errors.push(...result.errors.map(error => ({...error,row_index:index})))
    if (!exists) creates.push(...result.items)
    else if (!row.original || EDITABLE_FIELDS.some(field => comparableField(record,field) !== comparableField(row.original,field))) updates.push(...result.items)
  })
  const ids = new Set()
  for (const item of [...updates, ...deletes]) {
    if (ids.has(item.id)) errors.push({row_index:0,field:'id',messageKey:'duplicate'})
    ids.add(item.id)
    if (!Number.isSafeInteger(item.id) || item.id <= 0 || !Number.isSafeInteger(item.version) || item.version <= 0) errors.push({row_index:0,field:'id',messageKey:'unavailable'})
  }
  if (creates.length + updates.length + deletes.length > 50) errors.unshift({row_index:0,field:'',messageKey:'limit'})
  if (errors.length) throw Object.assign(new Error('validation'), { errors })
  return { creates, updates, deletes: deletes.map(({id,version})=>({id,version})) }
}
export function formatCustomDataTime(value, locale = 'zh-CN', timeZone) {
  if (!value || typeof value !== 'string') return '-'
  let text = value.trim().replace(' ', 'T')
  if (!/([zZ]|[+-]\d{2}:?\d{2})$/.test(text)) text += 'Z'
  const date = new Date(text)
  if (!Number.isFinite(date.getTime())) return '-'
  try { return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit', ...(timeZone ? {timeZone} : {})}).format(date) } catch { return '-' }
}
