# Finance and Dashboard Implementation Plan

> **Dependency notice:** This is a sub-plan. The authoritative phase order is defined in `backend_gap_completion_plan.md`. Do not continue Finance Phase 3 until Phase BE-5 Course Compliance Gate has completed: Report REST/gRPC demo, Redis producer/consumer, one Hangfire job, Docker, Swagger and README evidence.

## 1. Purpose

This plan defines the next implementation path for FPTU Club Report System after reading `FPTU_Club_Report_Proposal.md`, `backend_contract_freeze.md`, `backend_gap_completion_plan.md`, and `fe_completion_plan.md`.

Main decision:

- Preserve the completed Finance foundation and proposal flow without moving it ahead of the authoritative compliance sequence.
- Resume Finance Phase 3 only after BE-5 Course Compliance Gate passes.
- Implement Dashboard only after Finance exists, because dashboard statistics depend on Finance, Reports, KPI, Clubs, Members and Events.

This plan is designed so work can resume later without rediscovering the current state.

## 2. Current Baseline - 2026-07-14

### Already available

- Gateway routes: auth, users, clubs, events, reports, KPI, notifications, SignalR.
- Auth flow: register, login, refresh, forgot/reset password, verify email, resend verification.
- Users: list, update role, update status.
- Clubs and membership: CRUD, join, approve/reject member, role update, remove member.
- Events: list by club, detail, create, update, cancel, permanent delete.
- Reports: create, update, review, list by club, detail, delete.
- KPI: leaderboard and KPI rules CRUD.
- Notifications: list, mark read, mark all read, broadcast, SignalR hub.
- FE has real adapters for the Finance proposal flow; balance, transaction, receipt, settlement and Dashboard remain mock/placeholder dependent.

### Still missing or not production-ready

- Finance transaction, balance, receipt and settlement APIs.
- Dashboard/statistics API.
- File upload/storage for report evidence and finance receipts.
- Export PDF/Excel.
- Redis Pub/Sub/Streams business events.
- Hangfire background jobs.
- Contract cleanup: response envelope, role mismatch, list query consistency, JSON/XML content negotiation.

## 3. Guiding Decisions

- Keep Ocelot Gateway for now. Do not migrate to YARP unless the team or instructor explicitly requires it.
- Keep email/password, verification code, Brevo, JWT and refresh token as the approved authentication baseline.
- Finance remains higher priority than Dashboard inside this sub-plan, but neither may bypass the authoritative BE-5 Course Compliance Gate.
- Dashboard should not be built from hard-coded or local mock numbers once Finance is started.
- FE should keep mock/placeholder behavior only for modules whose BE API does not exist yet.
- Every implementation phase must update this plan and the relevant parent plan files.

## 4. Phase 0 - Contract Cleanup Gate

### Communication Layer across this sub-plan

- **REST:** FE -> Ocelot -> Finance/Dashboard APIs for proposal, settlement, transaction, balance and dashboard operations.
- **gRPC + Protobuf:** Finance -> Club synchronous ownership/club validation when the Finance request requires an immediate decision. `.proto` is the strongly typed binary gRPC contract, not a broker.
- **Redis Pub/Sub/Streams:** Finance publishes asynchronous proposal/settlement events; Notification and approved read-model consumers process later. Streams is used when buffering/retry/replay is required. Redis does not replace gRPC.
- **SignalR:** Notification Service pushes processed finance notifications to FE.
- **Hangfire:** schedules unused-budget/reminder jobs, which may publish Redis events.
- Phase mapping without changing order: Phase 0 freezes all contracts; Phases 1-4 implement REST and required synchronous gRPC; Phase 5 implements Redis producer/consumer, SignalR and Hangfire integration; Phases 6-7 verify external REST and complete cross-mechanism E2E evidence.

Status: **Completed on 2026-07-14**. Envelope integration tests remain a hardening task outside this gate.

Goal: remove small cross-cutting inconsistencies before adding Finance.

### Backend tasks

- Normalize Gateway placeholder response for unimplemented modules:
  - Remove `statusCode` from response body.
  - Use `success`, `message`, `data`, `errors`, `meta`, `traceId`.
- Audit response envelope in existing services:
  - Auth
  - Users
  - Clubs
  - Events
  - Reports
  - KPI
  - Notifications
