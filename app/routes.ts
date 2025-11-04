import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('signin', 'routes/signin.tsx'),
  route('signup', 'routes/signup.tsx'),
  layout('components/AuthWrapper.tsx', [
    route('feedback', 'routes/feedback.tsx'),
    route('friends', 'routes/friends.tsx'),
    route('gear-closet', 'routes/gear-closet.tsx'),
    route('profile', 'routes/profile.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('shopping-list', 'routes/shopping-list.tsx'),
    route('support', 'routes/support.tsx'),
    route('templates', 'routes/templates.tsx'),
    route('trips', 'routes/trips/index.tsx'),
    route('trips/:id', 'routes/trips/$id.tsx'),
    route('trips/new', 'routes/trips/new.tsx'),
  ]),
  route('resource/toggle-theme', 'routes/resource.toggle-theme.tsx'),
  route('resource/send-trip-invitation', 'routes/resource.send-trip-invitation.tsx'),
  route('resource/send-signin-email', 'routes/resource.send-signin-email.tsx'),
  // Add catch-all route for unknown URLs
  route('...', 'routes/[...].tsx'),
] satisfies RouteConfig
