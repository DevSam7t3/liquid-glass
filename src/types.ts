/**
 * All public-facing types, interfaces, and event maps for @avenra/liquid-glass.
 * Import from the main package entry point — these are re-exported there.
 */

// ─── Surface profiles ────────────────────────────────────────────────────────

export type ProfileFn = (x: number) => number;
export type ProfileName = 'convexSquircle' | 'convexCircle' | 'concave';
export type Profile = ProfileName | ProfileFn;

// ─── Filter ──────────────────────────────────────────────────────────────────

export type FilterMode = 'screen' | 'composite';

export interface FilterRefs {
  dispImgEl: SVGFEImageElement;
  specImgEl: SVGFEImageElement;
  dispMapEl: SVGFEDisplacementMapElement;
  blurEl: SVGFEGaussianBlurElement;
  satEl: SVGFEColorMatrixElement;
}

export interface FilterSVGConfig {
  filterId: string;
  width: number;
  height: number;
  blur?: number;
  scale?: number;
  saturation?: number;
  specularSlope?: number;
  filterMode?: FilterMode;
}

export interface FilterSVGResult {
  svg: SVGSVGElement;
  refs: FilterRefs;
}

// ─── Displacement map / physics ───────────────────────────────────────────────

export interface BuildMapsConfig {
  width: number;
  height: number;
  radius: number;
  bezelWidth: number;
  glassThickness: number;
  refractiveIndex: number;
  profile?: Profile;
}

export interface BuildMapsResult {
  dispUrl: string;
  specUrl: string;
  maxDisplacement: number;
}

// ─── Glass options ────────────────────────────────────────────────────────────

/** Options shared by every liquid-glass factory function. */
export interface GlassOptions {
  /** Override element width in px (auto-detected if omitted). */
  width?: number;
  /** Override element height in px (auto-detected if omitted). */
  height?: number;
  /** Corner radius in px. `null` = auto-read from CSS `border-radius`. */
  radius?: number | null;
  /** Width of the refractive bezel rim in px. Default: 20. */
  bezelWidth?: number;
  /** Virtual glass depth (affects lateral ray drift). Default: 80. */
  glassThickness?: number;
  /** Index of refraction n₂ (air = 1.0, glass ≈ 1.5). Default: 1.5. */
  refractiveIndex?: number;
  /** Surface height profile of the bezel. Default: `'convexSquircle'`. */
  profile?: Profile;
  /** Pre-displacement Gaussian blur stdDeviation. Default: 0.5. */
  blur?: number;
  /** Post-displacement colour saturation multiplier. Default: 1.3. */
  saturation?: number;
  /** Specular highlight intensity (0–1). Default: 0.8. */
  specularSlope?: number;
  /** SVG filter blend mode. Default: `'screen'`. */
  filterMode?: FilterMode;
}

export type LiquidGlassOptions = GlassOptions;

export interface LiquidButtonOptions extends GlassOptions {
  /** Text to display inside the button. */
  label?: string;
}

export interface LiquidSwitchOptions extends GlassOptions {
  /** Initial checked state. Default: `false`. */
  checked?: boolean;
}

export interface LiquidSliderOptions extends GlassOptions {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
}

export interface InitOptions {
  /** Limit the scan to a specific DOM subtree. Default: `document`. */
  root?: Element | Document;
}

// ─── Event maps ───────────────────────────────────────────────────────────────

export interface LiquidGlassEventMap {
  /** Fired when the element is resized. */
  resize: { width: number; height: number };
  /** Fired when `destroy()` is called. */
  destroy: undefined;
}

export interface LiquidButtonEventMap {
  click: MouseEvent;
  mouseenter: MouseEvent;
  mouseleave: MouseEvent;
  mousedown: MouseEvent;
  mouseup: MouseEvent;
  destroy: undefined;
}

export interface LiquidSwitchEventMap {
  /** Fires when the checked state changes. */
  change: { checked: boolean; element: Element };
  destroy: undefined;
}

export interface LiquidSliderEventMap {
  /** Fires continuously while dragging. */
  input: { value: number; element: Element };
  /** Fires once on pointer-up (equivalent to `<input type="range">` change). */
  change: { value: number; element: Element };
  destroy: undefined;
}

// ─── Handle interfaces ────────────────────────────────────────────────────────

