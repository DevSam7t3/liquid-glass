# Contributing to @avenra/liquid-glass

Thank you for considering a contribution! This document outlines the process and conventions for this project.

---

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

---

## Ways to contribute

| Type                | Where                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| Support / Questions | [GitHub Discussions](https://github.com/DevSam7t3/liquid-glass/discussions) |
| Bug report          | [New issue → Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml)             |
| Feature request     | [New issue → Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml)   |
| Documentation       | PR against `main`                                                           |
| Code fix / feature  | PR against `main` (see below)                                               |

---

## Development setup

```bash
# 1 — Fork and clone
git clone https://github.com/<your-username>/liquid-glass.git
cd liquid-glass

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

# 7 — Lint and format
npm run lint
npm run format
```

> **Note:** The SVG `backdrop-filter` displacement effect is **Chromium-only**. Use Chrome for visual testing.
> **Git Hooks:** This project uses Husky to run linting and formatting on every commit. If your code doesn't meet the style guidelines, the commit will be blocked.

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
   npm run lint        # zero linting errors
   npm test            # build + unit tests pass
   ```

4. **Open a PR against `main`** using the PR template.
   - Reference any related issue with `Closes #123`.
   - If it's a new component or API change, update `README.md` and `CHANGELOG.md`.

5. A maintainer will review within a few days. Once approved it will be squash-merged.

---

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix      | When to use                           |
| ----------- | ------------------------------------- |
| `feat:`     | New component or API                  |
| `fix:`      | Bug fix                               |
| `docs:`     | README, CHANGELOG, code comments      |
| `refactor:` | Code change with no functional effect |
| `test:`     | New or updated tests                  |
| `chore:`    | Build tooling, dependencies, CI       |
| `perf:`     | Performance improvement               |

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

## Releases

Releases are automated via GitHub Actions. There are two ways to trigger a release:

### 1. Automated (Recommended)

1. Go to the **Actions** tab in the GitHub repository.
2. Select the **Release** workflow.
3. Click **Run workflow**, choose the branch (`main`) and the version bump type (`patch`, `minor`, or `major`).
4. The workflow will automatically:
   - Update `package.json` version
   - Create and push a Git tag
   - Build and test the project
   - Create a GitHub Release with build assets
   - Publish to NPM

### 2. Semi-automated (Manual Tag)

If you prefer to bump the version and tag locally:

1. Update `CHANGELOG.md`.
2. Run `npm version <patch|minor|major>`.
3. Push tags: `git push origin main --tags`.
4. The **Release** workflow will trigger automatically to handle the GitHub Release and NPM publishing.

> **Note:** Ensure you have added `NPM_TOKEN` to your GitHub repository secrets for the publishing step to succeed.
