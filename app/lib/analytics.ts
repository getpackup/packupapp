import { AnalyticsBrowser, type EventProperties } from '@segment/analytics-next'
import { Analytics } from '@segment/analytics-node'

export const analyticsBrowser = AnalyticsBrowser.load({
  writeKey: import.meta.env.VITE_SEGMENT_API_KEY ?? process.env.VITE_SEGMENT_API_KEY ?? '',
})

const analyticsNode = new Analytics({
  writeKey: import.meta.env.VITE_SEGMENT_API_KEY ?? process.env.VITE_SEGMENT_API_KEY ?? '',
})

export function identify(
  email: string,
  userId: string,
  displayName: string,
  createdAt: string,
  username: string
) {
  analyticsBrowser.identify(email, {
    userId,
    email,
    displayName,
    createdAt,
    username,
  })
}

export function trackPage(pageName: string, route: string, title: string) {
  analyticsBrowser.page(pageName, {
    title: title,
    url: window.location.href,
    path: route,
    type: 'page',
  })
}

export function trackPageLeave() {
  if (typeof window === 'undefined') {
    return () => {}
  }

  function handlePageLeave() {
    analyticsBrowser.track({ event: '$pageleave', type: 'track' })
  }

  const eventName = 'onpagehide' in window ? 'pagehide' : 'beforeunload'
  window.addEventListener(eventName, handlePageLeave, { once: true })

  return () => window.removeEventListener(eventName, handlePageLeave)
}

export function trackBrowserEvent(event: string, userId: string, properties?: EventProperties) {
  return analyticsBrowser.track(event, {
    type: 'track',
    userId,
    ...properties,
  })
}

export function trackNodeEvent(event: string, userId: string, properties?: EventProperties) {
  return analyticsNode.track({
    event,
    userId,
    properties,
  })
}