/** Returned by `createLiquidGlass()`. */
export interface LiquidGlassHandle {
  readonly element: Element;
  on<K extends keyof LiquidGlassEventMap>(
    event: K,
    fn: (payload: LiquidGlassEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidGlassEventMap>(
    event: K,
    fn?: (payload: LiquidGlassEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidGlassEventMap>(
    event: K,
    fn: (payload: LiquidGlassEventMap[K]) => void,
  ): this;
  /** Rebuild displacement maps (called automatically on resize). */
  refresh(): this;
  destroy(): void;
}

/** Returned by `createLiquidButton()`. */
export interface LiquidButtonHandle {
  readonly element: Element;
  on<K extends keyof LiquidButtonEventMap>(
    event: K,
    fn: (payload: LiquidButtonEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidButtonEventMap>(
    event: K,
    fn?: (payload: LiquidButtonEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidButtonEventMap>(
    event: K,
    fn: (payload: LiquidButtonEventMap[K]) => void,
  ): this;
  setLabel(text: string): this;
  destroy(): void;
}

/** Returned by `createLiquidSwitch()`. */
export interface LiquidSwitchHandle {
  readonly element: Element;
  on<K extends keyof LiquidSwitchEventMap>(
    event: K,
    fn: (payload: LiquidSwitchEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidSwitchEventMap>(
    event: K,
    fn?: (payload: LiquidSwitchEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidSwitchEventMap>(
    event: K,
    fn: (payload: LiquidSwitchEventMap[K]) => void,
  ): this;
  checked: boolean;
  toggle(): this;
  destroy(): void;
}

/** Returned by `createLiquidSlider()`. */
export interface LiquidSliderHandle {
  readonly element: Element;
  on<K extends keyof LiquidSliderEventMap>(
    event: K,
    fn: (payload: LiquidSliderEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidSliderEventMap>(
    event: K,
    fn?: (payload: LiquidSliderEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidSliderEventMap>(
    event: K,
    fn: (payload: LiquidSliderEventMap[K]) => void,
  ): this;
  value: number;
  destroy(): void;
}

// ─── Cursor ───────────────────────────────────────────────────────────────────

export interface LiquidCursorEventMap {
  destroy: undefined;
}

export interface LiquidCursorOptions extends GlassOptions {
  /** Diameter of the cursor orb in px. Default: 90. */
  size?: number;
}

/** Returned by `createLiquidCursor()`. */
export interface LiquidCursorHandle {
  readonly element: Element;
  on<K extends keyof LiquidCursorEventMap>(
    event: K,
    fn: (payload: LiquidCursorEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidCursorEventMap>(
    event: K,
    fn?: (payload: LiquidCursorEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidCursorEventMap>(
    event: K,
    fn: (payload: LiquidCursorEventMap[K]) => void,
  ): this;
  destroy(): void;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface LiquidInputEventMap {
  focus: FocusEvent;
  blur: FocusEvent;
  input: { value: string; element: Element };
  destroy: undefined;
}

export interface LiquidInputOptions extends GlassOptions {
  placeholder?: string;
  value?: string;
  type?: string;
}

/** Returned by `createLiquidInput()`. */
export interface LiquidInputHandle {
  readonly element: Element;
  on<K extends keyof LiquidInputEventMap>(
    event: K,
    fn: (payload: LiquidInputEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidInputEventMap>(
    event: K,
    fn?: (payload: LiquidInputEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidInputEventMap>(
    event: K,
    fn: (payload: LiquidInputEventMap[K]) => void,
  ): this;
  value: string;
  focus(): this;
  blur(): this;
  destroy(): void;
}

// ─── Dial ─────────────────────────────────────────────────────────────────────

export interface LiquidDialEventMap {
  change: { angle: number; element: Element };
  destroy: undefined;
}

export interface LiquidDialOptions extends GlassOptions {
  /** Initial rotation angle in degrees. Default: 0. */
  value?: number;
}

/** Returned by `createLiquidDial()`. */
export interface LiquidDialHandle {
  readonly element: Element;
  on<K extends keyof LiquidDialEventMap>(
    event: K,
    fn: (payload: LiquidDialEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidDialEventMap>(
    event: K,
    fn?: (payload: LiquidDialEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidDialEventMap>(
    event: K,
    fn: (payload: LiquidDialEventMap[K]) => void,
  ): this;
  /** Current angle in degrees. */
  angle: number;
  destroy(): void;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export interface LiquidTooltipEventMap {
  show: undefined;
  hide: undefined;
  destroy: undefined;
}

export interface LiquidTooltipOptions extends GlassOptions {
  /** Element that triggers show/hide on hover (required). */
  trigger: string | Element;
  /** Tooltip label text. */
  text?: string;
}

/** Returned by `createLiquidTooltip()`. */
export interface LiquidTooltipHandle {
  readonly element: Element;
  on<K extends keyof LiquidTooltipEventMap>(
    event: K,
    fn: (payload: LiquidTooltipEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidTooltipEventMap>(
    event: K,
    fn?: (payload: LiquidTooltipEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidTooltipEventMap>(
    event: K,
    fn: (payload: LiquidTooltipEventMap[K]) => void,
  ): this;
  show(): this;
  hide(): this;
  toggle(): this;
  setText(text: string): this;
  destroy(): void;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface LiquidProgressEventMap {
  change: { value: number; element: Element };
  destroy: undefined;
}

export interface LiquidProgressOptions extends GlassOptions {
  /** Initial progress 0–100. Default: 0. */
  value?: number;
}

/** Returned by `createLiquidProgress()`. */
export interface LiquidProgressHandle {
  readonly element: Element;
  on<K extends keyof LiquidProgressEventMap>(
    event: K,
    fn: (payload: LiquidProgressEventMap[K]) => void,
  ): this;
  off<K extends keyof LiquidProgressEventMap>(
    event: K,
    fn?: (payload: LiquidProgressEventMap[K]) => void,
  ): this;
  once<K extends keyof LiquidProgressEventMap>(
    event: K,
    fn: (payload: LiquidProgressEventMap[K]) => void,
  ): this;
  /** Progress value 0–100. */
  value: number;
  destroy(): void;
}

// ─── Union ────────────────────────────────────────────────────────────────────

/** Union of all handle types — returned by `init()`. */
export type AnyHandle =
  | LiquidGlassHandle
  | LiquidButtonHandle
  | LiquidSwitchHandle
  | LiquidSliderHandle
  | LiquidCursorHandle
  | LiquidInputHandle
  | LiquidDialHandle
  | LiquidTooltipHandle
  | LiquidProgressHandle;
