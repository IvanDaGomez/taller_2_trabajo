import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { spring } from '@/lib/motion'

/**
 * Enter-only: no exit animation, so input is never locked out while a
 * page leaves. The new page eases in from its current (opacity) value.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring(reduce)}
    >
      {children}
    </motion.div>
  )
}
