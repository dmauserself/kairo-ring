'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { useLang } from '@/lib/i18n';
import { Counter } from './Counter';
import { Reveal } from './Reveal';

export function Accuracy() {
  const { t } = useLang();
  const a = t.accuracy;

  return (
    <section id="app" data-theme="dark" className="bg-night pb-28 pt-8 md:pb-44">
      <div className="shell grid gap-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <h2 className="display max-w-[8.75em] text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05]">{a.title}</h2>
            <p className="mt-6 max-w-[30rem] text-[16px] leading-relaxed text-ash">{a.lead}</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-14">
            <Phone />
          </Reveal>
        </div>

        <div>
          <ul className="border-t border-white/[0.14]">
            {a.rows.map((r, i) => (
              <Row key={r.label} {...r} locale={t.locale} delay={i * 0.08} />
            ))}
          </ul>
          <p className="mt-8 text-[12px] text-ash/80">* {a.note}</p>
        </div>
      </div>
    </section>
  );
}

function Row({ value, label, text, locale, delay }: { value: number; label: string; text: string; locale: string; delay: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();
  return (
    <li ref={ref} className="grid gap-4 border-b border-white/[0.14] py-10 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-end md:py-14">
      <p className="display text-[clamp(4rem,8vw,7.5rem)] leading-[0.85]">
        <Counter to={value} locale={locale} />
        <span className="text-ash">%</span>
      </p>
      <div className="sm:pb-2">
        <h3 className="text-[18px] font-medium">{label}</h3>
        <p className="mt-1.5 max-w-[26rem] text-[15px] leading-relaxed text-ash">{text}</p>
        <div className="mt-5 h-px w-full bg-white/[0.12]">
          <motion.div
            className="h-px bg-paper"
            initial={{ width: 0 }}
            animate={inView ? { width: `${value}%` } : undefined}
            transition={reduce ? { duration: 0 } : { duration: 1.8, delay, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </li>
  );
}

/** A believable phone screen with the morning report, not a floating glass card. */
function Phone() {
  const { t } = useLang();
  const m = t.accuracy.morning;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const score = 86;
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div ref={ref} className="relative mx-auto w-[300px] lg:mx-0">
      <div className="rounded-[52px] bg-gradient-to-b from-[#3a3a3c] via-[#1b1b1d] to-[#2c2c2e] p-[3px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="rounded-[49px] bg-black p-[10px]">
          <div className="relative overflow-hidden rounded-[40px] bg-[#0d0d0e] px-6 pb-8 pt-4 text-paper">
            <div className="flex items-center justify-between text-[12px] font-medium">
              <span>{m.time}</span>
              <span className="h-[22px] w-[82px] rounded-full bg-black" aria-hidden />
              <span className="flex gap-1" aria-hidden>
                <span className="h-2.5 w-4 rounded-[3px] border border-paper/70" />
              </span>
            </div>

            <p className="mt-7 text-[13px] text-ash">{m.title}</p>

            <div className="relative mx-auto mt-4 h-[170px] w-[170px]">
              <svg viewBox="0 0 170 170" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="85" cy="85" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <motion.circle
                  cx="85"
                  cy="85"
                  r={R}
                  fill="none"
                  stroke="#ECEBE7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={inView ? { strokeDashoffset: C * (1 - score / 100) } : undefined}
                  transition={reduce ? { duration: 0 } : { duration: 2, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="display text-[52px] leading-none">
                  <Counter to={score} />
                </span>
                <span className="mt-1 text-[12px] text-ash">{m.label}</span>
              </div>
            </div>

            <p className="mt-5 text-center text-[14px] leading-snug">{m.verdict}</p>

            <dl className="mt-6 divide-y divide-white/10 border-y border-white/10 text-[13px]">
              {m.metrics.map((x) => (
                <div key={x.k} className="flex justify-between py-2.5">
                  <dt className="text-ash">{x.k}</dt>
                  <dd>{x.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mx-auto mt-6 h-1 w-28 rounded-full bg-paper/60" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
