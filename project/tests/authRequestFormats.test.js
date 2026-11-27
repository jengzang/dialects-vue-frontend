import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ api: vi.fn(), saveToken: vi.fn(), ensureAuthenticated: vi.fn(), updateUser: vi.fn() }))
vi.mock('../src/api/auth/httpClient.js', () => ({ api: mocks.api }))
vi.mock('../src/api/auth/tokenStorage.js', () => ({ saveToken: mocks.saveToken }))
vi.mock('../src/api/auth/session.js', () => ({ clearSession: vi.fn(), ensureAuthenticated: mocks.ensureAuthenticated, update_userdatas_bytoken: mocks.updateUser }))
import { loginUser, updateUsername, updatePassword } from '../src/api/auth/actions.js'

beforeEach(() => { vi.clearAllMocks(); mocks.api.mockResolvedValue({ access_token: 'a', refresh_token: 'r' }) })

it('sends login and profile changes as JSON', async () => {
  await loginUser({ username: '用戶', password: 'secret' })
  await loginUser({ email: 'a@example.com', password: 'secret' })
  await updateUsername('新名', 'a@example.com')
  await updatePassword({ currentPassword: 'old', newPassword: 'new', email: 'a@example.com' })
  const expected = [
    ['/api/auth/login', { username: '用戶', password: 'secret' }],
    ['/api/auth/login', { username: 'a@example.com', password: 'secret' }],
    ['/api/auth/updateProfile', { username: '新名', email: 'a@example.com' }],
    ['/api/auth/updateProfile', { password: 'old', new_password: 'new', email: 'a@example.com' }],
  ]
  for (const [index, [path, body]] of expected.entries()) {
    const [actualPath, options] = mocks.api.mock.calls[index]
    expect(actualPath).toBe(path)
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual(body)
  }
})
