import type { LucideIcon } from 'lucide-react'
import { Activity, BarChart3, GitBranch, Info, MapPin, PackageCheck } from 'lucide-react'

export type AppRoute = {
  /** URL pattern, as React Router expects it. */
  path: string
  /** Short label for navigation. */
  label: string
  /** Page <title> and heading. */
  title: string
  description: string
  icon?: LucideIcon
  /** Shown in the header. */
  inHeader?: boolean
  /** Footer column the link lives in. */
  footer?: 'explorar' | 'proyecto'
}

export const routes = {
  home: {
    path: '/',
    label: 'Inicio',
    title: 'Orbix',
    description: 'Las baterías de los vehículos eléctricos vuelven a la producción.',
  },
  points: {
    path: '/puntos',
    label: 'Puntos',
    title: 'Puntos de recolección',
    description: 'Encuentra dónde entregar tu batería en Bogotá.',
    icon: MapPin,
    inHeader: true,
    footer: 'explorar',
  },
  pointDetail: {
    path: '/puntos/:pointId',
    label: 'Punto',
    title: 'Punto de recolección',
    description: 'Horarios, baterías aceptadas y cómo llegar.',
  },
  dropoff: {
    path: '/entregar',
    label: 'Entregar',
    title: 'Entregar una batería',
    description: 'Registra tu batería y recibe un código de seguimiento.',
    icon: PackageCheck,
    inHeader: true,
    footer: 'explorar',
  },
  tracking: {
    path: '/trazabilidad',
    label: 'Trazabilidad',
    title: 'Trazabilidad',
    description: 'Consulta el recorrido de una batería con su código.',
    icon: GitBranch,
    inHeader: true,
    footer: 'explorar',
  },
  trackingDetail: {
    path: '/trazabilidad/:batteryId',
    label: 'Seguimiento',
    title: 'Seguimiento de batería',
    description: 'Cada etapa, desde la recolección hasta los materiales recuperados.',
  },
  classification: {
    path: '/clasificacion',
    label: 'Clasificación',
    title: 'Clasificación con visión artificial',
    description: 'Prueba de concepto del algoritmo que identifica y clasifica baterías.',
    icon: Activity,
    inHeader: true,
    footer: 'explorar',
  },
  impact: {
    path: '/impacto',
    label: 'Impacto',
    title: 'Impacto',
    description: 'Materiales recuperados y agua que no se extrae. Datos ilustrativos.',
    icon: BarChart3,
    inHeader: true,
    footer: 'proyecto',
  },
  about: {
    path: '/proyecto',
    label: 'El proyecto',
    title: 'El proyecto',
    description: 'El problema, la solución y el alcance de este semestre.',
    icon: Info,
    footer: 'proyecto',
  },
} satisfies Record<string, AppRoute>

const all = Object.values(routes) as AppRoute[]

export const headerRoutes = all.filter((r) => r.inHeader)
export const footerRoutes = (group: NonNullable<AppRoute['footer']>) =>
  all.filter((r) => r.footer === group)

/** Builds a concrete URL from a pattern: href(routes.pointDetail.path, { pointId: 'x' }) */
export const href = (pattern: string, params: Record<string, string> = {}) =>
  Object.entries(params).reduce((url, [k, v]) => url.replace(`:${k}`, encodeURIComponent(v)), pattern)
