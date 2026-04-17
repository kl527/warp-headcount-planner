/**
 * warp.co design system reference.
 * Source: live site https://www.warp.co (captured 2026-04-17).
 * Tailwind v4 with a custom token layer.
 */

// ---------------------------------------------------------------------------
// 1. Breakpoints
// ---------------------------------------------------------------------------

export const BREAKPOINTS = {
  base: 0,
  sm: 640,
  tablet: 768,
  laptop: 1024,
  xl: 1280,
  cap: 1400,
} as const;

export const BREAKPOINT_RANGES = {
  mobile: { min: 0, max: 639 },
  largeMobile: { min: 640, max: 767 },
  tablet: { min: 768, max: 1023 },
  laptop: { min: 1024, max: 1279 },
  xl: { min: 1280, max: 1399 },
  cap: { min: 1400, max: Infinity },
} as const;

// ---------------------------------------------------------------------------
// 2. Typography
// ---------------------------------------------------------------------------

/**
 * Font stacks. The warp.co source uses proprietary commercial faces
 * (Restart Soft, Berkeley Mono, Macan, New York) that we don't have
 * licenses for. These are free look-alikes loaded via @fontsource:
 *
 *   warp.co        our stand-in            package
 *   -----------    --------------------    -----------------------------
 *   restartSoft →  Inter Variable          @fontsource-variable/inter
 *   brandFont   →  Geist Variable          @fontsource-variable/geist
 *   berkeleyMono → JetBrains Mono Variable @fontsource-variable/jetbrains-mono
 *   newYork     →  Instrument Serif        @fontsource/instrument-serif
 *
 * The @fontsource imports live in src/main.tsx.
 */
export const FONT_FAMILIES = {
  brand:
    "'Geist Variable', 'Inter Variable', system-ui, -apple-system, sans-serif",
  sans:
    "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono:
    "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  serif:
    "'Instrument Serif', Georgia, 'Times New Roman', serif",
} as const;

export const FONT_WEIGHTS = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  book: 450,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export const FONT_SIZES = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  "2xl": { size: 24, lineHeight: 32 },
  "3xl": { size: 30, lineHeight: 36 },
  "4xl": { size: 36, lineHeight: 40 },
  "typography-7": { size: 28, lineHeight: 36, letterSpacing: "-0.0075em" },
} as const;

export const TRACKING = {
  tight: "-0.025em",
  normal: "0",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
} as const;

export const LEADING = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const HEADING_SPECS = {
  h1Hero: {
    font: FONT_FAMILIES.sans,
    size: 48,
    lineHeight: 57.6,
    weight: 500,
    tracking: "normal",
    color: "rgb(32, 32, 32)",
  },
  h2Section: {
    font: FONT_FAMILIES.sans,
    size: 35,
    lineHeight: 40,
    weight: 450,
    tracking: "-0.35px",
    color: "oklch(0.608 0 none)",
  },
  h2LedeBold: {
    font: FONT_FAMILIES.sans,
    size: 35,
    lineHeight: 40,
    weight: 450,
    tracking: "-0.35px",
    color: "oklch(0.243 0 none)",
  },
  heroSubtext: {
    font: FONT_FAMILIES.sans,
    size: 18,
    lineHeight: 27,
    weight: 400,
    tracking: "-0.045px",
    color: "color(display-p3 0 0 0 / 0.61)",
  },
  h3CardTitle: {
    font: FONT_FAMILIES.sans,
    size: 16,
    lineHeight: 24,
    weight: 500,
    tracking: "normal",
    color: "oklch(0.243 0 none)",
  },
  bodyParagraph: {
    font: FONT_FAMILIES.sans,
    size: 16,
    lineHeight: 24,
    weight: 400,
    tracking: "normal",
    color: "oklch(0.243 0 none)",
  },
  footerHeading: {
    font: FONT_FAMILIES.sans,
    size: 14,
    weight: 450,
    tracking: "normal",
    color: "oklch(0.243 0 none)",
  },
} as const;

// ---------------------------------------------------------------------------
// 3. Colors
// ---------------------------------------------------------------------------

export const SEMANTIC_COLORS = {
  background: "#ffffff",
  card: "#ffffff",
  border: "#e8e8e8",
  muted: "#8d8d8d",
  success: "#008500",
  warning: "#f59e0b",
  brand: "#00b4f0",
} as const;

export const BRAND_CTA = {
  bg: "#FF3D00",
  fg: "#FFFFFF",
} as const;

export const ACCENT_SCALE = {
  1: "oklch(99.3% 0.0036 34.09)",
  2: "oklch(98.2% 0.0114 34.09)",
  3: "oklch(95.5% 0.0303 34.09)",
  4: "oklch(92.4% 0.0674 34.09)",
  5: "oklch(89.1% 0.0905 34.09)",
  6: "oklch(85.4% 0.1044 34.09)",
  7: "oklch(80.4% 0.1198 34.09)",
  8: "oklch(74.3% 0.1479 34.09)",
  9: "oklch(65.4% 0.234 34.09)",
  10: "oklch(61.5% 0.2369 34.09)",
  11: "oklch(57.5% 0.234 34.09)",
  12: "oklch(34.7% 0.0923 34.09)",
} as const;

