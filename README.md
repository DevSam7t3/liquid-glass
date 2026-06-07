# @avenra/liquid-glass

[![CI](https://github.com/DevSam7t3/liquid-glass/actions/workflows/ci.yml/badge.svg)](https://github.com/DevSam7t3/liquid-glass/actions/workflows/ci.yml)
[![CodeQL](https://github.com/DevSam7t3/liquid-glass/actions/workflows/codeql.yml/badge.svg)](https://github.com/DevSam7t3/liquid-glass/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/@avenra/liquid-glass.svg)](https://www.npmjs.com/package/@avenra/liquid-glass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Physics-based liquid glass UI effect for the web. Snell's law refraction baked into an SVG displacement map, specular rim light, spring animations — zero runtime dependencies.

> **Browser note:** The SVG displacement effect requires `backdrop-filter: url()` which is **Chromium-only**. All other browsers receive a CSS `blur + saturate` fallback that still looks like frosted glass.

---

## Install

```bash
npm install @avenra/liquid-glass
```

```html
<!-- CDN (production) -->
<script src="https://cdn.jsdelivr.net/npm/@avenra/liquid-glass/dist/liquid-glass.umd.min.js"></script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@avenra/liquid-glass/styles/liquid-glass.css"
/>
```

---

## Quick start

### npm / bundler

```ts
import { createLiquidButton, createLiquidSwitch, createLiquidSlider } from '@avenra/liquid-glass';
import '@avenra/liquid-glass/styles';

const btn = createLiquidButton('#myBtn', { label: 'Save' });
btn.on('click', (e: MouseEvent) => console.log('clicked'));

const sw = createLiquidSwitch('#toggle', { checked: false });
sw.on('change', ({ checked }) => console.log('switch:', checked));

const sl = createLiquidSlider('#slider', { min: 0, max: 100, value: 50 });
sl.on('input', ({ value }) => updateVolume(value));
sl.on('change', ({ value }) => savePreference(value)); // fires on release
```

### CDN / script tag

```html
<script src="https://cdn.jsdelivr.net/npm/@avenra/liquid-glass/dist/liquid-glass.umd.min.js"></script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@avenra/liquid-glass/styles/liquid-glass.css"
/>
<button id="btn"></button>
<script>
  const { createLiquidButton } = LiquidGlass;
  createLiquidButton('#btn', { label: 'Click me' }).on('click', () => alert('hello'));
</script>
```

### Zero-JS — data attributes

```html
<button data-liquid-button data-label="Subscribe"></button>
<div data-liquid-switch data-checked="true"></div>
<div data-liquid-slider data-min="0" data-max="100" data-value="50"></div>
<div data-liquid-glass></div>
```

```js
import { init } from '@avenra/liquid-glass';
const handles = init(); // scans document and applies everything
```

---

## Theming — CSS custom properties

Override these in your stylesheet to skin every glass element without touching JS:

```css
:root {
  --lg-tint: rgba(255, 255, 255, 0.05); /* glass body fill           */
  --lg-border: rgba(255, 255, 255, 0.2); /* 1px edge border           */
  --lg-shadow-out: 0 10px 30px rgba(0, 0, 0, 0.3); /* drop shadow               */
  --lg-shadow-hi: inset 0 2px 5px rgba(255, 255, 255, 0.25); /* top highlight */
  --lg-shadow-lo: inset 0 -2px 5px rgba(0, 0, 0, 0.15); /* bottom shade  */
  --lg-accent: #3b82f6; /* slider fill / progress fill gradient start  */
  --lg-accent-2: #60a5fa; /* gradient end                                */
}
```

---

## API Reference

### Common options (all components inherit these)

| Option             | Type                                                    | Default            | Description                                           |
| ------------------ | ------------------------------------------------------- | ------------------ | ----------------------------------------------------- |
| `bezelWidth`       | `number`                                                | `20`               | Refractive bezel rim width in px                      |
| `glassThickness`   | `number`                                                | `80`               | Virtual glass depth (larger = more lateral ray drift) |
| `refractiveIndex`  | `number`                                                | `1.5`              | Index of refraction n₂ (1.0 = no bend, 2.0 = strong)  |
| `profile`          | `'convexSquircle' \| 'convexCircle' \| 'concave' \| fn` | `'convexSquircle'` | Bezel surface shape                                   |
| `blur`             | `number`                                                | `0.5`              | Pre-displacement Gaussian blur stdDeviation           |
| `saturation`       | `number`                                                | `1.3`              | Post-displacement colour saturation multiplier        |
| `specularSlope`    | `number`                                                | `0.8`              | Specular highlight intensity 0–1                      |
| `filterMode`       | `'screen' \| 'composite'`                               | `'screen'`         | SVG filter blend pipeline                             |
| `width` / `height` | `number`                                                | auto               | Override element dimensions for map generation        |
| `radius`           | `number \| null`                                        | auto               | Corner radius override (null = read from CSS)         |

### Common handle API (every factory returns this)

```ts
handle.on(event, fn); // subscribe — returns handle (chainable)
handle.off(event, fn); // unsubscribe a specific listener
handle.once(event, fn); // subscribe once — auto-removed after first fire
handle.destroy(); // clean up all injected DOM and stop animations
```

All events include a `destroy` event fired when `destroy()` is called.

---

### `createLiquidGlass(target, options?)`

Apply the glass effect to any element.

```ts
const glass = createLiquidGlass('#myCard', {
  bezelWidth: 24,
  glassThickness: 120,
  refractiveIndex: 2.0,
});

glass.on('resize', ({ width, height }) => console.log(width, height));
glass.refresh(); // rebuild maps (auto-called on resize)
glass.destroy();
```

| Event     | Payload                             |
| --------- | ----------------------------------- |
| `resize`  | `{ width: number; height: number }` |
| `destroy` | —                                   |

---

### `createLiquidButton(target, options?)`

```ts
const btn = createLiquidButton('#myBtn', { label: 'Save Changes' });
btn.on('click', (e: MouseEvent) => handleSave(e));
btn.setLabel('Saved ✓');
btn.destroy();
```

| Option  | Type     | Description |
| ------- | -------- | ----------- |
| `label` | `string` | Button text |

| Event                       | Payload      |
| --------------------------- | ------------ |
| `click`                     | `MouseEvent` |
| `mouseenter` / `mouseleave` | `MouseEvent` |
| `mousedown` / `mouseup`     | `MouseEvent` |
| `destroy`                   | —            |

---

### `createLiquidSwitch(target, options?)`

```ts
const sw = createLiquidSwitch('#toggle', { checked: true });
sw.on('change', ({ checked }) => applyTheme(checked));
sw.checked = false; // programmatic setter
sw.toggle();
sw.destroy();
```

| Option    | Type      | Default |
| --------- | --------- | ------- |
| `checked` | `boolean` | `false` |

| Event     | Payload                                  |
| --------- | ---------------------------------------- |
| `change`  | `{ checked: boolean; element: Element }` |
| `destroy` | —                                        |

---

### `createLiquidSlider(target, options?)`

```ts
const sl = createLiquidSlider('#slider', { min: 0, max: 100, value: 50, step: 5 });
sl.on('input', ({ value }) => updateUI(value)); // while dragging
sl.on('change', ({ value }) => saveToServer(value)); // on release
sl.value = 75; // programmatic setter
sl.destroy();
```

| Option        | Type     | Default     |
| ------------- | -------- | ----------- |
| `min` / `max` | `number` | `0` / `100` |
| `value`       | `number` | `50`        |
| `step`        | `number` | `1`         |

| Event     | Payload                               |
| --------- | ------------------------------------- |
| `input`   | `{ value: number; element: Element }` |
| `change`  | `{ value: number; element: Element }` |
| `destroy` | —                                     |

---

### `createLiquidCursor(container, options?)`

Glass orb that replaces the system cursor inside `container`. The orb grows on hover, shrinks on click.

```ts
const cursor = createLiquidCursor('#stage', { size: 90 });
cursor.destroy(); // restores the default cursor
```

| Option | Type     | Default |
| ------ | -------- | ------- |
| `size` | `number` | `90`    |

---

### `createLiquidInput(target, options?)`

Glass-wrapped `<input>` with micro-vibration on each keystroke and scale spring on focus.

```ts
const inp = createLiquidInput('#searchBox', {
  placeholder: 'Search…',
  type: 'text',
});
inp.on('input', ({ value }) => runSearch(value));
inp.on('focus', () => showSuggestions());
inp.value = 'prefilled text'; // getter/setter
inp.focus();
inp.destroy();
```

| Option        | Type     | Default  |
| ------------- | -------- | -------- |
| `placeholder` | `string` | `''`     |
| `value`       | `string` | `''`     |
| `type`        | `string` | `'text'` |

| Event     | Payload                               |
| --------- | ------------------------------------- |
| `focus`   | `FocusEvent`                          |
| `blur`    | `FocusEvent`                          |
| `input`   | `{ value: string; element: Element }` |
| `destroy` | —                                     |

---

### `createLiquidDial(target, options?)`

Rotary knob — pointer drag spins it continuously.

```ts
const dial = createLiquidDial('#knob', { value: 0 });
dial.on('change', ({ angle }) => setFilter(angle));
dial.angle = 90; // programmatic setter (degrees)
dial.destroy();
```

| Option  | Type               | Default |
| ------- | ------------------ | ------- |
| `value` | `number` (degrees) | `0`     |

| Event     | Payload                               |
| --------- | ------------------------------------- |
| `change`  | `{ angle: number; element: Element }` |
| `destroy` | —                                     |

---

### `createLiquidTooltip(target, options)`

Glass pill that springs above a trigger element on hover/focus.

```ts
// Assuming #myTooltip is positioned relative to its parent:
const tip = createLiquidTooltip('#myTooltip', {
  trigger: '#triggerBtn',
  text: 'More details',
});
tip.on('show', () => {});
tip.show(); // programmatic show
tip.hide(); // programmatic hide
tip.toggle();
tip.setText('Updated text');
tip.destroy();
```

| Option    | Type                | Required |
| --------- | ------------------- | -------- |
| `trigger` | `string \| Element` | ✓        |
| `text`    | `string`            | —        |

| Event           | Payload |
| --------------- | ------- |
| `show` / `hide` | —       |
| `destroy`       | —       |

---

### `createLiquidProgress(target, options?)`

Fluid progress bar with squish animation on value update.

```ts
const bar = createLiquidProgress('#progressBar', { value: 0 });
bar.on('change', ({ value }) => console.log(value + '%'));
bar.value = 65; // triggers spring + squish
bar.destroy();
```

| Option  | Type           | Default |
| ------- | -------------- | ------- |
| `value` | `number` 0–100 | `0`     |

| Event     | Payload                               |
| --------- | ------------------------------------- |
| `change`  | `{ value: number; element: Element }` |
| `destroy` | —                                     |

---

### `init(options?)`

Scan the DOM for `data-liquid-*` attributes and apply the matching factory automatically.

```ts
import { init } from '@avenra/liquid-glass';

const handles = init(); // whole document
const handles = init({ root: '#myApp' }); // limit to subtree
```

**Supported data attributes:**

| Attribute            | Options via `data-*`                                              |
| -------------------- | ----------------------------------------------------------------- |
| `data-liquid-button` | `data-label`                                                      |
| `data-liquid-switch` | `data-checked`                                                    |
| `data-liquid-slider` | `data-min`, `data-max`, `data-value`, `data-step`                 |
| `data-liquid-glass`  | `data-bezel-width`, `data-refractive-index`, `data-profile`, etc. |

Returns `AnyHandle[]` — one handle per matched element.

---

## TypeScript

All types are exported from the package root:

```ts
import type {
  LiquidGlassHandle,
  LiquidGlassOptions,
  LiquidGlassEventMap,
  LiquidButtonHandle,
  LiquidButtonOptions,
  LiquidButtonEventMap,
  LiquidSwitchHandle,
  LiquidSwitchOptions,
  LiquidSwitchEventMap,
  LiquidSliderHandle,
  LiquidSliderOptions,
  LiquidSliderEventMap,
  LiquidCursorHandle,
  LiquidCursorOptions,
  LiquidInputHandle,
  LiquidInputOptions,
  LiquidInputEventMap,
  LiquidDialHandle,
  LiquidDialOptions,
  LiquidDialEventMap,
  LiquidTooltipHandle,
  LiquidTooltipOptions,
  LiquidTooltipEventMap,
  LiquidProgressHandle,
  LiquidProgressOptions,
  LiquidProgressEventMap,
  AnyHandle,
} from '@avenra/liquid-glass';
```

---

## Advanced — low-level API

Build a fully custom glass component using the raw physics engine:

```ts
import {
  Spring,
  PROFILES,
  buildMaps,
  createFilterSVG,
  injectImages,
  setScale,
  nextFilterId,
  supportsBackdropFilter,
} from '@avenra/liquid-glass';

const { dispUrl, specUrl, maxDisplacement } = buildMaps({
  width: 200,
  height: 140,
  radius: 70,
  bezelWidth: 30,
  glassThickness: 150,
  refractiveIndex: 1.5,
});

const filterId = nextFilterId('my-lens');
const { svg, refs } = createFilterSVG({ filterId, width: 200, height: 140 });
injectImages(refs, dispUrl, specUrl);
myElement.appendChild(svg);

if (supportsBackdropFilter()) {
  innerEl.style.backdropFilter = `url("#${filterId}")`;
}

// Animation loop — spring the displacement scale
const spring = new Spring(maxDisplacement, 300, 20);
spring.setTarget(maxDisplacement * 1.5);
requestAnimationFrame(function loop() {
  setScale(refs, spring.update(1 / 60));
  if (!spring.isSettled()) requestAnimationFrame(loop);
});
```

---

## Browser compatibility

| Feature                                | Chrome | Edge | Firefox | Safari |
| -------------------------------------- | ------ | ---- | ------- | ------ |
| SVG displacement + specular refraction | ✓      | ✓    | —       | —      |
| CSS blur/saturate fallback             | ✓      | ✓    | ✓       | ✓      |

---

## Build from source

```bash
npm install
npm run build    # outputs dist/
npm test         # build + run physics unit tests
```

## License

MIT

---

## Support

Need help? Please see our [Support Guide](SUPPORT.md).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

## Security

If you discover a security vulnerability, please see our [Security Policy](SECURITY.md).
