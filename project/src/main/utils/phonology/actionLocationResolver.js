function normalizeCandidateLocations(locations) {
  return Array.from(
    new Set(
      (Array.isArray(locations) ? locations : [locations])
        .map(location => String(location || '').trim())
        .filter(Boolean)
    )
  )
}

function normalizeResolvedLocations(payload, limit) {
  const locations = Array.isArray(payload?.locations_result)
    ? payload.locations_result
    : []

  return Array.from(new Set(locations))
    .filter(Boolean)
    .slice(0, limit)
}

export async function resolvePhonologyActionLocations(locations, getLocations, { limit = Infinity } = {}) {
  const candidates = normalizeCandidateLocations(locations)
  if (candidates.length === 0) return []

  const payload = await getLocations({ locations: candidates })
  return normalizeResolvedLocations(payload, limit)
}

export async function resolvePhonologyActionLocation({ detailRow, fallbackName }, getLocations) {
  const candidate = String(detailRow?.['簡稱'] || fallbackName || '').trim()

  const [resolvedLocation = ''] = await resolvePhonologyActionLocations(
    [candidate],
    getLocations,
    { limit: 1 }
  )

  return resolvedLocation
}
