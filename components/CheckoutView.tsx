'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { PRICE, type RingColorId } from '@/lib/content';
import { formatPrice, useLang } from '@/lib/i18n';
import { RingCanvas } from './RingCanvas';

export function CheckoutView({ color, size }: { color: RingColorId; size: number }) {
  const { t } = useLang();
  const c = t.checkout;
  const [done, setDone] = useState(false);
  const price = `${formatPrice(PRICE, t.locale)} ${t.currency}`;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fields = [
    { name: 'name', label: c.name, type: 'text', autoComplete: 'name' },
    { name: 'phone', label: c.phone, type: 'tel', autoComplete: 'tel' },
    { name: 'email', label: c.email, type: 'email', autoComplete: 'email' },
    { name: 'address', label: c.address, type: 'text', autoComplete: 'street-address' },
  ];

  return (
    <div className="min-h-screen bg-night">
      <header className="shell flex items-center justify-between pt-6">
        <Link href="/" className="wordmark text-[24px]" aria-label="KAIRO">
          KAIRO
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 text-[14px] text-ash hover:text-paper">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {c.back}
        </Link>
      </header>

      <main className="shell pb-24 pt-14 md:pt-20">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl" role="status">
              <h1 className="display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.05]">{c.done}</h1>
              <p className="mt-5 text-[17px] leading-relaxed text-ash">{c.doneText}</p>
              <Link href="/" className="btn-solid mt-10">
                {c.again}
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0 }} className="grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-24">
              <div>
                <h1 className="display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.05]">{c.title}</h1>
                <p className="mt-4 text-[15px] text-ash">{c.lead}</p>

                <form onSubmit={onSubmit} noValidate className="mt-12 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {fields.map((f) => (
                    <label key={f.name} className={`group block border-b border-white/20 pb-3 pt-5 focus-within:border-paper ${f.name === 'address' ? 'sm:col-span-2' : ''}`}>
                      <span className="block text-[13px] text-ash">{f.label}</span>
                      <input
                        name={f.name}
                        type={f.type}
                        autoComplete={f.autoComplete}
                        required
                        className="mt-2 block w-full bg-transparent text-[18px] text-paper outline-none"
                      />
                    </label>
                  ))}
                  <button type="submit" className="btn-solid group mt-10 justify-between sm:col-span-2">
                    <span>
                      {c.submit} — {price}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </button>
                </form>
              </div>

              <aside className="order-first h-fit border border-white/[0.14] p-7 lg:order-none">
                <h2 className="text-[13px] text-ash">{c.summary}</h2>
                <div className="mx-auto aspect-square w-full max-w-[300px]">
                  <RingCanvas mode="showcase" finish={color} className="h-full w-full" label={`${c.ring}, ${t.pricing.colors[color]}`} />
                </div>
                <dl className="divide-y divide-white/[0.1] text-[15px]">
                  {[
                    [c.ring, price],
                    [c.color, t.pricing.colors[color]],
                    [c.size, String(size)],
                    [c.delivery, c.free],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-3">
                      <dt className="text-ash">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 pt-5">
                    <dt>{c.total}</dt>
                    <dd className="display text-[28px]">{price}</dd>
                  </div>
                </dl>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
