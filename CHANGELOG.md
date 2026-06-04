# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-04

### Added

- Physics-based liquid glass refraction via Snell's law SVG displacement maps
- `createLiquidGlass()` — apply the glass effect to any selector or element
- `createLiquidButton()` — spring-animated hover/press button with `.on('click')` events
- `createLiquidSwitch()` — draggable toggle switch with `.on('change')` events
- `createLiquidSlider()` — fluid horizontal slider with `.on('input')` / `.on('change')` events
- `createLiquidCursor()` — glass orb that replaces the system cursor inside a container
- `createLiquidInput()` — glass `<input>` with micro-vibration on each keystroke
- `createLiquidDial()` — rotary knob with continuous drag and `.on('change')` events
- `createLiquidTooltip()` — spring-animated glass pill above a trigger element
- `createLiquidProgress()` — fluid progress bar with squish-spring on value update
- `init()` — zero-JS data-attribute auto-initialisation (`data-liquid-button`, `data-liquid-switch`, etc.)
- TypeScript support with full `.d.ts` declaration files (`dist/types/`)
- CSS custom properties for theming (`--lg-tint`, `--lg-border`, `--lg-shadow-out`, `--lg-accent`)
- CDN-compatible builds — UMD dev (`liquid-glass.umd.js`) and production (`liquid-glass.umd.min.js`)
- Non-Chrome fallback: CSS `blur + saturate` applied automatically when SVG `backdrop-filter` is unsupported
- Chainable `.on()` / `.off()` / `.once()` typed event API on every component handle
- Four distribution bundles: ESM (tree-shakeable), CJS, UMD, UMD minified
- Spring physics engine (`Spring` class) exposed as a low-level export
- Full low-level API: `compute1D`, `compute2D`, `computeSpecular`, `buildMaps`, `createFilterSVG`, `setScale`

[unreleased]: https://github.com/DevSam7t3/liquid-glass/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/DevSam7t3/liquid-glass/releases/tag/v1.0.0
