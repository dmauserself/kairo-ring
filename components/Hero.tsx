'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { formatPrice, useLang } from '@/lib/i18n';
import { RingCanvas } from './RingCanvas';

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const leftY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-10%']);
  const rightY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-18%']);
  const wordY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '30%']);

  const [active, setActive] = useState(1);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((i) => (i + 1) % t.hero.features.length), 2400);
    return () => clearInterval(id);
  }, [reduce, t.hero.features.length]);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.1, delay, ease },
  });

  return (
    <section
      ref={ref}
      id="product"
      data-theme="blend"
      className="relative isolate overflow-hidden bg-paper text-white lg:h-[100svh] lg:min-h-[760px] lg:max-h-[1100px]"
    >
      {/* studio light in the middle, stone at the edges */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,#fbfaf7_0%,#ecebe7_55%,#d9d7d1_100%)]" />
      <motion.div aria-hidden style={{ y: leftY }} className="absolute left-0 top-0 -z-10 h-[600px] w-[44vw] [mask-image:linear-gradient(to_bottom,#000_55%,transparent_85%)] lg:-top-[4%] lg:bottom-[-14%] lg:h-auto lg:w-[36vw] lg:[mask-image:none]">
        <Image src="/img/stone-l.png" alt="" fill priority sizes="(min-width: 768px) 36vw, 44vw" quality={90} className="object-cover object-right" />
      </motion.div>
      <motion.div aria-hidden style={{ y: rightY }} className="absolute right-0 top-0 -z-10 h-[600px] w-[38vw] [mask-image:linear-gradient(to_bottom,#000_55%,transparent_85%)] lg:-top-[4%] lg:bottom-[-20%] lg:h-auto lg:w-[30vw] lg:[mask-image:linear-gradient(to_bottom,#000_58%,transparent_74%)]">
        <Image src="/img/stone-r.png" alt="" fill priority sizes="(min-width: 768px) 30vw, 38vw" quality={90} className="-scale-x-100 object-cover object-right" />
      </motion.div>


      {/* everything typographic uses difference blending: white on stone, black on the light */}
      <div className="shell relative flex min-h-full flex-col pb-10 pt-24 lg:h-full lg:pt-[104px]">
        <motion.div style={{ y: wordY }} className="mx-auto w-max max-w-full mix-blend-difference">
          <motion.div
            aria-hidden
            className="wordmark select-none whitespace-nowrap text-center text-[calc((100vw-2.5rem)/5)] sm:text-[calc((100vw-4rem)/5.3)] lg:text-[min(calc((100vw-6rem)/5.7),33vh)] min-[1536px]:text-[min(16rem,33vh)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, ease }}
          >
            KAIRO
          </motion.div>
          <motion.ul {...fade(0.5)} className="mt-3 hidden grid-cols-[1fr_1fr_1fr] px-[9%] text-[13px] lg:grid">
            {t.hero.captions.map((c, i) => (
              <li key={c} className={i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}>
                {c}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* the ring */}
        <div className="relative mx-auto -mt-[6vw] aspect-square w-[min(100%,560px)] lg:absolute lg:left-1/2 lg:top-[33%] lg:mt-0 lg:h-[min(58vh,620px)] lg:w-auto lg:-translate-x-1/2">
          {/* soft contact shadow so the ring sits in the space instead of floating on it */}
          <div aria-hidden className="absolute bottom-[10%] left-1/2 h-[16%] w-[70%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,0,0,0.32),rgba(0,0,0,0.12)_55%,transparent)]" />
          <RingCanvas progress={scrollYProgress} reduceMotion={reduce} className="h-full w-full" label={t.hero.ringAlt} />
        </div>

        {/* right: what it tracks, one highlighted at a time */}
        <div className="absolute right-5 top-[52%] hidden sm:right-8 lg:block lg:right-12">
          {/* a soft patch of shadow tied to the list itself, so it always sits on dark stone */}
          <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-14 -right-28 -top-14 -z-10 bg-[radial-gradient(closest-side,rgba(8,8,8,0.95),rgba(8,8,8,0.85)_68%,transparent)]" />
        <motion.ul {...fade(0.8)} className="space-y-1.5 text-right text-[15px] mix-blend-difference">
          {t.hero.features.map((f, i) => (
            <li
              key={f}
              className={`transition-all duration-700 ${i === active ? 'text-[21px] font-medium opacity-100' : 'opacity-55'}`}
            >
              {f}
            </li>
          ))}
        </motion.ul>
        </div>

        {/* bottom row */}
        <div className="mt-6 grid gap-10 lg:mt-auto lg:grid-cols-[1fr_auto_1fr] lg:items-end lg:gap-6">
          <div className="relative">
          {/* same for the headline + button: the shadow follows the block at every width */}
          <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-40 -right-6 -top-20 -z-10 hidden lg:block bg-[radial-gradient(closest-side,rgba(8,8,8,0.95),rgba(8,8,8,0.85)_68%,transparent)]" />
          <motion.div {...fade(0.9)} className="mix-blend-difference">
            <h1 className="display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.12]">
              {t.hero.title.map((line, i) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <a href="#buy" className="btn-line group mt-7 w-full max-w-[340px] !gap-4 whitespace-nowrap hover:bg-white hover:text-black">
              <span>
                {t.hero.cta} <span className="opacity-60">— {formatPrice(t)}</span>
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </a>
          </motion.div>
          </div>

          <motion.dl {...fade(1)} className="grid grid-cols-3 mix-blend-difference lg:w-[440px]">
            {t.hero.specs.map((s, i) => (
              <div key={s.label} className={`flex flex-col-reverse px-2.5 sm:px-4 ${i ? 'border-l border-white/30' : 'pl-0 lg:pl-4'}`}>
                <dt className="mt-1 whitespace-nowrap text-[11px] opacity-60 sm:text-[12px]">{s.label}</dt>
                <dd className="text-[20px] lg:text-[22px]">{s.value}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.p {...fade(1.1)} className="max-w-[300px] text-[14px] leading-[1.45] mix-blend-difference lg:justify-self-end">
            {t.hero.blurb}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
