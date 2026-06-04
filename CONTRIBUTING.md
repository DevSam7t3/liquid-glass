# Contributing to @avenra/liquid-glass

Thank you for considering a contribution! This document outlines the process and conventions for this project.

---

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

---

## Ways to contribute

| Type | Where |
|------|-------|
| Bug report | [New issue → Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) |
| Feature request | [New issue → Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) |
| Documentation | PR against `main` |
| Code fix / feature | PR against `main` (see below) |

---

## Development setup

```bash
# 1 — Fork and clone
git clone https://github.com/<your-username>/liquid-lens.git
cd liquid-lens

# 2 — Install dev dependencies
npm install

# 3 — Build in watch mode (terminal A)
npm run build:watch

# 4 — Serve the demo (terminal B — any static server)
npx serve .
# open http://localhost:3000/demo/index.html in Chrome

# 5 — Run the test suite
npm test

# 6 — Type-check without emitting
npm run typecheck
```

> **Note:** The SVG `backdrop-filter` displacement effect is **Chromium-only**. Use Chrome for visual testing.

---

## Project structure

```
src/              TypeScript source
  types.ts        All public interfaces and event maps
  emitter.ts      Generic typed EventEmitter
  spring.ts       Spring physics
  math.ts         Snell's law displacement maps (compute1D/2D, computeSpecular)
  filter.ts       SVG filter DOM builder
  core.ts         createLiquidGlass — generic core
  components.ts   All pre-built components (button, switch, slider, cursor…)
  init.ts         data-attribute auto-init
  index.ts        Public re-exports
styles/           CSS (custom properties, component base styles)
dist/             Built output — generated, not committed
tests/            Node.js unit tests (math/physics only; no DOM)
demo/             Standalone HTML showcase
```

---

## Pull Request process

1. **Create a branch** off `main`:
   ```bash
   git checkout -b fix/your-bug-description
   # or
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes.** Keep commits focused — one logical change per commit.

3. **Verify everything passes:**
   ```bash
   npm run typecheck   # zero TypeScript errors
   npm test            # build + 11 unit tests pass
   ```

4. **Open a PR against `main`** using the PR template.  
   - Reference any related issue with `Closes #123`.
   - If it's a new component or API change, update `README.md` and `CHANGELOG.md`.

5. A maintainer will review within a few days. Once approved it will be squash-merged.

---

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New component or API |
| `fix:` | Bug fix |
| `docs:` | README, CHANGELOG, code comments |
| `refactor:` | Code change with no functional effect |
| `test:` | New or updated tests |
| `chore:` | Build tooling, dependencies, CI |
| `perf:` | Performance improvement |

---

## Adding a new component

1. Add event map, options interface, and handle interface to `src/types.ts`.
2. Implement the class + factory in `src/components.ts` following the existing pattern  
   (class extends `EventEmitter<T>`, factory wires DOM events and springs, returns the interface type).
3. Export from `src/index.ts`.
4. Add a data-attribute selector in `src/init.ts`.
5. Add a CSS section in `styles/liquid-glass.css`.
6. Add an exhibit in `demo/index.html`.
7. Document in `README.md` and add an entry to `CHANGELOG.md`.

---

## Releases (maintainers only)

Releases are fully automated via GitHub Actions:

1. Update `CHANGELOG.md` — move items from `[Unreleased]` to a new `[x.y.z]` section.
2. Bump `version` in `package.json`.
3. Commit: `git commit -m "chore: release x.y.z"`
4. Tag: `git tag vx.y.z`
5. Push: `git push origin main --tags`

The CI will automatically:
- Build all bundles
- Run the full test suite + type-check
- Create a GitHub Release with `.zip` and `.tar.gz` archives
- Publish to npm
