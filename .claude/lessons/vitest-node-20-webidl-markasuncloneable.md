# Frontend tests crash on Node 20 (`webidl.util.markAsUncloneable is not a function`)

- Check: manual (`npx vitest run src/frontend/...`)
- Last seen: 2026-10-12

## What happened
The default shell `node` was v20.20.1, but the project needs Node >= 24 (`package.json` engines, `.nvmrc`). Under Node 20 the bundled `undici` fails while starting the jsdom worker, so every frontend test file errors with "Failed to start forks worker" and reports "no tests". Backend tests still pass, which hides the cause.

## How to fix
Switch to Node 24 before running tests: `nvm use` (reads `.nvmrc`), or prefix `PATH=~/.nvm/versions/node/v24.21.0/bin:$PATH`.
