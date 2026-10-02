# CLAUDE.md

Guidance for Claude Code when working in `meridian-travel-atlas`.

## What this is

**Meridian Travel** — a travel-commerce storefront for the Vietnamese market. List-first browsing
with maps as support: four levels, each its own page and URL —
country → city → **place** (real coordinates) → experience (the product, always at one place).
Plus category pages, a community photo gallery, a day-by-day itinerary and a cart that sends one
booking request for the whole trip.

Stack: Next.js 15 (App Router) + React 19 + TypeScript, plain CSS (no Tailwind), one font
(Be Vietnam Pro). No database — the catalogue is a TypeScript module. No map library in the
browser: maps are SVG prerendered from Natural Earth data.

```bash
npm run dev        # http://localhost:3000
npm run build      # prerenders ~157 static routes
npm run typecheck  # tsc --noEmit
npm run maps       # rebuild map shapes after changing coordinates in seed.ts
```

## URLs

| Level | URL | Page |
|---|---|---|
| Country | `/viet-nam` | [CountryView](src/components/CountryView.tsx) |
| City | `/viet-nam/phu-quoc` | [CityExplorer](src/components/CityExplorer.tsx) — list + map |
| Place | `/viet-nam/phu-quoc/bai-ong-lang` | [PlaceView](src/components/PlaceView.tsx) |
| Experience | `/trai-nghiem/bungalow-bai-ong-lang` | `app/trai-nghiem/[slug]` + [BookingAside](src/components/BookingAside.tsx) |
| Category | `/danh-muc/luu-tru` (`/danh-muc` redirects there) | [CategoryResults](src/components/CategoryResults.tsx) |
| Gallery | `/thu-vien-anh` (`#dang-anh` opens the upload dialog) | [GalleryGrid](src/components/GalleryGrid.tsx) |
| Itinerary | `/hanh-trinh` | [TripPlanner](src/components/TripPlanner.tsx) |
| Cart | `/gio-hang` | [CartFlow](src/components/CartFlow.tsx) |
| Search | `/tim-kiem?q=` | [SearchResults](src/components/SearchResults.tsx) |

- **Experience URLs are flat** (`/trai-nghiem/<slug>`), so experience slugs must be unique across
  the whole catalogue. `buildCatalog()` in [seed.ts](src/lib/seed.ts) throws at build time on a
  duplicate, on an experience pointing at a missing place, or on a place slug equal to an
  experience slug in the same city.
- **The old experience URLs still work.** `/<country>/<city>/<experience>` used to be the
  experience page; that position is now the place page, which `permanentRedirect`s (308) to
  `/trai-nghiem/<slug>` when the slug is an experience — that is why the place route keeps
  `dynamicParams` on while every other catalogue route sets it to `false`.
- Every catalogue page is static (SSG) with `generateMetadata`; experience pages carry `Product`
  JSON-LD.

## Data

- [catalog.ts](src/lib/catalog.ts): types, `hrefOf`, category tables (`CAT_ORDER`, `CAT_SLUG`…).
- [seed.ts](src/lib/seed.ts): the records. Place coordinates were looked up on OpenStreetMap
  (Nominatim), `[lng, lat]` like GeoJSON. Experiences whose description names no location were
  assigned a place by hand (Trà đạo → Gion, Bữa haenyeo → Hado, Nhà đá đen → Aewol, Xưởng đồng
  hồ → Phố cổ Lucerne, Daintree → Hẻm Mossman) — confirm with the product owner.
- Keys are positional and stable: `c0t2` city, `c0t2p0` place, `c0t2e0` experience. Bookings
  and the admin store reference experience keys, so **append** to `RAW`, never reorder.
- **Server reads go through [catalog-service.ts](src/lib/catalog-service.ts)** (pages, API
  routes). **The client gets the catalogue from the JS bundle**: [CatalogProvider](src/components/CatalogProvider.tsx)
  imports `buildCatalog()` directly. Passing it from the layout as a prop put ~45 KB into the
  RSC payload of *every* route, including every route Next prefetches for links on screen
  (~750 KB of background traffic on a city page). When the seed is replaced by a real API,
  change both catalog-service.ts and CatalogProvider (fetch once, cache).

