import {createCookie} from 'react-router'

export const themePreferenceCookie = createCookie(`themePreference`, {
  path: '/',
})

export const gdprConsent = createCookie('gdpr-consent', {
  path: '/',
  maxAge: 31536000, // One Year
})
