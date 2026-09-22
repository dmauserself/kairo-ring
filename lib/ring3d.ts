import * as THREE from 'three';
import { ringColors, type RingColorId } from './content';

/* ------------------------------------------------------------------ */
/*  Stage: renderer + camera + studio lighting, with a managed loop    */
/* ------------------------------------------------------------------ */

export type Stage = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Request a single frame (for static scenes driven by scroll). */
  invalidate: () => void;
  dispose: () => void;
};

type StageOptions = {
  fov?: number;
  cameraZ?: number;
  /** Upper bound for devicePixelRatio (lower = cheaper). */
  maxDpr?: number;
  /** Called before every rendered frame. Return true to keep animating. */
  onFrame?: (time: number, dt: number) => boolean | void;
};

export function createStage(container: HTMLElement, opts: StageOptions = {}): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.maxDpr ?? 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = studioScene();
  scene.environment = pmrem.fromScene(envScene, 0.035).texture;
  envScene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 28, 1, 0.1, 60);
  camera.position.set(0, 0, opts.cameraZ ?? 6);

  let raf = 0;
  let visible = true;
  let running = false;
  let last = performance.now();
  let needsFrame = true;

  const frame = (now: number) => {
    raf = 0;
    // rAF timestamps can precede `last` on the first frame; never let dt go negative
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const keepGoing = opts.onFrame?.(now / 1000, dt);
    renderer.render(scene, camera);
    needsFrame = false;
    if ((keepGoing || needsFrame) && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  };

  const start = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const invalidate = () => {
    needsFrame = true;
    start();
  };

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) invalidate();
    },
    { rootMargin: '100px' },
  );
  io.observe(container);
  const onVis = () => !document.hidden && invalidate();
  document.addEventListener('visibilitychange', onVis);
  resize();

  return {
    scene,
    camera,
    renderer,
    invalidate,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => {
            Object.values(mm).forEach((v) => v instanceof THREE.Texture && v.dispose());
            mm.dispose();
          });
        }
      });
      scene.environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** A black room with a few softboxes — gives metal crisp, product-shot reflections. */
function studioScene() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x030303);
  const box = (w: number, h: number, k: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(k), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(...look);
    s.add(m);
  };
  box(7, 3, 7, [0, 6, 1]); // overhead
  box(1.4, 8, 10, [-6, 0.5, 1.5]); // left strip
  box(0.9, 8, 6, [6, 0.5, 0]); // right strip
  box(9, 0.8, 2.5, [0, 2.5, -6]); // back rim
  box(7, 2, 1.2, [0, -3, 6]); // low front fill
  return s;
}

/* ------------------------------------------------------------------ */
/*  Ring geometry                                                      */
/* ------------------------------------------------------------------ */

const V = (x: number, y: number) => new THREE.Vector2(x, y);

