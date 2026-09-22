'use client';

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { useLang } from '@/lib/i18n';
import { Reveal } from './Reveal';

const VW = 1200;
const VH = 180;
const MID = 90;
// where each stage sits along the line (column starts)
const STOPS = [0.012, 0.36, 0.7];

/** A body signal that goes from erratic to a calm, even rhythm — the story in one line. */
function signal(x: number) {
  const chaos =
    30 * Math.sin(x * 0.13) * Math.sin(x * 0.031 + 1.3) +
    18 * Math.sin(x * 0.57 + 0.4) +
    12 * Math.sin(x * 1.31) +
    (Math.sin(x * 0.021) > 0.72 ? 34 * Math.sin(x * 0.9) : 0);
  const calm = 28 * Math.sin(x * 0.042 - 0.6);
  const t = Math.min(1, Math.max(0, (x - VW * 0.28) / (VW * 0.42)));
  const k = t * t * (3 - 2 * t);
  return MID + chaos * (1 - k) + calm * k;
}

export function Story() {
  const { t } = useLang();
  const s = t.story;
  const lineRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLSpanElement | null>(null);

  const d = useMemo(() => {
    let out = `M 0 ${signal(0).toFixed(1)}`;
    for (let x = 3; x <= VW; x += 3) out += ` L ${x} ${signal(x).toFixed(1)}`;
    return out;
  }, []);

  const { scrollYProgress } = useScroll({ target: lineRef, offset: ['start 85%', 'end 35%'] });
  // progress along the x axis, so stops and the tip line up exactly.
  // Scroll-driven only, so it is kept with "reduce motion" too.
  const drawn = useTransform(scrollYProgress, [0, 1], [0.02, 1]);
  const clipW = useTransform(drawn, (p) => p * VW);

  const placeHead = (p: number) => {
    const head = headRef.current;
    if (!head) return;
    head.style.left = `${p * 100}%`;
    head.style.top = `${(signal(p * VW) / VH) * 100}%`;
  };
  useMotionValueEvent(drawn, 'change', placeHead);

  return (
    <section id="about" data-theme="light" className="bg-paper py-28 text-night md:py-40">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
          <Reveal>
            <h2 className="display max-w-[8.1em] text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05]">{s.title}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[clamp(1.25rem,1.9vw,1.75rem)] font-light leading-[1.4] text-night/85">{s.manifesto}</p>
          </Reveal>
        </div>

        {/* the signal */}
        <div ref={lineRef} className="relative mt-20 h-[120px] md:mt-28 md:h-[180px]" aria-hidden>
          <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <clipPath id="signal-clip">
                <motion.rect x="0" y="-40" height={VH + 80} width={clipW} />
              </clipPath>
            </defs>
            <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" clipPath="url(#signal-clip)" />
          </svg>
          {STOPS.map((x, i) => (
            <Stop key={x} x={x} progress={drawn} index={i} />
          ))}
          <span ref={(el) => { headRef.current = el; placeHead(drawn.get()); }} className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-night" />
        </div>

        <ol className="mt-10 grid md:mt-14 md:grid-cols-3">
          {s.steps.map((step, i) => (
            <Reveal as="li" key={step.label} delay={i * 0.12} className={`py-6 md:py-0 ${i ? 'border-t border-night/15 md:border-l md:border-t-0 md:pl-8' : 'md:pr-8'}`}>
              <p className="flex items-baseline gap-4 text-[13px] text-smoke">
                <span>0{i + 1}</span>
                {step.label}
              </p>
              <p className="mt-5 max-w-[22rem] text-[19px] leading-snug">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Stop({ x, progress, index }: { x: number; progress: MotionValue<number>; index: number }) {
  const on = useTransform(progress, [x - 0.02, x + 0.02], [0, 1]);
  const scale = useTransform(on, [0, 1], [0.4, 1]);
  const top = Math.round((signal(x * VW) / VH) * 10000) / 100;
  return (
    <motion.span
      style={{ left: `${x * 100}%`, top: `${top}%`, x: '-50%', y: '-50%', opacity: on, scale }}
      className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-night/40 bg-paper text-[11px]"
    >
      {index + 1}
    </motion.span>
  );
}
