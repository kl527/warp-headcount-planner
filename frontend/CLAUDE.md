# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from `frontend/`:

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) then produce a production build
- `npm run lint` — run ESLint across the project
- `npm run preview` — serve the built bundle locally

There is no test runner configured yet.

## Stack notes

- **React 19 + Vite 8 + TypeScript 6.** The React Compiler is enabled via `babel-plugin-react-compiler` wired through `@rolldown/plugin-babel` in `vite.config.ts`. Do not hand-optimize with `useMemo`/`useCallback` unless profiling shows the compiler isn't handling a case — it will add redundant memoization.
- **No path alias is configured.** Use relative imports (`../constants/design`) until a `@/` alias is added to both `vite.config.ts` and `tsconfig.app.json`.
- The backend lives at `../backend/` (Cloudflare Worker). This directory is frontend-only.

## Design constants (`src/constants/design.ts`)

This file is the **single source of truth** for warp.co design tokens (typography, color scales, radii, shadows, layout, component specs). It was extracted from the live warp.co production build and must stay faithful to those values.

### Usage rules

1. **Read before styling.** When implementing any UI, import tokens from `src/constants/design.ts` instead of hardcoding pixel values, hex codes, or font weights. If a value you need isn't there, it probably belongs to a different token — check the file before inventing.
2. **Do not duplicate values.** If you find yourself typing `#FF3D00`, `oklch(0.243 0 none)`, `57px`, or a font weight literal in a component, stop and import from `design.ts` instead.
3. **Do not edit token values casually.** The numbers in this file correspond to measured output from warp.co. Changing them is a design-system-wide decision, not a component tweak. If a component needs a different value, it's a component-level override, not a token change.
4. **One-off values stay one-off.** The email input uses a hardcoded 13px radius (`RADIUS_EMAIL_INPUT`) because warp.co itself uses a non-token value there. Don't promote it into the `RADIUS` scale.
5. **All exports use `as const`.** Treat token objects as readonly literals — their types narrow to their values, which downstream components rely on for autocomplete and type safety.

### What's in there

- **Breakpoints:** `BREAKPOINTS`, `BREAKPOINT_RANGES` — note the custom `tablet` (768) and `laptop` (1024) names, not Tailwind's default `md`/`lg`.
- **Typography:** `FONT_FAMILIES`, `FONT_WEIGHTS`, `FONT_SIZES`, `TRACKING`, `LEADING`, `HEADING_SPECS`. `HEADING_SPECS` captures the exact hero/section heading recipes including the distinctive H2 two-tone pattern (dark lede + muted trailing descriptor).
- **Color:** `SEMANTIC_COLORS`, `BRAND_CTA` (the real `#FF3D00` CTA, not the legacy `--brand` cyan), plus 12-step `ACCENT_SCALE`, `RED_SCALE`, `AMBER_SCALE`, `GRAY_SCALE`.
- **Radius / shadows:** `RADIUS`, `RADIUS_EMAIL_INPUT`, `SHADOWS` (layered rings, not simple drop shadows), `FOOTER_SHADOW`.
- **Layout:** `SPACING_BASE` (4px), `CONTAINERS`, `PAGE_WIDTH` (1280 max / 1180 inner), `SECTION_RHYTHM`.
- **Component specs:** `HEADER`, `BUTTONS`, `EMAIL_INPUT`, `PRODUCT_CARD`, `CHIP`, `FOOTER` — measured directly from the live site.
- **Utility lists:** `TABLET_UTILITIES`, `LAPTOP_UTILITIES` — reference of the Tailwind classes actually used on warp.co at each breakpoint.
- **`QUICK_SUMMARY`:** condensed lookup of the most common values.

### Design intent to preserve

- **CTAs are `#FF3D00`**, not the accent scale. The 12-step accent ramp exists for fills/text on accented surfaces (chips, badges), not for the main CTA color.
- **Borders are drawn via shadow rings**, not `border: 1px solid`. Use `SHADOWS.border` / `SHADOWS.borderInset` for 1px outlines.
- **H2 hierarchy comes from color, not weight.** Same size/weight; the foreground lede is `oklch(0.243 0 none)` and the trailing descriptor drops to `oklch(0.608 0 none)`.
- **Section rhythm differs by breakpoint:** 96px vertical on desktop, 40–60px compressed on tablet. Don't use a single spacing value across breakpoints.
