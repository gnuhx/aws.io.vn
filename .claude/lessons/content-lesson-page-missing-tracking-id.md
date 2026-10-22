# Content test fails: "every lesson page has a tracking ID"

- Check: `npm test` (`src/frontend/content.test.ts`)
- Last seen: 2026-10-20

## What happened
New content was uploaded (MCP Module 8–9, React Module 1–13) and the test listed `.md` files with no entry in `src/shared/lessonProgress.ts`. Every `.md` under `content/<topic>/` becomes a lesson page, so the list also had:
- `MCP/Module 7/Module-7-Remote-Auth-Deploy (1).md`, a byte-identical duplicate of the real Module 7 page (a download saved twice).
- READMEs inside `MCP/Module 8/nexus-m8/nexus/` and `MCP/Module 9/nexus/`. Those folders are nested git repos committed as gitlinks (mode 160000, no `.gitmodules`), so their files exist only in a local checkout. Tracking them would make CI fail the opposite test ("every tracking ID belongs to an existing lesson page").

## How to fix
- Add a `lessonProgressManifest` entry for each real lesson page (next free `<topic>:lesson-NNNN`, never renumber), pointing at the roadmap item it covers.
- Delete duplicate `(1)` copies instead of tracking them.
- Exclude gitlinked folders from the `rawContentModules` glob in `src/frontend/content.ts` (or commit their files as normal files if they should be lessons).
- A new course also needs its roadmap as `- [ ]` checklist lines plus `roadmapProgressManifest` items whose `sourceLine` is each checklist line; the "every item points at a checklist line" test checks this.
