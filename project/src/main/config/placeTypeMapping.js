// place_type_code → { place_type_name, level1, level2, level3 } mapping
// Full mapping to be provided — this file contains the sample entries.

const MAPPING = {
  "11100": {
    "place_type_name": "海洋",
    "level1": { "code": "1", "name": "自然地理实体" },
    "level2": { "code": "11", "name": "海洋" },
    "level3": { "code": "11A", "name": "海域" }
  }
  // TODO: full mapping
}

export function getPlaceTypeInfo(code) {
  return MAPPING[code] || null
}

export default MAPPING
