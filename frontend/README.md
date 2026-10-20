# Frontend (Next.js)

See the main [README](../README.md) for setup, pages and deployment.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                  # http://localhost:3000
```

## Design system

- **Tokens:** `app/globals.css` defines semantic colours (`bg-surface`, `text-muted`, `border-line`, `bg-primary`, …)
  for light and dark mode. Use these instead of raw Tailwind colours so both themes keep working.
- **Theme:** follows the operating system; the header button switches System → Light → Dark (stored per browser).
  Printing always uses the light palette.
- **Site details** (name, author, email, LinkedIn): `lib/site.ts`. The LinkedIn links stay hidden until `linkedin` is set.

## Fonts and licences (commercial use)

| Font | Used for | Licence | Files |
|---|---|---|---|
| [Inter](https://github.com/rsms/inter) (variable) | UI and body text | SIL Open Font License 1.1 | `app/fonts/InterVariable-latin.woff2`, licence `app/fonts/Inter-OFL.txt` |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (variable) | Numbers and results | SIL Open Font License 1.1 | `app/fonts/JetBrainsMonoVariable-latin.woff2`, licence `app/fonts/JetBrainsMono-OFL.txt` |

Both are self-hosted with `next/font/local` (no request to Google at build time or in the browser). The OFL allows
commercial use, embedding and self-hosting; keep the licence files next to the font files.

## Images

`public/images/` holds the hero and banner photos as WebP with JPEG fallback in 640/1280/1920/2560 px widths,
served through `components/ResponsivePicture.tsx` (`<picture>` + `srcset`, lazy-loaded below the fold).
To replace a photo: `python ../tools/optimize_images.py path/to/photo.jpg paving-sunset`.
Make sure you hold a commercial licence for any photo you publish.

## Pavement cross-section

`components/design/Charts.tsx` (`CrossSection`, `CrossSectionPanel`) draws the designed structure with material textures
from `components/design/pavementTextures.tsx`: layers to scale (thin layers get a minimum height), name, thickness,
material and key property per layer, a depth scale and a legend. Only layers present in the result are drawn.
PNG (3×) and SVG export always produce the light, white-background version for reports.