## Maps

[scripts/build-maps.mjs](scripts/build-maps.mjs) projects each region (city, country, world) into
a 1000×1000 Mercator square and writes the land as SVG paths, plus the projection parameters
(`k`, `tx`, `ty`), to `src/lib/maps/regions.json` (imported server-side by
[lib/maps](src/lib/maps/index.ts)) and `public/maps/trip.json` (fetched by the itinerary map).
Pins are projected with the same formula in [lib/map.ts](src/lib/map.ts), so they always sit on
the coastline they belong to. Sources: Natural Earth via world-atlas@2.0.2 — 1:10m land for cities
(downloaded into `scripts/.cache/`, gitignored), 1:50m countries / 1:110m world in `scripts/data/`.

- **Re-run `npm run maps` after changing coordinates.** A city's frame is fitted to its places.
- The square is laid out with container query units (`.map` / `.map-in` in globals.css) and the
  land is drawn past the frame, so a frame of any aspect ratio shows continuous coastline and
  `%`-positioned pins stay aligned. Anything positioned "on the map" (pins, labels, the city
  quick-view card) must live inside `.map-in`, not the outer frame.
- Pins are centred with `transform`; animations use the separate `translate`/`scale`
  properties. Animating `translate` on something centred with `translate` moves it off its
  coordinate when the animation ends.
- Pins closer than ~36 units merge into a cluster (`cluster()` in lib/map.ts).
- Two traps in the generator, both fixed and commented: Antarctica's ring wraps the pole, so
  clipping returns a full-frame rectangle (the sea disappears); and `projection.invert` wraps
  ±180°, so longitude bounds are computed directly.

## Trip and cart

One client state object ([lib/trip.ts](src/lib/trip.ts), pure functions; persisted to
localStorage `meridian.trip` by [TripProvider](src/components/TripProvider.tsx)): ordered stops
(city + days + saved items) and the cart (experience keys), plus departure and guests shared by
the experience page, cart and booking form. Adding to the cart also adds to the itinerary;
removing from the cart does not. "Lưu" (heart) everywhere means "add to itinerary". The old
`meridian.hanh-trinh` key (the cart before the redesign) is merged into the cart on load.
Read state only after mount (`ready`), otherwise hydration mismatches.

## Booking requests (mocked)

`/gio-hang` runs three steps on one URL (cart → contact form → sent) in
[CartFlow](src/components/CartFlow.tsx). The form lives in the main column but its submit button
sits in the summary (and the mobile bottom bar), wired with `form="booking-form"`. The "next"
button and the submit button carry different `key`s on purpose: React 19 flushes state inside the
click, so a reused `<button>` would already be `type=submit` when the browser runs the click's
default action, and the empty form would be submitted. Prices are **per guest**; the server
estimate is the sum × guests.

`POST /api/booking-requests` validates with the same `validateBooking()` the form uses
([src/lib/booking.ts](src/lib/booking.ts), which is also the request/response contract), looks up
the prices again on the server, **saves** the request through
[src/lib/booking-store.ts](src/lib/booking-store.ts), then emails the admin through
[src/lib/mailer.ts](src/lib/mailer.ts). Once saved it returns 201 even if the mail fails; the
record carries `notified: false` and the admin shows it. The mailer is a **mock**: it only logs
(full text in dev, subject only in production, because the body contains customer PII). To go
live, either replace `getMailer()` or point `NEXT_PUBLIC_BOOKING_ENDPOINT` at the real backend.
Set the recipients with `BOOKING_ADMIN_EMAIL` (comma-separated).

## Photos (mocked, closed in production)

