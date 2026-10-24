'use client';

import { useReducedMotion as useSystemReducedMotion } from 'framer-motion';

/**
 * Учитывать ли системную настройку «Уменьшить движение».
 * false — сайт всегда полностью анимирован, даже если настройка включена (по желанию владельца).
 * true  — при включённой настройке анимации упрощаются.
 */
export const RESPECT_REDUCED_MOTION = false;

export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  return RESPECT_REDUCED_MOTION && !!system;
}
