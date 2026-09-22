'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { Reveal } from './Reveal';

export function Faq() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" data-theme="dark" aria-labelledby="faq-title" className="bg-night pb-28 md:pb-40">
      <div className="shell grid gap-10 border-t border-white/[0.14] pt-14 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <Reveal>
          <h2 id="faq-title" className="display text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05] lg:sticky lg:top-24">
            {t.faq.title}
          </h2>
        </Reveal>

        <ul className="border-b border-white/[0.14]">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-t border-white/[0.14] first:border-t-0 lg:first:border-t">
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[18px] md:text-[20px]"
                  >
                    <span className="transition-opacity group-hover:opacity-70">{item.q}</span>
                    <span className="relative h-4 w-4 shrink-0" aria-hidden>
                      <span className="absolute left-0 top-1/2 h-px w-4 bg-paper" />
                      <span className={`absolute left-1/2 top-0 h-4 w-px bg-paper transition-transform duration-300 ${isOpen ? 'scale-y-0' : ''}`} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-a-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[40rem] pb-7 text-[16px] leading-relaxed text-ash">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
