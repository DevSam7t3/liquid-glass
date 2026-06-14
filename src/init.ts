import { createLiquidGlass } from './core.js';
import {
  createLiquidButton,
  createLiquidSwitch,
  createLiquidSlider,
  createLiquidCursor,
  createLiquidInput,
  createLiquidTextarea,
  createLiquidSelect,
  createLiquidCheckbox,
  createLiquidDial,
  createLiquidProgress,
} from './components.js';
import type {
  AnyHandle,
  InitOptions,
  LiquidGlassOptions,
  LiquidButtonOptions,
  LiquidSwitchOptions,
  LiquidSliderOptions,
  LiquidCursorOptions,
  LiquidInputOptions,
  LiquidTextareaOptions,
  LiquidSelectOptions,
  LiquidCheckboxOptions,
  LiquidDialOptions,
  LiquidProgressOptions,
} from './types.js';

const DONE = '_lgInit';

function parseDataset(ds: DOMStringMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const str = (k: string) => {
    if (ds[k] != null) out[k] = ds[k];
  };
  const num = (k: string) => {
    if (ds[k] != null) out[k] = parseFloat(ds[k] as string);
  };
  const bool = (k: string) => {
    if (ds[k] != null) out[k] = ds[k] !== 'false';
  };

  str('label');
  str('placeholder');
  str('type');
  str('profile');
  str('filterMode');
  bool('checked');
  num('min');
  num('max');
  // Parse value as a number when it looks numeric, otherwise keep as string
  // (needed so select data-value="opt-id" works alongside slider data-value="50")
  if (ds['value'] != null) {
    const n = parseFloat(ds['value'] as string);
    out['value'] = isNaN(n) ? ds['value'] : n;
  }
  num('step');
  num('rows');
  num('size');
  num('bezelWidth');
  num('glassThickness');
  num('refractiveIndex');
  num('blur');
  num('saturation');
  num('specularSlope');

  return out;
}

/**
 * Scan the document (or a sub-tree) for `data-liquid-*` attributes and apply
 * the appropriate factory to each matched element.
 *
 * @example
 * ```html
 * <button data-liquid-button  data-label="Subscribe"></button>
 * <div    data-liquid-switch  data-checked="true"></div>
 * <div    data-liquid-slider  data-min="0" data-max="100" data-value="50"></div>
 * <div    data-liquid-glass   data-bezel-width="24"></div>
 * <div    data-liquid-cursor></div>
 * <div    data-liquid-input   data-placeholder="Search…"></div>
 * <div    data-liquid-dial    data-value="0"></div>
 * <div    data-liquid-progress data-value="40"></div>
 * ```
 * ```ts
 * import { init } from '@avenra/liquid-glass';
 * const handles = init();
 * ```
 */
export function init(options: InitOptions = {}): AnyHandle[] {
  const root = options.root ?? document;
  const handles: AnyHandle[] = [];

  function apply<T extends HTMLElement>(
    selector: string,
    factory: (el: T, opts: Record<string, unknown>) => AnyHandle,
  ) {
    root.querySelectorAll<T>(selector).forEach((el) => {
      if ((el as unknown as Record<string, unknown>)[DONE]) return;
      (el as unknown as Record<string, unknown>)[DONE] = true;
      try {
        const opts = parseDataset(el.dataset);
        const handle = factory(el, opts);
        (el as unknown as Record<string, unknown>)._liquidGlassHandle = handle;
        handles.push(handle);
      } catch (e) {
        console.warn('[liquid-glass] init failed on element:', el, e);
      }
    });
  }

  apply('[data-liquid-button]', (el, opts) => createLiquidButton(el, opts as LiquidButtonOptions));
  apply('[data-liquid-switch]', (el, opts) => createLiquidSwitch(el, opts as LiquidSwitchOptions));
  apply('[data-liquid-slider]', (el, opts) => createLiquidSlider(el, opts as LiquidSliderOptions));
  apply('[data-liquid-cursor]', (el, opts) => createLiquidCursor(el, opts as LiquidCursorOptions));
  apply('[data-liquid-input]', (el, opts) => createLiquidInput(el, opts as LiquidInputOptions));
  apply('[data-liquid-textarea]', (el, opts) =>
    createLiquidTextarea(el, opts as LiquidTextareaOptions),
  );
  apply('[data-liquid-select]', (el, opts) => createLiquidSelect(el, opts as LiquidSelectOptions));
  apply('[data-liquid-checkbox]', (el, opts) =>
    createLiquidCheckbox(el, opts as LiquidCheckboxOptions),
  );
  apply('[data-liquid-dial]', (el, opts) => createLiquidDial(el, opts as LiquidDialOptions));
  apply('[data-liquid-progress]', (el, opts) =>
    createLiquidProgress(el, opts as LiquidProgressOptions),
  );
  apply('[data-liquid-glass]', (el, opts) => createLiquidGlass(el, opts as LiquidGlassOptions));

  return handles;
}
