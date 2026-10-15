import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { headerRoutes, routes } from '@/routes'
import { spring } from '@/lib/motion'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'

const MENU_ID = 'menu-movil'

export function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const reduce = useReducedMotion()

  // Scroll edge effect: no hard divider at rest; a hairline fades in
  // continuously (tracked 1:1 with scroll) once content passes underneath.
  const { scrollY } = useScroll()
  const edge = useTransform(scrollY, [0, 32], [0, 1])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="material relative">
        <div className="mx-auto flex h-12 max-w-page items-center justify-between px-5 sm:px-8">
          <Link
            to={routes.home.path}
            aria-label="Orbix, ir al inicio"
            className="press -ml-1 flex items-center gap-2 rounded-lg px-1 py-1"
          >
            <Logo className="h-6 w-6 text-ink" />
            <span className="text-[1.0625rem] font-semibold tracking-title">Orbix</span>
          </Link>

          <nav aria-label="Navegación principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {headerRoutes.map(({ path, label }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      `press relative block rounded-full px-3.5 py-1.5 text-[0.875rem] font-medium tracking-snug transition-colors duration-150 ${
                        isActive ? 'text-ink' : 'text-muted hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-full bg-ink/[0.07]"
                            transition={spring(reduce)}
                          />
                        )}
                        <span className="relative">{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="press -mr-2 grid h-10 w-10 place-items-center rounded-full md:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ink/10"
          style={{ opacity: edge }}
        />
      </div>

      <AnimatePresence>{open && <MobileMenu id={MENU_ID} onClose={() => setOpen(false)} />}</AnimatePresence>
    </header>
  )
}
