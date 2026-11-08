# Thai Robotics Platform — working local pilot

Implemented 8 November 2026 in the existing Next.js application. The software workflows are available across M01–M11. Physical evaluation and competition records created by the setup script are explicitly labeled demonstration data. Venue agreements, actual robot trials and human observations still require the team.

## Open the full website

```sh
pnpm install --frozen-lockfile
pnpm demo
```

Open `http://127.0.0.1:3000`, then `/demo` to select a local persisted account. The setup provides USER, COMPANY, REVIEWER, LAB, ORGANIZER, JUDGE, MODERATOR and ADMIN roles. Each selection issues a signed session and opens `/me`. Normal users can also register with a password and use `/sign-in`.

On this Windows workstation, Node is available through the existing portable tooling:

```powershell
.\scratch\tooling\node.exe scripts/dev-platform.mjs
```

The launcher starts an isolated, persistent PGlite database through its PostgreSQL socket bridge on `127.0.0.1:5433`, imports Atlas records from the repository dataset, creates labeled pilot examples, starts the simulator worker and runs Next.js on port 3000. It preserves the original `.env` and creates an ignored `.env.local` with the local database URL and a random session secret. Data lives in ignored `scratch/platform-db`. It never seeds a remote database. The socket bridge supports multiple connections so the web server and worker can share the local database.

