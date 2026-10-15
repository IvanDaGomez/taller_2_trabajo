import { Link } from 'react-router-dom'
import { footerRoutes, routes } from '@/routes'
import { Logo } from './Logo'

const columns = [
  { title: 'Explorar', items: footerRoutes('explorar') },
  { title: 'Proyecto', items: footerRoutes('proyecto') },
]

export function Footer() {
  return (
    <footer className="bg-surface text-muted">
      <div className="mx-auto max-w-page px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link
              to={routes.home.path}
              className="press -ml-1 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-ink"
            >
              <Logo className="h-6 w-6" />
              <span className="text-[1.0625rem] font-semibold tracking-title">Orbix</span>
            </Link>
            <p className="mt-4 text-[0.9375rem] leading-relaxed">
              Conectamos a quienes tienen una batería usada con el reciclaje que la devuelve a la producción.
            </p>
          </div>

          {columns.map(({ title, items }) => (
            <nav key={title} aria-label={title}>
              <h2 className="text-[0.875rem] font-semibold text-ink">{title}</h2>
              <ul className="mt-4 space-y-3">
                {items.map(({ path, label }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="text-[0.9375rem] transition-colors duration-150 hover:text-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-ink/10 pt-6 text-[0.8125rem] sm:flex-row sm:justify-between">
          <p>Prototipo académico desarrollado en Bogotá, Colombia.</p>
          <p>Los datos que ves son ilustrativos.</p>
        </div>
      </div>
    </footer>
  )
}
