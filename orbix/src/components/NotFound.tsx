import { Link } from 'react-router-dom'
import { routes } from '@/routes'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Página no encontrada')
  return (
    <section className="mx-auto max-w-page px-5 py-28 sm:px-8">
      <h1 className="text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-display">
        No encontramos esa página.
      </h1>
      <p className="mt-5 max-w-xl text-[1.1875rem] leading-snug text-muted">
        Revisa la dirección o vuelve al inicio.
      </p>
      <Link
        to={routes.home.path}
        className="press mt-10 inline-block rounded-full bg-accent px-6 py-3 text-[1.0625rem] font-medium text-accent-ink"
      >
        Ir al inicio
      </Link>
    </section>
  )
}
