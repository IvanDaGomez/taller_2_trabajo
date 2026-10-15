import type { Transition } from 'framer-motion'

/**
 * House springs. Critically damped by default (no overshoot);
 * bounce is reserved for gestures that carried momentum.
 * Under reduced motion we fall back to a short cross-fade.
 */
export const spring = (reduce: boolean | null): Transition =>
  reduce ? { duration: 0.15, ease: 'easeOut' } : { type: 'spring', bounce: 0, duration: 0.4 }

export const springBouncy = (reduce: boolean | null): Transition =>
  reduce ? { duration: 0.15, ease: 'easeOut' } : { type: 'spring', bounce: 0.2, duration: 0.4 }
