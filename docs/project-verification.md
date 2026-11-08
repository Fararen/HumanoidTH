# Project verification — 8 November 2026

Reviewed the Next.js application, persisted platform workflows, authentication boundaries, migration chain, browser journeys, and the legacy Python backend. This is a local pilot verification, not a claim that physical robot trials or production deployment acceptance are complete.

## Issues corrected

- **Administrator access:** CMS source/robot/contribution mutations, data ingestion, AI map refresh, private submission exports, and ingestion job history now check the signed account's database role at the server entry point. Hiding a button or protecting an admin layout does not protect an exported server action.
- **Administrator credentials:** removed the built-in fallback credentials. `/admin-login` requires explicitly configured `ADMIN_BASIC_USER` and `ADMIN_BASIC_PASSWORD`. Session cookies retain the attributes set by the signed-session helper. Legacy preview switches clear any existing signed session.
- **API authentication:** replaced the old middleware's separate fallback-password checks with handler-level authorization. Signed browser administrators can download private exports; scripts can still use explicitly configured Basic credentials. Middleware is only an early page-navigation hint, and server checks remain authoritative.
- **Atlas privacy:** the raw `/database` browser and all raw CSV exports require administrator access. Only administrators can use inventory operator mode; public inventory excludes private records and hides custodian/document details. Public contribution lists, graph records, analytics and map analysis exclude private contributions/inventory. Pending submissions and internal review notes no longer appear in the public graph, and analytics only exposes approved submissions.
- **Uploads:** anonymous uploads are rejected. Uploads are limited to 5 MB raster images with recognized file signatures, generated filenames and exclusive writes; HTML/SVG content disguised as a PNG is rejected. Local public-directory storage still needs replacement with persistent storage for a deployment with ephemeral disks.
- **Sign-in redirects:** reject protocol-relative, backslash and control-character destinations that browsers can normalize to an external host.
- **CSV exports:** private submissions and ingestion logs require an administrator; export table names are allowlisted and formula-leading cells are neutralized.
- **Simulator publication display:** the browser test reproduced a successful publication followed by an older run-page render. Successful workflow mutations now reload the page after the transaction commits, preventing an in-flight polling response from leaving an obsolete revision on screen.
- **Data integrity:** removed sample community metadata, removed the unused legacy composer that fabricated successful local posts after failed API calls, and stopped map reads from triggering paid AI requests or manufacturing cached measurements after analysis failures. Community database outages now display an error notice.
- **Lint:** supplied the missing Next.js ESLint configuration and corrected internal community navigation links. Existing image, hook-dependency and accessibility warnings remain visible.

Historical built-in administrator credentials must not be reused for deployment. Configure a fresh unique password and session secret. Existing passwordless demo accounts are for the isolated local pilot.

## Dependency audit

Updated Next.js and its ESLint configuration from 15.5.20 to 15.5.29, retaining the existing major version and recording the resolved packages in `pnpm-lock.yaml`. `pnpm audit --prod` decreased from 26 reported advisories (3 critical, 14 high, 9 moderate) to 6 (0 critical, 4 high, 2 moderate).

The remaining audit findings are open, not suppressed:

| Installed package | Dependency path | Reported findings | Patched version reported by audit |
| --- | --- | --- | --- |
| PostCSS 8.4.31 | Next.js | 2 high, 2 moderate | 8.5.23 or newer |
| DeepmergeTS 7.1.5 | Prisma configuration through Prisma Client | 1 high | 8.0.0 or newer |
| Zod 3.25.76 | Application dependency | 1 high | 4.6.6 or newer |

These are dependency scanner findings; individual exploitability has not been established. The PostCSS pin needs a tested dependency override or upstream update. DeepmergeTS and Zod fixes cross major versions and need compatibility work. The project should not be described as free of known dependency advisories.

## Verification commands

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm check:no-mock-data
pnpm test:platform
pnpm test:platform:browser
pnpm test:hri
node scripts/check-platform-migrations.mjs
pnpm build
pnpm audit --prod
```

The Python backend was checked in an isolated virtual environment with `uv run --extra dev python -m pytest tests/test_schema_and_ingest.py tests/test_pipeline.py tests/test_web.py -q`: 7 tests passed. Its legacy browser smoke tests were not used as the modern website acceptance suite.

Final results after the fixes:

| Check | Result |
| --- | --- |
| Unit/API/security policy tests | 37 passed |
| Persisted database integration scenarios | 2 passed, including public graph privacy |
| Full-site browser workflows | 7 passed against the rebuilt production server |
| HRI component browser cases | 4 passed |
| Python schema, pipeline and web tests | 7 passed |
| Fresh-schema migrations | All 6 applied successfully in an isolated temporary schema |
| TypeScript, ESLint, static data audit | Passed; existing lint warnings remain |
| Production build | Passed with Next.js 15.5.29; existing CSS warnings remain |
| Production dependency audit | 6 open advisories described above |

The production server and queue worker were restarted. The local site is available at `http://127.0.0.1:3000`, with local role selection at `/demo`. Browser fixture records are removed using the guarded cleanup script. Source changes remain local and uncommitted; this verification did not push a new commit.

## Scope limits

- The roadmap's human acceptance work remains open: participant observations, venue/protocol agreements, real robot trials, presentation rehearsal and organizer submission requirements.
- Grid simulation is implemented; general robot physics simulation and arbitrary-language execution are not implemented.
- Billing, email delivery, password recovery and production file storage are not wired to providers.
- AI map groups and the separate sample challenge catalog are not independently verified physical results. The persistent competition workflow is `/competitions`.
- Legacy Python browser smoke tests assume the old preview administrator login. Current browser acceptance uses `playwright.platform.config.ts` with real signed local sessions.
