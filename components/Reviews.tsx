'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { Reveal } from './Reveal';

/**
 * Transform-based carousel. It is deliberately NOT a native horizontal scroller:
 * on a trackpad (Safari especially) a scroll container latches the gesture and
 * stops the page from scrolling vertically. Here vertical scrolling always
 * belongs to the page; horizontal swipes and the arrows move the cards.
 */
export function Reviews() {
  const { t } = useLang();
  const items = t.reviews.items;
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [maxIndex, setMaxIndex] = useState(items.length - 1);

  // measure one card and how many fit
  useEffect(() => {
    const view = viewRef.current;
    const track = trackRef.current;
    if (!view || !track) return;
    const measure = () => {
      const card = track.querySelector('li');
      if (!card) return;
      const w = card.getBoundingClientRect().width;
      setStep(w);
      const visible = Math.max(1, Math.floor((view.clientWidth + 1) / w));
      setMaxIndex(Math.max(0, items.length - visible));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => setIndex((i) => Math.min(i, maxIndex)), [maxIndex]);

  const go = useCallback((dir: 1 | -1) => setIndex((i) => Math.min(maxIndex, Math.max(0, i + dir))), [maxIndex]);

  // horizontal trackpad swipe → move cards; vertical deltas are left alone for the page
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    let acc = 0;
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); // also stops Safari's back-swipe while over the cards
      const now = performance.now();
      if (now < lock) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 40) {
        go(acc > 0 ? 1 : -1);
        acc = 0;
        lock = now + 450;
      }
    };
    view.addEventListener('wheel', onWheel, { passive: false });
    return () => view.removeEventListener('wheel', onWheel);
  }, [go]);

  // touch swipe; touch-action: pan-y keeps vertical scrolling native
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const btn = 'grid h-12 w-12 place-items-center border border-night/25 transition-colors enabled:hover:bg-night enabled:hover:text-paper disabled:opacity-30';

  return (
    <section data-theme="light" aria-labelledby="reviews-title" className="overflow-x-clip bg-paper pb-28 text-night md:pb-40">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-night/15 pt-14">
          <Reveal>
            <h2 id="reviews-title" className="display text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05]">
              {t.reviews.title}
            </h2>
            <p className="mt-3 text-[15px] text-smoke">{t.reviews.lead}</p>
          </Reveal>
          <div className="flex">
            <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label={t.reviews.prev} className={btn}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(1)} disabled={index >= maxIndex} aria-label={t.reviews.next} className={`-ml-px ${btn}`}>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* aligned with the page margin; cards run off to the right edge */}
        <div ref={viewRef} className="mt-12 touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <ul
            ref={trackRef}
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translate3d(${-index * step}px,0,0)` }}
            aria-live="polite"
          >
            {items.map((r, i) => (
              <li
                key={r.name}
                className={`flex w-[88%] shrink-0 flex-col pr-8 sm:w-1/2 lg:w-1/3 ${i ? 'border-l border-night/15 pl-8' : ''}`}
              >
                <div className="flex gap-1 text-[13px]" role="img" aria-label={`${t.reviews.stars}: ${r.rating} / 5`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s} aria-hidden className={s < r.rating ? 'text-night' : 'text-night/20'}>
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="mt-6 flex-1 text-[19px] leading-[1.45]">{t.quotes[0]}
                  {r.text}
                  {t.quotes[1]}</blockquote>
                <p className="mt-8 flex items-center gap-4">
                  <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-night text-[13px] text-paper">
                    {r.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium">{r.name}</span>
                    <span className="block text-[13px] text-smoke">{r.role}</span>
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
