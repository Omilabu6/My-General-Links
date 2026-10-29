export const EMOJIS = [
  '🔥', '💀', '✨', '🧠', '🎮', '🎨', '📚', '💼', '🛒', '🎧',
  '📺', '💸', '🤖', '🌍', '⚡', '🍕', '🦄', '🧪', '🏆', '📌',
]

export const GROUP_EMOJIS = ['💼', '🎓', '🏠', '🎮', '💸', '🧠', '🎨', '📚', '🔥', '🧪', '🌍', '📁']

export const COLORS = ['bubblegum', 'zap', 'grape', 'ice', 'butter', 'peach']

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/**
 * Returns a clean http(s) URL, or null if the input isn't a usable link.
 * Only http/https are allowed, so `javascript:` and friends can never be saved
 * (also protects against hostile imported JSON).
 */
export function normalizeUrl(input) {
  let s = String(input ?? '').trim()
  if (!s) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return null
    return u.href
  } catch {
    return null
  }
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