- Apply the final role contract: `Advisor` is legacy source data, is not a canonical v1 role and must be migrated/mapped to `StudentAffairsAdmin`.
- Confirm enum serialization:
  - Public API should return string status values where possible.
  - FE mapping must not depend on integer-only status.
- Confirm env naming for Brevo/JWT is consistent with Docker Compose and `.env.example`.

### FE tasks

- Use real Finance proposal flow after verification; keep balance, transaction, receipt, settlement and Dashboard in mock/disabled mode until their APIs exist.
- Runtime profiles:
  - Mock demo: `VITE_USE_MOCK_DATA=true`.
  - PRN232 compliance/E2E: `VITE_USE_MOCK_DATA=false`.
  - Production-like: `VITE_USE_MOCK_DATA=false`.
- Prepare `.env` instructions for real integration mode:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SIGNALR_URL=http://localhost:5000/gateway/hubs/notification
VITE_USE_MOCK_DATA=false
```

### Acceptance criteria

- `dotnet build` passes.
- `npm run build` passes if FE files are touched.
- Gateway `/gateway/finance/*` and `/gateway/dashboard/*` return a contract-compliant `501` until implemented.
- Role decision is documented.

### Completion record - 2026-07-14

- Gateway Finance/Dashboard placeholders return contract-compliant `501` without body `statusCode`.
- Shared BE response, model validation and exception responses use structured errors.
- FE and mock response types use the same canonical envelope.
- `Advisor` remains only as legacy source data and must migrate/map to `StudentAffairsAdmin`; no new contract or UI guard may depend on it.
- Docker Compose reads SQL/JWT settings from `.env`.
- `dotnet build ... --no-restore`: pass with 0 errors and 2 AutoMapper `NU1903` warnings.
- `npm run build`: pass with non-blocking SignalR/Rolldown warnings.
- Shared responses auto-populate `traceId` from the active request Activity.
- Follow-up debt: add response-envelope integration tests.

## 5. Phase 1 - Finance Service Foundation

Status: **Implemented and self-checked on 2026-07-14; independent double-check is still pending.**

Goal: create the Finance microservice and database ownership boundary.

### Backend tasks

- Add Finance service projects:
  - `Finance.API`
  - `Finance.Application`
  - `Finance.Domain`
  - `Finance.Infrastructure`
- Add Finance database context and EF migration.
- Add Dockerfile and docker-compose service entry.
- Add Gateway route:
  - `/gateway/finance/{everything}` -> Finance service `/api/v1/finance/{everything}`
- Add Swagger with Bearer auth.
- Add health endpoint.

### Domain entities

- `BudgetProposal`
  - `id`
  - `clubId`
  - `activityId`
  - `proposerId`
  - `eventName`
  - `requestedAmount`
  - `approvedAmount`
  - `proposedDate`
  - `reviewedAt`
  - `reviewedBy`
  - `status`
  - `feedback`
  - `budgetDetailsJson`
- `FinanceTransaction`
  - `id`
  - `clubId`
  - `amount`
  - `type`
  - `description`
  - `referenceId`
  - `transactionDate`
  - `receiptUrl`
- `ClubFinanceBalance`
  - `clubId`
  - `allocatedAmount`
  - `spentAmount`
  - `availableAmount`

### Acceptance criteria

- Finance service starts in Docker.
- Swagger opens.
- Migration applies on empty database.
- Gateway can route to Finance health or a basic endpoint.

### Completion record - 2026-07-14

- Added `Finance.Domain`, `Finance.Application`, `Finance.Infrastructure` and `Finance.API` to the solution.
- Added the initial domain schema for budget proposals, transactions and per-club balances.
- Generated and applied EF Core migration `InitialFinance` to `finance_db`.
- Added Swagger with Bearer configuration and shared response/error behavior.
- Added direct health endpoint and foundation status endpoint.
- Added Docker image/service `finance-service` on host port `5005`.
- Added Ocelot routing:
  - public `GET /gateway/finance/health`
  - authenticated `/gateway/finance/{everything}`
- Added `.dockerignore` to prevent `bin`, `obj`, secrets and repository metadata from inflating build context.
- Verification:
  - full solution build passed with 0 errors;
  - Finance image and Gateway image built successfully;
  - `fptu-finance` and `fptu-gateway` are running;
  - direct and Gateway Finance health both returned `OK`;
  - container logs confirm all three Finance tables and indexes were created.

Next entry point: Phase 2 Budget Proposal Flow. Do not switch FE Finance from mock mode until the Phase 2 proposal endpoints are implemented and verified.

Verification note - 2026-07-15: Phase 1 has not received an independent double-check yet. Treat it as implemented but not finally accepted until another review verifies the migration, Docker startup, Gateway routing, JWT protection and documented contract.

## 6. Phase 2 - Budget Proposal Flow

Status: **Implemented and self-checked on 2026-07-15; independent double-check is still pending.**

Goal: implement UC-04 and UC-10 core flow.

### Backend API contract

- `POST /gateway/finance/proposals`
  - Club `Treasurer` with system role `ClubManager` creates a proposal; `StudentAffairsAdmin` may create only when the approved business rule allows it.
- `GET /gateway/finance/proposals`
  - Supports filters: `clubId`, `status`, `page`, `pageSize`.
- `GET /gateway/finance/proposals/{id}`
- `PUT /gateway/finance/proposals/{id}`
  - Editable only in `Draft` or before submission if status model keeps draft.
- `POST /gateway/finance/proposals/{id}/submit`
- `POST /gateway/finance/proposals/{id}/approve`
  - Supports full approval.
- `POST /gateway/finance/proposals/{id}/partial-approve`
  - Requires `approvedAmount` and feedback.
- `POST /gateway/finance/proposals/{id}/reject`
  - Requires feedback/reason.

### Authorization

- Student: cannot create/review finance proposals.
- Treasurer with system-level `ClubManager`: can create and submit for the owned club.
- `StudentAffairsAdmin`: can review all proposals.
- Actor ID must come from JWT, not request body.

### FE tasks

- Update `finance.api.ts` if route/payload names differ.
- Finance page:
  - proposal list
  - create proposal form
  - review modal for `StudentAffairsAdmin`
  - loading/empty/error states
- Keep settlement/receipt UI as placeholder until Phase 3.

### Acceptance criteria

- Club role can create proposal through Gateway.
- `StudentAffairsAdmin` can approve, partially approve or reject.
- FE can run Finance demo with `VITE_USE_MOCK_DATA=false` for proposal flow.

### Completion record - 2026-07-15

- Implemented proposal lifecycle endpoints through Gateway:
  - `POST /gateway/finance/proposals`
  - `GET /gateway/finance/proposals`
  - `GET /gateway/finance/proposals/{id}`
  - `PUT /gateway/finance/proposals/{id}`
  - `POST /gateway/finance/proposals/{id}/submit`
  - `POST /gateway/finance/proposals/{id}/approve`
  - `POST /gateway/finance/proposals/{id}/partial-approve`
  - `POST /gateway/finance/proposals/{id}/reject`
- Added domain-enforced transitions: `Draft -> PendingApproval -> Approved/PartiallyApproved/Rejected`.
- Invalid transitions return `409`; unauthorized club access returns `403`.
- Actor/reviewer IDs are read from JWT claims and are not accepted from request bodies.
- Finance checks club ownership through Club gRPC `IsClubManager`.
- Added `Treasurer = 3` to club membership roles and Finance authorization projection.
- Non-`StudentAffairsAdmin` list behavior:
  - without `clubId`, users see proposals they created;
  - with `clubId`, Finance verifies management permission through gRPC.
- Added paging metadata for proposal lists.
- Updated FE Finance adapter and mock adapter to the same lifecycle contract.
- Updated Finance UI in English with Draft submission and `StudentAffairsAdmin` full/partial/reject review controls.
- Verification:
  - BE solution build passed with 0 errors;
  - FE production build passed;
  - Historical E2E through Gateway passed for seeded legacy roles; rerun after role migration using `ClubManager`/`StudentAffairsAdmin`/`Student`.
  - Student create returned `403`;
  - duplicate submit returned `409`;
  - full approval, partial approval and rejection returned expected states and amounts.
- No Finance migration was needed in Phase 2 because lifecycle rules use the Phase 1 schema.

Acceptance note: Phase 2 is implemented and self-checked but has not received an independent double-check. Do not mark it finally accepted until another reviewer reruns authorization, transition, paging and FE integration checks.

## 7. Phase 3 - Transactions, Settlement and Receipts

Status: **Blocked by dependency until Phase BE-5 Course Compliance Gate is completed.**

Goal: implement UC-05 and financial transparency.

### Backend API contract

- `GET /gateway/finance/clubs/{clubId}/balance`
- `GET /gateway/finance/transactions?clubId=...`
- `POST /gateway/finance/transactions`
- `POST /gateway/finance/proposals/{id}/settle`
- `POST /gateway/finance/receipts`
  - Can start as metadata-only placeholder if file storage is not ready.

### Backend rules

- Approved proposal can create disbursement transaction.
- Settlement records actual expenses.
- Receipt URL/file metadata is required for expense settlement when available.
- Over-spending must be rejected or require `StudentAffairsAdmin` adjustment.

### FE tasks

- Add balance card.
- Add transaction list.
- Add settlement form.
- Add receipt placeholder/upload UI depending on backend readiness.

### Acceptance criteria

- Finance balance changes after approved/settled transactions.
- `StudentAffairsAdmin` and the owning `ClubManager`/`Treasurer` can see consistent finance history.
- FE no longer needs finance mock for core finance flow.

## 8. Phase 4 - Dashboard API

Goal: implement UC-14 and remove derived/mock dashboard numbers.

### Backend API contract

- `GET /gateway/dashboard/admin/summary`
  - total clubs
  - active clubs
  - member count
  - event count
  - pending reports
  - pending finance proposals
  - approved budget
  - spent budget
- `GET /gateway/dashboard/student/summary`
  - available clubs
  - joined clubs if API exists
  - upcoming events
  - unread notifications
- `GET /gateway/dashboard/club/{clubId}/summary`
  - members
  - pending join requests
  - upcoming activities
  - report status
  - budget balance
  - KPI score

### Data sourcing

- Dashboard service can start as an API aggregator if a separate service is too expensive.
- Do not query other services' databases directly.
- Use REST/gRPC/service clients or add read-model/events later.

### FE tasks

- Add `dashboard.api.ts`.
- Replace derived/mock dashboard values.
- Keep graceful fallback when a metric is unavailable.

### Acceptance criteria

- Dashboard page uses dashboard API with `VITE_USE_MOCK_DATA=false`.
- No hard-coded metric values in dashboard components.

## 9. Phase 5 - Events, Notifications and Background Processing

Goal: align with proposal event-driven requirements after core Finance exists.

### Redis Pub/Sub/Streams events

- `BudgetProposalSubmittedV1`
- `BudgetReviewedV1`
- `BudgetSettledV1`
- `ReportSubmittedV1`
- `ReportReviewedV1`
- `ActivityCreatedV1`

### Notification behavior

- Store notification before SignalR push.
- Push realtime notification through SignalR.
- Optional email notifications for important events.

### Hangfire jobs

- `WeeklyReportReminderJob`
- `MonthlyKPICalculatorJob`
- `UnusedBudgetAlertJob`

### Acceptance criteria

- At least one Finance event is published and consumed by Notification service.
- At least one Hangfire job is registered and visible/runnable.

## 10. Phase 6 - File Upload and Export

Goal: satisfy evidence/receipt and UC-12 export requirements.

### Backend tasks

- File metadata model and storage adapter.
- Upload report evidence.
- Upload finance receipt.
- Export KPI leaderboard/report to PDF or Excel.

### FE tasks

- Replace receipt/evidence URL placeholders with upload controls.
- Add export buttons where backend supports them.

### Acceptance criteria

- User can attach evidence/receipt metadata or files.
- `StudentAffairsAdmin` can export KPI leaderboard or final report artifact.

## 11. Phase 7 - Final Verification

### Required checks

- `dotnet build`
- `docker compose up --build`
- `npm run build`
- Gateway health OK.
- Swagger opens for all services.
- FE works with `VITE_USE_MOCK_DATA=false` for all implemented modules.
- Role test:
  - Student
  - system role `ClubManager` with club role `ClubLeader` or `Treasurer`
  - StudentAffairsAdmin
- Error test:
  - 400 validation
  - 401 unauthenticated
  - 403 forbidden
  - 404 not found
  - 409 invalid state transition

## 12. Maintenance Rule

Every future implementation must update documentation in the same change:

- Backend route/contract/status/role/env change:
  - update `backend_contract_freeze.md`
  - update `backend_gap_completion_plan.md`
- Finance/Dashboard phase progress:
  - update this file
- FE API/UI/mock behavior change:
  - update `fe_completion_plan.md`
- If a task is blocked, document the exact missing endpoint, missing field, or decision needed.
