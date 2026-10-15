import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { PageTransition } from './PageTransition'

/**
 * Shell shared by every route: header on top, footer at the bottom,
 * and the page rendered in <main> between them.
 */
export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <Header />

      {/* pt offsets the fixed 48px header (+ iPhone notch inset) */}
      <main
        id="contenido"
        tabIndex={-1}
        className="flex-1 pt-[calc(3rem+env(safe-area-inset-top))] outline-none"
      >
        <PageTransition key={pathname}>
          <Outlet />
        </PageTransition>
      </main>

      <Footer />
      <ScrollRestoration />
    </div>
  )
}
