/* eslint-disable no-undef */

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }

  const title =
    payload.notification?.title ?? payload.data?.title ?? 'New message'
  const url = payload.data?.url ?? '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})