export const RED_SCALE = {
  1: "#fffcfb",
  2: "#fff7f6",
  3: "#ffeae6",
  4: "#ffd9d1",
  5: "#ffc9bf",
  6: "#ffb7ac",
  7: "#ffa295",
  8: "#fb8476",
  9: "#ff2323",
  10: "#f1000b",
  11: "#e20000",
  12: "#691410",
} as const;

export const AMBER_SCALE = {
  1: "#fefdfb",
  2: "#fff8e7",
  3: "#ffefcd",
  4: "#ffe5b7",
  5: "#ffd99e",
  6: "#ffc977",
  7: "#ffb453",
  8: "#f19a00",
  9: "#f59e0b",
  10: "#e99300",
  11: "#ac6500",
  12: "#4f3515",
} as const;

export const GRAY_SCALE = {
  1: "oklch(99.1% 0 none)",
  2: "oklch(98.1% 0 none)",
  3: "oklch(95.4% 0 none)",
  4: "oklch(93.0% 0 none)",
  5: "oklch(90.8% 0 none)",
  6: "oklch(88.4% 0 none)",
  7: "oklch(85.1% 0 none)",
  8: "oklch(79.1% 0 none)",
  9: "oklch(64.3% 0 none)",
  10: "oklch(60.8% 0 none)",
  11: "oklch(50.3% 0 none)",
  12: "oklch(24.3% 0 none)",
} as const;

// ---------------------------------------------------------------------------
// 4. Radius
// ---------------------------------------------------------------------------

export const RADIUS = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
} as const;

// One-off: email input container uses a hardcoded 13px radius, not a token.
export const RADIUS_EMAIL_INPUT = 13;

// ---------------------------------------------------------------------------
// 5. Shadows
// ---------------------------------------------------------------------------

export const SHADOWS = {
  border: "0 0 0 1px #00000014",
  borderInset: "inset 0 0 0 1px #00000014",
  borderMedium:
    "0 0 0 1px #00000014, 0 2px 2px #0000000a, 0 8px 8px -8px #0000000a",
  tooltip:
    "0 0 0 1px #00000014, 0 1px 1px #00000005, 0 4px 8px #0000000a",
  menu:
    "0 0 0 1px #00000014, 0 1px 1px #00000005, 0 4px 8px -4px #0000000a, 0 16px 24px -8px #0000000f",
  modal:
    "0 0 0 1px #00000014, 0 1px 1px #00000005, 0 8px 16px -4px #0000000a, 0 24px 32px -8px #0000000f",
  fullscreen:
    "0 0 0 1px #00000014, 0 1px 1px #00000005, 0 8px 16px -4px #0000000a, 0 24px 32px -8px #0000000f",
  large: "0 2px 2px #0000000a, 0 8px 16px -4px #0000000a",
} as const;

export const FOOTER_SHADOW =
  "linear-gradient(to bottom, #ffffffe6 0%, #ffffff80 40%, transparent 100%)";

// ---------------------------------------------------------------------------
// 6. Layout and spacing
// ---------------------------------------------------------------------------

export const SPACING_BASE = 4;

export const CONTAINERS = {
  xs: 320,
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  "2xl": 672,
  "3xl": 768,
  "4xl": 896,
  "5xl": 1024,
  "6xl": 1152,
  "7xl": 1280,
} as const;

export const PAGE_WIDTH = {
  max: 1280,
  innerContent: 1180,
} as const;

