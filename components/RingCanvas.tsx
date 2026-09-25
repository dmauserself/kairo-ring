'use client';

import type { MotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import type { RingColorId } from '@/lib/content';
import { whenNeeded } from '@/lib/defer';

type Props = {
  finish?: RingColorId;
  mode?: 'hero' | 'showcase';
  /** 0..1 scroll progress that turns the ring (hero only). */
  progress?: MotionValue<number>;
  reduceMotion?: boolean;
  className?: string;
  label: string;
};

/** Real-time 3D ring. three.js is loaded lazily so it never blocks first paint. */
export function RingCanvas({ finish = 'graphite', mode = 'hero', progress, reduceMotion = false, className, label }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef<{ setFinish: (f: RingColorId) => void } | null>(null);
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    const init = async () => {
      const { createStage, buildRing, applyFinish, Group } = await import('@/lib/ring3d');
      if (disposed) return;

      const pose = new Group();
      const spinner = new Group();
      const { group, shellMat } = buildRing(finishRef.current);
      spinner.add(group);
      pose.add(spinner);

      const hero = mode === 'hero';
      const baseTilt = hero ? 1.02 : 1.12;
      const baseRoll = hero ? -0.42 : -0.3;
      pose.rotation.set(baseTilt, 0, baseRoll);

      let yaw = hero ? 0.35 : 0;
      let vel = 0;
      let dragging = false;
      let lastX = 0;
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      let shown = 0;

      const stage = createStage(host, {
        fov: 26,
        cameraZ: hero ? 6.2 : 6.6,
        onFrame: (_t, dt) => {
          const p = progress?.get() ?? 0;
          let moving = false;

          // entrance: fade/scale in once
          if (shown < 1) {
            shown = reduceMotion ? 1 : Math.min(1, shown + dt * 0.9);
            const e = 1 - Math.pow(1 - shown, 3);
            pose.scale.setScalar(0.86 + 0.14 * e);
            pose.position.y = (1 - e) * -0.25;
            moving = shown < 1;
          }

          if (!reduceMotion && !dragging) {
            yaw += dt * (hero ? 0.12 : 0.25) + vel * dt;
            vel *= 0.94;
            moving = true;
          }
          if (dragging) moving = true;

          pointer.x += (pointer.tx - pointer.x) * 0.06;
          pointer.y += (pointer.ty - pointer.y) * 0.06;
          if (Math.abs(pointer.tx - pointer.x) > 0.001) moving = true;

          spinner.rotation.y = yaw + (hero ? p * 2.4 : 0);
          pose.rotation.x = baseTilt + (hero ? p * 0.35 : 0) + pointer.y * 0.12;
          pose.rotation.z = baseRoll + pointer.x * 0.12;
          return moving;
        },
      });
      stage.scene.add(pose);
      void stage.ready();

      api.current = {
        setFinish: (f) => {
          applyFinish(shellMat as THREE.MeshPhysicalMaterial, f);
          stage.invalidate();
        },
      };

      const onMove = (e: PointerEvent) => {
        if (reduceMotion) return;
        const r = host.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (dragging) {
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          yaw += dx * 0.01;
          vel = dx * 0.6;
        }
        stage.invalidate();
      };
      const onDown = (e: PointerEvent) => {
        if (mode !== 'showcase') return;
        dragging = true;
        lastX = e.clientX;
        host.setPointerCapture(e.pointerId);
      };
      const onUp = () => {
        dragging = false;
      };
      const onLeave = () => {
        pointer.tx = 0;
        pointer.ty = 0;
        stage.invalidate();
      };
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerdown', onDown);
      host.addEventListener('pointerup', onUp);
      host.addEventListener('pointerleave', onLeave);
      const unsub = progress?.on('change', () => stage.invalidate());

      cleanup = () => {
        unsub?.();
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointerleave', onLeave);
        stage.dispose();
        api.current = null;
      };
    };

    // The hero ring is on screen at load, so it starts right away; the showcase
    // further down waits until it is needed, keeping page load light.
    const run = () => void init().catch((e) => console.error('ring3d', e));
    let cancelDefer = () => {};
    if (mode === 'hero') run();
    else cancelDefer = whenNeeded(host, run);

    return () => {
      disposed = true;
      cancelDefer();
      cleanup();
    };
  }, [mode, progress, reduceMotion]);

  useEffect(() => {
    api.current?.setFinish(finish);
  }, [finish]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className={`${className ?? ''} ${mode === 'showcase' ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}`}
    />
  );
}
