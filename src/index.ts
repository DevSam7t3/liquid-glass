/**
 * @avenra/liquid-glass — public API
 */

// ── Component factories ───────────────────────────────────────────────────────
export { createLiquidGlass } from './core.js';
export {
  createLiquidButton,
  createLiquidSwitch,
  createLiquidSlider,
  createLiquidCursor,
  createLiquidInput,
  createLiquidDial,
  createLiquidTooltip,
  createLiquidProgress,
} from './components.js';

// ── Auto-init ────────────────────────────────────────────────────────────────
export { init } from './init.js';

// ── All public types ─────────────────────────────────────────────────────────
export type {
  // Options
  GlassOptions,
  LiquidGlassOptions,
  LiquidButtonOptions,
  LiquidSwitchOptions,
  LiquidSliderOptions,
  LiquidCursorOptions,
  LiquidInputOptions,
  LiquidDialOptions,
  LiquidTooltipOptions,
  LiquidProgressOptions,
  InitOptions,
  Profile,
  ProfileFn,
  ProfileName,
  FilterMode,
  // Event maps
  LiquidGlassEventMap,
  LiquidButtonEventMap,
  LiquidSwitchEventMap,
  LiquidSliderEventMap,
  LiquidCursorEventMap,
  LiquidInputEventMap,
  LiquidDialEventMap,
  LiquidTooltipEventMap,
  LiquidProgressEventMap,
  // Handle interfaces
  LiquidGlassHandle,
  LiquidButtonHandle,
  LiquidSwitchHandle,
  LiquidSliderHandle,
  LiquidCursorHandle,
  LiquidInputHandle,
  LiquidDialHandle,
  LiquidTooltipHandle,
  LiquidProgressHandle,
  AnyHandle,
  // Low-level
  FilterRefs,
  FilterSVGConfig,
  FilterSVGResult,
  BuildMapsConfig,
  BuildMapsResult,
} from './types.js';

// ── Low-level / power-user API ───────────────────────────────────────────────
export { Spring } from './spring.js';
export {
  PROFILES,
  buildMaps,
  maxDisp,
  compute1D,
  compute2D,
  computeSpecular,
  imageDataToURL,
} from './math.js';
export {
  supportsBackdropFilter,
  createFilterSVG,
  injectImages,
  setScale,
  nextFilterId,
} from './filter.js';
