'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';

export function Header() {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  // which section sits under the bar: the hero gets difference blending,
  // everything else a plain colour — blending over the whole page is costly in Safari
  const [theme, setTheme] = useState<'blend' | 'dark' | 'light'>('blend');

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const sections = document.querySelectorAll<HTMLElement>('[data-theme]');
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        if (r.top <= 40 && r.bottom > 40) {
          const next = (el.dataset.theme as 'blend' | 'dark' | 'light') ?? 'dark';
          setTheme((prev) => (prev === next ? prev : next));
          return;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const left = [
    { href: '#product', label: t.nav.product },
    { href: '#tech', label: t.nav.tech },
  ];
  const right = [
    { href: '#app', label: t.nav.app },
    { href: '#about', label: t.nav.about },
  ];

  const langSwitch = (
    <div role="radiogroup" aria-label={t.nav.langLabel} className="flex border border-current text-[13px]">
      {(['ru', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={`h-8 w-10 transition-opacity ${lang === l ? 'opacity-100' : 'opacity-45 hover:opacity-80'} ${l === 'en' ? 'border-l border-current' : ''}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          theme === 'blend' ? 'text-white mix-blend-difference' : theme === 'light' ? 'text-night' : 'text-paper'
        }`}
      >
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-28 transition-opacity duration-300 ${theme === 'blend' ? 'opacity-0' : 'opacity-100'} ${
            theme === 'light' ? 'bg-gradient-to-b from-paper via-paper/80 to-transparent' : 'bg-gradient-to-b from-night via-night/80 to-transparent'
          }`}
        />
        <div className="shell pointer-events-auto relative flex items-start justify-between pt-5 md:pt-7">
          <Link href="/" className="wordmark text-[22px] leading-none md:text-[26px]" aria-label="KAIRO">
            KAIRO
          </Link>

          <nav aria-label={t.nav.menu} className="hidden gap-16 text-[14px] leading-[1.45] md:flex lg:gap-28">
            {[left, right].map((col, i) => (
              <ul key={i}>
                {col.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="opacity-80 transition-opacity hover:opacity-100">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a href="#buy" className="hidden text-[14px] underline decoration-1 underline-offset-[6px] md:inline">
              {t.nav.buy}
            </a>
            {langSwitch}
            <button
              type="button"
              className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={t.nav.menu}
              onClick={() => setOpen(true)}
            >
              <span className="h-px w-6 bg-current" />
              <span className="h-px w-6 bg-current" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            className="fixed inset-0 z-[60] flex flex-col bg-night md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="shell flex items-center justify-between pt-5">
              <span className="wordmark text-[22px]">KAIRO</span>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.nav.close} className="relative h-8 w-8">
                <span className="absolute left-1 top-1/2 h-px w-6 rotate-45 bg-paper" />
                <span className="absolute left-1 top-1/2 h-px w-6 -rotate-45 bg-paper" />
              </button>
            </div>
            <nav aria-label={t.nav.menu} className="shell mt-16 flex-1">
              <ul className="space-y-2">
                {[...left, ...right, { href: '#buy', label: t.nav.buy }].map((l, i) => (
                  <motion.li key={l.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                    <a href={l.href} onClick={() => setOpen(false)} className="display block py-2 text-[34px]">
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
