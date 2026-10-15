import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { PagePlaceholder } from '@/pages/home/PagePlaceholder'
import { Home } from '@/pages/home/Home'
import { NotFound } from '@/components/NotFound'
import { routes } from '@/routes'
import { Dropoff } from './pages/dropoff/dropoff'
import { Tracking } from './pages/tracking/Tracking'
import { Points } from './pages/points/Points'

// Every route renders inside <Layout /> (header + <main><Outlet/></main> + footer).
// Swap each PagePlaceholder for the real page as we build it.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: routes.home.path, element: <Home /> },
      { path: routes.points.path, element: <Points /> },
      { path: routes.pointDetail.path, element: <PagePlaceholder route={routes.pointDetail} /> },
      { path: routes.dropoff.path, element: <Dropoff /> },
      { path: routes.tracking.path, element: <Tracking /> },
      { path: routes.trackingDetail.path, element: <PagePlaceholder route={routes.trackingDetail} /> },
      { path: routes.classification.path, element: <PagePlaceholder route={routes.classification} /> },
      { path: routes.impact.path, element: <PagePlaceholder route={routes.impact} /> },
      { path: routes.about.path, element: <PagePlaceholder route={routes.about} /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