function arc(out: THREE.Vector2[], cx: number, cy: number, r: number, a0: number, a1: number, n = 10) {
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(V(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
}

/**
 * Cross-section of a band (in r/y), walked counter-clockwise so LatheGeometry
 * normals point out of the solid. `inner` returns the inner wall separately.
 */
function bandProfile(ri: number, ro: number, h: number, rad: number, crown = 0.01, grooves = true) {
  const shell: THREE.Vector2[] = [];
  const hh = h / 2;
  arc(shell, ri + rad, -hh + rad, rad, Math.PI, Math.PI * 1.5, 8);
  arc(shell, ro - rad, -hh + rad, rad, Math.PI * 1.5, Math.PI * 2, 8);
  const top = hh - rad;
  const n = 80;
  const g = top - 0.035;
  for (let i = 1; i < n; i++) {
    const y = -top + (2 * top * i) / n;
    let r = ro + crown * (1 - (y / top) ** 2);
    if (grooves) r -= 0.007 * Math.exp(-(((Math.abs(y) - g) / 0.005) ** 2));
    shell.push(V(r, y));
  }
  arc(shell, ro - rad, top, rad, 0, Math.PI / 2, 8);
  arc(shell, ri + rad, top, rad, Math.PI / 2, Math.PI, 8);

  const inner: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const y = top - (2 * top * i) / 40;
    inner.push(V(ri - 0.01 * (1 - (y / top) ** 2), y));
  }
  return { shell, inner };
}

export function finishMaterial(id: RingColorId) {
  const f = ringColors.find((c) => c.id === id) ?? ringColors[0];
  return new THREE.MeshPhysicalMaterial({
    color: f.color,
    metalness: f.metalness,
    roughness: f.roughness,
    clearcoat: f.clearcoat,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.7,
  });
}

export function applyFinish(mat: THREE.MeshPhysicalMaterial, id: RingColorId) {
  const f = ringColors.find((c) => c.id === id) ?? ringColors[0];
  mat.color.set(f.color);
  mat.metalness = f.metalness;
  mat.roughness = f.roughness;
  mat.clearcoat = f.clearcoat;
  mat.needsUpdate = true;
}

export const LED = new THREE.Color('#8fb8ff');

const RO = 1;
const RI = 0.78;
const H = 0.7;

/** The finished ring: titanium shell, resin inner wall and the sensor module. */
export function buildRing(finish: RingColorId) {
  const group = new THREE.Group();
  const shellMat = finishMaterial(finish);
  const { shell, inner } = bandProfile(RI, RO, H, 0.07);
  group.add(new THREE.Mesh(new THREE.LatheGeometry(shell, 220), shellMat));

  const resin = new THREE.MeshPhysicalMaterial({
    color: '#0b0b0d',
    roughness: 0.38,
    metalness: 0.1,
    clearcoat: 0.9,
    clearcoatRoughness: 0.2,
  });
  group.add(new THREE.Mesh(new THREE.LatheGeometry(inner, 220), resin));

  group.add(sensorModule(RI - 0.01));
  return { group, shellMat };
}

/** Sensor window + domes on the inner wall, at the back (−z) facing the centre. */
function sensorModule(r: number) {
  const m = new THREE.Group();

  const shape = new THREE.Shape();
  const w = 0.2;
  const h = 0.24;
  const c = 0.05;
  shape.moveTo(-w / 2 + c, -h / 2);
  shape.lineTo(w / 2 - c, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + c);
  shape.lineTo(w / 2, h / 2 - c);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - c, h / 2);
  shape.lineTo(-w / 2 + c, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - c);
  shape.lineTo(-w / 2, -h / 2 + c);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + c, -h / 2);
  const frame = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 3 }),
    new THREE.MeshPhysicalMaterial({ color: '#3a3b40', metalness: 1, roughness: 0.3 }),
  );
  frame.position.set(0, 0, -r + 0.005);
  m.add(frame);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.03, h - 0.03),
    new THREE.MeshPhysicalMaterial({ color: '#030304', roughness: 0.05, metalness: 0, clearcoat: 1 }),
  );
  glass.position.set(0, 0, -r + 0.023);
  m.add(glass);

  const ledMat = new THREE.MeshBasicMaterial({ color: LED.clone().multiplyScalar(2.2), toneMapped: false });
  const glowMat = new THREE.MeshBasicMaterial({
    color: LED,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  [
    [-0.04, 0.05],
    [0.04, 0.05],
    [-0.04, -0.03],
    [0.04, -0.03],
  ].forEach(([x, y]) => {
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.014, 24), ledMat);
    led.position.set(x, y, -r + 0.025);
    m.add(led);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), glowMat);
    glow.position.set(x, y, -r + 0.026);
    m.add(glow);
  });

  // temperature domes either side of the window
  const domeMat = new THREE.MeshPhysicalMaterial({ color: '#8d8f96', metalness: 1, roughness: 0.2 });
  [-0.32, 0.32].forEach((a) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 12), domeMat);
    d.scale.set(1, 1, 0.45);
    d.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r);
    d.lookAt(0, 0, 0);
    m.add(d);
  });
  return m;
}

/* ------------------------------------------------------------------ */
/*  Exploded layers                                                    */
/* ------------------------------------------------------------------ */

function stripeTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas');
  cv.width = 2048;
  cv.height = 128;
  const ctx = cv.getContext('2d')!;
  draw(ctx, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export type Layer = { mesh: THREE.Group; radius: number };

export function buildLayers(): Layer[] {
  const make = (ri: number, ro: number, h: number, mat: THREE.Material, rad = 0.012) => {
    const g = new THREE.Group();
    const { shell, inner } = bandProfile(ri, ro, h, rad, 0, false);
    g.add(new THREE.Mesh(new THREE.LatheGeometry(shell, 140), mat));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(inner, 140), mat));
    return g;
  };

  // 1. titanium shell
  const shell = new THREE.Group();
  const { shell: sp, inner: ip } = bandProfile(0.94, 1, 0.66, 0.03);
  const ti = finishMaterial('graphite');
  shell.add(new THREE.Mesh(new THREE.LatheGeometry(sp, 160), ti));
  shell.add(new THREE.Mesh(new THREE.LatheGeometry(ip, 160), ti));

  // 2. antenna: amber flex PCB with copper traces
  const antTex = stripeTexture((c, w, h) => {
    c.fillStyle = '#5a3212';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e9a765';
    c.lineWidth = 1.5;
    for (let row = 0; row < 6; row++) {
      c.beginPath();
      const y0 = 18 + row * 18;
      for (let x = 0; x <= w; x += 10) c.lineTo(x, y0 + ((x / 10) % 2 ? 4 : -4));
      c.stroke();
    }
  });
  const antenna = make(0.905, 0.925, 0.5, new THREE.MeshPhysicalMaterial({ map: antTex, metalness: 0.45, roughness: 0.4, clearcoat: 0.6 }));

  // 3. main board: dark PCB with chips
  const pcbTex = stripeTexture((c, w, h) => {
    c.fillStyle = '#101418';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#c9a15a';
    for (let x = 8; x < w; x += 16) c.fillRect(x, 8, 4, 10);
    for (let x = 8; x < w; x += 16) c.fillRect(x, h - 18, 4, 10);
    c.strokeStyle = '#2b3a3f';
    c.lineWidth = 2;
    for (let x = 0; x < w; x += 64) {
      c.beginPath();
      c.moveTo(x, 20);
      c.lineTo(x + 30, 64);
      c.lineTo(x + 30, 108);
      c.stroke();
    }
  });
  const board = make(0.87, 0.89, 0.56, new THREE.MeshPhysicalMaterial({ map: pcbTex, metalness: 0.3, roughness: 0.45, clearcoat: 0.5 }));
  const chipMat = new THREE.MeshPhysicalMaterial({ color: '#0a0a0c', roughness: 0.35, metalness: 0.2, clearcoat: 0.6 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const size = i % 3 === 0 ? 0.16 : 0.09;
    const chip = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.9, 0.025), chipMat);
    chip.position.set(Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9);
    chip.lookAt(Math.sin(a) * 2, 0, Math.cos(a) * 2);
    board.add(chip);
  }

  // 4. battery: brushed aluminium pouch
  const battery = make(0.83, 0.855, 0.5, new THREE.MeshPhysicalMaterial({ color: '#9ea3ab', metalness: 1, roughness: 0.42 }), 0.01);

  // 5. sensor board with glowing LEDs on the inside
  const sensors = make(0.8, 0.815, 0.54, new THREE.MeshPhysicalMaterial({ color: '#15171b', roughness: 0.5, metalness: 0.2 }));
  const ledMat = new THREE.MeshBasicMaterial({ color: LED.clone().multiplyScalar(2.4), toneMapped: false });
  const glowMat = new THREE.MeshBasicMaterial({ color: LED, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  [-0.18, -0.06, 0.06, 0.18].forEach((a) => {
    const p = new THREE.Vector3(Math.sin(a) * 0.795, 0, -Math.cos(a) * 0.795);
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.02, 20), ledMat);
    led.position.copy(p);
    led.lookAt(0, 0, 0);
    sensors.add(led);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), glowMat);
    glow.position.copy(p).multiplyScalar(0.995);
    glow.lookAt(0, 0, 0);
    sensors.add(glow);
  });

  // 6. inner coating: translucent resin
  const coating = make(
    0.76,
    0.785,
    0.62,
    new THREE.MeshPhysicalMaterial({
      color: '#dfe3ea',
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );

  return [shell, antenna, board, battery, sensors, coating].map((mesh, i) => ({ mesh, radius: [1, 0.925, 0.89, 0.855, 0.815, 0.785][i] }));
}
