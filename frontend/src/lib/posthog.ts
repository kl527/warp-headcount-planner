import posthog from 'posthog-js';

const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;

export const posthogEnabled = Boolean(key);

if (key) {
  posthog.init(key, {
    // Reverse proxy via Vercel rewrites (see vercel.json) so requests hit
    // our own origin. Path is deliberately app-specific (not /ingest, not
    // /track, not /collect) because EasyPrivacy-style filter lists match
    // those paths regardless of origin.
    api_host: '/relay-wp',
    ui_host: 'https://us.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

export { posthog };
