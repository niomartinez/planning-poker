# PartyServer production handoff — October 16, 2026

## Current State

Production is live at https://planning-poker-ten-sooty.vercel.app with the Cloudflare PartyServer backend. The validated frontend was promoted, and all three historical production aliases were independently verified on deployment `dpl_5SUQZzVNKSRmihTXFm35zQL5Drot`. Two independent browser clients passed the complete representative multiplayer flow on both the candidate and primary production URL. The owner authorized publication and production cutover with fresh rooms and waived old-room preservation. This does not establish that the old backend was empty.

See the [October 13 implementation handoff](/Users/antoniomartinez/Documents/GitHub/planning-poker/docs/handoffs/2026-10-13-partyserver-migration.md) for code changes, local checks, dependency reachability review, and remaining server trust semantics.

## Executed Backend Deployment

Approved official Wrangler device authorization succeeded after the initial browser callback timed out at 120 seconds. The CLI was checked and remained unauthenticated before device authorization. The verified account is `e49073802cedc705920f82c3cb81eb96`.

No existing `planning-poker` Worker was found before the first deployment attempt or after its hostname failure. The account had no workers.dev subdomain, and the default `planning-poker` subdomain was unavailable. The available `niomartinez.workers.dev` subdomain was registered through the documented API only after guarding against an existing hostname, then verified by GET.

- Worker: `https://planning-poker.niomartinez.workers.dev`.
- Deployed version: `bbdcc030-8110-4d7d-851d-1a4f88363e5b`.
- Live binding: `Main`, class `Main`, namespace `92c559df4f9f44539741c099d5b75bd0`, created by the configured initial `v1` SQLite migration. Application room state remains in memory; this configuration does not persist votes or players.

Node-native PartySocket over WSS passed with two clients and fresh UUID rooms: admin permissions, votes 8/13, reveal/reset, reconnect, admin handoff, room isolation, and test-player cleanup. The candidate and primary production browser checks below also validate the frontend integration.

## Frontend Candidate and Configuration

| Item | Verified value |
| --- | --- |
| Vercel project | `prj_IFnEqrzblwjz46LcF472KBeOl9eb` |
| Team | `team_Ae4zKo4cDo6SwNdOshn9Rwhb` |
| Hosted Node setting | `22.x` |
| Rebuilt candidate | `dpl_5SUQZzVNKSRmihTXFm35zQL5Drot` — READY |
| Candidate URL | `https://planning-poker-7g0xniymz-niomartinez.vercel.app` |
| Exact candidate source | `3c637f1ec7b3741a883451e298b44ffe0124a502` |

`NEXT_PUBLIC_PARTYSERVER_HOST` now uses `planning-poker.niomartinez.workers.dev` for production and all preview branches, and `localhost:1999` for development. The legacy `NEXT_PUBLIC_PARTYKIT_HOST` entries are retained; the new variable takes precedence. These public values require a new frontend build, which the candidate supplies.

Production/development variables were added through the CLI. A CLI 50.23.2 preview-branch prompt bug blocked the omitted-branch command; the global preview variable was created through the official POST API as `type: plain`, without a branch or upsert. No production cutover is implied by an environment update alone.

October 16 `npm audit` reports 9 advisories: 7 high, 2 moderate, 0 critical, matching the October 13 review. No dependency upgrade, purchase, new legal terms acceptance, or old/unrelated resource deletion occurred during this execution.

## Completed Cutover and Validation

1. Built the frontend with the new production host. The remote Linux/Vercel build, lint, and frontend type checks passed. Both app and Worker TypeScript checks were also rerun successfully on the Mac.
2. Candidate browser QA passed in two isolated contexts: create/join, admin ticket synchronization and non-admin read-only behavior, votes 8/13, reveal with average 10.5, reset, reload without duplicates or identity changes, and leave/admin promotion without rejoin.
3. Promoted the exact production-target candidate using `vercel promote dpl_5SUQZzVNKSRmihTXFm35zQL5Drot --scope team_Ae4zKo4cDo6SwNdOshn9Rwhb --timeout 60s --non-interactive`.
4. Promotion moved the primary alias. The two older aliases required explicit assignment using `vercel alias set`, followed by independent API inspection. All three were verified READY on the same deployment:

- `planning-poker-ten-sooty.vercel.app`
- `planning-poker-niomartinezs-projects.vercel.app`
- `planning-poker-git-main-niomartinezs-projects.vercel.app`

5. Repeated the full representative two-client browser flow through the primary production URL. All actual app sockets used `wss://planning-poker.niomartinez.workers.dev/parties/main/<fresh-room>`. No console, page, or socket errors were observed. The only aborted requests were Next.js navigation prefetches. Both synthetic rooms were cleaned, and only the owned browser contexts were closed.
6. The historical Vercel error-log query for this deployment returned zero error records in its one-hour window. A separate 45-second filtered Worker tail returned zero events, but its connection readiness was not independently confirmed, so it is not evidence of a clean Worker error window. No persistent monitoring or log drain was configured by this migration.

Source application changes are in `3bb44d26646ec86df9770919528662e4882457a8`; the Worker and cutover frontend were built from `3c637f1ec7b3741a883451e298b44ffe0124a502`. This release handoff adds documentation without changing application code. Source publication uses a fast-forward to `main`. The existing Git integration can produce another deployment after publication; inspect the final serving deployment and all aliases after that build rather than assuming the cutover artifact remains current.

Local task evidence includes `cloudflare-worker-release.json`, `partyserver-frontend-candidate.json`, `production-alias-cutover.json`, `production-candidate-browser-qa-2026-10-16.json`, `production-primary-browser-qa-2026-10-16.json`, both corresponding screenshots, `vercel-production-error-summary.json`, and `security-production-rollout-audit.json`. The final release evidence file records the published SHA and alias checks after source publication. These files contain only selected release metadata and synthetic QA results, not credentials or raw account logs.

Refresh old browser tabs after cutover and use fresh rooms. Already loaded JavaScript can retain the old backend host and split participants between backends even when the room code is identical.

## Rollback

The original frontend baseline is `dpl_FfejdutDRmia3y2P1HBXTE5zZs85` (`https://planning-poker-r3zrtvr1j-niomartinezs-projects.vercel.app`). If needed:

```bash
vercel rollback dpl_FfejdutDRmia3y2P1HBXTE5zZs85 --scope team_Ae4zKo4cDo6SwNdOshn9Rwhb --timeout 60s --non-interactive
```

Recheck all three aliases and the project's automatic Git promotion settings. Reassign any remaining alias to the intended target and verify it. The old artifact embeds the PartyKit host; changing current environment variables does not retrofit it, and its multiplayer usefulness ends with hosted PartyKit availability.

Retain the validated `dpl_5SUQZzVNKSRmihTXFm35zQL5Drot` as the PartyServer frontend fallback. For a later release rollback, promote that exact production-target artifact and verify the aliases, rather than returning to the retired backend. Retain the compatible Worker version above; frontend rollback does not roll back Worker code, migrations, or reconstruct in-memory rooms. No old-resource deletion or state import is required.
