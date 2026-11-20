# Contributing to Meridian Travel

This project has **live hosting** but several **mock/demo business workflows**. Read [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) for repository-only technical standards; do not apply their rules to other repos or user-global tooling.

For every PR:

1. Label changed behavior as **LIVE**, **MOCK**, **TEST**, **VERIFY**, or **DOCS** in the PR template.
2. State if the change affects user-visible booking, authentication, storage, admin metrics or email delivery.
3. Run `npm ci`, `npm run typecheck`, `npm run build` and attach actual result evidence. Run `npm run maps` only when geography sources change.
4. Never call CI typecheck/build proof of persistence, integration delivery or end-to-end verification.
5. Separate seed/test data from real customer operational metrics. Do not claim mock responses or logs represent fulfilled bookings.
6. Leave final PR merge and deployment approval to the maintainer: merging to `main` triggers AWS Amplify deployment.
7. State unresolved production blockers using [release readiness](docs/RELEASE_READINESS.md).

Do not commit API keys, tokens, customer PII, Terraform state or unrelated global agent settings.
