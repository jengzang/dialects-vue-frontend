import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('Leaderboard notes endpoint', () => {
  it('shows the notes endpoint in the character-tone category with localized labels', () => {
    const component = readSource('src/main/components/user/LeaderboardPanel.vue')

    expect(component).toContain("key: 'endpoint__api_notes'")
    expect(component).toContain("t('user.leaderboard.categories.charsTones.items.notes')")

    const localeLabels = {
      'src/i18n/locales/zh-CN/user.json': '查注释',
      'src/i18n/locales/zh-Hant/user.json': '查註釋',
      'src/i18n/locales/en/user.json': 'Annotation Queries',
    }

    Object.entries(localeLabels).forEach(([path, label]) => {
      const messages = JSON.parse(readSource(path))
      expect(messages.leaderboard.categories.charsTones.items.notes).toBe(label)
    })
  })
})
