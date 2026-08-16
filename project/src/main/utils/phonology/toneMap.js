/**
 * 從 locationdetail 的 T1陰平…T10輕聲 欄位構造調值映射。
 *
 * 結構：{ 調類名: { category, value, number } }，供 HomophoneLexicon 做
 * 調類 / 調值 / 調號 三態切換。
 */

const TONE_FIELDS = [
  ['T1陰平', '陰平', '1'],
  ['T2陽平', '陽平', '2'],
  ['T3陰上', '陰上', '3'],
  ['T4陽上', '陽上', '4'],
  ['T5陰去', '陰去', '5'],
  ['T6陽去', '陽去', '6'],
  ['T7陰入', '陰入', '7'],
  ['T8陽入', '陽入', '8'],
  ['T9其他調', '其他調', '9'],
  ['T10輕聲', '輕聲', '10']
]

export function buildToneMapFromDetail(row) {
  const map = {}
  if (!row) return map

  for (const [field, category, number] of TONE_FIELDS) {
    const raw = row[field]
    if (!raw || raw === '無' || raw === '无') continue
    const value = String(raw).replace(/`/g, '')
    map[category] = { category, value, number }
  }

  return map
}
