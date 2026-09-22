'use client';

import { useLang } from '@/lib/i18n';

export function SkipLink() {
  const { t } = useLang();
  return (
    <a href="#main" className="fixed left-4 top-4 z-[70] -translate-y-24 bg-paper px-4 py-2 text-sm text-night transition-transform focus:translate-y-0">
      {t.meta.skip}
    </a>
  );
}
