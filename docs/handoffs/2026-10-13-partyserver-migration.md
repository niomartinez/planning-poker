# PartyServer migration handoff — October 13, 2026

## Repository and Initial State

- Canonical checkout: `/Users/antoniomartinez/Documents/GitHub/planning-poker`.
- Public source: `niomartinez/planning-poker`, baseline `main` commit `1a92296` (merge of the admin-role change). The fresh checkout was clean before migration work; no existing migration was found.
- Prior hosted backend: `planning-poker.niomartinez.partykit.dev`.
- The historical Vercel frontend returned HTTP 200. The PartyKit root returned HTTP 404; a root response does not determine whether individual room WebSockets still work.
- No known production room codes or verified production backups were established during the initial inspection. The owner subsequently chose fresh rooms and waived preservation; this is a decision, not proof that the old backend was empty.

## Current Authorization and Release State

On October 13, 2026 the owner explicitly authorized completing the migration to live production with fresh rooms and no preservation requirement. This supersedes the earlier local-only/no-push/no-deploy boundary. No old-room inventory, export, or import is required for this rollout; old resources are not to be deleted unnecessarily.

Publication, backend deployment, and frontend cutover are authorized. New persistent credential grants, paid charges, and legal agreement acceptance remain separate approval boundaries. Wrangler is unauthenticated, and approval to start its standard browser login is pending. No new credential has been generated. No Cloudflare Worker has been deployed, and the original production URLs still point to the rollback baseline. A production-target frontend candidate was built without assigning the original aliases; it is platform validation, not the completed migration.

Existing Vercel authentication and project matching are verified. The checkout is linked locally to the existing project `planning-poker` in `niomartinez's projects`; ignored `.vercel/` metadata is not committed. The current production deployment is `dpl_FfejdutDRmia3y2P1HBXTE5zZs85`, source commit `1a92296df646cd72e34de72fc399d165c8e2a765`, unique URL `https://planning-poker-r3zrtvr1j-niomartinezs-projects.vercel.app`, with production alias `https://planning-poker-ten-sooty.vercel.app`. This is the rollback baseline, not the migrated release. The Git integration uses `main`, and the hosted runtime is configured as Node 22.x. Production, preview, and development have the existing `NEXT_PUBLIC_PARTYKIT_HOST`; `NEXT_PUBLIC_PARTYSERVER_HOST` is not yet configured.


## Published Candidate and Platform Validation

- App/source commit: `3bb44d26646ec86df9770919528662e4882457a8`, published on `codex/partyserver-migration` in the existing repository. `main` is unchanged.
- Vercel candidate: `dpl_95vuyFyDAYz6NDidvFnuyHHP9ejQ`, READY, exact source SHA verified through deployment metadata, matched project `planning-poker`, actual Node runtime metadata 22.x.
- Candidate URL: `https://planning-poker-h0rb3k3om-niomartinez.vercel.app`. The CLI assigned the generated default alias `https://planning-poker-niomartinez.vercel.app`; the three recorded original aliases still resolve to `dpl_FfejdutDRmia3y2P1HBXTE5zZs85`.
- Remote Linux/Vercel install and production build passed. The candidate image endpoint returned HTTP 200, `image/webp`, 1,734 bytes; decoding confirmed a valid 64x56 WebP logo.
- **Do not promote this artifact as the final PartyServer migration.** It was built before a Cloudflare hostname was available and retains the legacy backend environment. Deploy/verify the new Worker, set `NEXT_PUBLIC_PARTYSERVER_HOST`, then rebuild a final frontend candidate before assigning the existing URLs.
- Cloudflare persistent CLI authorization remains pending. Fresh-room production deployment and cutover are authorized once existing account/target checks and this access step are complete. No old-room backup is required.

## Deadline and Data Risk

