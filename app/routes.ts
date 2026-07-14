import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('layouts/sidebar.tsx', [
    index('routes/home.tsx'),
    route('/flash-cards/:id', 'routes/flash-cards.tsx'),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
