# CLAUDE.md

Guidance for Claude Code when working in `meridian-travel-atlas`.

## What this is

**Meridian Travel** — a travel-commerce storefront for the Vietnamese market whose home page is a globe.
The user descends four levels (globe → country → city → experience); each level rotates and zooms the
globe and swaps the selling panel on the right.

Stack: Next.js 15 (App Router) + React 19 + TypeScript, plain CSS (no Tailwind), `d3-geo` +
`topojson-client` drawing on a 2D canvas. No database — the catalogue is a TypeScript module.

```bash
npm run dev        # http://localhost:3000
npm run build      # prerenders all 83 routes
npm run typecheck  # tsc --noEmit
```

## The one idea to preserve

**The URL is the zoom state.** `/nhat-ban/kyoto/ryokan-arashiyama` is level 3; `resolveRoute()` in
[src/lib/route.ts](src/lib/route.ts) turns a pathname back into `{ level, country, city, experience }`,
and the camera is derived from that. Consequences worth keeping:

- every level deep-links, shares, and prerenders (SEO — the point of choosing Next over plain Vite);
- back/forward buttons animate the globe for free;
- the globe lives in `app/layout.tsx` via [AtlasShell](src/components/AtlasShell.tsx) so it never
  unmounts on navigation. **Do not move the canvas into a page.**

## Layout contract

`AtlasShell` renders the canvas, pins, top rail, hero, index rail, and an empty `<aside class="panel">`.
Each page fills that panel and must render exactly this shape:

```tsx
<div className="pbody">…</div>   // scrolls
<div className="pfoot">…</div>   // optional sticky footer (price + CTA)
```

Because both blocks are siblings inside `.panel`, anything sharing state across them (the departure
date and the add button) has to live in one client component — see
[ExperiencePanel](src/components/ExperiencePanel.tsx).

## Conventions

- **Vietnamese UI, English keys.** Copy, labels and slugs are Vietnamese (`slugify()` strips
  diacritics: `Mã Pí Lèng` → `ma-pi-leng`). Data keys, category codes (`STAY`, `TRAIL`, `TABLE`,
  `STUDIO`, `PASSAGE`) and identifiers stay ASCII.
- **Money and numbers are formatted by hand** in [src/lib/format.ts](src/lib/format.ts), not by
  `Intl` — server and client must produce byte-identical strings or hydration breaks. VND uses `.`
  for thousands, `,` for decimals.
- **A country's `id` is its ISO 3166-1 numeric code** and must match `world-atlas` (`036` for
  Australia, with the leading zero). Getting this wrong silently stops the country from highlighting.
- **Canvas colours come from CSS custom properties**, read once into `palette` and refreshed on theme
  change — never hard-code a colour in the draw loop. Both themes are defined in
  [globals.css](src/app/globals.css) under bare `:root`, `prefers-color-scheme`, and `[data-theme]`.
- **The render loop is mount-only.** Navigation callbacks are reached through the `actions` ref, so
  changing route never tears down listeners (doing so cancels the fly-to animation mid-flight).

## Map data

`public/geo/countries-110m.json` (105 KB) draws the world level; `countries-50m.json` (740 KB) is
fetched lazily the first time the user goes below world level and used from then on. Both come from
`world-atlas@2.0.2`.

## Not built yet

Real imagery (the swatches in [src/lib/swatch.ts](src/lib/swatch.ts) are placeholders), payment,
auth, i18n, and any street-level zoom — going deeper than ~1:6M needs raster tiles and a
mercator projection, which is a different renderer.
