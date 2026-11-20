# Production readiness checklist

**Overall status: storefront code is deployable, but booking/fulfillment workflows are NOT ready to process real customer orders reliably.**

This checklist is a blocker-based plan; unchecked items are **not verified**, not implied to be working.

## P0 — before accepting actual customer booking requests

- [ ] Replace in-memory `booking-store.ts` with durable shared storage and migrations.
- [ ] Eliminate generated `booking-seed.ts` data from real operational reports and transactions; isolate demo data under an explicit demo mode or sandbox dataset.
- [ ] Provide authenticated admin access to real bookings across instances and restarts; define audit history and retention.
- [ ] Replace mock `mailer.ts` with an actual delivery service, receipt logging, retries and deliverability monitoring; do not return “notified” for a fake send.
- [ ] Validate booking request path end-to-end in the deployed environment, including redeploy/restart persistence.
- [ ] Resolve secure HTTPS connectivity to auth-service and verify secrets/session handling (see `infra/README.md`).
- [ ] Review privacy and data retention for name, phone, email and order history.

## P1 — before describing the catalog as a commercial offer

- [ ] Product owner verifies actual availability, prices, dates, visa and travel content.
- [ ] Inventory/source-of-truth integration and safe price change handling are established.
- [ ] Photo upload either stays visibly unavailable or gets real storage, moderation and privacy controls.
- [ ] Monitoring and alerting for API errors, booking submission failures, notification failures and deployment rollback.
- [ ] Manual browser QA on mobile/desktop, auth roles, admin, accessibility and error/empty/loading states.

## Verification evidence to attach

For each accepted release: link exact commit, CI run, Amplify deployment result, route status, environment URL, test data vs real data labels and named reviewer. A passing build is not proof of these checks.

**Current merge impact:** existing AWS Amplify auto-deploy may run after merge to `main`. This documentation-oriented change does not itself implement the P0 fixes.
