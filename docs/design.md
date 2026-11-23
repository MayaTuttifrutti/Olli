# Olli — design reference

Figma: https://www.figma.com/design/QoFjIsn3V4xxRG8NcJ0cSa/Olli--co-parenting--in-sync
Live prototype: https://olli-zeta.vercel.app

Mockups (1440 px wide) live in `docs/mockups/light` and `docs/mockups/dark`.

## Screens → code

| Mockup | Component |
|---|---|
| 01 Overview | `src/components/OverviewView.tsx` |
| 02 Calendar | `src/components/CalendarView.tsx` |
| 06 New event modal | `src/components/EventModal.tsx` |
| 03 Health | `src/components/HealthView.tsx` (+ `MedicationIcon.tsx`) |
| 04 Tasks | `src/components/TasksView.tsx` |
| 05 Stats | `src/components/AnalyticsView.tsx` |
| Sidebar + theme toggle | `src/components/Sidebar.tsx` |

## Color tokens (Figma collection "Color")

| Token | Light | Dark |
|---|---|---|
| bg/app | #faf7f2 | #101012 |
| bg/surface | #ffffff | #17171a |
| bg/sidebar | #ffffff | #141416 |
| bg/muted | #f5f5f4 | #222226 |
| bg/inset | #fafaf9 | #1b1b1f |
| border/default | #e7e5e4 | #2b2b2f |
| border/strong | #d6d3d1 | #3a3a40 |
| text/primary | #101012 | #f7f4ef |
| text/secondary | #57534e | #d6d3d1 |
| text/muted | #78716c | #a8a29e |
| text/faint | #a8a29e | #78716c |
| text/on-accent | #ffffff | #ffffff |
| accent/link | #e11d48 | #fbbf24 |
| accent/rose | #f43f5e | #f43f5e |
| accent/amber | #f59e0b | #f59e0b |
| status/success | #059669 | #34d399 |
| status/warn | #d97706 | #fbbf24 |
| status/danger | #e11d48 | #fb7185 |
| status/success-bg | #ecfdf5 | #10281f |
| status/warn-bg | #fffbeb | #2a2314 |
| status/danger-bg | #fff1f2 | #2d1519 |
| status/warn-border | #f6d98b | #5a4516 |
| parent/claire-bg | #fff1f2 | #2d1519 |
| parent/david-bg | #fffbeb | #2a2314 |
| tint/dark-card | #171717 | #171717 |

## Updating the prototype

1. Change the design in Figma (or describe the change).
2. Give an AI assistant (Claude / AI Studio) the screenshot from `docs/mockups`, this file and the relevant component.
3. `npm install && npm run dev`, check, commit, push — Vercel redeploys automatically.