Gallery entries in [lib/gallery.ts](src/lib/gallery.ts) are **samples** (placeholder tiles, example
author names) and are labelled "Ảnh mẫu" on the page. The upload dialog
([UploadDialog](src/components/UploadDialog.tsx)) is complete UI, but `POST /api/photos` only
receives metadata — no file content, nothing stored. So in production the submit button is
disabled with a notice and the API answers 503, unless `NEXT_PUBLIC_PHOTO_UPLOADS=mock`. Going live
needs object storage + a moderation queue.

## Admin (`/admin`)

Dashboard, request list and detail (status changes, internal notes, CSV export), a Gantt of
departures, and per-experience performance. Layout and CSS live in `app/admin/` and nowhere else.

- **Same design system, own frame, no tracking tags.** [SiteFrame](src/components/SiteFrame.tsx)
  skips the site header/footer under `/admin`, and `PublicOnly` wraps the Mieruca tags in
  `app/layout.tsx`, because admin pages show customer names, emails and phones. The tag *content*
  stays in `layout.tsx`. The admin uses the storefront's tokens, font and components (`.btn-p/-s`,
  `.pill`, `.kicker`, `.formerr`, `.logo`). `admin.css` only adds admin layout (sidebar, KPI tiles,
  tables, charts, Gantt) plus the `--viz-*` / `--st-*` chart colours. One light palette, no theme
  switcher.
- **Only `ROLE_ADMIN` accounts get in.** The middleware asks auth-service (`/api/users/me`) on
  every `/admin` and `/api/admin` request, because the FE cannot verify the JWT signature and the
  role in the token may be stale. No session: pages 303 to `/dang-nhap?next=…`, APIs get 401.
  Logged in but not admin: 403. auth-service down: 503. There is no dev bypass, so run
  auth-service locally or point `AUTH_SERVICE_URL` at the deployed one. See "Accounts" below.
  Mutations are server actions: they POST back to the `/admin/...` URL itself, so the session
  cookie always rides along.
- **Server env vars on Amplify** only reach the SSR runtime because `amplify.yml` writes them to
  `.env.production` before the build. Add any new server variable to that loop. Values must stay
  within `A-Z a-z 0-9 . _ ~ + / = @ , : -`, because dotenv truncates at `#` and expands `$`.
  See [infra/README.md](infra/README.md). `NEXT_PUBLIC_*` variables are inlined at build time.
- **HTML must not outlive a deploy on the CDN.** Amplify's CloudFront keys its cache on the
  `Accept` header too, so each browser gets its own copy, and a copy cached during a deploy
  switch-over survived the invalidation: Chrome kept showing the old UI until a click forced a
  hard navigation. Hence `revalidate = 300` in `app/layout.tsx` plus `expireTime: 3600` in
  `next.config.ts` (`s-maxage=300, stale-while-revalidate=3300` instead of one year). Don't
  remove them to "make pages fully static".
- **The store is a mock, in memory.** It holds ~190 days of seeded requests
  ([booking-seed.ts](src/lib/booking-seed.ts), deterministic PRNG, anchored to server start) plus
  real submissions. It is cached on `globalThis` so it survives HMR, but it is lost on restart,
  and each serverless instance keeps its own copy. `booking-store.ts` is the single seam to
  replace with a DB or API, just like `catalog-service.ts`.
- **Stats are pure functions** in [admin-stats.ts](src/lib/admin-stats.ts). Pages pass `now` in,
  and days are VN calendar days (UTC+7, via `vnDayKey()` in `format.ts`). `DEPARTURES[].iso` gives
  the Gantt real dates.
- **Charts are hand-rolled** in [components/admin/](src/components/admin/charts.tsx), with no
  chart library. Colours are the `--viz-*` / `--st-*` tokens in `admin.css`: `--viz-1` is the
  site teal (6.2:1 on the white card), the ordinal funnel steps are a teal ramp, and status colours
  always come with an icon and a label. Gantt labels sit outside the bar. Every chart has a table
  view.
- In the booking detail, status buttons also write the choice into a hidden `intent` input on
  click. React sets the pending state before building `FormData`, and a disabled submitter's
  `name/value` is dropped.

## Accounts (auth-service)

