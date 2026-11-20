# System status and verification evidence

Snapshot based on files committed to `main` during repository standardization; this is a **code review**, not a live site or AWS integration test.

| Surface | Classification | Grounding | Honest interpretation |
| --- | --- | --- | --- |
| Storefront routes/UI | **LIVE CODE** | `src/app/`, `src/components/` | Implemented Next.js pages; availability/UX in production not verified here |
| Hosted deployment | **REAL DEPLOYMENT CONFIG** | `amplify.yml`, `infra/` | Push/merge to `main` may cause AWS Amplify deployment |
| Authentication/admin gating | **EXTERNAL INTEGRATION** | `src/lib/auth-service.ts`, `src/lib/session.ts`, middleware | Depends on configured/healthy external auth service and permissions |
| Catalog, itinerary prices & dates | **SAMPLE BUSINESS DATA** | `src/lib/seed.ts`, `catalog.ts` | UI examples; not a verified inventory, product offer or sales contract |
| Booking API | **MOCK PERSISTENCE** | `src/app/api/booking-requests/route.ts`, `src/lib/booking-store.ts` | Accepts HTTP requests but stores records in per-process RAM only |
| Booking admin history, dashboards & CSV | **MIXED SEED + EPHEMERAL** | `src/lib/booking-seed.ts`, `admin-stats.ts`, admin routes | Sample generated bookings contaminate business totals; data not durable |
| Booking email notification | **MOCK MAILER** | `src/lib/mailer.ts` | Logs an imitation send; does not deliver a message |
| Gallery entries | **DEMO** | `src/lib/gallery.ts` | Static placeholder photos with `sample: true` |
| Photo upload API | **MOCK** | `src/app/api/photos/route.ts` | No image file upload/storage; returns 503 on normal production settings |
| Map assets | **GENERATED ARTIFACTS** | `scripts/build-maps.mjs`, `public/maps/`, `src/lib/maps/` | Derived from source coordinates and geographic datasets |
| GitHub CI | **BUILD VERIFICATION** | `.github/workflows/ci.yml` | `npm ci`, `tsc --noEmit`, `next build`; not an end-to-end acceptance test |

## Vocabulary

- **LIVE CODE:** executable feature code, not automatically proof of business readiness.
- **REAL INTEGRATION:** calls a real external service; needs evidence from the destination service.
- **TEST:** repeatable automated assertions on behavior; only mark passed when executed.
- **VERIFY:** manual or static validation with links/exit codes; clearly specify which boundary is checked.
- **MOCK/DEMO:** simulated backing service, generated seed, fake data or intentionally non-persistent behavior.
- **PRODUCTION READY:** requires all relevant gates in [release readiness](RELEASE_READINESS.md), not merely a successful build.

## Specific operational risk

A successful `201` booking response only proves that the current process handled it: the record may disappear on restart/cold start or when another server instance handles the admin request. The mock emailer logs a fake message ID and does not notify staff. **Do not promise booking fulfillment to real customers based on this route.**

Because the admin dashboard includes a large generated dataset, its totals, funnels, overdue/SLA metrics and sales estimates **cannot** be treated as measured production performance.

No AWS deployment, user registration, real booking persistence, email delivery or payment transaction was tested during this standardization.
