// Bidirectional character equivalence used when a canonical form is uncertain.
export const customVariantDict = Object.freeze({
  淸: '清', 鄕: '鄉', 鐵: '鉄', 髙: '高', 郞: '郎', 屛: '屏',
  靑: '青', 尙: '尚', 郉: '邢', 楡: '榆', 峯: '峰', 鎭: '鎮',
  巖: '岩', 黃: '黃', 甯: '寧',
})

const variantGroups = new Map()
for (const [left, right] of Object.entries(customVariantDict)) {
  if (!variantGroups.has(left)) variantGroups.set(left, new Set([left]))
  if (!variantGroups.has(right)) variantGroups.set(right, new Set([right]))
  variantGroups.get(left).add(right)
  variantGroups.get(right).add(left)
}

export function getVariantCandidates(value) {
  const chars = Array.from(String(value ?? ''))
  return chars.reduce((candidates, char) => {
    const variants = variantGroups.get(char) || new Set([char])
    return candidates.flatMap(prefix => [...variants].map(variant => `${prefix}${variant}`))
  }, [''])
}

export function areVariantEquivalent(left, right) {
  const leftChars = Array.from(String(left ?? ''))
  const rightChars = Array.from(String(right ?? ''))
  return leftChars.length === rightChars.length && leftChars.every((char, index) =>
    (variantGroups.get(char) || new Set([char])).has(rightChars[index])
  )
}
