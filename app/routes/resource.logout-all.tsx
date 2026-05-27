import { getAuth } from 'firebase-admin/auth'
import { type ActionFunction } from 'react-router'

import { getFirebaseAdmin } from '~/firebase/admin'
import getObjectFromFormData from '~/lib/getObjectFromFormData'

interface LogoutAllBody {
  uid: string
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await request.formData()
    const { uid } = getObjectFromFormData<LogoutAllBody>(formData)

    if (!uid) {
      return new Response(JSON.stringify({ error: 'Missing uid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const app = getFirebaseAdmin()
    await getAuth(app).revokeRefreshTokens(uid)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error revoking refresh tokens:', error)
    return new Response(JSON.stringify({ error: 'Failed to revoke sessions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function loader() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}
