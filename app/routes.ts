import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('layouts/sidebar.tsx', [
    index('routes/home.tsx'),
    route('/flash-cards/:name', 'routes/flash-cards.tsx'),
    route('/flash-cards/:name/edit', 'routes/edit-flash-cards.tsx'),
    route('/flash-cards/create', 'routes/create-flash-cards.tsx'),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
