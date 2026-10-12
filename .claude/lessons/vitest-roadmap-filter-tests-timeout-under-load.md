# Roadmap filter tests time out only in the full suite (`Test timed out in 5000ms`)

- Check: manual (`npx vitest run` vs `npx vitest run src/frontend/pages/Roadmap`)
- Last seen: 2026-10-12

## What happened
`RoadmapProgressView.test.tsx` › "filters roadmap items by status" / "…unread lessons" render all 305 roadmap items and take 3–4 s each on their own. In the full suite, 12 workers share the CPU and they sometimes cross vitest's 5 s default timeout, so they fail intermittently. Running the file alone (or the suite again) passes. Unrelated code changes get blamed for it.

## How to fix
Re-run the file alone to confirm before debugging. Lasting fix (not done yet): give those two tests a longer timeout (`it('…', fn, 15_000)`) or render a smaller roadmap fixture.
