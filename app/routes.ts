import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('signin', 'routes/signin.tsx'),
  layout('components/auth-wrapper.tsx', [route('trips', 'routes/trips.tsx')]),
  route('resource/toggle-theme', 'routes/resource.toggle-theme.tsx'),
  // Add catch-all route for unknown URLs
  route('...', 'routes/[...].tsx'),
] satisfies RouteConfig
