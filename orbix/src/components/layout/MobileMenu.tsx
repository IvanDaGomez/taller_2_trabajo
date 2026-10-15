import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { headerRoutes } from '@/routes'
import { spring } from '@/lib/motion'

type Props = { id: string; onClose: () => void }

/**
 * Opens from the menu button (top-right), so it also closes toward it.
 * It is a modal task, so it gets a scrim; the surface "materializes"
 * (blur + scale + opacity together) instead of a plain fade.
 */
export function MobileMenu({ id, onClose }: Props) {
  const reduce = useReducedMotion()
  const t = spring(reduce)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const hidden = reduce
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, filter: 'blur(12px)' }
  const shown = reduce
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, filter: 'blur(0px)' }

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={t}
        onPointerDown={onClose}
      />
      <motion.nav
        id={id}
        aria-label="Navegación principal"
        className="material-thick fixed inset-x-3 top-14 z-50 rounded-sheet p-2 md:hidden"
        style={{ transformOrigin: 'top right' }}
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={t}
      >
        <ul className="flex flex-col">
          {headerRoutes.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `press flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[1.0625rem] font-medium tracking-snug ${
                    isActive ? 'bg-ink/[0.07] text-ink' : 'text-ink/80'
                  }`
                }
              >
                {Icon && <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} aria-hidden="true" />}
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </motion.nav>
    </>
  )
}