This local development setup follows the [PGlite socket integration documentation](https://pglite.dev/docs/pglite-socket). A deployed application uses a normal PostgreSQL service and a separately running simulator worker; the local `/demo` role switcher requires `LOCAL_DEMO_MODE=1` and a loopback host. Do not use local role switching as an external account system.

## What is implemented

| Module | Entry points | Working pilot behavior |
| --- | --- | --- |
| M01 | `/robots` → HRI button | Uses an imported Atlas model, records four outcomes, saves/reloads logs in the local database and exports JSON/CSV |
| M02 | `/leaderboards/company/industrial-pick-place`, `/company/portal` | Server filters unpublished/private fields; company membership controls editing; assigned reviewers approve exact versions; publication consent and duplicate protection |
| M03 | `/evaluate`, `/evaluate/physical/new`, `/ops/lab` | Requests, information corrections, assignment, cost/date proposal, owner confirmation, intake, five measured rounds, report certification and return receipt |
| M04 | `/company/portal` | Multiple model versions, new versions instead of changing approved hardware, linking a certified report to the exact hardware/firmware version, review history and publication checks |
| M05 | `/leaderboards`, `/leaderboards/benchmark/:groupId`, `/results/:id` | Separate Physical and Simulation groups; protocol/version/class metadata, units, sorting, owner consent, optional evidence fields and withdrawal |
| M06 | `/simulator/grid-navigation`, `/simulator/grid-navigation/workspace`, `/me/runs/:id` | Saved F/L/R programs, bounded deterministic grid engine, practice/evaluation queues, cancellation, failed-run reasons, replay, history and export |
| M07 | `/competitions`, `/ops/challenges`, `/me/entries/:id` | Persistent rules and deadlines, one team per account/competition, eligibility review/correction, on-site check-in, judge scoring, appeals, finalization and official rankings |
| M08 | Same competition routes | Online, On-site and Hybrid; online runs tied to eligible entries, worker-derived scores, online qualification, separate appeal deadlines and on-site progression |
| M09 | `/learn`, `/learn/:lessonId` | Three Thai beginner lessons, exercises linking to Atlas/simulator, account completion and continue-learning links |
| M10 | `/community`, `/community/drafts`, `/ops/moderation` | Account drafts, required references for news/research, publication, reports, moderator decisions, hidden-content filtering and author-visible moderation notes |
| M11 | `/me`, `/search` | Personal lessons/programs/runs/requests/teams/drafts, assigned work, role queues, search across public records, type filters, sign-in return paths and navigation links |

The existing `/challenges` catalog remains labeled example content. The persistent competition workflow is `/competitions`; it is linked from the full-site navigation and home page. Old example scores do not become official results.

## Rehearsal routes

1. **HRI:** Open `/robots`, select ทดลอง HRI, finish guidance, restart for staff handoff, cancel and injected failure. Reload and open saved history. Use JSON/CSV export to inspect the actual round events.
2. **Simulator:** Choose USER at `/demo`; open the navigation workspace, save the starter program, choose PRACTICE or EVALUATION and queue a run. The report refreshes while queued/running. Only successful verified standalone evaluations can be consented into the Simulation benchmark.
3. **Physical evaluation:** USER opens a request using an Atlas model. ADMIN assigns a LAB account. LAB requests corrections or proposes a date/cost. USER confirms. LAB records intake, starts testing, enters five evidence-backed rounds, certifies the pilot report and records return. USER can publish passing metrics, choose optional evidence/firmware fields and withdraw consent later.
4. **Company:** COMPANY opens its portal or submits a model. ADMIN assigns REVIEWER. REVIEWER records a pass or correction request. COMPANY confirms the public fields. Approved model fields are locked; use New version for hardware/firmware changes. For linked reports, create the evaluation with the company model ID and exact version/specification; link the certified result while the model is a draft. The draft moves to the matching pilot protocol group. Reviewer-supplied numbers cannot override the linked report's measurements.
5. **Competition:** ORGANIZER creates a competition, assigns JUDGE and opens registration. USER applies; ORGANIZER accepts or requests corrections. Online entrants queue a saved program through their entry. JUDGE selects a verified run; On-site teams must check in before scoring. Teams can appeal within the published window. JUDGE resolves appeals and finalizes after that round's appeal deadline. ORGANIZER closes entry and publishes finalized results. Hybrid qualifiers retain their Online score and continue to On-site check-in. Official tables rank rounds separately. Later score amendments require a reason, an audit event and a results revision.
6. **Community:** USER saves a NEWS draft; publishing without a reference fails visibly. Add an http(s) source, save and publish. Another user can report the post. MODERATOR hides, restores or dismisses with a reason. Hidden content disappears from feeds, detail APIs and search; the author's draft shows the publication state and moderation notes.

The setup seeds open demonstration competitions with future dates. It does not shorten appeal windows to make the UI bypass the rules. Automated integration tests advance only their own fixture deadlines to test finalization.

## Persistence, permission and measurement rules

- `PlatformRecord` holds typed workflow payloads; `PlatformEvent` records every accepted action and revision. Updates use optimistic revision checks inside transactions. One unique slot prevents duplicate team applications even under concurrent requests.
- The server validates protocol/task/scene versions and owns simulator scores. The command language accepts at most 100 F/L/R commands; it executes no user JavaScript, Python, containers or arbitrary shell commands.
- Owner, assigned staff and administrator checks protect private records. Public results use an explicit field projection. Changing role/email cookies cannot authenticate an account; legacy preview cookies have no account email or elevated role.
- Passwords are stored as salted scrypt hashes. Sessions use expiring HMAC signatures with an HttpOnly cookie. Set a persistent random `SESSION_SECRET` of at least 32 characters outside local setup. Existing passwordless accounts need an account recovery process before use outside the local pilot.
- Physical pilot metrics are the mean precision (mm) and seconds/cycle across five recorded rounds. All safety checks must pass for benchmark publication. A certified failed report remains private. These are entered pilot measurements, not telemetry from connected robot hardware.
- The grid simulation score is 100 minus commands beyond nine if the goal is reached, otherwise zero. Counts and paths are scene outcomes; they do not represent physical robot speed or safety.
- Cancellation and worker interruption produce explicit terminal states. A new submission produces a new run and retains history.

## Verification

```sh
pnpm test
pnpm typecheck
pnpm test:platform
pnpm test:platform:browser
pnpm test:hri
node scripts/check-platform-migrations.mjs
pnpm build
```

The database integration suite is guarded to the isolated local demo URL. It creates its own records and removes only those recorded IDs. It checks the complete evaluation, queue, competition, appeal and moderation flows; stale/concurrent updates; idempotent creates; private projections; and worker interruption recovery. The browser suite uses real local database records and actual signed account sessions, including the full Atlas-to-HRI route and the lab-to-company report link. The separate HRI component suite uses labeled transport fixtures for failure paths.

The migration chain includes a prerequisite migration restoring the Community, HRI and CompanyModelEvaluation tables omitted from the historical migration files. It preserves tables on installations previously synchronized with `db push`. A fresh-schema migration check verifies the entire chain and removes only its temporary schema.

Verification recorded on 8 November 2026: 31 unit/API policy tests passed; the persisted database integration scenario passed, including concurrent update protection and interrupted-worker recovery; all six full-site browser scenarios passed; four HRI component scenarios passed; TypeScript and the production build passed. The build retains pre-existing autoprefixer warnings in unrelated stylesheets. A final production-server check opened the home page, registry, lessons, simulator, evaluation, rankings, competitions and search; signed local login, mobile layout and saved HRI replay also passed.

Browser-created fixture records were removed from the local demo after verification, leaving the labeled starter examples and imported Atlas data. The guarded cleanup command is `pnpm exec tsx scripts/cleanup-platform-browser-tests.ts`; it only matches the test suite's reserved names in the isolated local database. It does not remove ordinary demo or user records.

Screenshots under `docs/evidence/platform` show the production build's [home page](evidence/platform/full-site-desktop.png), [mobile workspace](evidence/platform/my-workspace-mobile.png) and [HRI results using imported Atlas records](evidence/platform/hri-live-atlas.png).

## Remaining acceptance work

The pilot implements the software paths. Module closure still needs real-user observations and resulting changes, confirmation of the organizer's required base commit, the submission commit, presentation-machine rehearsal, a confirmed pilot venue, an agreed actual lab protocol and resources, and real physical robot measurements if claiming physical or health outcomes. Those requirements remain unchecked in the roadmap. The current simulator is the bounded grid task described above; additional robotics tasks and arbitrary-language execution require additional implementations.
