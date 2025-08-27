import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('signin', 'routes/signin.tsx'),
  route('signup', 'routes/signup.tsx'),
  layout('components/AuthWrapper.tsx', [
    route('trips', 'routes/trips/index.tsx'),
    route('trips/new', 'routes/trips/new.tsx'),
    route('trips/:id', 'routes/trips/$id.tsx'),
    route('settings', 'routes/settings.tsx'),
  ]),
  route('resource/toggle-theme', 'routes/resource.toggle-theme.tsx'),
  // Add catch-all route for unknown URLs
  route('...', 'routes/[...].tsx'),
] satisfies RouteConfig
