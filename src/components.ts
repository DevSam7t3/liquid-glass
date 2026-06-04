import { EventEmitter } from './emitter.js';
import { createLiquidGlass, resolveEl } from './core.js';
import { Spring } from './spring.js';
import { supportsBackdropFilter } from './filter.js';
import type {
  LiquidButtonHandle,
  LiquidButtonEventMap,
  LiquidButtonOptions,
  LiquidSwitchHandle,
  LiquidSwitchEventMap,
  LiquidSwitchOptions,
  LiquidSliderHandle,
  LiquidSliderEventMap,
  LiquidSliderOptions,
  LiquidCursorHandle,
  LiquidCursorEventMap,
  LiquidCursorOptions,
  LiquidInputHandle,
  LiquidInputEventMap,
  LiquidInputOptions,
  LiquidDialHandle,
  LiquidDialEventMap,
  LiquidDialOptions,
  LiquidTooltipHandle,
  LiquidTooltipEventMap,
  LiquidTooltipOptions,
  LiquidProgressHandle,
  LiquidProgressEventMap,
  LiquidProgressOptions,
  LiquidGlassHandle,
} from './types.js';

const DT = 1 / 60;

/** @internal — internal glass methods not on the public LiquidGlassHandle interface */
interface GlassInternals {
  _setScale(s: number): void;
  _getMaxDisp(): number;
}
type InternalGlass = LiquidGlassHandle & GlassInternals;

// ─── DOM event-listener tracker (auto-cleanup) ───────────────────────────────

