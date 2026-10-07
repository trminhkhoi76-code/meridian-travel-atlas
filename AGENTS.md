# AGENTS.md

Repository-wide instructions for coding agents working on Meridian Travel.

## IMPORTANT — Repository-local scope only

These agent instructions are **repository-local**.

- They apply only while an agent is working inside the `meridian-travel-atlas` repository or a session explicitly scoped to this repository.
- They must **not** be copied, promoted, installed, or interpreted as global instructions for the developer's local machine.
- They must **not** affect sibling repositories, parent directories, personal projects, business projects, or any other workspace.
- Do not create or modify global agent configuration files (for example in the user's home directory, editor-global settings, global Claude/Codex/agent instructions, or shared MCP configuration) unless the user explicitly asks for that separate global change.
- When an agent changes repositories, it must stop applying Meridian-specific rules and load the target repository's own instructions instead.
- If repository scope is ambiguous, prefer doing nothing outside this repository rather than propagating these settings.

This isolation is intentional: the same local machine contains unrelated personal and business repositories, and cross-repository instruction leakage is considered a configuration error.

## Start here

Before changing code:

1. Read `README.md` for product scope.
2. Read `CLAUDE.md` for architecture details, non-obvious constraints, and deployment notes.
3. Inspect the affected route, component, service seam, and existing tests before proposing changes.

`CLAUDE.md` is the detailed engineering handbook. This file defines the cross-agent operating rules.

## Git workflow

- Never push directly to `main`.
- Never merge pull requests.
- Create one branch per issue/task:
  - `agent/<issue-id>-<short-description>`
  - Example: `agent/ADMIN-012-cancel-confirmation`
- Keep changes scoped to the issue. Do not refactor unrelated code.
- Use conventional commit-style messages:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `refactor(scope): ...`
  - `test(scope): ...`
  - `chore(scope): ...`

## Deployment boundary

- Every merge into `main` triggers an AWS Amplify deployment.
- Treat merge approval as deployment approval.
- Never merge solely to "see if it works" in production.
- UI changes should be verified locally before PR, then browser-verified on the deployed site after the human maintainer merges.
- Keep PRs small enough that a deployment can be rolled back or diagnosed quickly.

## Required checks before push

Run:

```bash
npm ci
npm run typecheck
npm run build
```

If map coordinates or map source data change, also run:

```bash
npm run maps
npm run typecheck
npm run build
```

Do not claim checks passed unless they were actually run successfully.

## Architecture invariants

- Preserve Next.js App Router conventions already used in the repo.
- Server catalogue reads go through `src/lib/catalog-service.ts`.
- Client catalogue access follows the existing `CatalogProvider` pattern.
- Do not reorder existing catalogue records in `RAW`; booking/admin data references stable positional keys.
- Server must recalculate booking prices. Never trust totals sent by the client.
- Keep auth tokens in HttpOnly cookies. Never expose them to browser JavaScript or localStorage.
- Authorization decisions must use the auth-service-backed identity check, not decoded client-visible token data.
- Do not add analytics/tracking scripts to `/admin`.
- Do not remove the ISR/CDN cache workaround (`revalidate` / `expireTime`) without explicit approval and evidence that the Amplify/CloudFront issue is resolved.
- Keep admin-specific layout styles in the admin surface; avoid class names that can collide with storefront styles after client navigation.
- Avoid introducing a new dependency when an existing component, utility, CSS pattern, or platform API is sufficient.

## UI/UX implementation rules

- Reuse existing design tokens and shared components before adding new visual patterns.
- Preserve the current Vietnamese-first UI language.
- Every interactive feature must account for:
  - default state
  - loading/pending state
  - error state
  - disabled state where relevant
  - empty state where relevant
- Destructive actions require an explicit confirmation or a safe undo pattern.
- Do not communicate status with color alone; pair color with text and/or iconography.
- Preserve keyboard accessibility and visible focus.
- Respect `prefers-reduced-motion`.
- Avoid hardcoded one-off spacing/color values when an existing token is appropriate.
- For UI PRs, include screenshots or a short before/after description in the PR.

## Admin-specific rules

- Treat customer names, emails, and phone numbers as sensitive operational data.
- Do not add tracking or third-party analytics to admin routes.
- Status-changing actions must make their consequence clear.
- Destructive state changes must be reversible or confirmed.
- Preserve auditability: when adding notes/status history, prefer author + timestamp metadata.
- Optimize tables and filters for operator efficiency before decorative polish.

## Data and persistence

Current catalogue and booking persistence include mock/static seams. Do not hide this by adding unrelated local persistence.

When replacing mocks:
- catalogue integration belongs behind `catalog-service.ts` and the client catalogue boundary;
- booking persistence belongs behind `booking-store.ts`;
- preserve existing API contracts unless the issue explicitly changes them.

## Local PR review loop

For a local coding agent working on its own PR in this repository:

- GitHub CLI (`gh`) must already be authenticated for this repository.
- To inspect all currently available PR feedback once, run:

```bash
npm run agent:review-inbox
```

- To keep watching the PR for newly arriving review comments, run:

```bash
npm run agent:watch-pr
```

The watcher is repository-local:
- it refuses to run unless the current GitHub repository is exactly `trminhkhoi76-code/meridian-travel-atlas`;
- it stores seen-comment state only under this repository's `.git/` directory;
- it does not install a global daemon, hook, editor setting, or cross-repository configuration.

When new feedback appears:
1. Read the full review/comment and linked issue context.
2. Verify the feedback is technically correct before changing code.
3. Fix only justified findings and keep the change scoped.
4. Run the required checks from this file.
5. Commit and push to the same PR branch.
6. Do not merge the PR.
7. If a review comment is incorrect or conflicts with repository invariants, explain why in the PR instead of blindly applying it.

## Pull request expectations

Each PR should include:

- linked issue/task;
- concise problem statement;
- summary of implementation;
- files/areas affected;
- validation commands actually run;
- screenshots for visible UI changes;
- known limitations or follow-up work.

Do not merge the PR. Leave final approval/merge to the human maintainer.