export const SECTION_RHYTHM = {
  desktop: { verticalPadding: 96 },
  tablet: { topPad: 40, marginBottom: [24, 48, 60] as const },
  horizontalGutters: {
    tablet: [24, 32] as const,
    laptop: [48, 52, 80] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// 7. Components (measured on live site)
// ---------------------------------------------------------------------------

export const HEADER = {
  height: 57,
  sticky: true,
  background: "rgba(255, 255, 255, 0.95)",
  bottomBorder: "1px solid rgba(0, 0, 0, 0.09)",
  navLink: {
    size: 14,
    lineHeight: 20,
    weight: 450,
    color: "oklch(0.243 0 0)",
    opacity: 0.8,
  },
  linkPadding: "0 12px",
} as const;

export const BUTTONS = {
  navPrimary: {
    label: "Get Started",
    width: 97,
    height: 32,
    bg: "#FF3D00",
    fg: "#ffffff",
    radius: 8,
    padding: "0 12px",
    fontSize: 14,
    lineHeight: 20,
    weight: 450,
  },
  navGhost: {
    label: "Log in",
    width: 63,
    height: 32,
    bg: "transparent",
    fg: "oklch(0.243 0 none)",
    fgOpacity: 0.8,
    radius: 8,
    padding: "0 12px",
    fontSize: 14,
    lineHeight: 20,
    weight: 450,
  },
  heroPrimary: {
    label: "See a Demo",
    width: 136,
    height: 44,
    bg: "#FF3D00",
    fg: "#ffffff",
    radius: 8,
    padding: "0 16px",
    fontSize: 16,
    lineHeight: 24,
    weight: 400,
  },
} as const;

export const EMAIL_INPUT = {
  container: {
    width: 420,
    height: 56,
    bg: "oklch(0.981 0 none)",
    border: "1px solid oklch(0.884 0 none)",
    radius: 13,
    hasInsetShadow: true,
  },
  input: {
    size: 14,
    lineHeight: 21,
    weight: 400,
    color: "rgb(32, 32, 32)",
    padding: "0 14px",
  },
} as const;

export const PRODUCT_CARD = {
  link: { width: 361, height: 367, radius: 8 },
  preview: {
    width: 361,
    height: 211,
    bg: "oklch(0.981 0 none)",
    radius: 8,
    padding: "32px 32px 0",
  },
  title: { size: 16, lineHeight: 24, weight: 500 },
  body: { size: 16, lineHeight: 24, weight: 400 },
} as const;

export const CHIP = {
  textSize: 14,
  lineHeight: 20,
  weight: 450,
  fillStep: "accent-low",
  textStep: ["accent-11", "accent-12"] as const,
} as const;

export const FOOTER = {
  bg: "#ffffff",
  color: "oklch(0.243 0 0)",
  topBorder: "1px solid oklab(0 none none / 0.08)",
  sectionHeading: { size: 14, weight: 450 },
  link: { size: 16, lineHeight: 24, weight: 400, underline: false },
} as const;

// ---------------------------------------------------------------------------
// 8. Tablet utilities (active 768–1023)
// ---------------------------------------------------------------------------

export const TABLET_UTILITIES = [
  "tablet:grid-cols-2",
  "tablet:grid-cols-3",
  "tablet:flex",
  "tablet:block",
  "tablet:hidden",
  "tablet:px-[24px]",
  "tablet:px-[32px]",
  "tablet:pt-[40px]",
  "tablet:mb-[24px]",
  "tablet:mb-[48px]",
  "tablet:mb-[60px]",
  "tablet:min-h-[600px]",
  "tablet:max-w-140",
  "tablet:rounded-lg",
  "tablet:typography-7",
] as const;

// ---------------------------------------------------------------------------
// 9. Laptop / desktop utilities (active 1024+)
// ---------------------------------------------------------------------------

export const LAPTOP_UTILITIES = [
  "laptop:grid-cols-3",
  "laptop:grid-cols-4",
  "laptop:grid-cols-[1fr_380px]",
  "laptop:flex-row",
  "laptop:gap-10",
  "laptop:gap-[40px]",
  "laptop:sticky",
  "laptop:top-24",
  "laptop:ml-[260px]",
  "laptop:p-[30px]",
  "laptop:px-[48px]",
  "laptop:px-[52px]",
  "laptop:px-[80px]",
  "laptop:py-[80px]",
  "laptop:pt-[36px]",
  "laptop:pt-[48px]",
  "laptop:inline-flex",
  "laptop:border-r",
  "laptop:border-l",
  "laptop:rounded-l-none",
  "laptop:rounded-r-none",
] as const;

// ---------------------------------------------------------------------------
// 10. Quick summary
// ---------------------------------------------------------------------------

export const QUICK_SUMMARY = {
  fonts: {
    primary: FONT_FAMILIES.sans,
    mono: FONT_FAMILIES.mono,
    serif: FONT_FAMILIES.serif,
    display: FONT_FAMILIES.brand,
  },
  body: { size: 16, lineHeight: 24, weight: 400, color: "oklch(0.243 0 none)" },
  primaryCta: { bg: "#FF3D00", fg: "#ffffff", radius: 8 },
  accentHue: 34.09,
  gray12: "oklch(24.3% 0 none)",
  border: "#e8e8e8",
  radiiInUse: [4, 6, 8, 12, 16, 24] as const,
  shadow: "layered 1px ring + soft drop, all black low alpha",
  breakpoints: { sm: 640, tablet: 768, laptop: 1024, xl: 1280, cap: 1400 },
  maxWidth: { main: 1280, inner: 1180 },
  sectionPad: { desktop: 96, tabletRange: [40, 60] as const },
  headings: {
    h1: { size: 48, lineHeight: 57.6, weight: 500 },
    h2: {
      size: 35,
      lineHeight: 40,
      weight: 450,
      tracking: "-0.35px",
      tablet: { size: 28, lineHeight: 36 },
    },
    h3: { size: 16, lineHeight: 24, weight: 500 },
  },
} as const;
