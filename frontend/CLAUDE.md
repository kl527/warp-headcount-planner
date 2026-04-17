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
- **Path alias:** `@/` resolves to `src/`, wired in both `vite.config.ts` and `tsconfig.app.json` (via `paths`). Use `@/components/ui/button` for shadcn imports; relative imports (`../constants/design`) are still fine for local domain code.
- The backend lives at `../backend/` (Cloudflare Worker). This directory is frontend-only.

## Design constants (`src/constants/design.ts`)

This file is the **single source of truth** for warp.co design tokens (typography, color scales, radii, shadows, layout, component specs). It was extracted from the live warp.co production build and must stay faithful to those values.

### Usage rules

1. **Read before styling.** When implementing any UI, import tokens from `src/constants/design.ts` instead of hardcoding pixel values, hex codes, or font weights. If a value you need isn't there, it probably belongs to a different token — check the file before inventing.
2. **Do not duplicate values.** If you find yourself typing `#FF3D00`, `oklch(0.243 0 none)`, `57px`, or a font weight literal in a component, stop and import from `design.ts` instead.
3. **Do not edit token values casually.** The numbers in this file correspond to measured output from warp.co. Changing them is a design-system-wide decision, not a component tweak. If a component needs a different value, it's a component-level override, not a token change.
4. **One-off values stay one-off.** The email input uses a hardcoded 13px radius (`RADIUS_EMAIL_INPUT`) because warp.co itself uses a non-token value there. Don't promote it into the `RADIUS` scale.
5. **All exports use `as const`.** Treat token objects as readonly literals — their types narrow to their values, which downstream components rely on for autocomplete and type safety.

### Fonts: free look-alikes, not the real warp.co faces

The real site ships commercial faces (Restart Soft, Berkeley Mono, Macan, New York) that we don't have licenses for. `FONT_FAMILIES` in `design.ts` points to free `@fontsource` stand-ins instead:

| warp.co face  | Our stand-in            | Package                              |
| ------------- | ----------------------- | ------------------------------------ |
| restartSoft   | Inter Variable          | `@fontsource-variable/inter`         |
| brandFont     | Geist Variable          | `@fontsource-variable/geist`         |
| berkeleyMono  | JetBrains Mono Variable | `@fontsource-variable/jetbrains-mono`|
| newYork       | Instrument Serif        | `@fontsource/instrument-serif`       |

The side-effect imports that load these live in `src/main.tsx`. If you add another weight or a new family, add the import there too. All four variable fonts support the full 100–900 weight range (including the custom `450` book weight).

Ambient module shims for `@fontsource*` and `@fontsource-variable*` live in `src/fontsource.d.ts` — required because TS 6 rejects side-effect imports of modules without type declarations.

When building components, always read the font via `FONT_FAMILIES.sans` / `.brand` / `.mono` / `.serif` (or `HEADING_SPECS[*].font`). Never hardcode the family name, and never reintroduce the original face names (`"restartSoft"`, etc.) — they won't render and will silently fall through to the system stack.

### What's in there

- **Breakpoints:** `BREAKPOINTS`, `BREAKPOINT_RANGES` — note the custom `tablet` (768) and `laptop` (1024) names, not Tailwind's default `md`/`lg`.
- **Typography:** `FONT_FAMILIES` (CSS stacks for the four families above), `FONT_WEIGHTS`, `FONT_SIZES`, `TRACKING`, `LEADING`, `HEADING_SPECS`. `HEADING_SPECS` captures the exact hero/section heading recipes including the distinctive H2 two-tone pattern (dark lede + muted trailing descriptor).
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

## shadcn/ui — the default primitive layer

shadcn is the UI kit for this project. **Reach for a shadcn component before writing a bespoke one.** Bespoke is reserved for domain-specific layouts that shadcn doesn't ship (dense stat cards, the month grid, the hire table — see "When to stay bespoke" below).

### Layout

- Components live in `src/components/ui/`, imported as `@/components/ui/button`, etc.
- `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — use it when composing class strings.
- `components.json` at `frontend/` is the shadcn config. Don't hand-edit beyond `registries`.
- Icons: `lucide-react`. Match existing components' sizing — `[&_svg:not([class*='size-'])]:size-4` is already baked into Button/Badge/Tabs.

### Adding components

```bash
npx shadcn@latest add <name>   # e.g. popover, select, sheet, skeleton, accordion, switch
```

The CLI will drop files into `src/components/ui/` and install any radix primitives it depends on. Re-run with `--yes` to skip prompts.

### How shadcn inherits Warp styling (the CSS var bridge in `index.css`)

shadcn components read from semantic slots: `--color-primary`, `--color-foreground`, `--color-muted`, `--color-border`, etc. These resolve through a **two-layer indirection** that `index.css` sets up:

```
shadcn utility (bg-primary)
  → @theme inline { --color-primary: var(--primary); }
    → :root { --primary: var(--color-brand-cta); }  ← our warp token
```

Concretely, the `:root` block in `index.css` maps:

| shadcn slot            | Warp token                          | Effect                                   |
| ---------------------- | ----------------------------------- | ---------------------------------------- |
| `--primary`            | `--color-brand-cta` (`#ff3d00`)     | default Button = warp orange             |
| `--primary-foreground` | `#ffffff`                           | white text on primary                    |
| `--foreground`         | `--color-gray-12`                   | body text = warp charcoal                |
| `--muted` / `--accent` | `--color-gray-2`                    | hover + tabs-list bg                     |
| `--muted-foreground`   | `--color-gray-10`                   | secondary text                           |
| `--border` / `--input` | `oklch(0 0 0 / 0.08)`               | matches `SHADOWS.border` ring color      |
| `--ring`               | `--color-brand-cta`                 | focus rings use CTA orange               |
| `--destructive`        | `--color-warpred-11`                | danger state uses warp red               |
| `--radius`             | `0.5rem` (8px, = `RADIUS.lg`)       | shadcn's internal radius handle          |