The [official shutdown notice](https://blog.partykit.io/posts/hosted-platform-shutdown/) lists October 16, 2026 for export/help and redeployment, and October 23 for removal of hosted projects and room data. It does not publish a precise cutoff timezone; complete preservation ahead of October 16.

The original `party/server.ts` keeps players, votes, reveal state, current ticket, and transient emotes in an in-memory field. It has no application storage writes, room registry, or export endpoint. This source establishes the application's memory-only design; it does not prove which room state exists on the hosted deployment, or that no data was ever persisted by a different deployed version.

Known live rooms may contain names, votes, and ticket text worth preserving. A Worker restart or old-server redeploy can discard this memory. **Snapshot live rooms before considering an old-server redeploy to add export functionality.** The storage-copy example in the [official migration guide](https://docs.partykit.io/guides/migrate-to-partyserver/) would not by itself export this application's in-memory state.

The hosted platform does not provide room enumeration through this application. Identify required active rooms from participants' existing `/room/<code>` URLs or room codes, saved `player_<ROOM_CODE>_id`, `player_<ROOM_CODE>_name`, and `player_<ROOM_CODE>_emoji` localStorage keys in their app browser, or existing app logs if known. This is an inventory of required known rooms, not platform-wide enumeration. If unknown rooms or deployed storage must be recovered, the owner needs to decide whether to request provider assistance before the deadline; no contact has been made.

### Known-Room Snapshots

With Node.js 22+, use real room codes and the exact source host:

```bash
npm run backup:rooms -- --host planning-poker.niomartinez.partykit.dev --room <KNOWN_ROOM_CODE> --room <ANOTHER_KNOWN_ROOM_CODE>
node scripts/verify-room-backup.mjs .backups/<snapshot-directory>
```

`--out-dir .backups/<new-directory>` and `--timeout-ms 10000` are optional. The output directory is created fresh to avoid overwriting an earlier capture. The tool connects to each room, validates its initial `sync` state, saves it, and disconnects without sending application actions.

The manifest records source host, capture method, UTC start/completion times, requested room IDs, per-room capture time, filename, bytes, SHA-256, failures, and coverage limitations. Verify all requested rooms succeeded and run the verifier before relying on a snapshot. Keep the ignored `.backups/` files private and preserve another secure copy if needed; never commit their contents. Retain the printed manifest SHA-256 separately, such as in the owner's private migration record, and compare it when verifying a copied backup.

A valid manifest and matching hashes prove that the saved requested-room state is internally intact at capture time. They do not prove a complete project backup, historical room existence, or durable-storage export. Connecting to an unknown code can yield a newly initialized empty room. An empty observed state does not establish that a room never existed. No automatic restore/import endpoint is implemented.

## Local Changes

- `party/server.ts` now exports `Main extends Server<Env>` and a Worker fetch handler. `routePartykitRequest` keeps `/parties/main/:room`; PartySocket and the existing room message protocol remain in use.
- `app/room/[code]/page.tsx` prevents the auto-join effect from re-adding a player while leave navigation is pending. This existing race was reproduced and fixed during browser validation.
- Server event signatures and broadcast calls use PartyServer APIs. The state is typed, and malformed or unsupported messages are ignored. Player/admin rules, ticket updates, voting, emotes, reconnect identity, and the memory-only room lifecycle are retained. Hibernation remains disabled.
- `wrangler.jsonc` replaces `partykit.json`: Worker `planning-poker`, entry `party/server.ts`, compatibility date `2026-10-13`, `Main` binding, and initial `v1` SQLite Durable Object class migration. This provisions a namespace; it does not persist application state or move hosted rooms into the new account.
- PartyKit dependencies are replaced with PartyServer 0.5.10 and Wrangler 4.149.0. Next.js is updated from 15.0.7 to 15.5.27 with matching lint configuration 15.5.27 following critical security advisories, preserving React 18. Concurrently is refreshed within its existing version range to 9.2.5, with shell-quote 1.12.0; these changes clear the reported critical dependency findings. Development uses Node 22.13+ within 22.x or Node 24+, with npm 10.9+. The package uses `devEngines.runtime` rather than `engines.node`, so Vercel retains its verified project setting of Node 22.x instead of implicitly selecting Node 24. `tsconfig.worker.json` separates Worker and frontend checks, and `.vercelignore` keeps backend files out of the frontend upload.
- The client prefers `NEXT_PUBLIC_PARTYSERVER_HOST`, accepts legacy `NEXT_PUBLIC_PARTYKIT_HOST` as a fallback, then defaults to `localhost:1999`. `.env.example` documents local setup.
- `party` runs Wrangler locally on `127.0.0.1:1999`; `dev:all` also runs Next.js. Scripts cover type checking, Worker dry-run bundling, local multiplayer testing, and known-room snapshots. Cloudflare state, build output, local secrets, and snapshots are ignored by Git.

The Next.js frontend stays on its existing Vercel deployment. Only the WebSocket backend moves to Cloudflare. Frontend URLs, `/room/<code>` links, and per-room browser localStorage identities keep their current format.

## Exact Changed Files

- Worker and configuration: `party/server.ts`, `wrangler.jsonc`, `tsconfig.worker.json`, `tsconfig.json`, `.gitignore`, `.vercelignore`.
- Dependency and host setup: `package.json`, `package-lock.json`, `.env.example`; `partykit.json` is removed.
- Frontend: `hooks/usePartyRoom.ts`, `app/room/[code]/page.tsx`.
- Tools: `scripts/test-multiplayer.mjs`, `scripts/backup-rooms.mjs`, `scripts/verify-room-backup.mjs`.
- Documentation: `README.md`, `CLAUDE.md`, `docs/handoffs/2026-10-13-partyserver-migration.md`.

## Validation Status

Validated on the connected Mac with Node.js 24.13.1 and npm 11.9.0:

- `npm run typecheck` passed for both frontend and Worker.
- `npm run lint` passed with no ESLint warnings or errors. The Next.js CLI reports that `next lint` is deprecated for a future Next.js 16 upgrade.
- `npm run build` passed on Next.js 15.5.27, including a rebuild after the leave-room fix. Existing browser compatibility databases report age warnings; the build still succeeds.
- `npm run build:party` passed: Wrangler dry-run bundle, 38.71 KiB, correct `Main` Durable Object binding, no deployment.
- `npm run test:multiplayer` passed all 12 stages against local Wrangler: initial sync and 404, join/admin/duplicate protection, room isolation, ticket permission, numeric/pass/question votes, reveal/reset, names/emojis, emote timing, reconnect without duplicates, leave/admin promotion, and malformed JSON/type/binary recovery.
- Backup scripts passed syntax checks, 28 synthetic localhost command/fixture checks, and an actual local Worker snapshot and verification. Checks include retained admin/ticket/vote/reveal/emoji/unknown fields, zero gameplay sends, 0700 directories/0600 files, hashes and byte counts, overwrite refusal, incomplete capture, tampering, unsafe paths/symlinks, permissions, and missing files. A real-Worker close-handshake issue found during testing was fixed by sending normal close code 1000.
- Chrome tested the built frontend using `127.0.0.1:3007` and `localhost:3007` as independent localStorage identities with the same local Worker. Create/join, ticket sync, votes 8/13, reveal with average 10.5, reset, reload without duplicate players, and the corrected leave/admin handoff passed. A result screenshot was captured in the task output. No browser console error was reported.
- `git diff --check` passed. No push, traffic cutover, or production room snapshot was performed during these local checks. The validated candidate is committed locally on `codex/partyserver-migration` for release.

### Dependency Advisory Review and Compatible Fixes

The earlier 27/15 audit figures are superseded. The validated candidate now reports **9 package advisories: 7 high, 2 moderate, 0 critical**. `npm audit --omit=dev` reports **7 installed-package advisories: 5 high, 2 moderate, 0 critical**. These count affected dependency nodes and propagated meta-advisories, not exploitable runtime paths. `omit=dev` still includes Tailwind through the production `tailwindcss-animate` peer; that does not make Tailwind execute on room requests.

Applied fixes stay on Next.js 15, React 18, and Tailwind 3:

- Sharp is upgraded to 0.35.5, explicitly supported by Next 15.5.27's optional range `^0.34.3 || ^0.35.4`. The reviewed libvips/libheif/librsvg findings are cleared.
- Direct PostCSS is 8.5.30; a scoped `overrides.next.postcss` pins the same patched version because Next 15 declares 8.4.31. This is outside Next's exact dependency pin, not a maintainer-certified compatibility matrix. Its used PostCSS 8 APIs remain compatible, and the actual production build passes. A stale nested lock entry initially defeated npm's override; removing only that entry was verified in an isolated clean-install fixture, then canonical `npm ci` and `npm ls postcss` confirmed Next dedupes to 8.5.30 with no invalid copy. Remove/revisit this override when upstream Next adopts a patched version.
- Compatible transitive refreshes clear findings in AJV, browser compatibility data, Brace Expansion, Flatted, Glob, JS-YAML, Minimatch, Nano ID 3, Picomatch, and source-map-js. TypeScript ESLint remains within version 8. Selector parser 6.1.4 clears its older recursive AST advisory, while its newer flat-parser finding remains.

| Path | Actual application exposure and residual findings |
| --- | --- |
| PartyServer Worker | No flagged package instance appears in the inspected Worker source-map bundle. PartyServer uses its separate Nano ID 5.1.16; room messages use native JSON parsing and application guards. |
| Next image endpoint | Sharp is traced into Next's image request handling, not merely the favicon tool. Both components use fixed `/logo.png`; the app has no upload route. Requests can select another local HTTP path, while unconfigured remote image URLs and non-image HTML routes are rejected. No crafted-image byte source or remote exploit chain was demonstrated. Sharp is now patched. Local macOS traces are not proof of the deployed Linux/Vercel image-service implementation. |
| PostCSS and source maps | These process repository CSS/generated font CSS during builds. The app accepts no CSS/source-map input from visitors. The conditional AMP runtime path is unused by this App Router app, which has no AMP/Pages routes; `optimizeCss` is not enabled. The audited package copies were absent from production traces and are now patched. |
| Tailwind/file scanning | Remaining high entries are `braces`, `chokidar`, `micromatch`, `fast-glob`, and `tailwindcss`; Next's ESLint plugin/config add two propagated high entries. Globs and CSS are fixed repository inputs, not live player/ticket data. Braces latest remains 3.0.3 with no patched release. This does not establish zero risk when building untrusted contributed source. |
| Selector parsing | `postcss-selector-parser` 6.1.4 and `postcss-nested` account for the two moderate entries. The fixed parser is 7.1.6, outside the current Tailwind 3 contract. Ordinary trusted CSS builds are excluded from the maintainer's stated attack precondition. |

No remaining advisory was demonstrated to be exploitable through the current candidate's live room or image inputs. This is a reachability assessment, not a guarantee of absence of vulnerabilities or a statement that the old production deployment is patched. Next has vendored libraries separate from audited package identities.

A Tailwind 4 migration or forced parser-major override is broader maintenance scope, not necessary to finish this migration's runtime fixes. Tailwind 4 alone would not clear lint's dependency chain: Next 16's ESLint plugin still depends on Fast Glob. Keep build sources trusted, follow upstream fixes, and consider the broader CSS/lint modernization separately; no forced major upgrade was applied.

Primary sources: [Sharp advisories](https://github.com/lovell/sharp/security/advisories), [Next 15.5.27 metadata](https://raw.githubusercontent.com/vercel/next.js/v15.5.27/packages/next/package.json), [PostCSS fix](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp), [selector-parser advisory](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf), [Braces issue](https://github.com/micromatch/braces/issues/70).

After these fixes, a clean `npm ci`, both TypeScript checks, lint, production build, Worker dry-run bundle, and all 12 local multiplayer stages passed again. The native image check exercised all six existing favicon sizes in memory without changing public files; the production Next endpoint returned a valid optimized 64px WebP logo, and rejected a remote URL and local HTML route. Sharp 0.35.5/libvips 8.18.7 were loaded successfully. Evidence is in the local task workspace: `security-reviewed-audit.json`, `security-reviewed-production-audit.json`, `image-pipeline-results.txt`, and `security-refresh-multiplayer-results.txt`. The standalone QA runner is `check-image-pipeline.mjs` in that workspace.

Existing server trust semantics remain: player IDs are client-supplied and not bound to a connection, disconnected players remain until explicit leave, and overlapping emote timers can clear a later emote. This migration preserves that behavior rather than adding a new authentication model. Application state still resets when a Worker instance is restarted or evicted; declaring a SQLite namespace does not persist it.

Reproduce local checks:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run build:party
```

In separate terminals:

```bash
npm run party
npm run test:multiplayer
```

The multiplayer script accepts an optional local origin argument or `PARTY_SERVER_TEST_URL`; it rejects remote hosts and only runs against a local HTTP origin. Cloudflare staging verification requires an authorized deployment and actual browser clients pointing at that staging Worker. The owner has explicitly chosen fresh rooms with no preservation requirement. Cloudflare CLI authorization remains pending; real production multiplayer must still be verified after deployment.

## Rollout Checklist

1. **Completed decision:** the owner authorized fresh rooms with no preservation requirement. Do not add export endpoints, import old room state, or delete old/unrelated resources. Optional snapshot tools remain available for future use.
2. Select the Cloudflare account and approve the target Worker/environment. Check for an existing `planning-poker` Worker before using the configured name; choose a separate staging target to avoid overwriting unrelated resources. `wrangler whoami` reported no authentication. Starting the standard Wrangler browser login requires the pending separate approval for persistent CLI access. Production deployment itself is authorized; the account must still be verified after login.
3. After explicit deployment authorization and account verification, deploy the approved staging Worker with Wrangler. Confirm the `Main` binding and SQLite migration apply to the intended new namespace. Do not apply this new-class migration blindly to an existing Worker namespace.
4. Point a local or approved preview frontend build at the staging Worker. Verify representative multiplayer browser flows, reconnects, room isolation, and logs. This does not change production traffic.
5. Start with fresh rooms as authorized. No restoration or old-room comparison is required. Verify newly created rooms rather than claiming old data transferred.
6. Production Worker deployment and frontend cutover are already authorized. After backend verification, perform the frontend environment/rebuild using the verified existing project. Use the approved Worker hostname in `NEXT_PUBLIC_PARTYSERVER_HOST`; public environment values are embedded in the Next.js build. Preserve the previous frontend deployment and environment values.
7. Confirm production room links and multiplayer behavior from two independent clients after cutover. Recheck any restored state and preserve the backup manifest. No old-data deletion is required for the migration.

The Worker deployment command, **only after the target and action are authorized**, is:

```bash
npx wrangler deploy
```

Account setup, terms acceptance, purchases, persistent credential creation, provider contact, pushes, deployments, and production changes require their applicable authorization. Existing authorized tooling may be used without publishing secrets.

## Rollback Checklist

1. Retain the previous frontend deployment and exact host environment values before cutover.
2. If reverting to the hosted backend, remove or reset `NEXT_PUBLIC_PARTYSERVER_HOST` as well as checking `NEXT_PUBLIC_PARTYKIT_HOST`; the new variable takes precedence. Rebuild/redeploy the frontend only after rollback is authorized.
3. Check that the old host and the required room state are still reachable. Hosted rollback is time-limited by the shutdown and cannot recover discarded in-memory sessions.
4. After shutdown, use a previously validated PartyServer Worker version and the approved host instead. Keep Durable Object binding names and migration history compatible; a Worker code rollback does not reverse storage migrations or reconstruct memory.
5. Keep verified snapshots intact. A backend switch does not merge votes or players collected on separate backends, and restoration remains a separate controlled operation.
