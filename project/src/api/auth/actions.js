import { api, saveToken, clearToken, update_userdatas_bytoken, ensureAuthenticated } from './auth.js'
import { userStore } from '@/utils/store.js'

/**
 * Login with email or username
 * @param {Object} credentials - { email?, username?, password }
 * @returns {Promise<Object>} User data with tokens
 */
export async function loginUser({ email, username, password }) {
  const form = new URLSearchParams()

  if (email) {
    form.append('username', email)
  } else {
    form.append('username', username)
  }
  form.append('password', password)

  const data = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
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
  const data = await api('/auth/register', {
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

  const form = new URLSearchParams()
  form.append('username', newUsername)
  form.append('email', email)

  const data = await api('/auth/updateProfile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  })

  // Update user store
  await update_userdatas_bytoken()

  return data
}

/**
 * Update password
 * @param {Object} passwords - { currentPassword, newPassword, email }
 * @returns {Promise<Object>} Success response
 */
export async function updatePassword({ currentPassword, newPassword, email }) {
  await ensureAuthenticated()

  const form = new URLSearchParams()
  form.append('password', currentPassword)
  form.append('new_password', newPassword)
  form.append('email', email)

  const data = await api('/auth/updateProfile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
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
    await api('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { refresh_token: refreshToken }
    })
  } catch (error) {
    // Ignore logout errors
  } finally {
    clearToken()
    userStore.role = 'anonymous'
    userStore.isAuthenticated = false
  }
}

