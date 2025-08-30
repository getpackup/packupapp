export function getBodyClassNames(themePreference?: 'dark' | 'light'): string {
  const systemTheme =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

  const isDarkMode =
    !themePreference && typeof document !== 'undefined' ? systemTheme : themePreference === `dark`

  return [isDarkMode ? `dark bg-gray-900 text-gray-300` : `bg-gray-50 text-primary`]
    .join(' ')
    .trim()
}
