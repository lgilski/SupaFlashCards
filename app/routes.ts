import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('layouts/layout.tsx', [
    index('routes/home.tsx'),
    route('/login', 'routes/login.tsx'),
    route('/signup', 'routes/signup.tsx'),
    route('/logout', 'routes/logout.tsx'),
    route('/forgot-password', 'routes/forgot-password.tsx'),
    route('/update-password', 'routes/update-password.tsx'),

    layout('layouts/protected.tsx', [
      route('/dashboard', 'routes/dashboard.tsx'),
      route('/flash-cards/:id', 'routes/flash-cards.tsx'),
      route('/flash-cards/:id/edit', 'routes/edit-flash-cards.tsx'),
      route('/flash-cards/create', 'routes/create-flash-cards.tsx'),
    ]),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
