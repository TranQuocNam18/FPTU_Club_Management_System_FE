# FPTU Club Report System — Interface System

## Direction

Modern Premium SaaS Dashboard for University Club Management. The interface is calm, data-friendly, dark-first, and professional. Decoration stays in branding/CTA areas; working surfaces prioritize clarity and contrast.

## Foundations

- Font stack: Inter, Geist, Segoe UI, system sans-serif.
- Heading weight: 600–700. Body weight: 400–500.
- Minimum body: 14px. Minimum label: 13px. Line height: 1.4–1.6.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Controls: 8–10px radius and 44–48px minimum height.
- Cards: 14–16px radius. Modal: 16px radius.
- Focus: visible 2px indigo ring with sufficient offset.

## Semantic tokens

Tokens are defined in `src/index.css` and are the source of truth:

- Background: `--color-bg` (#0B1020)
- Surface: `--color-surface`
- Elevated surface: `--color-surface-elevated`
- Border: `--color-border`, `--color-border-strong`
- Text: `--color-text`, `--color-text-muted`, `--color-text-subtle`
- Action: `--color-primary`, hover/active/soft variants
- Feedback: `--color-success`, `--color-warning`, `--color-danger`
- Spacing: `--space-1` through `--space-12`
- Radius: `--radius-sm` through `--radius-xl`
- Shadow: `--shadow-card`, `--shadow-control`
- Motion: `--transition-fast`, `--transition-base`
- Layout: `--layout-auth-card`, `--layout-content`, `--sidebar-width`

## Interaction rules

- All interactive controls expose hover, focus-visible, disabled, and loading states.
- Icon-only actions require an accessible name and a 44px touch target.
- Validation is inline and associated through `aria-describedby`.
- API/form-level errors use an alert region, not `window.alert`.
- Motion is brief and disabled via `prefers-reduced-motion`.
- Never use color as the only status signal.

## Admin users and broadcast rules

- User discovery uses server-side search, canonical role/status filters, pagination metadata, and one list request per filter state.
- User cards and the detail dialog render only fields returned by the users list contract; no synthetic account lifecycle state is shown.
- Canonical selectable roles are `StudentAffairsAdmin`, `ClubManager`, and `Student`. Legacy roles may be labeled for display but never offered as mutation targets.
- Role and account-status mutations require a dedicated confirmation dialog, disable self-management, and update the UI only after server success.
- Broadcast remains inside Notifications for Student Affairs Admin. Its request contains title, message, and canonical targetRole only.
- Broadcast always provides a clearly labeled unsent preview and a final confirmation step. Recipient totals are shown only from the successful API response.
- User status and email verification always combine semantic text with color/icon cues.

## Events and notifications rules

- Events use `ExpectedDate` as the only supported event timestamp. Do not imply an end time, attendee count, cover image, reviewer, or feedback when the contract does not return it.
- Event actions are derived from canonical status plus system role and approved ClubLeader membership. Treasurer and legacy Manager memberships do not gain event-management capability.
- Event detail is loaded only when opened. Club names come from the cached clubs list; cards never request club detail.
- Workflow mutations are confirmed, never optimistic, and invalidate event list, club-events, and the selected detail after server success.
- Notifications Page and Header preview share `['notifications', userId]`. Opening either surface never marks an item read.
- SignalR payloads trigger REST invalidation instead of direct cache insertion. Reconnection also reconciles through REST, preventing client-side duplicate IDs and invented unread totals.
- Realtime state is informational and must not block REST notifications. Authentication failures remain visible as disconnected state without retry toast spam.
- Notification target links render only for internal paths beginning with `/`; messages are always plain text.

## Responsive rules

- Desktop auth layout: branding 52–54%, form 46–48%, form card max 480px.
- Below 900px: hide branding panel and center a full-width card with 24px padding.
- Below 480px: 16px page padding, safe-area padding, no horizontal overflow.
- Primary validation viewports: 375×812, 768×1024, 1366×768, 1440×900, 1920×1080.

## App shell rules

- Desktop shell begins at 1024px with a 256px expanded sidebar and a 72px collapsed rail.
- Mobile and tablet use a modal navigation drawer; the document body is locked while it is open.
- Header height is 64px. The mobile header exposes navigation, breadcrumb context, notifications, and account actions without horizontal overflow.
- Sidebar navigation remains grouped by overview, club management, reports/finance, and administration.
- Role and capability filtering is authoritative: admin items require Admin; manager report/finance items require the existing approved membership role checks.
- Icon-only collapsed navigation always keeps an accessible name and tooltip.
- Popovers support Escape and outside-click dismissal. The mobile notification preview is inset 16px from both viewport edges.
- Drawer focus moves to its close action on open, is trapped inside the dialog, and returns to the navigation trigger on close.
- Shell motion uses short transform/opacity GSAP transitions scoped with `gsap.context()` and cleaned with `context.revert()`.
- Reduced-motion preference disables entrance and popover movement while keeping content immediately visible.

## Dashboard rules

- Dashboard data must be direct Gateway API data or a clearly described derivation from it.
- Unavailable metrics stay hidden or use an explanatory unavailable state; they are never represented as zero.
- Student, Club Manager, and Student Affairs Admin render distinct compositions from the canonical `User.role`.
- Manager requests are enabled by approved membership capability: Club Leader for reports/events and Treasurer for finance navigation.
- Dashboard failures are isolated to their section so successful data remains usable.
- Stat grids use three columns on desktop and one column below 720px; two-column content stacks below 900px.
- Charts render only with a non-empty real dataset and include a text summary and legend.
- Dashboard entrance motion uses the shared ref-scoped reveal helper once per role and respects reduced motion.

## Clubs workspace rules

- Club discovery cards use only list-response fields; member counts never trigger per-card requests.
- Student join actions remain hidden until `my-memberships` resolves successfully.
- Club Detail tabs enable members, events, and reports queries only when the corresponding panel is selected.
- Club Leader capability is approved membership role 2; Treasurer and legacy role 1 do not inherit member-management access.
- Membership actions use the dedicated approve, reject, role-update, and remove endpoints without optimistic workflow changes.
- Club metadata that is absent from the API is omitted or explained as unavailable, never rendered as a fabricated zero.
- Club grids use three, two, and one columns across desktop, tablet, and mobile.
- Modal dialogs lock body scroll, trap focus, close on Escape/backdrop, and return focus to their trigger.
- Clubs header/card/hero reveals use the shared GSAP helper once per route mount and respect reduced motion.

## Reports workflow rules

- `/reports` and `/admin/reports` share the canonical Reports workspace; action visibility is determined by role, approved Club Leader capability, and server status.
- Report status remains Draft, Pending Approval, Approved, Request Revision, or Rejected. Labels and icons accompany color.
- Club Managers resolve report capability from the cached `my-memberships` response; Reports must not fetch every club's membership list or make per-row detail requests.
- Report creation uses the canonical Active Semester response and preserves the existing create-then-submit sequence. A missing or failed semester response blocks submission with an explicit state.
- Draft supports edit and explicit submit. Request Revision keeps reviewer feedback visible and performs update-then-resubmit only after the update succeeds.
- Admin review is available only for Pending Approval and preserves the single review endpoint actions: Approve, RequestRevision, and Reject. Revision/rejection feedback is validated before mutation.
- Evidence is presented only as existing URL metadata; no upload control or progress state is implied.
- List filters are local over the fetched club report response and include status, type, semester, and text search; no fake period or server contract is introduced.
- Detail and revision history load only when a report modal is open. History failure stays isolated from the report content.
- Reports use stacked scan-friendly cards, wrapping filter/action regions, viewport-bounded dialogs, tokenized CSS transitions, and the shared one-time GSAP reveal helper with reduced-motion cleanup.

## Finance workspace rules

- `/finance` is the single canonical Finance workspace. Student Affairs Admin receives read/review access; ClubManager access requires an approved Treasurer membership role 3 for the selected club.
- Admin never receives create, edit, submit, or settlement actions. Treasurer never receives review actions. Club Leader and Student capabilities are not substituted for Treasurer.
- Backend proposal status is Draft, Pending, Approved, PartiallyApproved, Rejected, or Settled. Legacy frontend `PendingApproval` may be normalized for display only; `Adjusted` is not a proposal status.
- Proposal, balance, transaction, detail, and settlement requests keep their existing Gateway methods and payloads. Actor, proposer, and reviewer identity always comes from JWT.
- Balance and Transactions load only when their tab opens. Proposal detail loads only when its dialog opens, and failures remain isolated to their section.
- Money uses the shared VND `Intl.NumberFormat`; null is unavailable and never coerced into a fabricated zero.
- Receipt presentation is URL metadata only. No file picker, upload progress, inferred transaction, running balance, chart, or trend is introduced.
- Draft supports edit and explicit submit. Admin review keeps full, partial, and reject endpoints distinct. Settlement is shown only for Treasurer and Approved/PartiallyApproved proposals.
- Finance uses responsive proposal cards and transaction rows, wrapping action/filter regions, viewport-bounded dialogs, visible semantic status labels, and the shared one-time GSAP reveal helper with reduced-motion cleanup.

## KPI analytics rules

- `/kpi` is the canonical KPI workspace. Leaderboard and club score/history are readable to authenticated roles; Rules CRUD, Semester actions, and Manual Adjustment are visible only to Student Affairs Admin.
- Semester selection uses canonical Semester IDs and prefers the backend Active status without synchronizing derived selection through an effect.
- Leaderboard rank, order, and total score are authoritative backend values. Filtering, re-ranking, report-count formulas, inferred trends, and client score calculations are prohibited.
- Club score and history load only after a leaderboard entry opens. History failure remains isolated from the leaderboard and score summary.
- The current detail contract exposes totalPoints but no criteria aggregate or denominator. The UI must explain that limitation and must not invent progress bars, max 100, or chart data.
- Club names and logos come from the cached clubs query; no per-row club detail request is permitted.
- KPI Rules load only on the Admin Rules tab. Create, update, and delete keep their dedicated adapters, inline validation, confirmation, and server-confirmed completion.
- Manual Adjustment sends only clubId, semesterId, optional ruleId, points, and reason; adjustedBy comes from JWT. No optimistic score or rank update is permitted.
- KPI uses restrained top-three accents with textual rank, tabular score formatting, responsive compact rows/cards, semantic history direction labels, and the shared one-time GSAP reveal helper with reduced-motion cleanup.
