'use client';

import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { useLang } from '@/lib/i18n';
import { Counter } from './Counter';

export function Statement() {
  const { t } = useLang();
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  const words = t.statement.text.split(' ');

  return (
    <section data-theme="dark" className="bg-night py-28 md:py-44">
      <div className="shell">
        {/* words light up as you read down the page */}
        <p ref={ref} className="display max-w-[12.5em] text-[clamp(2rem,4.6vw,4.6rem)] leading-[1.06]">
          {words.map((w, i) => (
            <Word key={`${w}-${i}`} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>

        <dl className="mt-24 grid border-t border-white/[0.14] md:mt-36 md:grid-cols-3">
          {t.statement.stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col-reverse gap-3 py-8 md:py-10 ${i ? 'border-t border-white/[0.14] md:border-l md:border-t-0 md:pl-8' : ''}`}>
              <dt className="min-h-[2.9em] max-w-[16rem] text-[14px] leading-snug text-ash">{s.label}</dt>
              <dd className="display text-[clamp(2.75rem,5vw,4.5rem)] leading-none">
                <Counter to={s.value} decimals={s.decimals} suffix={s.suffix} locale={t.locale} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block pr-[0.28em]">
      {children}
    </motion.span>
  );
}
