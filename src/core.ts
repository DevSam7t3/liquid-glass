import { EventEmitter } from './emitter.js';
import { buildMaps } from './math.js';
import {
  nextFilterId,
  createFilterSVG,
  injectImages,
  setScale,
  supportsBackdropFilter,
} from './filter.js';
import type { LiquidGlassHandle, LiquidGlassEventMap, LiquidGlassOptions } from './types.js';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULTS: Required<LiquidGlassOptions> = {
  width: 0, // 0 = auto-detect from element
  height: 0,
  radius: null as unknown as number,
  bezelWidth: 20,
  glassThickness: 80,
  refractiveIndex: 1.5,
  profile: 'convexSquircle',
  blur: 0.5,
  saturation: 1.3,
  specularSlope: 0.8,
  filterMode: 'screen',
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Resolve a selector or element, throwing if not found. Always returns Element. */
export function resolveEl(target: string | Element): Element {
  if (typeof target === 'string') {
    const found = document.querySelector(target);
    if (!found) throw new Error(`Liquid Glass: element not found — "${target}"`);
    return found;
  }
  if (target instanceof Element) return target;
  throw new Error(`Liquid Glass: invalid target — expected a CSS selector or Element`);
}

function readRadius(el: Element, override: number | null | undefined): number {
  if (override != null) return override;
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius);
  return Number.isFinite(r) ? r : 0;
}

// ─── Handle implementation ────────────────────────────────────────────────────

class LiquidGlassHandleImpl extends EventEmitter<LiquidGlassEventMap> implements LiquidGlassHandle {
  readonly element: Element;
  /** @internal */ _setScale: (s: number) => void;
  /** @internal */ _getMaxDisp: () => number;
  private readonly _cleanup: () => void;
  private readonly _rebuild: () => void;

  constructor(
    element: Element,
    setScaleFn: (s: number) => void,
    getMaxDispFn: () => number,
    cleanupFn: () => void,
    rebuildFn: () => void,
  ) {
    super();
    this.element = element;
    this._setScale = setScaleFn;
    this._getMaxDisp = getMaxDispFn;
    this._cleanup = cleanupFn;
    this._rebuild = rebuildFn;
  }

  refresh(): this {
    this._rebuild();
    return this;
  }

  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

// ─── DOM injection ────────────────────────────────────────────────────────────

function inject(el: Element, filterId: string, useBackdrop: boolean) {
  if (getComputedStyle(el).position === 'static') {
    (el as HTMLElement).style.position = 'relative';
  }

  const clone = document.createElement('div');
  clone.className = 'lg-clone';
  const cloneWorld = document.createElement('div');
  cloneWorld.className = 'lg-clone-world';
  clone.appendChild(cloneWorld);

  const inner = document.createElement('div');
  inner.className = 'lg-inner';

  el.insertBefore(inner, el.firstChild);
  el.insertBefore(clone, el.firstChild);

  if (useBackdrop) {
    clone.style.display = 'none';
    inner.style.backdropFilter = `url("#${filterId}")`;
    (inner.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter =
      `url("#${filterId}")`;
  } else {
    // Non-Chrome fallback: CSS backdrop-filter (no displacement physics, but frosted glass).
    // Firefox and Safari both support blur()/saturate() in backdrop-filter.
    clone.style.display = 'none';
    const cssFilter = 'blur(8px) saturate(1.4) brightness(1.05)';
    inner.style.backdropFilter = cssFilter;
    (inner.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter =
      cssFilter;
  }

  return { inner, clone };
}

// ─── Public factory ───────────────────────────────────────────────────────────

export function createLiquidGlass(
  target: string | Element,
  options: LiquidGlassOptions = {},
): LiquidGlassHandle {
  const el = resolveEl(target); // throws if not found

  const opts = { ...DEFAULTS, ...options };
  const useBackdrop = supportsBackdropFilter();
  const filterId = nextFilterId();

  const getSize = () => ({
    w: opts.width || 0 || el.clientWidth || 100,
    h: opts.height || 0 || el.clientHeight || 100,
    r: readRadius(el, opts.radius),
  });

  const { w, h, r } = getSize();

  const initial = buildMaps({
    width: w,
    height: h,
    radius: r,
    bezelWidth: opts.bezelWidth,
    glassThickness: opts.glassThickness,
    refractiveIndex: opts.refractiveIndex,
    profile: opts.profile,
  });

  const { svg, refs } = createFilterSVG({
    filterId,
    width: w,
    height: h,
    blur: opts.blur,
    scale: initial.maxDisplacement,
    saturation: opts.saturation,
    specularSlope: opts.specularSlope,
    filterMode: opts.filterMode,
  });
  injectImages(refs, initial.dispUrl, initial.specUrl);
  el.appendChild(svg);

  inject(el, filterId, useBackdrop);

  let currentMaxDisp = initial.maxDisplacement;

  function rebuild(): void {
    const { w: w2, h: h2, r: r2 } = getSize();
    const maps = buildMaps({
      width: w2,
      height: h2,
      radius: r2,
      bezelWidth: opts.bezelWidth,
      glassThickness: opts.glassThickness,
      refractiveIndex: opts.refractiveIndex,
      profile: opts.profile,
    });
    injectImages(refs, maps.dispUrl, maps.specUrl);
    currentMaxDisp = maps.maxDisplacement;
    refs.dispMapEl.setAttribute('scale', String(currentMaxDisp));
    handle._emit('resize', { width: w2, height: h2 });
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(rebuild);
    ro.observe(el);
  }

  const handle = new LiquidGlassHandleImpl(
    el,
    (s) => setScale(refs, s),
    () => currentMaxDisp,
    () => {
      if (ro) ro.disconnect();
      svg.remove();
      el.querySelector('.lg-inner')?.remove();
      el.querySelector('.lg-clone')?.remove();
    },
    rebuild,
  );

  return handle;
}
