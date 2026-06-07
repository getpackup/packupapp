import { AnalyticsBrowser } from '@segment/analytics-next'
import { Analytics } from '@segment/analytics-node'

export const analyticsBrowser = AnalyticsBrowser.load({
  writeKey: import.meta.env.VITE_SEGMENT_API_KEY ?? process.env.VITE_SEGMENT_API_KEY ?? '',
})

const analyticsNode = new Analytics({
  writeKey: import.meta.env.VITE_SEGMENT_API_KEY ?? process.env.VITE_SEGMENT_API_KEY ?? '',
})

export const AnalyticsEvent = {
  UserSignedUp: 'user_signed_up',
  TripCreated: 'trip_created',
  AddFromGearClosetCompleted: 'add_from_gear_closet_completed',
  PackingListItemAdded: 'packing_list_item_added',
  PackingListItemPacked: 'packing_list_item_packed',
  TripChatMessageSent: 'trip_chat_message_sent',
  ShoppingListItemChecked: 'shopping_list_item_checked',
  GearClosetItemAdded: 'gear_closet_item_added',
  FriendRequestSent: 'friend_request_sent',
  TripMemberInvited: 'trip_member_invited',
  FeedbackSubmitted: 'feedback_submitted',
  AccountDeleted: 'account_deleted',
  CheckoutSessionCreated: 'checkout_session_created',
  PlanUpgraded: 'plan_upgraded',
  PlanDowngraded: 'plan_downgraded',
  SafetyItinerarySent: 'safety_itinerary_sent',
} as const

type Platform = 'web' | 'pwa' | 'ios_pwa' | 'ios_app_store'

type BaseProperties = {
  source: 'browser' | 'server'
  platform?: Platform
}

type EventPropertiesMap = {
  user_signed_up: { anonymous_converted: boolean }
  trip_created: { trip_id: string; tag_count: number; member_count: number }
  add_from_gear_closet_completed: { trip_id: string; items_added: number; tag_count: number }
  packing_list_item_added: { trip_id: string; is_group_item: boolean }
  packing_list_item_packed: { trip_id: string; item_id: string; is_group_item: boolean }
  trip_chat_message_sent: { trip_id: string; message_type: 'text' | 'image' }
  shopping_list_item_checked: { trip_id: string; item_id: string }
  gear_closet_item_added: { category: string; has_custom_tag: boolean }
  friend_request_sent: { recipient_user_id: string }
  trip_member_invited: { trip_id: string; invitee_user_id: string; is_friend: boolean }
  feedback_submitted: { feedback_type?: string }
  account_deleted: Record<never, never>
  checkout_session_created: { plan: 'pro' }
  plan_upgraded: { plan: 'pro'; subscription_id: string }
  plan_downgraded: { plan: 'free'; subscription_id: string }
  safety_itinerary_sent: { trip_id: string; member_count: number }
}

function isIosAppStore(): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith('app-platform=iOS App Store'))
}

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  if (isIosAppStore()) return 'ios_app_store'
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return 'ios_pwa'
  if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa'
  return 'web'
}

export function identify({
  email,
  userId,
  displayName,
  createdAt,
  username,
}: {
  email: string
  userId: string
  displayName: string
  createdAt: string
  username: string
}) {
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

export function trackBrowserEvent<E extends keyof EventPropertiesMap>(
  event: E,
  userId: string,
  properties: BaseProperties & EventPropertiesMap[E]
) {
  return analyticsBrowser.track(event, {
    type: 'track',
    userId,
    ...properties,
  })
}

export function trackNodeEvent<E extends keyof EventPropertiesMap>(
  event: E,
  userId: string,
  properties: BaseProperties & EventPropertiesMap[E]
) {
  return analyticsNode.track({
    event,
    userId,
    properties,
  })
}
