import posthog from 'posthog-js';

const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;

export const posthogEnabled = Boolean(key);

if (key) {
  posthog.init(key, {
    // Reverse proxy via Vercel rewrites (see vercel.json) so requests hit
    // our own origin and aren't blocked by uBlock / Brave Shields / Safari
    // content blockers. The ui_host keeps "view in PostHog" links correct.
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

export { posthog };