function makeCleanupTracker() {
  const teardowns: Array<() => void> = [];
  function add(
    target: EventTarget,
    event: string,
    fn: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions,
  ) {
    target.addEventListener(event, fn, opts);
    teardowns.push(() => target.removeEventListener(event, fn, opts));
  }
  return { add, runAll: () => teardowns.forEach((fn) => fn()) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Button
// ─────────────────────────────────────────────────────────────────────────────

class LiquidButtonHandleImpl
  extends EventEmitter<LiquidButtonEventMap>
  implements LiquidButtonHandle
{
  readonly element: Element;
  private readonly _labelSpan: HTMLSpanElement;
  private readonly _cleanup: () => void;

  constructor(element: Element, labelSpan: HTMLSpanElement, cleanup: () => void) {
    super();
    this.element = element;
    this._labelSpan = labelSpan;
    this._cleanup = cleanup;
  }

  setLabel(text: string): this {
    this._labelSpan.textContent = text;
    return this;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

export function createLiquidButton(
  target: string | Element,
  options: LiquidButtonOptions = {},
): LiquidButtonHandle {
  const el = resolveEl(target);
  const { label, ...glassOpts } = options;

  el.classList.add('lg-button');
  if (!el.hasAttribute('type') && el.tagName === 'BUTTON') el.setAttribute('type', 'button');

  let labelSpan = el.querySelector<HTMLSpanElement>('.lg-button-text');
  if (!labelSpan) {
    labelSpan = document.createElement('span');
    labelSpan.className = 'lg-button-text';
    el.appendChild(labelSpan);
  }
  if (label != null) labelSpan.textContent = label;

  const glass = createLiquidGlass(el, {
    bezelWidth: 26,
    glassThickness: 120,
    refractiveIndex: 2.0,
    blur: 0.8,
    saturation: 1.2,
    specularSlope: 0.8,
    ...glassOpts,
  }) as InternalGlass;

  const sp = {
    sc: new Spring(1, 400, 20),
    sd: new Spring(8, 400, 20),
    rs: new Spring(0.8, 300, 20),
  };
  let hover = false,
    pressed = false,
    af: number | null = null;

  function loop() {
    sp.sc.setTarget(pressed ? 0.9 : hover ? 1.05 : 1);
    sp.sd.setTarget(pressed ? 2 : hover ? 16 : 8);
    sp.rs.setTarget(pressed ? 1.5 : hover ? 1.2 : 0.8);

    const sc = sp.sc.update(DT),
      sd = sp.sd.update(DT),
      rs = sp.rs.update(DT);
    (el as HTMLElement).style.transform = `scale(${sc})`;
    glass._setScale(glass._getMaxDisp() * rs);

    const inner = el.querySelector<HTMLElement>('.lg-inner');
    if (inner)
      inner.style.boxShadow =
        `0 ${sd}px ${sd * 3}px rgba(0,0,0,.4),` +
        `inset 0 2px 4px rgba(255,255,255,.2),` +
        `inset 0 -2px 6px rgba(0,0,0,.4),` +
        `inset 0 0 12px rgba(255,255,255,.1)`;

    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  const ev = makeCleanupTracker();

  const handle = new LiquidButtonHandleImpl(el, labelSpan, () => {
    if (af !== null) cancelAnimationFrame(af);
    glass.destroy();
    ev.runAll();
    el.classList.remove('lg-button');
  });

  ev.add(el, 'click', (e) => handle._emit('click', e as MouseEvent));
  ev.add(el, 'mouseenter', (e) => {
    hover = true;
    handle._emit('mouseenter', e as MouseEvent);
    kick();
  });
  ev.add(el, 'mouseleave', (e) => {
    hover = false;
    pressed = false;
    handle._emit('mouseleave', e as MouseEvent);
    kick();
  });
  ev.add(el, 'mousedown', (e) => {
    pressed = true;
    handle._emit('mousedown', e as MouseEvent);
    kick();
  });
  ev.add(el, 'mouseup', (e) => {
    pressed = false;
    handle._emit('mouseup', e as MouseEvent);
    kick();
  });
  ev.add(
    el,
    'touchstart',
    () => {
      pressed = true;
      kick();
    },
    { passive: false },
  );
  ev.add(el, 'touchend', () => {
    pressed = false;
    kick();
  });

  af = requestAnimationFrame(loop);
  return handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Switch
// ─────────────────────────────────────────────────────────────────────────────

class LiquidSwitchHandleImpl
  extends EventEmitter<LiquidSwitchEventMap>
  implements LiquidSwitchHandle
{
  readonly element: Element;
  private _state: { chk: boolean };
  private readonly _setChecked: (v: boolean, emit: boolean) => void;
  private readonly _cleanup: () => void;

  constructor(
    element: Element,
    state: { chk: boolean },
    setChecked: (v: boolean, emit: boolean) => void,
    cleanup: () => void,
  ) {
    super();
    this.element = element;
    this._state = state;
    this._setChecked = setChecked;
    this._cleanup = cleanup;
  }

  get checked(): boolean {
    return this._state.chk;
  }
  set checked(v: boolean) {
    this._setChecked(!!v, false);
  }

  toggle(): this {
    this._setChecked(!this._state.chk, true);
    return this;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

export function createLiquidSwitch(
  target: string | Element,
  options: LiquidSwitchOptions = {},
): LiquidSwitchHandle {
  const el = resolveEl(target);
  const { checked: initialChecked = false, ...glassOpts } = options;

  const TW = 160,
    TH = 67,
    W = 146,
    H = 92,
    R = 46,
    BW = 19;
  const SR = 0.65,
    SA = 0.9;
  const ro = ((1 - SR) * W) / 2;
  const tr = TW - TH - (W - H) * SR;

  const track = document.createElement('div');
  track.className = 'lg-switch-track';
  const thumb = document.createElement('div');
  thumb.className = 'lg-switch-thumb';
  track.appendChild(thumb);
  el.appendChild(track);

  const glass = createLiquidGlass(thumb, {
    width: W,
    height: H,
    radius: R,
    bezelWidth: BW,
    glassThickness: 47,
    refractiveIndex: 1.5,
    blur: 0.2,
    saturation: 6,
    specularSlope: 0.5,
    filterMode: 'composite',
    ...glassOpts,
  }) as InternalGlass;

  const state = { chk: !!initialChecked, pd: false, ix: 0, xr: initialChecked ? 1 : 0 };
  const sp = {
    xr: new Spring(state.chk ? 1 : 0, 1000, 80),
    sc: new Spring(SR, 2000, 80),
    bo: new Spring(1, 2000, 80),
    tc: new Spring(state.chk ? 1 : 0, 1000, 80),
    sr: new Spring(0.4, 100, 10),
  };
  let af: number | null = null;
  const useBackdrop = supportsBackdropFilter();

  function loop() {
    if (!state.pd) sp.xr.setTarget(state.chk ? 1 : 0);
    sp.sc.setTarget(state.pd ? SA : SR);
    sp.bo.setTarget(state.pd ? 0.1 : 1);
    sp.sr.setTarget(state.pd ? 0.9 : 0.4);
    sp.tc.setTarget(state.pd ? (state.xr > 0.5 ? 1 : 0) : state.chk ? 1 : 0);

    const xr = sp.xr.update(DT),
      sc = sp.sc.update(DT),
      bo = sp.bo.update(DT),
      tc = sp.tc.update(DT);

    (thumb as HTMLElement).style.left = -ro + (TH - H * SR) / 2 + xr * tr + 'px';
    (thumb as HTMLElement).style.transform = `translateY(-50%) scale(${sc})`;
    (thumb as HTMLElement).style.backgroundColor = `rgba(255,255,255,${bo})`;
    (thumb as HTMLElement).style.boxShadow = state.pd
      ? '0 4px 22px rgba(0,0,0,.1),inset 2px 7px 24px rgba(0,0,0,.09)'
      : '0 10px 30px rgba(0,0,0,.5)';

    const r2 = Math.round(255 + (139 - 255) * tc);
    const g2 = Math.round(255 + (92 - 255) * tc);
    const b2 = Math.round(255 + (246 - 255) * tc);
    track.style.backgroundColor = `rgba(${r2},${g2},${b2},${0.05 + 0.45 * tc})`;

    const cloneEl = thumb.querySelector<HTMLElement>('.lg-clone');
    if (cloneEl && !useBackdrop) cloneEl.style.opacity = String(1 - bo);
    glass._setScale(glass._getMaxDisp() * sp.sr.update(DT));

    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  function setChecked(v: boolean, emit: boolean) {
    state.chk = v;
    if (emit) handle._emit('change', { checked: state.chk, element: el });
    kick();
  }

  const ev = makeCleanupTracker();

  const handle = new LiquidSwitchHandleImpl(el, state, setChecked, () => {
    if (af !== null) cancelAnimationFrame(af);
    glass.destroy();
    ev.runAll();
  });

  ev.add(thumb, 'mousedown', (e: Event) => {
    state.pd = true;
    state.ix = (e as MouseEvent).clientX;
    state.xr = state.chk ? 1 : 0;
    kick();
  });
  ev.add(
    thumb,
    'touchstart',
    (e: Event) => {
      e.preventDefault();
      state.pd = true;
      state.ix = (e as TouchEvent).touches[0].clientX;
      state.xr = state.chk ? 1 : 0;
      kick();
    },
    { passive: false },
  );
  ev.add(window, 'mousemove', (e: Event) => {
    if (!state.pd) return;
    const cx = (e as MouseEvent).clientX;
    const rv = (state.chk ? 1 : 0) + (cx - state.ix) / tr;
    state.xr =
      Math.min(1, Math.max(0, rv)) +
      ((rv < 0 ? 1 : -1) * (rv < 0 ? -rv : rv > 1 ? rv - 1 : 0)) / 22;
    sp.xr.setTarget(state.xr);
    kick();
  });
  ev.add(
    window,
    'touchmove',
    (e: Event) => {
      if (!state.pd) return;
      e.preventDefault();
      const cx = (e as TouchEvent).touches[0].clientX;
      const rv = (state.chk ? 1 : 0) + (cx - state.ix) / tr;
      state.xr =
        Math.min(1, Math.max(0, rv)) +
        ((rv < 0 ? 1 : -1) * (rv < 0 ? -rv : rv > 1 ? rv - 1 : 0)) / 22;
      sp.xr.setTarget(state.xr);
      kick();
    },
    { passive: false },
  );
  ev.add(window, 'mouseup', (e: Event) => {
    if (!state.pd) return;
    state.pd = false;
    const cx = (e as MouseEvent).clientX;
    const next = Math.abs(cx - state.ix) < 4 ? !state.chk : state.xr > 0.5;
    if (next !== state.chk) setChecked(next, true);
    else kick();
  });
  ev.add(window, 'touchend', (e: Event) => {
    if (!state.pd) return;
    state.pd = false;
    const cx = (e as TouchEvent).changedTouches[0].clientX;
    const next = Math.abs(cx - state.ix) < 4 ? !state.chk : state.xr > 0.5;
    if (next !== state.chk) setChecked(next, true);
    else kick();
  });
  ev.add(track, 'click', (e: Event) => {
    if (e.target === track) setChecked(!state.chk, true);
  });

  af = requestAnimationFrame(loop);
  return handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Slider
// ─────────────────────────────────────────────────────────────────────────────

class LiquidSliderHandleImpl
  extends EventEmitter<LiquidSliderEventMap>
  implements LiquidSliderHandle
{
  readonly element: Element;
  private _current: number;
  private readonly _setVal: (v: number) => void;
  private readonly _cleanup: () => void;

  constructor(element: Element, initial: number, setVal: (v: number) => void, cleanup: () => void) {
    super();
    this.element = element;
    this._current = initial;
    this._setVal = setVal;
    this._cleanup = cleanup;
  }

  get value(): number {
    return this._current;
  }
  set value(v: number) {
    this._setVal(v);
  }
  /** @internal */ _updateCurrent(v: number) {
    this._current = v;
  }

  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

export function createLiquidSlider(
  target: string | Element,
  options: LiquidSliderOptions = {},
): LiquidSliderHandle {
  const el = resolveEl(target);
  const { min = 0, max = 100, value: initial = 50, step = 1, ...glassOpts } = options;

  const TW = 330,
    W = 90,
    H = 60,
    R = 30,
    BW = 16;
  const SR = 0.6;

  el.classList.add('lg-slider');

  const track = document.createElement('div');
  track.className = 'lg-slider-track';
  const fill = document.createElement('div');
  fill.className = 'lg-slider-fill';
  track.appendChild(fill);
  const thumb = document.createElement('div');
  thumb.className = 'lg-slider-thumb';
  el.appendChild(track);
  el.appendChild(thumb);

  const glass = createLiquidGlass(thumb, {
    width: W,
    height: H,
    radius: R,
    bezelWidth: BW,
    glassThickness: 80,
    refractiveIndex: 1.45,
    blur: 0,
    saturation: 7,
    specularSlope: 0.4,
    filterMode: 'composite',
    ...glassOpts,
  }) as InternalGlass;

  function clampStep(v: number): number {
    return Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  }

  let current = clampStep(initial);
  let dragging = false;
  const sp = {
    sc: new Spring(SR, 2000, 80),
    bo: new Spring(1, 2000, 80),
    sr: new Spring(0.4, 100, 10),
  };
  let af: number | null = null;
  const useBackdrop = supportsBackdropFilter();

  function layout() {
    const pct = (current - min) / (max - min);
    fill.style.width = pct * 100 + '%';
    (thumb as HTMLElement).style.left = (W * SR) / 2 + pct * (TW - W * SR) - W / 2 + 'px';
  }

  function loop() {
    sp.sc.setTarget(dragging ? 1.0 : SR);
    sp.bo.setTarget(dragging ? 0.1 : 1);
    sp.sr.setTarget(dragging ? 0.9 : 0.4);

    const sc = sp.sc.update(DT),
      bo = sp.bo.update(DT);
    (thumb as HTMLElement).style.transform = `scale(${sc})`;
    (thumb as HTMLElement).style.backgroundColor = `rgba(255,255,255,${bo})`;
    const cloneEl = thumb.querySelector<HTMLElement>('.lg-clone');
    if (cloneEl && !useBackdrop) cloneEl.style.opacity = String(1 - bo);
    glass._setScale(glass._getMaxDisp() * sp.sr.update(DT));

    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  function fromClientX(clientX: number) {
    const rect = track.getBoundingClientRect();
    const halfW = (W * SR) / 2;
    const pct = Math.min(1, Math.max(0, (clientX - rect.left - halfW) / (TW - W * SR)));
    const next = clampStep(min + pct * (max - min));
    if (next !== current) {
      current = next;
      (handle as LiquidSliderHandleImpl)._updateCurrent(current);
      layout();
      handle._emit('input', { value: current, element: el });
    }
  }

  const ev = makeCleanupTracker();

  const handle = new LiquidSliderHandleImpl(
    el,
    current,
    (v) => {
      current = clampStep(v);
      (handle as LiquidSliderHandleImpl)._updateCurrent(current);
      layout();
    },
    () => {
      if (af !== null) cancelAnimationFrame(af);
      glass.destroy();
      ev.runAll();
      el.classList.remove('lg-slider');
    },
  );

  ev.add(thumb, 'pointerdown', (e: Event) => {
    e.preventDefault();
    dragging = true;
    (thumb as HTMLElement).setPointerCapture((e as PointerEvent).pointerId);
    kick();
  });
  ev.add(window, 'pointermove', (e: Event) => {
    if (dragging) fromClientX((e as PointerEvent).clientX);
  });
  ev.add(window, 'pointerup', () => {
    if (!dragging) return;
    dragging = false;
    handle._emit('change', { value: current, element: el });
    kick();
  });

  layout();
  af = requestAnimationFrame(loop);
  return handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Cursor
// ─────────────────────────────────────────────────────────────────────────────

class LiquidCursorHandleImpl
  extends EventEmitter<LiquidCursorEventMap>
  implements LiquidCursorHandle
{
  readonly element: Element;
  private readonly _cleanup: () => void;
  constructor(element: Element, cleanup: () => void) {
    super();
    this.element = element;
    this._cleanup = cleanup;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

/**
 * Glass orb that follows the mouse inside a container.
 * @param container  Element to track mouse events on.
 */
export function createLiquidCursor(
  container: string | Element,
  options: LiquidCursorOptions = {},
): LiquidCursorHandle {
  const cont = resolveEl(container);
  const { size = 90, ...glassOpts } = options;

  if (getComputedStyle(cont).position === 'static')
    (cont as HTMLElement).style.position = 'relative';
  (cont as HTMLElement).style.cursor = 'none';

  const cursor = document.createElement('div');
  cursor.className = 'lg-cursor';
  (cursor as HTMLElement).style.width = size + 'px';
  (cursor as HTMLElement).style.height = size + 'px';
  cont.appendChild(cursor);

  const glass = createLiquidGlass(cursor, {
    width: size,
    height: size,
    radius: size / 2,
    bezelWidth: 15,
    glassThickness: 60,
    refractiveIndex: 1.45,
    blur: 0.5,
    saturation: 1.4,
    specularSlope: 0.8,
    ...glassOpts,
  }) as InternalGlass;

  const sp = {
    x: new Spring(0, 400, 25),
    y: new Spring(0, 400, 25),
    sc: new Spring(1, 350, 20),
  };
  let mx = 0,
    my = 0,
    inside = false,
    pressed = false,
    hovering = false,
    af: number | null = null;

  function loop() {
    sp.x.setTarget(mx);
    sp.y.setTarget(my);
    sp.sc.setTarget(pressed ? 0.7 : hovering ? 1.6 : 1.0);
    const cx = sp.x.update(DT),
      cy = sp.y.update(DT),
      cs = sp.sc.update(DT);
    const ox = cx - size / 2,
      oy = cy - size / 2;
    (cursor as HTMLElement).style.transform = `translate(${ox}px,${oy}px) scale(${cs})`;
    glass._setScale(glass._getMaxDisp() * cs);
    if (inside && !Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  const ev = makeCleanupTracker();
  ev.add(cont, 'mousemove', (e: Event) => {
    const r = cont.getBoundingClientRect();
    mx = (e as MouseEvent).clientX - r.left;
    my = (e as MouseEvent).clientY - r.top;
    if (!inside) {
      inside = true;
      cursor.classList.add('lg-cursor-visible');
      sp.x.value = mx;
      sp.y.value = my;
    }
    kick();
  });
  ev.add(cont, 'mouseleave', () => {
    inside = false;
    cursor.classList.remove('lg-cursor-visible');
  });
  ev.add(cont, 'mousedown', () => {
    pressed = true;
    kick();
  });
  ev.add(cont, 'mouseup', () => {
    pressed = false;
    kick();
  });
  ev.add(cont, 'mouseenter', () => {
    hovering = true;
    kick();
  });

  return new LiquidCursorHandleImpl(cursor, () => {
    if (af !== null) cancelAnimationFrame(af);
    glass.destroy();
    ev.runAll();
    cursor.remove();
    (cont as HTMLElement).style.cursor = '';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Input
// ─────────────────────────────────────────────────────────────────────────────

class LiquidInputHandleImpl extends EventEmitter<LiquidInputEventMap> implements LiquidInputHandle {
  readonly element: Element;
  private readonly _input: HTMLInputElement;
  private readonly _cleanup: () => void;
  constructor(element: Element, input: HTMLInputElement, cleanup: () => void) {
    super();
    this.element = element;
    this._input = input;
    this._cleanup = cleanup;
  }
  get value(): string {
    return this._input.value;
  }
  set value(v: string) {
    this._input.value = v;
  }
  focus(): this {
    this._input.focus();
    return this;
  }
  blur(): this {
    this._input.blur();
    return this;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

/**
 * Glass-wrapped text input with micro-vibration on typing.
 */
export function createLiquidInput(
  target: string | Element,
  options: LiquidInputOptions = {},
): LiquidInputHandle {
  const el = resolveEl(target);
  const { placeholder = '', value: initVal = '', type = 'text', ...glassOpts } = options;

  el.classList.add('lg-input-wrapper');

  const glass = createLiquidGlass(el, {
    width: 340,
    height: 60,
    radius: 30,
    bezelWidth: 15,
    glassThickness: 60,
    refractiveIndex: 1.5,
    blur: 0.5,
    saturation: 1.2,
    specularSlope: 0.7,
    ...glassOpts,
  }) as InternalGlass;

  const input = document.createElement('input');
  input.type = type;
  input.className = 'lg-input-field';
  input.placeholder = placeholder;
  input.value = initVal;
  el.appendChild(input);

  const sp = { sc: new Spring(1, 400, 20), sx: new Spring(1, 400, 25), sy: new Spring(1, 400, 25) };
  let af: number | null = null;

  function loop() {
    sp.sc.setTarget(1);
    sp.sx.setTarget(1);
    sp.sy.setTarget(1);
    const s = sp.sc.update(DT),
      sx = sp.sx.update(DT),
      sy = sp.sy.update(DT);
    (el as HTMLElement).style.transform = `scale(${s * sx}, ${s * sy})`;
    glass._setScale(glass._getMaxDisp() * s);
    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  const handle = new LiquidInputHandleImpl(el, input, () => {
    if (af !== null) cancelAnimationFrame(af);
    glass.destroy();
    ev.runAll();
    input.remove();
    el.classList.remove('lg-input-wrapper');
  });

  const ev = makeCleanupTracker();
  ev.add(input, 'focus', (e) => {
    sp.sc.setTarget(1.05);
    kick();
    handle._emit('focus', e as FocusEvent);
  });
  ev.add(input, 'blur', (e) => {
    sp.sc.setTarget(1.0);
    kick();
    handle._emit('blur', e as FocusEvent);
  });
  ev.add(input, 'input', () => {
    sp.sx.velocity += 1.5;
    sp.sy.velocity -= 0.8;
    kick();
    handle._emit('input', { value: input.value, element: el });
  });

  return handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Dial
// ─────────────────────────────────────────────────────────────────────────────

class LiquidDialHandleImpl extends EventEmitter<LiquidDialEventMap> implements LiquidDialHandle {
  readonly element: Element;
  private _angle: number;
  private readonly _cleanup: () => void;
  constructor(element: Element, initial: number, cleanup: () => void) {
    super();
    this.element = element;
    this._angle = initial;
    this._cleanup = cleanup;
  }
  get angle(): number {
    return this._angle;
  }
  set angle(v: number) {
    this._angle = v;
  }
  /** @internal */ _syncAngle(v: number) {
    this._angle = v;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

/**
 * Rotary knob — drag to spin, fires 'change' with the new angle.
 */
export function createLiquidDial(
  target: string | Element,
  options: LiquidDialOptions = {},
): LiquidDialHandle {
  const el = resolveEl(target);
  const { value: initAngle = 0, ...glassOpts } = options;

  el.classList.add('lg-dial');

  const knob = document.createElement('div');
  knob.className = 'lg-dial-knob';
  const indicator = document.createElement('div');
  indicator.className = 'lg-dial-indicator';
  knob.appendChild(indicator);
  el.appendChild(knob);

  const glass = createLiquidGlass(knob, {
    width: 140,
    height: 140,
    radius: 70,
    bezelWidth: 20,
    glassThickness: 80,
    refractiveIndex: 1.8,
    blur: 0.5,
    saturation: 1.2,
    specularSlope: 0.9,
    ...glassOpts,
  }) as InternalGlass;

  let currentAngle = initAngle,
    lastRaw = 0,
    dragging = false;
  const sp = { angle: new Spring(initAngle, 400, 30), scale: new Spring(1, 400, 20) };
  let af: number | null = null;

  function loop() {
    sp.scale.setTarget(dragging ? 1.05 : 1);
    const a = sp.angle.update(DT),
      sc = sp.scale.update(DT);
    (knob as HTMLElement).style.transform = `scale(${sc}) rotate(${a}deg)`;
    glass._setScale(glass._getMaxDisp() * sc);
    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  function angleFrom(e: PointerEvent) {
    const r = el.getBoundingClientRect();
    return (
      Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) *
      (180 / Math.PI)
    );
  }

  const handle = new LiquidDialHandleImpl(el, initAngle, () => {
    if (af !== null) cancelAnimationFrame(af);
    glass.destroy();
    ev.runAll();
    knob.remove();
    el.classList.remove('lg-dial');
  });

  const ev = makeCleanupTracker();
  ev.add(knob, 'pointerdown', (e: Event) => {
    dragging = true;
    (knob as HTMLElement).setPointerCapture((e as PointerEvent).pointerId);
    lastRaw = angleFrom(e as PointerEvent);
    kick();
  });
  ev.add(knob, 'pointermove', (e: Event) => {
    if (!dragging) return;
    const raw = angleFrom(e as PointerEvent);
    let delta = raw - lastRaw;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    currentAngle += delta;
    lastRaw = raw;
    sp.angle.setTarget(currentAngle);
    handle._syncAngle(currentAngle);
    handle._emit('change', { angle: currentAngle, element: el });
    kick();
  });
  ev.add(knob, 'pointerup', () => {
    dragging = false;
    kick();
  });

  af = requestAnimationFrame(loop);
  return handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Tooltip
// ─────────────────────────────────────────────────────────────────────────────

class LiquidTooltipHandleImpl
  extends EventEmitter<LiquidTooltipEventMap>
  implements LiquidTooltipHandle
{
  readonly element: Element;
  private readonly _textEl: HTMLElement;
  private readonly _cleanup: () => void;
  private readonly _show: () => void;
  private readonly _hide: () => void;
  constructor(
    element: Element,
    textEl: HTMLElement,
    show: () => void,
    hide: () => void,
    cleanup: () => void,
  ) {
    super();
    this.element = element;
    this._textEl = textEl;
    this._show = show;
    this._hide = hide;
    this._cleanup = cleanup;
  }
  show(): this {
    this._show();
    return this;
  }
  hide(): this {
    this._hide();
    return this;
  }
  toggle(): this {
    return this;
  } // state tracked in closure
  setText(text: string): this {
    this._textEl.textContent = text;
    return this;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

/**
 * Glass pill that springs into view above a trigger element on hover.
 */
export function createLiquidTooltip(
  target: string | Element,
  options: LiquidTooltipOptions,
): LiquidTooltipHandle {
  const el = resolveEl(target);
  const trigger = resolveEl(options.trigger);
  const { text = '', ...glassOpts } = options;

  el.classList.add('lg-tooltip');
  (el as HTMLElement).style.cssText +=
    ';position:absolute;bottom:calc(100% + 14px);left:50%;transform-origin:bottom center;';

  const textEl =
    el.querySelector<HTMLElement>('.lg-tooltip-text') ||
    (() => {
      const t = document.createElement('span');
      t.className = 'lg-tooltip-text';
      el.appendChild(t);
      return t;
    })();
  textEl.textContent = text;

  const glass = createLiquidGlass(el, {
    width: 140,
    height: 46,
    radius: 23,
    bezelWidth: 15,
    glassThickness: 60,
    refractiveIndex: 1.6,
    blur: 0.5,
    saturation: 1.2,
    specularSlope: 0.8,
    ...glassOpts,
  }) as InternalGlass;

  let visible = false;
  const sp = { sc: new Spring(0.5, 400, 25), y: new Spring(20, 400, 25) };
  let af: number | null = null;

  function loop() {
    const sc = sp.sc.update(DT),
      y = sp.y.update(DT);
    (el as HTMLElement).style.transform = `translateX(-50%) translateY(${y}px) scale(${sc})`;
    (el as HTMLElement).style.opacity = String(Math.max(0, (sc - 0.5) * 2));
    glass._setScale(glass._getMaxDisp() * sc);
    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  function doShow() {
    sp.sc.setTarget(1);
    sp.y.setTarget(0);
    visible = true;
    kick();
    handle._emit('show');
  }
  function doHide() {
    sp.sc.setTarget(0.5);
    sp.y.setTarget(20);
    visible = false;
    kick();
    handle._emit('hide');
  }

  const handle = new LiquidTooltipHandleImpl(el, textEl, doShow, doHide, () => {
    if (af !== null) cancelAnimationFrame(af);
    glass.destroy();
    ev.runAll();
    el.classList.remove('lg-tooltip');
  });
  (handle as LiquidTooltipHandleImpl).toggle = function () {
    if (visible) {
      doHide();
    } else {
      doShow();
    }
    return this;
  };

  const ev = makeCleanupTracker();
  ev.add(trigger, 'mouseenter', doShow as EventListener);
  ev.add(trigger, 'mouseleave', doHide as EventListener);
  ev.add(trigger, 'focus', doShow as EventListener);
  ev.add(trigger, 'blur', doHide as EventListener);

  // Start hidden
  (el as HTMLElement).style.opacity = '0';
  (el as HTMLElement).style.transform = 'translateX(-50%) translateY(20px) scale(0.5)';

  af = requestAnimationFrame(loop);
  return handle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Progress
// ─────────────────────────────────────────────────────────────────────────────

class LiquidProgressHandleImpl
  extends EventEmitter<LiquidProgressEventMap>
  implements LiquidProgressHandle
{
  readonly element: Element;
  private _val: number;
  private readonly _set: (v: number) => void;
  private readonly _cleanup: () => void;
  constructor(element: Element, initial: number, set: (v: number) => void, cleanup: () => void) {
    super();
    this.element = element;
    this._val = initial;
    this._set = set;
    this._cleanup = cleanup;
  }
  get value(): number {
    return this._val;
  }
  set value(v: number) {
    this._set(v);
  }
  /** @internal */ _syncVal(v: number) {
    this._val = v;
  }
  destroy(): void {
    this._cleanup();
    this._emit('destroy');
  }
}

/**
 * Glass-overlaid progress bar that squishes on value change.
 */
export function createLiquidProgress(
  target: string | Element,
  options: LiquidProgressOptions = {},
): LiquidProgressHandle {
  const el = resolveEl(target);
  const { value: initVal = 0, ...glassOpts } = options;

  el.classList.add('lg-progress');

  const fill = document.createElement('div');
  fill.className = 'lg-progress-fill';
  el.appendChild(fill);

  const glass = createLiquidGlass(el, {
    bezelWidth: 12,
    glassThickness: 50,
    refractiveIndex: 1.5,
    blur: 0.5,
    saturation: 1.2,
    specularSlope: 0.7,
    ...glassOpts,
  }) as InternalGlass;

  let current = Math.min(100, Math.max(0, initVal));
  const sp = { progress: new Spring(current, 200, 25), sy: new Spring(1, 400, 20) };
  let af: number | null = null;

  function loop() {
    sp.sy.setTarget(1);
    const prog = sp.progress.update(DT),
      sy = sp.sy.update(DT);
    fill.style.width = `${Math.max(0, Math.min(100, prog))}%`;
    (el as HTMLElement).style.transform = `scaleY(${sy})`;
    glass._setScale(glass._getMaxDisp() * sy);
    if (!Object.values(sp).every((s) => s.isSettled())) af = requestAnimationFrame(loop);
    else af = null;
  }
  function kick() {
    if (!af) af = requestAnimationFrame(loop);
  }

  const handle = new LiquidProgressHandleImpl(
    el,
    current,
    (v) => {
      current = Math.min(100, Math.max(0, v));
      sp.progress.setTarget(current);
      sp.sy.velocity += 1.2;
      (handle as LiquidProgressHandleImpl)._syncVal(current);
      handle._emit('change', { value: current, element: el });
      kick();
    },
    () => {
      if (af !== null) cancelAnimationFrame(af);
      glass.destroy();
      fill.remove();
      el.classList.remove('lg-progress');
    },
  );

  af = requestAnimationFrame(loop);
  return handle;
}
