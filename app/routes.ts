import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('signin', 'routes/signin.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('get-started', 'routes/get-started.tsx'),
  layout('components/AuthWrapper.tsx', [
    route('friends', 'routes/friends.tsx'),
    route('gear-closet', 'routes/gear-closet.tsx'),
    route('profile', 'routes/profile.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('account-delete', 'routes/account-delete.tsx'),
    route('test', 'routes/test.tsx'),
    route('shopping-list', 'routes/shopping-list.tsx'),
    route('templates', 'routes/templates.tsx'),
    route('trips', 'routes/trips/index.tsx'),
    route('trips/:id', 'routes/trips/$id.tsx'),
    route('trips/new', 'routes/trips/new.tsx'),
  ]),
  route('resource/toggle-theme', 'routes/resource.toggle-theme.tsx'),
  route('resource/send-trip-invitation', 'routes/resource.send-trip-invitation.tsx'),
  route('resource/send-friend-request', 'routes/resource.send-friend-request.tsx'),
  route('resource/send-feedback', 'routes/resource.send-feedback.tsx'),
  route('resource/delete-account', 'routes/resource.delete-account.tsx'),
  route('resource/logout-all', 'routes/resource.logout-all.tsx'),
  route('resource/send-signin-email', 'routes/resource.send-signin-email.tsx'),
  route('resource/create-checkout-session', 'routes/resource.create-checkout-session.tsx'),
  route('resource/create-portal-session', 'routes/resource.create-portal-session.tsx'),
  route('resource/stripe-webhook', 'routes/resource.stripe-webhook.tsx'),
  // Add catch-all route for unknown URLs
  route('...', 'routes/[...].tsx'),
] satisfies RouteConfig
