/**
 * Run `task` when it is actually needed, instead of during page load:
 * as soon as `el` comes within ~1.5 screens of the viewport, or once the page
 * has loaded and the browser is idle (after `delay` ms) — whichever is first.
 * Keeps heavy 3D setup out of the first seconds and away from active scrolling.
 */
export function whenNeeded(el: Element, task: () => void, delay = 1500) {
  let done = false;
  let timer = 0;
  let idle = 0;
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  const cleanup = () => {
    io.disconnect();
    window.clearTimeout(timer);
    if (idle) w.cancelIdleCallback?.(idle);
    window.removeEventListener('load', onLoad);
  };
  const go = () => {
    if (done) return;
    done = true;
    cleanup();
    task();
  };
  const onLoad = () => {
    timer = window.setTimeout(() => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(go, { timeout: 3000 });
      else go();
    }, delay);
  };

  const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && go(), { rootMargin: '150% 0px' });
  io.observe(el);
  if (document.readyState === 'complete') onLoad();
  else window.addEventListener('load', onLoad, { once: true });

  return cleanup;
}
