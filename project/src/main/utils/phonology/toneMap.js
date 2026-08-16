/**
 * 從 locationdetail 的 T1陰平…T10輕聲 欄位構造調值映射。
 *
 * 原始單元格格式為「調值+調類」，如 `55陰平`、`5上陰入`，且陰入可能
 * 再細分並用逗號並列：`[7a]5上陰入,[7b]3下陰入`。因此不能把整格當成
 * 單一調值，需按逗號拆分，並從每段提取「調值 / 調類 / 調號」。
 *
 * 輸出結構：{ 調類名: { category, value, number } }，供 HomophoneLexicon
 * 做調類 / 調值 / 調號 三態切換。key 使用單元格內嵌的調類名（與
 * phonology_matrix 的聲調軸命名一致，如上陰入、陰上、上、去…）。
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

function parseToneElement(element, defaultNumber, fallbackCategory) {
  const trimmed = String(element || '').trim()
  if (!trimmed) return null

  let number = defaultNumber
  let body = trimmed

  const bracket = trimmed.match(/^\[([0-9a-zA-Z]+)\](.*)$/)
  if (bracket) {
    number = bracket[1]
    body = bracket[2]
  }

  const valueMatch = body.match(/^(`?[\d/-]+)(.*)$/)
  if (!valueMatch) return null

  const value = valueMatch[1].replace(/`/g, '')
  const category = valueMatch[2].trim() || fallbackCategory

  return { category, value, number }
}

export function buildToneMapFromDetail(row) {
  const map = {}
  if (!row) return map

  for (const [field, fallbackCategory, defaultNumber] of TONE_FIELDS) {
    const raw = row[field]
    if (!raw) continue

    const rawStr = String(raw).trim()
    if (!rawStr || rawStr === '無' || rawStr === '无') continue

    const elements = rawStr.split(/[，,|;]/)
    for (const element of elements) {
      const parsed = parseToneElement(element, defaultNumber, fallbackCategory)
      if (!parsed) continue

      if (!map[parsed.category]) {
        map[parsed.category] = {
          category: parsed.category,
          value: parsed.value,
          number: parsed.number
        }
      }
    }
  }

  return map
}
