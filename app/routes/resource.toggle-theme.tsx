import { type ActionFunction, type LoaderFunction, redirect } from 'react-router'

import { themePreferenceCookie } from '~/cookies.server'

export const action: ActionFunction = async ({ request }) => {
  const cookieHeader = request.headers.get('Cookie')
  const cookie = (await themePreferenceCookie.parse(cookieHeader)) || {}
  const themePreference = cookie.themePreference === 'dark' ? 'light' : 'dark'

  return redirect(request.headers.get('Referer') || '/', {
    headers: {
      'Set-Cookie': await themePreferenceCookie.serialize({
        themePreference,
        expires: new Date(Date.now() + 31536000000), // 1 year
      }),
    },
  })
}

export const loader: LoaderFunction = async () => {
  return redirect(`/`, { status: 404 })
}