Customers sign up and log in at `/dang-ky`, `/dang-nhap` and `/tai-khoan`. Credentials go to
**auth-service** (repo `meridian-backend/auth-service`, Spring Boot), whose URL is `AUTH_SERVICE_URL`
(defaults to `http://localhost:8080` in dev and is required in production).

- **Backend-for-frontend.** Only the Next server talks to auth-service
  ([src/lib/auth-service.ts](src/lib/auth-service.ts), `fetch` only so it runs on Edge and Node).
  Tokens live in HttpOnly cookies `mt_at` / `mt_rt`. The browser never sees them, no CORS is
  needed, and the HTTPS site is not blocked as mixed content while auth-service is still HTTP.
- **Contract and validation** are in [src/lib/auth.ts](src/lib/auth.ts), which the form, the server
  actions and the middleware all share. Passwords are capped at **72 UTF-8 bytes**: auth-service's
  BCrypt throws past that and answers 500 instead of 400.
- **The middleware renews the session only on dynamic routes** (`/api/session`, the account pages
  and `/admin`). Storefront pages are prerendered and may be cached by the CDN, so a `Set-Cookie`
  there could hand one customer's session to another. It writes the new token into the request
  too, so Server Components behind it read it straight away.
- **The layout never reads cookies.** Doing so would make every prerendered route dynamic.
  [SessionProvider](src/components/SessionProvider.tsx) fetches `/api/session` after mount, and
  again whenever the user enters or leaves an account page (the login/logout server actions end in
  a redirect, so there is no client callback). `user === undefined` means it is still loading.
- **Displaying identity vs. authorising.** `getSession()` / `/api/session` only decode the access
  token, with no signature check, so use them for display only. Any authorisation decision calls
  `me()`.
- Logout only clears the cookies. auth-service cannot revoke tokens yet.

## Conventions

- **Vietnamese UI, English keys.** Copy, labels and slugs are Vietnamese (`slugify()` strips
  diacritics: `Mã Pí Lèng` → `ma-pi-leng`). Data keys, category codes (`STAY`, `TRAIL`, `TABLE`,
  `STUDIO`, `PASSAGE`) and identifiers stay ASCII.
- **Money and numbers are formatted by hand** in [src/lib/format.ts](src/lib/format.ts), not by
  `Intl` — server and client must produce byte-identical strings or hydration breaks. VND uses `.`
  for thousands, `,` for decimals.
- **Design tokens** are the `:root` variables at the top of [globals.css](src/app/globals.css)
  (ink/teal/sunset/sea…, from the design's "Nền tảng" board), shared by the storefront and the
  admin. admin.css stays in the document after a client-side navigation away from `/admin`, so its
  class names must not collide with storefront ones.
- **Motion**: CSS only. Scroll-linked effects use `animation-timeline` (no scroll listeners),
  only opacity/transform are animated, and `prefers-reduced-motion` turns everything off.
  Re-running an entrance animation after a filter change = change the list's `key`.
- **Images are placeholders**: [Photo](src/components/Photo.tsx) renders a tinted tile with the
  place name as caption and `aria-label`. Swap its body for `<Image>` when there is a CDN.
- Mobile (≤820px): bottom tab bar, compact header, breadcrumb collapses to "‹ parent", the city map
  sticks under the header and the list slides over it (pure CSS), the cart summary becomes a
  sticky bottom bar.

## Mieruca tags

`app/layout.tsx` loads the Mieruca heatmap and Optimize tags on every storefront page. On slow
CPUs the heatmap script is the largest single main-thread task after hydration, and it grows with
DOM size — measure with and without it before blaming first-party code.

## Not built yet

Real imagery and photo storage, payment, multiple saved itineraries / sharing an itinerary,
a persistent store for admin, an admin UI for roles (promote users in auth-service's DB),
catalogue editing (prices and copy still live in `seed.ts`), i18n, and street-level maps —
the prerendered 1:10m coastline is the limit; deeper zoom needs raster/vector tiles.

`infra/url-match/` still holds the Terraform for the removed `/url-match` repro hosts; destroy
that stack before deleting the folder.
