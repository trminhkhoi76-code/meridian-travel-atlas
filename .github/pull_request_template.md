## Problem

<!-- What problem does this PR solve? Link the issue. -->

Closes #

## Behavior classification

- [ ] LIVE runtime / actual integration
- [ ] MOCK / DEMO / example data
- [ ] TEST / static verification only
- [ ] DOCS / no behavior change

**What is backed by real persistence/service evidence, and what remains simulated?**

## What changed

<!-- Keep this concise and scoped. -->

-

## Affected areas

<!-- Routes, components, services, APIs, or styles touched. -->

-

## Validation

Run and confirm only what actually passed. This repository currently has no dedicated automated test script; **typecheck/build are not runtime tests**:

- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run maps` (only when map coordinates/source data changed)

## UI evidence

<!-- Required for visible UI changes. Attach screenshots or describe before/after clearly. -->

Before:

After:

## Risk / regression notes

<!-- What could break? What did you specifically verify? -->

-

## Production readiness

- [ ] Any booking, upload, catalog, pricing, or analytics claim explicitly distinguishes MOCK from LIVE
- [ ] No seed data is represented as customer activity or real revenue
- [ ] If introducing real persistence/email/checkout, provide integration and delivery evidence

## Deployment impact

- [ ] I understand merging this PR into `main` triggers an AWS Amplify deployment.
- [ ] This change is safe to deploy after CI passes.
- [ ] No required environment variable / Amplify configuration change is missing.
- [ ] For visible UI changes, post-merge browser QA is expected on the deployed site.

## Known limitations / follow-up

<!-- Leave empty if none. -->

-
