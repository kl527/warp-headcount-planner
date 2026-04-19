<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Warp Headcount Planner. `posthog-js` was installed and initialized in `src/lib/posthog.ts` (loaded via a side-effect import in `src/main.tsx`). Environment variables `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` were written to `.env.local`. Twelve events were instrumented across two files covering the core user journeys: sharing plans, building headcount (drag-and-drop role placement), switching view modes, comparing saved scenarios, and opening shared links.

| Event | Description | File |
|---|---|---|
| `share_deck_opened` | User clicked the Share button to open the email input | `src/components/headcount/ShareButton.tsx` |
| `share_deck_sent` | User successfully sent the plan deck to an email address | `src/components/headcount/ShareButton.tsx` |
| `share_deck_failed` | Sending the plan deck to email failed (build or network error) | `src/components/headcount/ShareButton.tsx` |
| `role_added` | User dragged a role from the sidebar onto a month or year slot | `src/components/headcount/HeadcountPlanner.tsx` |
| `role_removed` | User dragged a role off the board, removing it from the plan | `src/components/headcount/HeadcountPlanner.tsx` |
| `role_moved` | User moved a role from one month slot to another | `src/components/headcount/HeadcountPlanner.tsx` |
| `view_changed` | User switched between yearly, monthly, and runway views | `src/components/headcount/HeadcountPlanner.tsx` |
| `financial_inputs_changed` | User updated company balance, MRR, or MoM growth rate | `src/components/headcount/HeadcountPlanner.tsx` |
| `scenario_loaded` | User loaded a saved scenario from the compare strip | `src/components/headcount/HeadcountPlanner.tsx` |
| `scenario_reverted` | User reverted to their pre-load state after previewing a saved scenario | `src/components/headcount/HeadcountPlanner.tsx` |
| `location_changed` | User changed the salary location for headcount cost estimates | `src/components/headcount/HeadcountPlanner.tsx` |
| `share_link_opened` | User opened the app via a shared state URL | `src/components/headcount/HeadcountPlanner.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/387931/dashboard/1484074
- **Share deck funnel (opened → sent):** https://us.posthog.com/project/387931/insights/Q7x8Mv9y
- **Role planning activity over time:** https://us.posthog.com/project/387931/insights/m3yPw0JK
- **View mode distribution:** https://us.posthog.com/project/387931/insights/k6KdoCXO
- **Shared link engagement:** https://us.posthog.com/project/387931/insights/EldpZNGq
- **Scenario load vs revert rate:** https://us.posthog.com/project/387931/insights/YafmK42l

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
