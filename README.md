# Orchard Drop

A bright, arcade-style fruit-merging game for the browser. Move to aim, click or release to drop, and merge matching fruit through eleven stages from blueberry to jackfruit. Merge two jackfruits to harvest the pair and earn a 1,000-point bonus.

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
- Easy, Classic, and Hard modes with separate personal bests.
- Eleven fruits with full circular artwork matching their collision surfaces; real rolling, friction, bounce, stable stacking, and sleeping resting bodies.
- Three-fruit upcoming preview, evolution strip, merge particles, score bursts, and chain-merge feedback.
- Unlimited undo through drops and sweeps in the current session, including recovery after game over. Unlimited sweeps of the smallest fruit type.
- Automatic saves, pause when the tab is hidden, and explicit resume when returning.
- Optional synthesized sound; muted by default. Respects reduced-motion preferences.
- Viewport-filling phone, Fold cover/unfolded, tablet, and desktop layouts; compact side controls in landscape. Browser toolbar changes use dynamic viewport sizing. Canvas resolution tracks its actual displayed size and screen density; fruit remain circular.
- No accounts, ads, analytics, cookies, backend, or external runtime requests. Matter.js is vendored locally with its MIT license.

## Browser saves

The versioned `mbogard.fruit.orchard.v1` localStorage entry holds the current board, fruit velocities and rotation, upcoming queue, random generator state, score, elapsed time, mode, and settings. Its payload is version 2; original eight-fruit saves migrate automatically, preserving the board and score. Old charge limits are ignored. Runs save after drops, on pause/tab exit, and about once a second during play. Returning opens the saved run paused. Undo history is session-only and resets when the page is closed or reloaded. Saves are local to the browser/profile and origin; they do not sync across devices. Clearing site data removes them. Private browsing or blocked storage can prevent persistent saving; gameplay still works.

## GitHub Pages

This is an independent GitHub Pages project. In **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/(root)**. The root `index.html`, relative assets, and `.nojekyll` require no build step. With the custom domain configured on `BogieBogard.github.io`, the project is served at `https://mbogard.com/fruit/`. Do not add a CNAME to this project: it inherits the user-site domain and `/fruit/` path.

Private-repository Pages requires an eligible existing GitHub plan. The game does not change repository visibility or billing.

## Source

- `engine.js`: fixed-step Matter.js rigid-body simulation, contact merges, scoring, power-ups, save validation and migration.
- `art.js`: original canvas fruit illustrations.
- `game.js`: input, rendering, sound, UI, and persistence.
- `style.css` / `layout.css` / `index.html`: compact, dark arcade interface with system fonts, dynamic viewport grids, safe-area spacing, and foldable/landscape layouts. Board dimensions adapt while preserving fruit size/shape, supporting contacts, and the saved pile. Crowded piles retain enough logical height to stay visible during a fold or rotation.
- `vendor/matter.js`: Matter.js 0.20.0, MIT licensed. The UMD root is changed from `this` to `globalThis` to support native browser/Node ES modules. See `vendor/LICENSE-Matter.txt` and https://www.brm.io/matter-js/.
- `tests/engine.test.mjs`: merge, contact support, floor gap, rolling, power-up, migration, and crowded-pile tests.
- `scripts/browser-check.mjs`: optional Playwright integration checks; install Playwright separately or set `PLAYWRIGHT_MODULE` to an existing module path.
- `scripts/layout-check.mjs`: nine phone/foldable/tablet/landscape viewports, sharp round rendering, controls/menu visibility, overlap checks, and fold/rotate state preservation.

The earlier Android code remains in `app/` as an archive. Its workflow is manual-only; the website does not use Android tooling. CI checks the web engine on pushes and pull requests.
