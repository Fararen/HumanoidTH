# M01 · HRI Living Lab — implementation and evidence

Audit date: 8 November 2026 (Asia/Bangkok). The initial audit below recorded a database outage. **Update: the full application now uses an isolated local database with 17 imported Atlas models; browser testing verified all four HRI outcomes, actual database saves and reload/replay. Human participant evidence remains pending.** See [the working platform pilot](platform-pilot.md) and [full-site HRI screenshot](evidence/platform/hri-live-atlas.png).

## Provenance and scope

| Item | Evidence |
| --- | --- |
| Fork remote in this checkout | `https://github.com/Fararen/HumanoidTH.git` |
| Local pre-feature base | `d17d52e5a265a29ca0a8125766f5d71d77ab68d6` (parent of the original M01/M02 feature commit) |
| Original M01/M02 feature | `513e31a27850ca1b6af2443e9c0943f7336996c9` |
| Checkout before this repair | `fa2f70108eca517f8d79277a22c198c954db3489` |
| Repair commit | Pending: changes are in the working tree, not committed or pushed |
| Scene implemented here | `HRI-WELLNESS-RECEPTION-v1.1` |
| Entry points already present | `/robots` → ทดลอง HRI, and `/robots/:id` → ทดลอง HRI |
| Feature route | `/robots/:id/hri-lab`, under the existing Next.js layout |

The local pre-feature base is a reproducible comparison point, not a claim that the organizers have approved that base. Confirm the required upstream commit before submission. Registry identity and references come from `RobotModel` and `SourceRecord`; the receptionist, route, staff acknowledgment and visitor are a labeled web simulation. No robot hardware is controlled and no staff member is contacted.

Inspect the original feature with `git show 513e31a -- app/robots app/api/hri-runs prisma/schema.prisma`. Inspect this repair with `git diff -- app/robots app/api/hri-runs package.json playwright.config.ts` and the new files below. Untracked files must also be included in a future submission commit.

## What was unfinished and what changed

| Finding in the existing feature | Repair |
| --- | --- |
| Artificial `+0.2`, `+0.4` and backdated checkpoint times | `performance.now()` records observed events; duration is the last minus first event time, rounded to 0.1 s |
| Completed runs could accept more choices using the same ID | Pure state transitions reject actions after completion; restart makes a UUID; replay is read-only |
| Timer callbacks could overwrite a replayed or cancelled run | A single timer reads the current run reference and advances only `GUIDING` runs |
| Save failures were silent; success language preceded a database receipt | Separate local/saving/saved/error states, visible retry, local JSON/CSV export on failure |
| Server trusted client scores, duration and model name | Schema and event-order validation; metrics recomputed; model name read from Atlas |
| Retries could produce unique-key errors | Idempotent upsert with immutable payload comparison; changed logs under the same ID return 409 |
| Verification table reported four passes without observations | Results come from current/history logs for the same model, scene version and mode; untested cases say Not run |
| History query failure prevented a usable model from opening | Model, picker and history load separately; history/source failures are visible without inventing registry data |
| Retry on a missing model switched to a different model | Retry refreshes the requested route; returning to the registry is an explicit link |
| SVG coordinates and animation constants looked like physical telemetry | Coordinates use image units; explanatory text distinguishes interaction time from physical performance |
| Long IDs overflowed on mobile | Wrapping, bounded grid columns and responsive controls; visible focus and keyboard-operable report tabs |

Implementation: [simulation and validation](../lib/hri-simulation.ts), [client](../app/robots/[id]/hri-lab/HriLabClient.tsx), [page loader](../app/robots/[id]/hri-lab/page.tsx), [API](../app/api/hri-runs/route.ts), [styles](../app/robots/[id]/hri-lab/HriLab.module.css).

## Verification recorded

| Check | Result and scope |
| --- | --- |
| `pnpm test` | 21 tests pass, including 9 HRI engine/API tests; API database delegates are controlled test doubles |
| `pnpm typecheck` | Pass |
| `pnpm test:hri` | 4 Chromium browser scenarios pass, including all four outcomes, keyboard operation, narrow viewport, replay, reload, failed save, retry and JSON export |
| `pnpm build` | Pass; existing autoprefixer warnings in Analytics, HostCompetition and RobotDirectory styles |
| `node scripts/check-hri-readiness.mjs` | Configured PostgreSQL connection refused (`ECONNREFUSED`); no database rows read or written |

Browser evidence uses a test-only Atlas record and a controlled save transport. It is **not evidence of a successful real PostgreSQL save, upstream registry import, or a human participant trial**. The test harness runs outside Next.js; it introduces no fixture routes or database bypass in the application. Reload in this harness restores controlled test history, not production database history.

