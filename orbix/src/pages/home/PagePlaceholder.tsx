import { useParams } from 'react-router-dom'
import type { AppRoute } from '@/routes'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** Stand-in until each screen is built. Shows what the route will hold. */
export function PagePlaceholder({ route }: { route: AppRoute }) {
  const params = useParams()
  useDocumentTitle(route.title)
  const entries = Object.entries(params)

  return (
    <section className="mx-auto max-w-page px-5 py-20 sm:px-8 sm:py-28">
      <h1 className="max-w-3xl text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-display">
        {route.title}
      </h1>
      <p className="mt-5 max-w-xl text-[1.1875rem] leading-snug text-muted">{route.description}</p>

      <div className="mt-12 rounded-sheet bg-surface p-6 sm:p-8">
        <p className="text-[0.9375rem] font-medium">Pantalla pendiente de construir</p>
        <p className="mt-1 text-[0.9375rem] text-muted">
          Ruta <code className="rounded bg-ink/[0.07] px-1.5 py-0.5 text-[0.875rem] text-ink">{route.path}</code>
          {entries.length > 0 && (
            <>
              {' '}con {entries.map(([k, v]) => `${k} = ${v}`).join(', ')}
            </>
          )}
        </p>
      </div>
    </section>
  )
}
