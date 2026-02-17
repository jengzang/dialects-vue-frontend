// Re-export everything from auth.js (existing functionality)
export {
  api,
  getToken,
  getRefreshToken,
  saveToken,
  clearToken,
  initUserByToken,
  refreshAccessToken,
  ensureAuthenticated,
  update_userdatas_bytoken,
  getUserRole,
  reportOnlineTime
} from './auth.js'

// Export validation functions
export {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordMatch
} from './validation.js'

// Export authentication actions
export {
  loginUser,
  registerUser,
  updateUsername,
  updatePassword,
  logoutUser
} from './actions.js'
