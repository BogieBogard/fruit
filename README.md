# Orchard Drop

A quiet little fruit-merging game for the browser. Move to aim, click or release to drop, and merge matching fruit from cherry all the way to jackfruit. Merge two jackfruits to harvest the pair and earn a 1,000-point bonus.

Intended Pages URL: **https://mbogard.com/fruit/**

## Run locally

Requires Node.js 22 or newer. No dependency installation or build step.

```sh
npm run dev
```

Open http://127.0.0.1:4173/fruit/. Run `npm test` for physics, scoring, save/restore, and stability tests.

## Controls and features

- Mouse: move to aim, click to drop. Touch: slide to aim, release to drop.
- Keyboard: left/right arrows to aim, Space to drop, P/Escape to pause, M to toggle sound.
- Cozy, Classic, and Spicy modes with separate personal bests.
- Automatic saves, pause when the tab is hidden, and explicit resume when returning.
- Optional synthesized sound; muted by default. Respects reduced-motion preferences.
- Responsive phone, tablet, and desktop layouts; high-density canvas rendering.
- No accounts, ads, analytics, cookies, backend, or runtime JavaScript dependencies.

## Browser saves

The versioned `mbogard.fruit.orchard.v1` localStorage entry holds the current board, fruit velocities, upcoming fruit, random generator state, score, elapsed time, mode, and settings. Runs save after drops, on pause/tab exit, and about once a second during play. Returning opens the saved run paused. Saves are local to the browser/profile and origin; they do not sync across devices. Clearing site data removes them. Private browsing or blocked storage can prevent persistent saving; gameplay still works.

## GitHub Pages

This is an independent GitHub Pages project. In **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/(root)**. The root `index.html`, relative assets, and `.nojekyll` require no build step. With the custom domain configured on `BogieBogard.github.io`, the project is served at `https://mbogard.com/fruit/`. Do not add a CNAME to this project: it inherits the user-site domain and `/fruit/` path.

Private-repository Pages requires an eligible existing GitHub plan. The game does not change repository visibility or billing.

## Source

- `engine.js`: deterministic fixed-step circle simulation, collisions, merging, scoring, save validation.
- `art.js`: original canvas fruit illustrations.
- `game.js`: input, rendering, sound, UI, and persistence.
- `style.css` / `index.html`: responsive interface. Google Fonts enhance typography with system fallbacks when unavailable.
- `tests/engine.test.mjs`: dependency-free automated tests.
- `scripts/browser-check.mjs`: optional Playwright integration checks; install Playwright separately or set `PLAYWRIGHT_MODULE` to an existing module path.

The earlier Android code remains in `app/` as an archive. Its workflow is manual-only; the website does not use Android tooling. CI checks the web engine on pushes and pull requests.
