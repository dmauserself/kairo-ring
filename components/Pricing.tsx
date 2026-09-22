'use client';

import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PRICE, ringColors, ringSizes, type RingColorId } from '@/lib/content';
import { formatPrice, useLang } from '@/lib/i18n';
import { Reveal } from './Reveal';
import { RingCanvas } from './RingCanvas';

export function Pricing() {
  const { t } = useLang();
  const p = t.pricing;
  const reduce = !!useReducedMotion();
  const [color, setColor] = useState<RingColorId>('graphite');
  const [size, setSize] = useState<number>(9);
  const price = `${formatPrice(PRICE, t.locale)} ${t.currency}`;

  return (
    <section id="buy" data-theme="dark" className="bg-night py-28 md:py-40">
      <div className="shell grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div className="relative">
          <Reveal>
            <h2 className="display text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05]">{p.title}</h2>
            <p className="mt-5 max-w-[30rem] text-[16px] leading-relaxed text-ash">{p.lead}</p>
          </Reveal>
          <div className="relative mx-auto mt-6 aspect-square w-full max-w-[620px]">
            <div aria-hidden className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle,rgba(236,235,231,0.16)_0%,rgba(236,235,231,0.05)_45%,transparent_70%)]" />
            <RingCanvas mode="showcase" finish={color} reduceMotion={reduce} className="relative h-full w-full" label={`KAIRO, ${p.colors[color]}`} />
          </div>
        </div>

        <Reveal delay={0.1} className="lg:pt-4">
          <div className="flex items-baseline justify-between border-b border-white/[0.14] pb-6">
            <p className="wordmark text-[28px]">KAIRO</p>
            <p className="text-[13px] text-ash">{p.noSub}</p>
          </div>

          <p className="display mt-8 text-[clamp(2.75rem,4.5vw,4rem)] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {price}
          </p>
          <p className="mt-3 text-[14px] text-ash">{p.split}</p>

          <fieldset className="mt-10">
            <legend className="text-[13px] text-ash">
              {p.color} — <span className="text-paper">{p.colors[color]}</span>
            </legend>
            <div className="mt-4 flex gap-3" role="radiogroup" aria-label={p.color}>
              {ringColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={color === c.id}
                  aria-label={p.colors[c.id]}
                  onClick={() => setColor(c.id)}
                  className={`grid h-12 w-12 place-items-center rounded-full border transition-colors ${
                    color === c.id ? 'border-paper' : 'border-transparent hover:border-white/30'
                  }`}
                >
                  <span className="h-9 w-9 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]" style={{ background: c.swatch }} />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-[13px] text-ash">{p.size}</legend>
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-8" role="radiogroup" aria-label={p.size}>
              {ringSizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`-ml-px -mt-px h-12 border text-[15px] transition-colors ${
                    size === s ? 'relative z-10 border-paper bg-paper text-night' : 'border-white/20 text-paper/80 hover:text-paper'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-ash">{p.sizeHint}</p>
          </fieldset>

          <Link href={`/checkout?color=${color}&size=${size}`} prefetch={false} className="btn-solid group mt-10 w-full justify-between">
            <span>
              {p.buy} — {price}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-[13px] text-ash">{p.includesTitle}</p>
              <ul className="mt-3 divide-y divide-white/[0.1] text-[14px]">
                {p.includes.map((item) => (
                  <li key={item} className="py-2.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <ul className="divide-y divide-white/[0.1] self-end text-[14px] text-ash">
              {p.guarantees.map((g) => (
                <li key={g} className="py-2.5">
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
