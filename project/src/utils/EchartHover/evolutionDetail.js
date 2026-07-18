const TOP_LEVEL_CHAR_LIMIT = 15;
const LEVEL2_CHAR_LIMIT = 10;

function buildCharPreview(chars, limit) {
  const charList = Array.isArray(chars) ? chars : [];
  return {
    displayChars: charList.slice(0, limit),
    remainingChars: Math.max(0, charList.length - limit),
  };
}

export function buildEvolutionMobileDetail({ pie, pieIndex, itemIndex }) {
  const items = Array.isArray(pie?.level1)
    ? pie.level1
    : Array.isArray(pie?.phonetic_values)
      ? pie.phonetic_values
      : [];

  const item = items[itemIndex];
  if (!item) {
    return null;
  }

  const level2Items = Array.isArray(item.level2)
    ? item.level2.map((level2Item) => ({
      label: level2Item.label,
      count: level2Item.count ?? 0,
      percent: level2Item.percent ?? '0',
      ...buildCharPreview(level2Item.chars, LEVEL2_CHAR_LIMIT),
    }))
    : [];

  const topLevelChars = level2Items.length > 0
    ? { displayChars: [], remainingChars: 0 }
    : buildCharPreview(item.chars, TOP_LEVEL_CHAR_LIMIT);

  return {
    key: `${pieIndex}:${itemIndex}`,
    pieIndex,
    itemIndex,
    pieTitle: pie?.value ?? pie?.level1_value ?? '',
    title: item.label ?? item.value ?? '',
    count: item.count ?? 0,
    percent: item.percent ?? '0',
    level2Items,
    ...topLevelChars,
  };
}

export function isSameEvolutionMobileDetail(currentDetail, nextDetail) {
  return Boolean(
    currentDetail
    && nextDetail
    && currentDetail.pieIndex === nextDetail.pieIndex
    && currentDetail.itemIndex === nextDetail.itemIndex
  );
}
