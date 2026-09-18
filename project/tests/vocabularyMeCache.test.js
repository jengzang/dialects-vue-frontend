import { createApp, inject, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userStore } from '../src/main/store/store.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

const apiMocks = vi.hoisted(() => ({
  getVocabularyMe: vi.fn(),
}))

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  route: {
    path: '/menu/vocabulary/manage',
    query: {},
  },
}))

vi.mock('@/api', () => apiMocks)

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routerMocks.route,
  useRouter: () => ({
    push: routerMocks.push,
    replace: routerMocks.replace,
  }),
}))

vi.mock('@/components/common/BarIcon.vue', () => ({
  default: {
    name: 'BarIconStub',
    template: '<span />',
  },
}))

vi.mock('@/components/selector/ChoiceSelector.vue', () => ({
  default: {
    name: 'ChoiceSelectorStub',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<span data-testid="choice-selector" />',
  },
}))

vi.mock('@/utils/ui/message.js', () => ({
  showError: vi.fn(),
}))

const { default: VocabularyPage } = await import('../src/main/views/menu/VocabularyPage.vue')

const PermissionSink = {
  name: 'PermissionSink',
  props: [
    'vocabularyMe',
    'isLoadingVocabularyMe',
    'vocabularyMeError',
    'isAuthenticated',
    'isAuthReady',
  ],
  setup() {
    return {
      refreshVocabularyMe: inject('refreshVocabularyMe', null),
    }
  },
  methods: {
    serialize(value) {
      return JSON.stringify(value)
    },
  },
  template: `
    <div
      data-testid="permission-sink"
      :data-vocabulary-me="serialize(vocabularyMe)"
      :data-loading="String(isLoadingVocabularyMe)"
      :data-error="vocabularyMeError"
      :data-authenticated="String(isAuthenticated)"
      :data-auth-ready="String(isAuthReady)"
    >
      <button
        v-if="refreshVocabularyMe"
        type="button"
        @click="refreshVocabularyMe"
      >
        权限
      </button>
    </div>
  `,
}

function mountVocabularyPage() {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp(VocabularyPage)
  app.component('router-view', {
    name: 'RouterViewStub',
    setup(_, { slots }) {
      return () => slots.default?.({ Component: PermissionSink })
    },
  })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

async function flushPromises() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function resetUserStore() {
  userStore.role = 'user'
  userStore.isAuthenticated = true
  userStore.username = 'alice'
  userStore.id = 42
  userStore.authReady = true
  userStore.sessionStatus = 'authenticated'
}

beforeEach(() => {
  apiMocks.getVocabularyMe.mockReset()
  routerMocks.push.mockReset()
  routerMocks.replace.mockReset()
  routerMocks.route.path = '/menu/vocabulary/manage'
  routerMocks.route.query = {}
  localStorage.clear()
  document.body.innerHTML = ''
  resetUserStore()
})

describe('vocabulary permission cache', () => {
  it('uses cached permissions until the refresh permission button is clicked', async () => {
    const cachedPermission = {
      user_id: 42,
      permission_level: 'edit',
      can_upload: true,
      can_manage_entries: true,
      can_view_logs: false,
    }
    const refreshedPermission = {
      user_id: 42,
      permission_level: 'manage',
      can_upload: true,
      can_manage_entries: true,
      can_view_logs: true,
    }
    localStorage.setItem('vocabulary_me', JSON.stringify({
      owner_key: 'id:42',
      data: cachedPermission,
    }))
    apiMocks.getVocabularyMe.mockResolvedValueOnce(refreshedPermission)

    const wrapper = mountVocabularyPage()
    await flushPromises()

    expect(apiMocks.getVocabularyMe).not.toHaveBeenCalled()
    expect(JSON.parse(wrapper.host.querySelector('[data-testid="permission-sink"]').dataset.vocabularyMe)).toEqual(cachedPermission)

    const refreshButton = [...wrapper.host.querySelectorAll('button')]
      .find((button) => button.textContent.includes('权限'))
    expect(refreshButton).toBeTruthy()
    refreshButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(apiMocks.getVocabularyMe).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem('vocabulary_me'))).toEqual({
      owner_key: 'id:42',
      data: refreshedPermission,
    })
    expect(JSON.parse(wrapper.host.querySelector('[data-testid="permission-sink"]').dataset.vocabularyMe)).toEqual(refreshedPermission)

    wrapper.unmount()
  })

  it('keeps the refresh permission action near the edit permission request action', () => {
    const vocabularyPage = readSource('src/main/views/menu/VocabularyPage.vue')
    const vocabularyImportPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
    const zhHantWords = JSON.parse(readSource('src/i18n/locales/zh-Hant/words.json'))
    const zhCnWords = JSON.parse(readSource('src/i18n/locales/zh-CN/words.json'))
    const enWords = JSON.parse(readSource('src/i18n/locales/en/words.json'))

    expect(vocabularyPage).not.toContain('刷新权限')
    expect(vocabularyPage).not.toContain('权限')
    expect(vocabularyImportPage).toContain("inject('refreshVocabularyMe'")
    expect(vocabularyImportPage).toContain('canShowRefreshVocabularyPermission')
    expect(vocabularyImportPage).toContain('props.isAuthenticated')
    expect(vocabularyImportPage).toContain('class="action-btn action-btn--sm"')
    expect(vocabularyImportPage).toContain("t('words.wordList.access.refreshPermission')")
    expect(vocabularyImportPage).not.toContain('刷新权限')
    expect(vocabularyImportPage).not.toContain('requiresVocabularyPermission.value && Boolean(refreshVocabularyMe)')
    expect(vocabularyImportPage.indexOf("t('words.wordList.access.requestEditPermission')"))
      .toBeLessThan(vocabularyImportPage.indexOf("t('words.wordList.access.refreshPermission')"))
    expect(zhHantWords.wordList.access.refreshPermission).toBe('權限')
    expect(zhCnWords.wordList.access.refreshPermission).toBe('权限')
    expect(enWords.wordList.access.refreshPermission).toBe('Permission')
  })
})
