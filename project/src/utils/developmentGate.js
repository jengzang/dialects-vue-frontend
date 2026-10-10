const blockedFeatures = new Set()

export function blockDevelopmentFeature(feature) {
  if (feature) blockedFeatures.add(feature)
}

export function isDevelopmentBlocked(feature) {
  return Boolean(feature) && blockedFeatures.has(feature)
}
