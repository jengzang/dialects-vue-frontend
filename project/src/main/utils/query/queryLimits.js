import { GET_LOCS_EXPLICIT_LOCATIONS_LIMIT } from '../../config/constants.js';

// 允许的 CJK 汉字 Unicode 区间
const CJK_IDEOGRAPH_RANGES = [
  [0x3400, 0x4DBF],   // Extension A
  [0x4E00, 0x9FFF],   // CJK Unified Ideographs
  [0xF900, 0xFAD9],   // CJK Compatibility Ideographs

  [0x20000, 0x2A6DF], // Extension B
  [0x2A700, 0x2B73F], // Extension C
  [0x2B740, 0x2B81D], // Extension D
  [0x2B820, 0x2CEAD], // Extension E
  [0x2CEB0, 0x2EBE0], // Extension F
  [0x2EBF0, 0x2EE5D], // Extension I

  [0x2F800, 0x2FA1D], // Compatibility Ideographs Supplement

  [0x30000, 0x3134A], // Extension G
  [0x31350, 0x323AF], // Extension H
  [0x323B0, 0x33479], // Extension J
];

function isAllowedCjkIdeograph(char) {
  const codePoint = char.codePointAt(0);
  if (codePoint == null) return false;

  return CJK_IDEOGRAPH_RANGES.some(
    ([start, end]) => codePoint >= start && codePoint <= end
  );
}

export function limitEffectiveChars(input, limit = 10) {
  const chars = Array.from(input ?? '');
  const seen = new Set();
  const effectiveChars = [];

  for (const char of chars) {
    if (!isAllowedCjkIdeograph(char)) {
      continue;
    }

    if (seen.has(char)) {
      continue;
    }

    seen.add(char);
    effectiveChars.push(char);
  }

  const limitedChars = effectiveChars.slice(0, limit);
  const hasExtraEffectiveChars = effectiveChars.length > limit;

  return {
    value: limitedChars.join(''),
    effectiveCount: limitedChars.length,
    hasExtraEffectiveChars,
    wasTrimmedAfterLimit: hasExtraEffectiveChars,
  };
}


export function buildExplicitLocationsForGetLocs({
  locations = [],
  customRegionLocations = [],
} = {}) {
  return [...new Set([...(locations || []), ...(customRegionLocations || [])].filter(Boolean))];
}

export function isExplicitLocationsLimitExceeded(
  explicitLocations,
  limit = GET_LOCS_EXPLICIT_LOCATIONS_LIMIT,
) {
  return (explicitLocations || []).length > limit;
}
