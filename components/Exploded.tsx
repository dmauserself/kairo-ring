'use client';

import { useScroll } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { Reveal } from './Reveal';

const SPACING = 0.9;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function Exploded() {
  const { t } = useLang();
  const layers = t.tech.layers;

  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelRefs = useRef<(HTMLLIElement | null)[]>([]);
  const labelColRef = useRef<HTMLOListElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // the ring comes apart while the stage travels up into view; the page never stops moving
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: wide ? ['start 90%', 'center 52%'] : ['start 90%', 'end 70%'],
  });

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;
    let disposed = false;
    let cleanup = () => {};

    const fallback = () => {
      // no WebGL: still show every label, simply stacked
      labelRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = `translateY(${i * 88}px)`;
      });
      badgeRefs.current.forEach((el) => el && (el.style.display = 'none'));
    };

    (async () => {
      const THREE = await import('three');
      const { createStage, buildLayers } = await import('@/lib/ring3d');
      if (disposed) return;

      const pose = new THREE.Group();
      pose.rotation.x = 0.6;
      const built = buildLayers();
      built.forEach((l) => pose.add(l.mesh));

      // Driven only by the user's own scrolling, so it stays on even with
      // "reduce motion": nothing here moves unless the visitor scrolls.
      let current = 0;
      const v = new THREE.Vector3();

      // Layout is constant relative to the stage while it is pinned, so measure
      // once (and on resize) instead of forcing a layout read every frame.
      const box = { hx: 0, hy: 0, hw: 1, hh: 1, cx: 0, cy: 0, ch: 1, heights: [] as number[] };
      const measure = () => {
        box.hx = host.offsetLeft;
        box.hy = host.offsetTop;
        box.hw = host.offsetWidth;
        box.hh = host.offsetHeight;
        const col = labelColRef.current;
        if (col) {
          box.cx = col.offsetLeft;
          box.cy = col.offsetTop;
          box.ch = col.offsetHeight;
        }
        box.heights = labelRefs.current.map((el) => el?.offsetHeight ?? 0);
      };
      measure();
      const lines = svgRef.current?.querySelectorAll('polyline');
      const dots = svgRef.current?.querySelectorAll('circle');

      const s = createStage(host, {
        fov: 28,
        cameraZ: wide ? 12.5 : 11,
        maxDpr: 1.5,
        onFrame: (_t, dt) => {
          const target = scrollYProgress.get();
          current += (target - current) * Math.min(1, dt * 9);
          if (Math.abs(target - current) < 0.0005) current = target;
          const e = ease(clamp01((current - 0.02) / 0.62));

          // rotation follows the scroll instead of spinning on its own: no idle rendering
          built.forEach((l, i) => {
            l.mesh.position.y = (2.5 - i) * SPACING * e;
            l.mesh.rotation.y = 0.6 + current * 1.3;
          });
          pose.updateMatrixWorld(true);
          // the camera's view matrix is only refreshed inside render(); do it now so the
          // very first frame projects correctly instead of yielding Infinity/NaN
          s.camera.updateMatrixWorld();

          const anchors = built.map((l) => {
            v.set(l.radius + 0.04, l.mesh.position.y, 0).applyMatrix4(pose.matrixWorld).project(s.camera);
            const x = box.hx + ((v.x + 1) / 2) * box.hw;
            const y = box.hy + ((1 - v.y) / 2) * box.hh;
            return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
          });
          const showAt = (i: number) => clamp01((current - 0.5 - i * 0.05) / 0.2);

          // labels sit level with their layer, pushed apart just enough never to touch
          const labels = labelRefs.current;
          if (labels.length && labels.every(Boolean) && lines && dots) {
            const hs = box.heights;
            const ys = anchors.map((a) => a.y - box.cy - 10);
            for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + hs[i - 1] + 14);
            const overflow = ys[ys.length - 1] + hs[hs.length - 1] - box.ch;
            if (overflow > 0) {
              ys[ys.length - 1] -= overflow;
              for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - hs[i] - 14);
            }
            const lx = box.cx - 14;
            const kx = lx - 28;
            anchors.forEach((a, i) => {
              const show = String(showAt(i));
              const ly = box.cy + ys[i] + 10;
              lines[i].setAttribute('points', `${a.x},${a.y} ${kx},${a.y} ${kx + 14},${ly} ${lx},${ly}`);
              lines[i].style.opacity = show;
              dots[i].setAttribute('cx', String(a.x));
              dots[i].setAttribute('cy', String(a.y));
              dots[i].style.opacity = show;
              labels[i]!.style.opacity = show;
              labels[i]!.style.transform = `translateY(${ys[i]}px)`;
            });
          }
          anchors.forEach((a, i) => {
            const badge = badgeRefs.current[i];
            if (!badge) return;
            badge.style.transform = `translate(${a.x + 14}px, ${a.y - 12}px)`;
            badge.style.opacity = String(showAt(i));
          });

          return current !== target;
        },
      });
      s.scene.add(pose);
      const unsub = scrollYProgress.on('change', () => s.invalidate());
      const ro = new ResizeObserver(() => {
        measure();
        s.invalidate();
      });
      ro.observe(stage);
      cleanup = () => {
        unsub();
        ro.disconnect();
        s.dispose();
      };
    })().catch(fallback);

    return () => {
      disposed = true;
      cleanup();
    };
  }, [scrollYProgress, wide]);

  return (
    <section id="tech" data-theme="dark" className="relative bg-night py-24 md:py-32">
      <div className="shell">
        <Reveal className="max-w-[34rem]">
          <h2 className="display text-[clamp(2.1rem,3.8vw,3.6rem)] leading-[1.05]">{t.tech.title}</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ash">{t.tech.lead}</p>
        </Reveal>
      </div>

      {/* the stage scrolls with the page like everything else — no pinning */}
      <div ref={stageRef} className={`relative ${wide ? 'mt-6 h-[min(82vh,800px)] min-h-[600px]' : 'mt-8'}`}>
        <div
          ref={hostRef}
          role="img"
          aria-label={t.tech.title}
          className={wide ? 'absolute bottom-0 left-[6%] top-0 w-[46%]' : 'relative mx-auto aspect-[4/5] w-full max-w-[460px]'}
        />

        <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {layers.map((l) => (
            <g key={l.name}>
              <polyline fill="none" stroke="rgba(236,235,231,0.45)" strokeWidth="1" style={{ opacity: 0 }} />
              <circle r="3" fill="#ECEBE7" style={{ opacity: 0 }} />
            </g>
          ))}
        </svg>

        {wide ? (
          <ol ref={labelColRef} className="absolute bottom-0 right-[max(3rem,calc((100vw_-_1440px)/2_+_3rem))] top-0 w-[min(34%,420px)]">
            {layers.map((l, i) => (
              <li key={l.name} ref={(el) => void (labelRefs.current[i] = el)} className="absolute inset-x-0 top-0" style={{ opacity: 0 }}>
                <p className="flex gap-3 text-[15px] font-medium">
                  <span className="w-5 text-ash">{i + 1}</span>
                  {l.name}
                </p>
                <p className="mt-1 pl-8 text-[13px] leading-snug text-ash">{l.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          layers.map((l, i) => (
            <span
              key={l.name}
              ref={(el) => void (badgeRefs.current[i] = el)}
              className="pointer-events-none absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full border border-white/40 bg-night text-[11px]"
              style={{ opacity: 0 }}
              aria-hidden
            >
              {i + 1}
            </span>
          ))
        )}
      </div>

      {!wide && (
        <ol className="shell mt-10 grid gap-6 sm:grid-cols-2">
          {layers.map((l, i) => (
            <li key={l.name} className="border-t border-white/[0.14] pt-4">
              <p className="flex gap-3 text-[15px] font-medium">
                <span className="w-5 text-ash">{i + 1}</span>
                {l.name}
              </p>
              <p className="mt-1 pl-8 text-[14px] leading-snug text-ash">{l.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
