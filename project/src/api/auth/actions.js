import { api } from './httpClient.js'
import { saveToken } from './tokenStorage.js'
import { clearSession, ensureAuthenticated, update_userdatas_bytoken } from './session.js'

const AUTH_API_BASE = '/api/auth'

export async function createPasswordResetRequest({ email, newPassword }) {
  return api(`${AUTH_API_BASE}/password-reset/requests`, {
    method: 'POST',
    showError: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, new_password: newPassword })
  })
}

/**
 * Login with email or username
 * @param {Object} credentials - { email?, username?, password }
 * @returns {Promise<Object>} User data with tokens
 */
export async function loginUser({ email, username, password }) {
  const data = await api(`${AUTH_API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email || username, password })
  })

  // Save tokens and update store
  saveToken(data.access_token, data.refresh_token, data.expires_in)
  await update_userdatas_bytoken()

  return data
}

/**
 * Register new user
 * @param {Object} userData - { username, email, password }
 * @returns {Promise<Object>} User data with tokens
 */
export async function registerUser({ username, email, password }) {
  const data = await api(`${AUTH_API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })

  return data
}

/**
 * Update username
 * @param {string} newUsername - New username
 * @param {string} email - User email
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUsername(newUsername, email) {
  await ensureAuthenticated()

  const data = await api(`${AUTH_API_BASE}/updateProfile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: newUsername, email })
  })

  return data
}

/**
 * Update password
 * @param {Object} passwords - { currentPassword, newPassword, email }
 * @returns {Promise<Object>} Success response
 */
export async function updatePassword({ currentPassword, newPassword, email }) {
  await ensureAuthenticated()

  const data = await api(`${AUTH_API_BASE}/updateProfile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: currentPassword, new_password: newPassword, email })
  })

  return data
}

/**
 * Logout user
 * Clears tokens and resets store to anonymous
 * @param {string} refreshToken - Refresh token
 */
export async function logoutUser(refreshToken) {
  try {
    await api(`${AUTH_API_BASE}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { refresh_token: refreshToken }
    })
  } catch {
    // Ignore logout errors
  } finally {
    clearSession()
  }
}

/**
 * Get leaderboard rankings
 * @returns {Promise<Object>} Leaderboard data with rankings and total users
 */
export async function getLeaderboard() {
  return await api(`${AUTH_API_BASE}/leaderboard`)
}
