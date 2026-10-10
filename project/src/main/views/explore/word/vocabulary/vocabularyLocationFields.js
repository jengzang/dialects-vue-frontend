export const TONE_FIELD_KEYS = Array.from({ length: 10 }, (_, index) => `t${index + 1}`)

export const TONE_SOURCE_KEYS = [
  'T1陰平', 'T2陽平', 'T3陰上', 'T4陽上', 'T5陰去',
  'T6陽去', 'T7陰入', 'T8陽入', 'T9其他調', 'T10輕聲',
]

export const LOCATION_BASE_FIELDS = [
  {
    key: 'location_name',
    labelKey: 'words.wordList.upload.locationName',
    placeholderKey: 'words.wordList.upload.locationNamePlaceholder',
    required: true
  },
  {
    key: 'coordinates',
    labelKey: 'words.wordList.upload.coordinates',
    placeholderKey: 'words.wordList.upload.coordinatesPlaceholder',
    required: true
  },
  { key: 'province', labelKey: 'words.wordList.upload.province' },
  { key: 'city', labelKey: 'words.wordList.upload.city' },
  { key: 'county', labelKey: 'words.wordList.upload.county' },
  { key: 'town', labelKey: 'words.wordList.upload.town' },
  { key: 'administrative_village', labelKey: 'words.wordList.upload.administrativeVillage' },
  { key: 'natural_village', labelKey: 'words.wordList.upload.naturalVillage' },
  { key: 'yindian_region', labelKey: 'words.wordList.upload.yindianRegion' },
  { key: 'atlas_region', labelKey: 'words.wordList.upload.atlasRegion' },
  { key: 'vocabulary_source', labelKey: 'words.wordList.upload.vocabularySource' },
  { key: 'description', labelKey: 'words.wordList.upload.description' },
  { key: 'other', labelKey: 'words.wordList.upload.other' },
]

export const TONE_FIELDS = TONE_FIELD_KEYS.map((key) => ({
  key,
  labelKey: `words.wordList.upload.toneNames.${key}`,
}))
