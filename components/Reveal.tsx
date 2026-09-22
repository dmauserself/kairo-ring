'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = { children: ReactNode; delay?: number; className?: string; y?: number; as?: 'div' | 'li' };

/** Quiet fade + rise once the block scrolls into view. */
export function Reveal({ children, delay = 0, className, y = 24, as = 'div' }: Props) {
  const reduce = useReducedMotion();
  const Comp = as === 'li' ? motion.li : motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={reduce ? { duration: 0 } : { duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