| Case | Observed result | Navigation success |
| --- | --- | --- |
| Navigation | `ARRIVED_AT_DESTINATION`; events include the actual observed checkpoint and arrival | Yes, in the web scene |
| Staff handoff | `HANDED_OFF_TO_STAFF`; keyboard activation works | No |
| Cancel while guiding | `CANCELLED_BY_USER`; later timer ticks cannot finish navigation | No |
| Injected failure / missing model | `RECOVERY_READY`; reason, retry and export available | No |
| Save failure | Visible error, `LOCAL_ONLY` export; retry sends the exact same run ID and trace | Unchanged simulation result |
| Mobile | At 390 × 844, document width does not exceed viewport width | Not a navigation test |

Screenshots: [verification with test fixtures](evidence/m01/verification-test-fixture.png), [mobile with test fixtures](evidence/m01/mobile-test-fixture.png). They document the repaired component, not the full live Atlas flow. The existing baseline is available in Git for code comparison; an authentic pre-feature registry screenshot is still pending.

To repeat the checks:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test
pnpm typecheck
pnpm test:hri
pnpm build
node scripts/check-hri-readiness.mjs
```

This workstation used Node 22.14.0 and pnpm 10.32.1 from `scratch/tooling` because neither executable was on the shell PATH. It used the already installed browser at `scratch/tooling/browsers` via `PLAYWRIGHT_BROWSERS_PATH`. Those machine-local paths are not required on a normally configured development machine.

The browser run rewrites its two labeled screenshots under `docs/evidence/m01`. Tests cover validation and controlled persistence responses; an actual database round trip remains a separate check below.

## Measurement and limits

The clock starts when the browser initializes a scene and includes the user's decision time. Immediate events can share a timestamp. Model/database loading happens before browser initialization, so a missing-model report does not measure server/network loading latency. Navigation takes roughly four animation seconds after selection, subject to browser scheduling; this is a UI behavior, not a robot speed benchmark.

`testCasePassed` means that recorded actions, actors, statuses, sequence numbers and times match the expected trace. `navigationSucceeded` is true only for a valid arrival trace. The API can check internal consistency but cannot attest that browser-submitted events represent a real human trial. The public demo log endpoint does not provide private participant storage: use only synthetic visitor data. Older logs keep their original scene/version metadata and are rechecked rather than automatically counted as passes.

## CI, mood board and design system used

The existing HumanoidTH identity is retained. The visual references are a calm reception desk, a simple floor plan and a readable event ledger. Green (`#244e39`) identifies primary actions and registry information; warm neutral panels distinguish the simulated scenario; amber identifies handoff and red identifies errors. Every outcome also has text, so color is supplementary.

The screen consists of a registry provenance panel, a simulation panel, a route illustration, three explicitly named decisions, and a report with export actions. The stylesheet uses 8–14 px corner radii, consistent spacing, bounded columns on narrow screens, and the surrounding application's font. Text wraps for long run IDs. Keyboard focus is outlined; ordinary buttons support Enter/Space, report tabs support arrows/Home/End, and statuses use polite live announcements. Reduced-motion preferences remove transition effects.

An observed automated usability issue was fixed: long UUIDs increased the page width to 430 px on a 390 px screen. The regression test now passes at 390 px. This observation is from browser automation; it must not be described as participant feedback.

## Live rehearsal and human evidence still required

1. Configure a reachable **demo** PostgreSQL database in `.env` using [environment instructions](environment.md); repeat the read-only readiness command. Apply the repository schema to that intended demo database and ensure it contains a real Atlas model. No database creation, migration or seeding was performed during this audit.
2. Run `pnpm dev:next`; open `/robots`, choose a real model and record its ID, name and reference. Save screenshots of the registry and HRI screen in the application layout.
3. Run each of the four cases on the same model and scene version. Verify the saved receipt, reload, reopen the run and export its JSON/CSV. Record run IDs, actual results and whether each trace matched expectations.
4. Confirm the fork and organizer-required `BASE_COMMIT`; commit the reviewed repair and record its real `FEATURE_COMMIT`. Rehearse the roadmap's three-minute script on the presentation machine and record the elapsed time and any failures.
5. Ask real participants to find the start button, request staff, cancel and describe the status. Record consent and anonymous observations without putting participant identity in public logs. Make and document at least one change based on those actual observations.
6. Agree a pilot location and responsible staff contact. Complete the pilot/business worksheet below before claiming M01 is finished or advancing to M02 under the roadmap's sequence.

| Pilot question | Current proposal / evidence still needed |
| --- | --- |
| Users | Visitors and reception staff at one wellness reception desk; venue and staff owner not yet confirmed |
| Scope | One scene: choose guidance or staff assistance, with cancellation available |
| Possible payer | Venue operator or robot supplier paying for HRI evaluation or a scoped pilot; hypothesis only |
| Resources to estimate | Facilitator time, participant sessions, demo workstation, venue access, deployment/support and any later robot integration |
| Data to collect | Ability to find choices, understand status, request staff, cancel, and explain the outcome; actual observations pending |
| Expansion decision | Discuss physical robot integration only after the interaction trial; use an agreed physical protocol and publication consent before M02–M05 claims |

No health improvement, physical safety certification, buyer demand or agreed price is established by this demo.
