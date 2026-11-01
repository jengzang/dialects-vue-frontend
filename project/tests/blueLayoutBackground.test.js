import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createBackgroundMapTransform,
  getBackgroundLayout,
  getSurveyPoints,
  loadBackgroundGeography,
  projectBackgroundPoint,
} from '../src/utils/ui/blueLayoutBackground.js'

const country = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/gis/china_country.geojson'), 'utf8'))

describe('blue layout background geography', () => {
  it('projects north upwards and east to the right, using the same transform for points and boundaries', () => {
    const box = { x: 120, y: 80, width: 750, height: 900 }
    const transform = createBackgroundMapTransform(country, box)
    const south = transform.point(105, 20)
    const north = transform.point(105, 45)
    expect(north[1]).toBeLessThan(south[1])
    expect(transform.point(125, 30)[0]).toBeGreaterThan(transform.point(90, 30)[0])
    for (const feature of country.features) {
      for (const polygon of feature.geometry.coordinates) {
        for (const ring of polygon) {
          for (const [lon, lat] of ring) {
            const [x, y] = transform.point(lon, lat)
            expect(x).toBeGreaterThanOrEqual(box.x - .001)
            expect(x).toBeLessThanOrEqual(box.x + box.width + .001)
            expect(y).toBeGreaterThanOrEqual(box.y - .001)
            expect(y).toBeLessThanOrEqual(box.y + box.height + .001)
          }
        }
      }
    }
    expect(projectBackgroundPoint(105, 45)[1]).toBeLessThan(projectBackgroundPoint(105, 20)[1])
  })

  it('reads survey coordinates by field name and rejects missing or invalid coordinates', () => {
    expect(getSurveyPoints({ fields: ['lat', '語言', 'lon'], data: [
      [30, '甲', 110], [null, '乙', 115], [25, '丙', ''], [91, '丁', 110], [20, '戊', 181],
    ] })).toEqual([[110, 30]])
  })

  it('selects compositions by aspect ratio and keeps the map inside varied viewports without stretching', () => {
    for (const [width, height] of [[2560,1440],[1440,900],[844,390],[1080,2340],[390,844],[768,1024],[1000,1000]]) {
      const layout = getBackgroundLayout(width, height)
      expect(layout.portrait).toBe(height >= width)
      const transform = createBackgroundMapTransform(country, layout.map)
      expect(transform.bounds.x).toBeGreaterThanOrEqual(0)
      expect(transform.bounds.x + transform.bounds.width).toBeLessThanOrEqual(width + .001)
      expect(layout.book.y + layout.book.height).toBeGreaterThan(height)
      expect(layout.book.x).toBeLessThan(0)
      expect(layout.quote.fontSize).toBeLessThan(height * .08)
    }
  })

  it('loads actual project geography and current dots; a failed optional layer does not hide the country', async () => {
    const fetcher = vi.fn(async url => ({
      ok: !url.includes('rivers_l3'),
      json: async () => url.endsWith('dots.json') ? { fields: ['lon', 'lat'], data: [[110, 30]] } : country,
    }))
    const data = await loadBackgroundGeography(fetcher)
    expect(fetcher).toHaveBeenCalledTimes(6)
    expect(data.country).toEqual(country)
    expect(data.rivers[2]).toBeNull()
    expect(getSurveyPoints(data.dots)).toEqual([[110, 30]])
  })
})
