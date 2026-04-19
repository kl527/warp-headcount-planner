import { nanoid } from 'nanoid';
import { posthog, posthogEnabled } from './posthog';

const SESSION_KEY = 'warp_planner_session_id';

function readSessionId(): string {
  if (typeof window === 'undefined') return nanoid(12);
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = nanoid(12);
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return nanoid(12);
  }
}

function readEntryContext() {
  if (typeof window === 'undefined') {
    return {
      entry_page: null as string | null,
      entry_referrer: null as string | null,
      has_shared_link_param: false,
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    entry_page: window.location.pathname,
    entry_referrer: document.referrer || null,
    has_shared_link_param: params.has('state'),
  };
}

const SESSION_ID = readSessionId();
const ENTRY = readEntryContext();

const SUPER_PROPERTIES = {
  session_id: SESSION_ID,
  entry_page: ENTRY.entry_page,
  entry_referrer: ENTRY.entry_referrer,
  has_shared_link_param: ENTRY.has_shared_link_param,
  app_version: import.meta.env.VITE_APP_VERSION ?? 'dev',
} as const;

// Register once on module load. Imported as a side effect from main.tsx after
// posthog.ts, so init has already run by the time this executes.
if (posthogEnabled) {
  posthog.register(SUPER_PROPERTIES);
}

type Props = Record<string, unknown>;

function capture(event: string, props?: Props) {
  posthog.capture(event, { ...SUPER_PROPERTIES, ...(props ?? {}) });
}

const fired = new Set<string>();
function captureOnce(event: string, props?: Props) {
  if (fired.has(event)) return;
  fired.add(event);
  capture(event, props);
}

// Funnel step numbers are declarative labels on events so PostHog funnel
// insights can order them consistently. They are not enforced; a user can
// skip steps (e.g. arrive via shared link and jump straight to share).
export const FUNNEL_STEP = {
  appLoaded: 0,
  firstInteraction: 1,
  roleAdded: 2,
  runwayViewOpened: 3,
  scenarioSaved: 4,
  shareButtonClicked: 5,
  emailInputFocused: 6,
  emailInputChanged: 7,
  emailSubmitAttempted: 8,
  shareDeckSent: 9,
} as const;

export const track = {
  appLoaded: () =>
    captureOnce('app_loaded', { funnel_step: FUNNEL_STEP.appLoaded }),
  firstInteraction: (kind: string) =>
    captureOnce('first_interaction', {
      funnel_step: FUNNEL_STEP.firstInteraction,
      kind,
    }),
  shareLinkOpened: () => capture('share_link_opened'),
  roleAdded: (p: {
    role_key: string;
    team: string;
    month_index: number;
    view: string;
  }) => capture('role_added', { funnel_step: FUNNEL_STEP.roleAdded, ...p }),
  roleRemoved: (p: { role_key: string; team: string; from_month_index: number }) =>
    capture('role_removed', p),
  roleMoved: (p: {
    role_key: string;
    team: string;
    from_month_index: number;
    to_month_index: number;
    view: string;
  }) => capture('role_moved', p),
  viewChanged: (p: { view: string; trigger?: string }) =>
    capture('view_changed', p),
  runwayViewOpened: () =>
    captureOnce('runway_view_opened', {
      funnel_step: FUNNEL_STEP.runwayViewOpened,
    }),
  financialInputsChanged: (p: { fields: string[] }) =>
    capture('financial_inputs_changed', p),
  locationChanged: (p: { location: string }) =>
    capture('location_changed', p),
  scenarioLoaded: () => capture('scenario_loaded'),
  scenarioReverted: () => capture('scenario_reverted'),
  scenarioSaved: (p: { scenario_name: string }) =>
    capture('scenario_saved', { funnel_step: FUNNEL_STEP.scenarioSaved, ...p }),
  shareButtonClicked: () =>
    capture('share_button_clicked', {
      funnel_step: FUNNEL_STEP.shareButtonClicked,
    }),
  emailInputFocused: () =>
    capture('email_input_focused', {
      funnel_step: FUNNEL_STEP.emailInputFocused,
    }),
  emailInputChanged: (p: { valid: boolean; length: number }) =>
    capture('email_input_changed', {
      funnel_step: FUNNEL_STEP.emailInputChanged,
      ...p,
    }),
  emailValidationFailed: () => capture('email_validation_failed'),
  emailSubmitAttempted: (p: { valid: boolean }) =>
    capture('email_submit_attempted', {
      funnel_step: FUNNEL_STEP.emailSubmitAttempted,
      ...p,
    }),
  shareDeckSent: (p: { scenario_name: string; email: string }) => {
    // Identify at the moment of conversion — this merges the prior anonymous
    // distinct_id with the email so all earlier events in this session are
    // attributed to the identified user in PostHog funnels.
    posthog.identify(p.email, { email: p.email });
    capture('share_deck_sent', {
      funnel_step: FUNNEL_STEP.shareDeckSent,
      scenario_name: p.scenario_name,
    });
  },
  shareDeckFailed: (p: { stage: 'build' | 'network' | 'server' }) =>
    capture('share_deck_failed', p),
};