**Rules when editing:**

1. **Never re-introduce shadcn's default palette** (the `oklch(0.205 0 0)` neutral scale the init command writes) or the `.dark` block. This app is light-only (`html { color-scheme: light }`), and the brand palette is `--color-*` from `@theme`, not shadcn's defaults.
2. **Don't override radius utilities via `@theme inline`.** The init writes `--radius-sm: calc(var(--radius) * 0.6)` etc., which clobbers our pixel radii from `design.ts`. That block has been removed — don't let a future `init --force` put it back.
3. **Don't redefine `--font-sans` in `@theme inline`.** shadcn wants to default to Geist; we reserve Geist for `--font-brand` and keep Inter as `sans`. `--font-heading` may map to `--font-brand`, but `sans` stays Inter.
4. **New semantic slots bridge in one place.** If you add a shadcn component that references a slot we don't yet map (e.g. `--sidebar`, `--chart-1`), add both the `@theme inline` alias and the `:root` → warp-token mapping. Don't leave shadcn defaults in.

### Using shadcn components

- **Default variant = brand CTA.** `<Button>Save</Button>` is warp orange with white text. Use `variant="outline"` / `"ghost"` / `"secondary"` for non-primary actions.
- **Prefer shadcn over style={{ }} for standard surfaces.** If you're writing a `<button>` or `<input>` with inline styles, you're almost certainly reimplementing something shadcn already ships.
- **One-off styling rides on `className` / `style`.** Don't fork a component in `components/ui/` to add a color variant. Pass classes (`className="h-[22px] rounded-lg"`) or a `style` object for tokens that don't have utilities (`style={{ background: c.bg }}` in `StatusBadge`).
- **`asChild` for polymorphic wrappers.** Use `<Button asChild><a href="…">…</a></Button>` rather than duplicating Button styling on a link.

### When to stay bespoke

shadcn covers primitives (buttons, inputs, menus, dialogs, tabs, tooltips, badges, cards). **Don't force-fit it into domain layouts.** These stay hand-built against `design.ts`:

- `StatPill`, `MonthCard`, `BreakdownPanel`, `HireRow` — each has a specific visual rhythm (numeric emphasis, team swatches, cumulative bars) that shadcn Card/Table would wash out.
- Anything wired directly to `HEADING_SPECS` — headings are a token story, not a component story.

A good test: if the thing you're building is "a Button / Input / Menu / Dialog with tweaks," use shadcn. If it's "a numeric stat with a label, delta, and accent color," it's domain UI — build it against tokens.

### Pitfalls

- `Tabs` default variant uses `bg-muted` (gray-2) with active trigger on `bg-background` (white) + `shadow-sm`. This is the Warp 2.0 sub-nav look. If you need the old orange-active-segment look, pass `className` to `TabsTrigger` — don't edit the primitive.
- `Badge` has an `h-5` + `rounded-4xl` (pill) default. For square-ish status chips (like `StatusBadge`), override with `className="h-[22px] rounded-lg border-0"` and pass colors via `style`.
- **ESLint `react-refresh/only-export-components`** is disabled for `src/components/ui/**` because shadcn files co-export variant functions + components by upstream convention. Don't re-enable it scoped to those files.

## App chrome vs marketing chrome (Warp 2.0)

`design.ts` tokens come from warp.co's **marketing** site. This project is an **app**. Warp's own 2.0 rewrite (https://www.warp.co/blog/warp-2.0) was explicitly about separating these aesthetics. Apply the tokens, but not the marketing typographic scale.

### Rules

1. **Do not use `HEADING_SPECS.h1Hero` or `HEADING_SPECS.heroSubtext` inside app views.** Those are 96–120px landing-page treatments. App views top out at ~28px for the primary heading — use the `h2LedeBold` + `h2Section` two-tone pattern instead.
2. **Chrome is stacked, not a single block.** Warp 2.0 uses grouped top-level nav + a secondary sub-nav bar. In this codebase: `TopBar` carries only brand + context; `SubNav` (sticky directly below, `top: HEADER.height`) carries the year stepper, view toggle, and primary CTA. Do not merge the two or push toolbar controls into the page `<header>`.
3. **App-scale numerics, not hero-scale.** Headline numbers in `StatPill` / `MonthCard` are 26–28px, not 34–40px. Big numerics read as marketing; dashboards need density.
4. **Vertical rhythm on app pages is 24–32px, not 64–96px.** The section-rhythm tokens are for the landing page. In `main`, use `py-[24px] laptop:py-[32px]` and `gap-[24px]` between header / stats / content.
5. **Sub-nav controls group right, context groups left.** Year picker on the left (primary navigation axis); view toggle + CTA on the right (actions). This matches Warp 2.0's sub-nav layout.
6. **Data-dense components use `RADIUS.xl` (12px), not `RADIUS['2xl']` (16px).** Reserve 16px+ radii for marketing hero cards. Stat pills, month cards, and breakdown panels use 12px so the grid reads as a unit, not a gallery.

### When to break the rules

The only place marketing-hero tokens belong is a genuine landing/empty state (e.g. a first-run onboarding screen). Inside the working planner, assume app-density by default.
