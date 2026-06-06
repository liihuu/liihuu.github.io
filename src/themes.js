export function getSystemTheme () {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function getStoredTheme () {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return getSystemTheme()
}

export function applyBackgroundTheme (theme) {
  document.documentElement.dataset.bgTheme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'light' ? '#f5f7fc' : '#020208'
}

export function applyForegroundTheme (theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

export function applyTheme (theme) {
  applyBackgroundTheme(theme)
  applyForegroundTheme(theme)
}

export const THEME_BG = {
  dark: '#020208',
  light: '#f5f7fc'
}

/** 幕布顶部经过视口该比例时，切换文字色 */
export const THEME_FG_REVEAL_RATIO = 0.5
