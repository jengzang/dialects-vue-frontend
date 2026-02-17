/**
 * Email validation with domain whitelist
 * Supports 50+ domains (Chinese, international, educational)
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false

  // Extract domain
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false

  // Whitelist of common Chinese and international email domains
  const allowedDomains = [
    // NetEase (网易)
    '163.com', '126.com', 'yeah.net', '188.com',
    'vip.163.com', 'vip.126.com',

    // Tencent (腾讯)
    'qq.com', 'foxmail.com', 'vip.qq.com',

    // Sina (新浪)
    'sina.com', 'sina.cn', 'sina.net', 'vip.sina.com',

    // Sohu (搜狐)
    'sohu.com', 'sohu.net',

    // Alibaba (阿里)
    'aliyun.com', 'alibaba-inc.com',

    // Telecom operators (运营商)
    '139.com',      // China Mobile
    '10086.cn',     // China Mobile
    '189.cn',       // China Telecom
    'wo.cn',        // China Unicom
    '10010.com',    // China Unicom

    // Other Chinese providers
    '21cn.com', 'tom.com', '263.net', '2980.com',
    '88.com', 'eyou.com', '56.com', 'x.cn', 'citiz.net',

    // International - Google
    'gmail.com',

    // International - Microsoft
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',

    // International - Yahoo
    'yahoo.com', 'yahoo.com.cn', 'yahoo.com.hk', 'yahoo.com.tw',

    // International - Apple
    'icloud.com', 'me.com', 'mac.com',

    // International - Other
    'aol.com', 'protonmail.com', 'yandex.com',
    'mail.com', 'zoho.com', 'gmx.com', 'tutanota.com'
  ]

  // Wildcard suffixes for educational institutions
  const allowedSuffixes = [
    '.edu.cn',  // Chinese universities
    '.edu',     // International universities
    '.ac.uk',   // UK universities
    '.ac.jp'    // Japanese universities
  ]

  // Check exact domain match
  if (allowedDomains.includes(domain)) {
    return true
  }

  // Check wildcard suffix match
  return allowedSuffixes.some(suffix => domain.endsWith(suffix))
}

/**
 * Username validation (3-50 characters)
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') return false
  const trimmed = username.trim()
  return trimmed.length >= 3 && trimmed.length <= 50
}

/**
 * Password validation (minimum 6 characters)
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false
  return password.length >= 6
}

/**
 * Confirm password match validation
 */
export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0
}

