import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const supportPopupPath = resolve(projectRoot, 'src/main/components/user/popups/SupportPopup.vue')
const homeSupportPopupPath = resolve(projectRoot, 'src/main/components/popup/HomeSupportPopup.vue')
const homePagePath = resolve(projectRoot, 'src/main/views/HomePage.vue')
const likeAuthorPath = resolve(projectRoot, 'src/main/views/intro/LikeAuthor.vue')
const aboutPagePath = resolve(projectRoot, 'src/main/views/menu/support/AboutPage.vue')
const zhCnHomeLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/home.json')
const zhHantHomeLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/home.json')
const enHomeLocalePath = resolve(projectRoot, 'src/i18n/locales/en/home.json')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function readJson(path) {
  return JSON.parse(readSource(path))
}

describe('support popup unification', () => {
  it('renames the homepage popup component to SupportPopup', () => {
    expect(existsSync(supportPopupPath)).toBe(true)
    expect(existsSync(homeSupportPopupPath)).toBe(false)
  })

  it('keeps the shared popup content and donor list scaffolding in SupportPopup', () => {
    const source = readSource(supportPopupPath)

    expect(source).toContain("t('home.supportModal.title')")
    expect(source).toContain("t('home.supportModal.subtitle')")
    expect(source).toContain("t('home.supportModal.weixinLabel')")
    expect(source).toContain("t('home.supportModal.alipayLabel')")
    expect(source).toContain("t('home.supportModal.donorThanks')")
    expect(source).toContain("t('home.supportModal.donorColumns.time')")
    expect(source).toContain("t('home.supportModal.donorColumns.donor')")
    expect(source).toContain("t('home.supportModal.donorColumns.amount')")
    expect(source).toContain("t('home.supportModal.donorColumns.method')")
    expect(source).toContain('<table class="donor-table">')
    expect(source).toContain('const donors = [')
    expect(source).toContain("amount: '100.00'")
    expect(source).toContain("amount: '9.90'")
    expect(source).toContain("amount: '1.00'")
    expect(source).toContain("amount: '7.00'")
    expect(source).not.toContain("amount: '100元'")
    expect(source).not.toContain("amount: '1元'")
    expect(source).toContain('const sortedDonors = [...donors].sort((left, right) =>')
    expect(source).toContain('new Date(left.sortTime) - new Date(right.sortTime)')
  })

  it('updates the homepage to import the renamed SupportPopup component', () => {
    const source = readSource(homePagePath)

    expect(source).toContain("import('@/main/components/user/popups/SupportPopup.vue')")
    expect(source).not.toContain("import('@/main/components/popup/HomeSupportPopup.vue')")
    expect(source).toContain('<SupportPopup')
  })

  it('keeps the like-author entry in AboutPage and opens the shared popup', () => {
    expect(existsSync(likeAuthorPath)).toBe(false)
    const source = readSource(aboutPagePath)
    expect(source).toContain('v-if="currentTab === \'like\'"')
    expect(source).toContain(':visible="showQRCodes"')
    expect(source).toContain('@close="showQRCodes = false"')
  })

  it('replaces the inline AboutPage modal with the shared SupportPopup component', () => {
    const source = readSource(aboutPagePath)

    expect(source).toContain("import SupportPopup from '@/main/components/user/popups/SupportPopup.vue'")
    expect(source).toContain('<SupportPopup')
    expect(source).not.toContain('<AppModal')
  })

  it('adds donor thanks and table column labels to all three home locale files', () => {
    const zhCn = readJson(zhCnHomeLocalePath)
    const zhHant = readJson(zhHantHomeLocalePath)
    const en = readJson(enHomeLocalePath)

    expect(zhCn.supportModal.donorThanks).toBeTruthy()
    expect(zhHant.supportModal.donorThanks).toBeTruthy()
    expect(en.supportModal.donorThanks).toBeTruthy()

    expect(zhCn.supportModal.donorColumns).toEqual({
      time: expect.any(String),
      donor: expect.any(String),
      amount: expect.any(String),
      method: expect.any(String),
    })
    expect(zhHant.supportModal.donorColumns).toEqual({
      time: expect.any(String),
      donor: expect.any(String),
      amount: expect.any(String),
      method: expect.any(String),
    })
    expect(en.supportModal.donorColumns).toEqual({
      time: expect.any(String),
      donor: expect.any(String),
      amount: expect.any(String),
      method: expect.any(String),
    })

    expect(zhCn.supportModal.donorColumns.amount).toBe('金额(元)')
    expect(zhHant.supportModal.donorColumns.amount).toBe('金額(元)')
    expect(en.supportModal.donorColumns.amount).toBe('Amount (CNY)')
  })
})
