# Smart Report Assistant — SRA-4 Frontend Integration

Status: frontend implementation complete; authenticated runtime coverage is recorded separately from static verification. SRA-4 adds no AI integration and does not change backend contracts.

## UI placement and capability gate

The assistant is embedded in the existing Create Report modal on `/reports`. The modal is only exposed to a signed-in actor whose membership list contains an approved `ClubLeader` membership for the selected Club ID. The backend remains authoritative and rechecks the canonical `SUBMIT_REPORTS` permission for the exact club.

The assistant uses the existing form context:

- `clubId`: selected from the actor's authorized clubs.
- `semesterId`: selected active semester.
- `reportType`: existing Financial, Activity, or General type.
- `title` and `content`: current editable form values.

No actor ID, role, KPI, Finance total, event count, or other authoritative metric is sent by the frontend.

## Gateway APIs

| Action | Request | UI behavior |
|---|---|---|
| Preview | `GET /gateway/reports/smart-assistant/preview?clubId={clubId}&semesterId={semesterId}` | Shows authoritative snapshot metrics, availability, and sources |
| Generate | `POST /gateway/reports/smart-assistant/generate` with `clubId`, `semesterId`, `reportType` | Fills title/content only; asks before replacing non-empty content |
| Validate | `POST /gateway/reports/smart-assistant/validate` with the current form fields | Shows Errors, Warnings, and Suggestions with text and icons |

No mock fallback is used. HTTP `403`, `404`, and `503` receive distinct presentation messages. Other failures use the shared API error adapter.

## Snapshot presentation

Nullable metrics are displayed as `Chưa có dữ liệu`; the UI does not coerce them to zero. `RemainingBalance` is labelled `Số dư hiện tại` and explicitly disclosed as the persisted current club balance, not a semester balance. Availability flags are presented with icon, text, and status styling.

The Sources section renders the backend `type`, `title`, `id`, and optional `route` values without inventing links or source references.

## Draft and validation behavior

- Generation is explicit and rule-based.
- Empty title/content fields are populated directly.
- Existing title or content triggers an overwrite confirmation.
- Generated content remains editable.
- Generation does not save, update, or submit a report.
- Validation evaluates the current form values.
- Errors are labelled as blocking; warnings and suggestions are advisory.
- The backend `isReadyToSubmit` result is displayed but does not silently invoke submit.

Creating a report now saves a Draft only. The existing explicit Submit action on the report card remains the only UI action that sends it for approval.

## Verification

- TypeScript project build: PASS.
- ESLint full frontend: PASS.
- Vite production build: PASS.
- Unit tests: NOT AVAILABLE — this frontend repository has no test script or configured test framework.
- Authenticated ClubLeader browser flow and live API responses: NOT VERIFIED unless recorded in the phase handoff with a valid runtime fixture.
- Write behavior: intentionally not exercised during read-only runtime verification.

## Known limits

- Assistant integration is available in Create Report; the existing Edit Report modal is unchanged.
- Validation remains advisory under the frozen SRA-2 backend contract.
- Report attachments are not currently exposed by the Create Report form.
- Existing backend limits remain: no historical membership intervals, no semester-scoped balance, no event completion timestamp/evidence relation, and KPI may be unavailable.
- No AI provider, prompt, model call, auto-save, auto-submit, or mock data is present.
