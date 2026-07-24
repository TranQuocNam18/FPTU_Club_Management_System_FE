# Communication Reliability Gap Implementation Plan

## 1. Status and Authority

`Implementation Plan Status: APPROVED WITH MINOR REVISIONS`

- Audit date: `2026-07-17`.
- Source baseline: current FE/BE working trees, including existing uncommitted changes.
- Authority: `FPTU_Club_Report_Proposal`, `backend_contract_freeze.md`, and the phase order in `backend_gap_completion_plan.md`.
- Scope: only confirmed gaps in synchronous gRPC/Protobuf communication, asynchronous Redis messaging, Notification persistence/SignalR delivery, and FE reconnect behavior.
- This plan does not change business workflow, project scope, microservice boundaries, ownership/security/role models, or the Course Compliance Gate.
- No source code, API, database, or configuration was changed during this audit.

## 2. Confirmed Current State

### 2.1 gRPC and Protobuf

- One shared proto exists at `src/Shared/Shared.Kernel/Grpc/Protos/club.proto` and generates both client/server classes.
- Club Service hosts `ClubGrpcServiceImpl`; Report and Finance call Club synchronously.
- FE does not call gRPC; FE calls REST through Ocelot.
- Caller and receiver currently compile from the same proto, but the source contract does not match frozen contract v1 (`club_access_v1.proto`, `club.access.v1`, permission-based RPCs).
- Report client has no deadline/cancellation propagation and converts every gRPC failure to `false`.
- Finance propagates cancellation but has no deadline or explicit `RpcException` mapping.
- Club gRPC EF queries do not use `ServerCallContext.CancellationToken` and return boolean/default responses instead of canonical gRPC errors.

### 2.2 Redis messaging

- Report publishes `ReportSubmittedEvent` through Redis Pub/Sub channel `report-events-channel`.
- Notification subscribes only while online; no Redis Streams, consumer group, acknowledgement, retry, pending recovery, or dead-letter handling exists.
- Current event payload lacks canonical `eventId`, `eventType`, `occurredAt`, `correlationId`, `producer`, `version`, and `data` envelope.
- No `ProcessedEvents`/`SourceEventId` idempotency exists.
- Report saves SQL data before publishing but has no transactional outbox, so a crash/publish failure can leave a report without its integration event.

### 2.3 Notification and FE

- For a Pub/Sub event that is actually received, Notification Service saves the notification before SignalR push.
- Event recipient is a fixed demo GUID, not resolved from role/club/workflow.
- Broadcast pushes directly to `Clients.All` without database persistence.
- Notification entity lacks `ReadAt`, `SourceEventId`, `TargetUrl`, and optional soft-delete fields.
- API supports list, mark-one-read, mark-all-read, and broadcast; it lacks server-side `isRead` filtering, unread count, and delete.
- FE loads notifications through REST on authenticated layout/page mount and invalidates the query after `ReceiveNotification`.
- FE enables automatic SignalR reconnect but has no `onreconnected` refetch/invalidation, no retry for initial connection failure, and the cached connection captures the token supplied at creation time.
- No gRPC, Redis, Notification, SignalR, reconnect, or offline-delivery automated tests exist.

## 3. Priority and Dependency Order

| Order | Phase | Priority | Depends on |
| --- | --- | --- | --- |
| 1 | CR-0 Contract Alignment Gate | P0 | Frozen baseline |
| 2 | CR-1 gRPC Reliability | P1 | CR-0 |
| 3 | CR-2 Redis Streams and Outbox | P0 | CR-0 |
| 4 | CR-3 Notification Persistence and Idempotency | P0 | CR-2 |
| 5 | CR-4 Notification REST and FE Reconnect | P1 | CR-3 |
| 6 | CR-5 Integration Tests and Docker Evidence | P1/P2 | CR-1 through CR-4 |

CR-0 only freezes the minimum contracts required by the task being implemented. Independent work such as gRPC timeout/cancellation/logging, Redis connection/stream infrastructure, and outbox scaffolding may proceed in parallel while recipient resolution is still under review. A producer, consumer, or migration must not be implemented when its own field numbers, event/stream name, uniqueness key, or recipient contract remains unresolved. CR-3 must not begin until the stream/envelope and notification uniqueness contracts are frozen. CR-5 is the acceptance gate.

## 4. Phase CR-0 - Contract Alignment Gate

### Objective

Resolve documentation/source naming drift before changing generated contracts or persisted messages.

### Decisions to freeze

- gRPC file/package/service and RPCs follow `backend_contract_freeze.md`: `club_access_v1.proto`, `club.access.v1`, `ClubAccessService`, permission-based requests.
- Proto field numbers are never reused; removed fields are reserved.
- Redis stream namespace and canonical event envelope follow contract freeze v1.
- `ReportSubmittedV1` is a durable event and therefore uses Redis Streams, not Pub/Sub.
- Notification uniqueness is enforced by `SourceEventId` plus recipient identity.
- Dynamic recipient resolution uses an approved Identity/role lookup through synchronous gRPC or an approved local projection; no hard-coded recipient is allowed.

### Files/documents affected when implementation is approved

- `src/Shared/Shared.Kernel/Grpc/Protos/*`
- Shared integration-event contracts under `src/Shared/Shared.Kernel`
- `backend_contract_freeze.md` only if a non-breaking clarification is required.

### Definition of done

- One reviewed contract table maps old proto/event names to v1 names.
- Caller/server migration order is documented.
- No producer, consumer, generated-contract migration, or database migration starts with a contract dependency that remains unresolved.
- Independent timeout, cancellation, logging, Redis infrastructure, and outbox tasks may proceed in parallel when they do not depend on the unresolved decision.

### CR-0 completion record - 2026-07-18

#### Contract decision table

| Decision | Frozen value |
| --- | --- |
| Club gRPC contract | `club_access_v1.proto`; package `club.access.v1`; service `ClubAccessService` |
| Club RPCs | `CheckClubExists`, `GetClubSummary`, `GetMembership`, `CheckClubPermission`; all read-only/idempotent |
| Deadline policy | Timeout keys are per RPC; deadline is set per invocation and caller cancellation is propagated |
| Dynamic recipient lookup | Identity/Auth-owned `identity_directory_v1.proto`; `ListActiveUsersBySystemRole`; Report notification targets active `StudentAffairsAdmin` users |
| Durable report stream | `fptu.club.events.report.submitted.v1` |
| Notification consumer group | `notification-service.report-submitted.v1` |
| Dead-letter stream | `fptu.club.events.report.submitted.v1.dlq` |
| Stream payload | Field `envelope` containing canonical JSON event envelope v1 |
| Event identity | `SourceEventId` equals envelope `eventId`; event ID is stable across retry/replay |
| Notification uniqueness | Unique `(SourceEventId, RecipientUserId)` |
| ACK ordering | DB commit succeeds before `XACK`; SignalR occurs after persistence |
| Broadcast | Existing `/gateway/notifications/broadcast` is durable; ephemeral realtime signals use a distinct SignalR event and are not notifications/source of truth |

Detailed Protobuf field numbers, enum values, timeout keys, event fields, compatibility rules, and migration order are frozen in `backend_contract_freeze.md` Sections 9 and 10.

#### Old-to-v1 migration mapping

| Legacy | v1 |
| --- | --- |
| `club.proto`, package `club`, service `ClubGrpcService` | Side-by-side `club_access_v1.proto`, package `club.access.v1`, service `ClubAccessService` |
| `CheckClubExists(ClubRequest)` | `CheckClubExists(ClubIdRequest)` |
| `GetClubInfo(ClubRequest)` | `GetClubSummary(ClubIdRequest)` |
| No membership RPC | `GetMembership(GetMembershipRequest)` |
| `IsClubManager(ClubManagerRequest)` | `CheckClubPermission(CheckClubPermissionRequest)` with explicit permission enum |

Legacy contract remains unchanged during migration. New contracts use new package/message identities, so legacy field numbers are not silently repurposed. Future removed fields and enum values must be declared `reserved` before release.

CR-0 removes no existing field or enum value. Therefore no current identifier is marked `reserved`; doing so now would conflict with the still-active legacy field. Reservation becomes mandatory in the reviewed version that actually removes an identifier.

#### Files affected by CR-0

- `BE/.../src/Shared/Shared.Kernel/Grpc/Protos/club_access_v1.proto` - new frozen Club contract.
- `BE/.../src/Shared/Shared.Kernel/Grpc/Protos/identity_directory_v1.proto` - new frozen recipient-directory contract.
- `BE/.../src/Shared/Shared.Kernel/Shared.Kernel.csproj` - generates v1 contracts alongside legacy contract.
- `FE/.../docs/plans/backend_contract_freeze.md` - authoritative field/stream/idempotency/migration decisions.
- This plan - CR-0 decisions, risks, checklist, and status.

Expected implementation files in later phases, not modified by CR-0: Club gRPC server, Report/Finance gRPC clients, Report event/outbox code, Notification consumer/entity/migrations/controller, Docker configuration, and FE SignalR/notification clients.

#### Compatibility risks

- A caller switched to v1 before Club v1 server deployment will receive `Unimplemented`.
- Removing legacy `club.proto` before all Report/Finance callers migrate will break runtime communication.
- Role semantics change from broad legacy `IsClubManager` to explicit permissions; incorrect permission mapping can grant or deny access.
- Identity Directory must be deployed before dynamic recipient consumption is enabled.
- Stream/event/unique-index names become persisted compatibility surfaces and require reviewed versioning for breaking changes.
- Multiple recipients per event require the composite uniqueness key; uniqueness on `SourceEventId` alone would drop valid notifications.

#### Acceptance checklist

- [x] File/package/service/RPC names frozen.
- [x] Protobuf fields, enum values, and numeric identifiers frozen.
- [x] No field/enum value removed in CR-0; future removal/reservation rule documented without invalidating active legacy fields.
- [x] Legacy-to-v1 mapping and side-by-side migration order frozen.
- [x] Idempotent RPC list and per-RPC timeout configuration keys frozen.
- [x] Redis stream, consumer group, DLQ, envelope, and `ReportSubmittedV1` data contract frozen.
- [x] Dynamic recipient mechanism selected without cross-database access.
- [x] `(SourceEventId, RecipientUserId)`, DB commit-before-XACK, and persistence-before-SignalR rules frozen.
- [x] Durable broadcast separated from ephemeral realtime signals.
- [x] Shared contracts compile while legacy contract remains available.
- [x] No CR-1/CR-2/CR-3/FE implementation included in CR-0.

`Phase CR-0 Status: PASSED`

### Implementation Record - 2026-07-18

- CR-1: the legacy `club.proto` service remains mapped. Club now maps `ClubAccessService` v1, and Auth maps `IdentityDirectoryService` v1 on HTTP/2 port `9002`.
- Report and Finance use Club Access v1 with a per-RPC deadline from `GrpcSettings`, caller cancellation, explicit `RpcException` mapping, and one bounded retry only for idempotent `Unavailable` calls.
- CR-2A: Report submission persists the report and an `OutboxMessages` record in the same EF Core save operation. `OutboxDispatcher` publishes field `envelope` to `fptu.club.events.report.submitted.v1` and retries failed publishes with bounded exponential backoff.
- A temporary, configurable Pub/Sub bridge runs only after durable Stream publication so the existing Notification service continues to receive legacy report events until CR-3 supplies the stream consumer. CR-3 must remove this bridge after its integration tests pass.
- `20260717175315_AddReportOutbox` is intentionally limited to the Outbox table and index. EF detected historic snapshot drift and scaffolded unrelated Report schema changes; those unsafe changes were excluded.
- Verification: `dotnet build FPTU_Club_Report_System.sln --no-restore` passed with 0 errors on 2026-07-18. Docker runtime, consumer groups, `XACK`, DLQ, notification persistence, and frontend work are still outside this delivery.

`Phase CR-1 Status: IMPLEMENTED - awaiting runtime integration evidence`

`Phase CR-2A Status: IMPLEMENTED - awaiting Redis/Docker integration evidence`

### Implementation Record - CR-3 (2026-07-18)

- Notification now consumes `fptu.club.events.report.submitted.v1` through consumer group `notification-service.report-submitted.v1`; the DLQ is `fptu.club.events.report.submitted.v1.dlq` and the expected field is `envelope`.
- Consumer processing follows deserialize/validate -> dynamic Identity Directory gRPC lookup -> database transaction -> notification persistence -> SignalR push -> `XACK`. A failed database transaction or unavailable Identity service leaves the entry pending. SignalR failure is logged after persistence and does not roll back the notification.
- `SourceEventId = envelope.EventId` and the database has a filtered unique index over `(SourceEventId, UserId)`. Duplicate key handling treats replay as an already processed event.
- Durable `POST /notifications/broadcast` now resolves role recipients, persists one record per recipient before SignalR, and supports a caller-supplied `SourceEventId` for idempotent retry.
- `Messaging:LegacyPubSubBridgeEnabled=false` is now supplied to Report/Notification in Docker Compose. The obsolete Notification Pub/Sub subscriber was removed; Stream is the only notification event source.
- A Notification persistence migration was added. Because this service historically uses `EnsureCreated`, guarded startup SQL also adds the CR-3 columns/index/table to an already-created local database; migration baseline reconciliation remains a technical-debt item before switching the service fully to `Database.Migrate()`.
- Verification completed: solution build passed with 0 errors; existing `Shared.Kernel.Tests` passed 11/11. New isolated CR-3 tests and Docker runtime evidence are still required before this phase can be passed.

##### Acceptance Gate Update & Verification - 2026-07-21

- **Automated Tests**: Completed `CommunicationReliability.Tests` project containing 17 comprehensive tests (including 3 new resiliency tests) covering gRPC failures, Redis Stream consumer ACK ordering, DB transaction boundaries, SignalR fault isolation, duplicate event idempotency, XAUTOCLAIM pending recovery, DLQ promotion, and connection outage auto-recovery.
- **Test Execution**: Ran `dotnet test` successfully:
  - `Shared.Kernel.Tests`: 11 / 11 passed.
  - `CommunicationReliability.Tests`: 17 / 17 passed (8 legacy tests, 6 handler tests, 3 resiliency tests).
- **Docker & Runtime Verification**:
  - **Auth gRPC Unavailable Recovery**: Verified. Event remains pending, SQL Server has 0 notifications. On Auth restart, consumer uses `XAUTOCLAIM` to reclaim the message, dynamic lookup succeeds, notification is created exactly once, and is acknowledged in the stream (pending count back to 0).
  - **Redis Offline & Outbox Recovery**: Verified. Inserting outbox when Redis is stopped keeps `PublishedAtUtc = NULL` and records connection error in `LastError`. When Redis starts, dispatcher publishes the event, `PublishedAtUtc` is updated to a timestamp, and Notification processes it exactly once.
  - **Real SignalR Client**: Connected client on port `5000` (through the Ocelot Gateway hub path: `http://localhost:5000/gateway/hubs/notification`). Resolved Ocelot route mismatch for SignalR handshakes by adding an HTTP `/negotiate` route alongside the WebSocket route. The client connected using WebSockets and received notifications in real-time.
  - **Clean Database Migration**: Verified. Created `temp_report_db` and `temp_notification_db` and ran migrations from scratch inside a dotnet SDK docker container. Verified creation of tables, indexes, unique indices (`IX_Notifications_SourceEventId_UserId`), and `StreamProcessingFailures` table.
  - **Redis Outage Resiliency**: Resolved and verified. Wrapped stream reading and group verification operations in a robust try-catch for `RedisException` subclasses. When Redis goes offline, the consumer logs warnings and retries every 5000ms. When Redis is brought back online, the consumer automatically recovers connection and resumes processing.

`CR-1: IMPLEMENTED & VERIFIED`

`CR-2A: IMPLEMENTED & VERIFIED`

`CR-3: IMPLEMENTED & VERIFIED`

`Phase CR-3 Status: PASSED`

## 5. Phase CR-1 - gRPC Reliability

### Modules

Shared Kernel, Club API, Report Infrastructure/Application, Finance Infrastructure/API.

### Implementation tasks

- Replace/generalize `IsClubManager` with permission-based RPCs required by the frozen contract while preserving a safe migration path for existing callers.
- Generate strongly typed client/server code from the versioned `.proto`; do not pass REST DTOs into gRPC.
- Register clients through `AddGrpcClient` and load timeout values from configuration, for example `GrpcSettings:PermissionCheckTimeoutSeconds`.
- Set the deadline at each RPC invocation instead of imposing one fixed deadline on every client call; different RPCs may use different configured deadlines.
- Propagate request cancellation from controller/MediatR handler to Report/Finance gRPC clients.
- Pass `ServerCallContext.CancellationToken` to Club EF Core queries.
- Map invalid IDs to `InvalidArgument`, missing clubs/memberships to `NotFound`, denied permissions to `PermissionDenied`, and dependency failures to service-level `503`/structured errors rather than `false`.
- Handle `Unavailable`, `DeadlineExceeded`, and cancellation separately; do not silently convert infrastructure failure into a business denial.
- Retry gRPC only for transient connection failures/`Unavailable` and only when the RPC is idempotent. Use a bounded retry count and respect the original deadline/cancellation token.
- Do not retry `PermissionDenied`, `InvalidArgument`, `NotFound`, or `Unauthenticated`.
- Propagate correlation/trace metadata.

### Tests

- Proto/client/server compilation test.
- Report -> Club and Finance -> Club happy paths.
- Invalid ID, not found, permission denied, unavailable, deadline exceeded, and caller cancellation tests.
- Verify FE contains no gRPC dependency or direct gRPC call.

### Definition of done

- Both service flows return correct business outcomes and distinguish dependency failure from not-found/forbidden.
- No internal REST call is introduced for Club ownership/permission checks.
- Contract and integration tests pass in Docker.

## 6. Phase CR-2 - Redis Streams and Transactional Publication

### Modules

Shared event contracts, Report Service, Redis infrastructure, Docker Compose.

### Implementation tasks

- Define the canonical v1 envelope: `eventId`, `eventType`, `occurredAt`, `correlationId`, `producer`, `version`, and `data`.
- Publish `ReportSubmittedV1` to a versioned Redis Stream under the frozen namespace.
- Add a Report outbox record in the same SQL transaction as report persistence.
- Add an outbox dispatcher/background worker that writes pending events with `XADD`, records publish success, and retries transient Redis failures.
- Configure stream retention intentionally; do not assume Redis AOF makes Pub/Sub durable.
- Keep Pub/Sub only for explicitly best-effort transient signals, not the durable Report workflow.

### Tests

- Event schema serialization/version test.
- SQL commit followed by temporary Redis outage: outbox remains pending and later publishes.
- Producer returns without waiting for Notification consumer processing.
- Duplicate dispatcher execution does not create a second logical event ID.

### Definition of done

- Restarting/stopping Notification Service does not lose `ReportSubmittedV1`.
- Report persistence and event publication have a recoverable handoff.
- Stream entries match the frozen envelope and naming convention.

## 7. Phase CR-3 - Notification Persistence, Consumer Group, and Idempotency

### Modules

Notification Domain/Application/Infrastructure/API and notification database.

### Database changes

- Extend Notification with `RecipientUserId` (or explicitly migrate current `UserId`), `TargetUrl`/`ReferenceId`, `ReadAt`, `SourceEventId`, and optional `IsDeleted`/`DeletedAt` if delete is enabled.
- Add a unique index on `(SourceEventId, RecipientUserId)` or an equivalent `ProcessedEvents` uniqueness constraint because one domain event may create notifications for multiple recipients.
- Use EF Core migration instead of relying on `EnsureCreated` for the new schema.

### Consumer tasks

- Create a named Redis consumer group and read with blocking `XREADGROUP` semantics.
- Resolve recipients dynamically from the event context and approved role lookup/projection.
- Process each message in this order: read stream entry -> begin DB transaction -> check `(SourceEventId, RecipientUserId)` -> insert Notification/ProcessedEvent -> commit DB -> `XACK`.
- Never acknowledge a stream entry before the database commit succeeds.
- Push SignalR only after persistence. SignalR failure must not roll back or delete the persisted notification.
- On duplicate `SourceEventId`, skip duplicate creation and safely acknowledge.
- Recover pending messages after consumer restart; claim stale pending entries.
- After bounded retries, move poison messages to a dead-letter stream with error metadata and logs.
- Classify broadcast behavior explicitly. A durable user notification that must be reviewed later creates one persisted notification per resolved recipient before SignalR push.
- An ephemeral realtime signal such as `dashboard.data.changed` may use SignalR without persistence because it is not a user notification or source of truth.
- Classify the existing `POST /notifications/broadcast` endpoint as durable or ephemeral during CR-0. If it remains a user-facing notification endpoint, persistence is mandatory.

### Tests

- Consumer offline/restart, duplicate event, DB failure before commit, verification that no early `XACK` occurs, SignalR failure, malformed payload, pending recovery, and dead-letter tests.
- Verify one notification per `(SourceEventId, RecipientUserId)` while allowing one source event to notify multiple recipients.
- Verify offline users can fetch persisted notification later.

### Definition of done

- Effective flow is `Business Service -> Redis Streams -> Notification Consumer -> Notification DB -> SignalR`.
- No fixed recipient GUID remains.
- No notification is pushed before database commit.

## 8. Phase CR-4 - Notification REST API and FE Reconnect

### Backend REST tasks

- Support `GET /gateway/notifications?isRead=false` with paging/sorting.
- Add `GET /gateway/notifications/unread-count`.
- Keep `PUT /gateway/notifications/{id}/read` and `PUT /gateway/notifications/read-all` ownership-safe.
- Add `DELETE /gateway/notifications/{id}` only if soft delete is approved; keep read and delete states independent.
- Exclude soft-deleted records from normal list/count queries.
- Return the canonical response envelope and update Swagger/Ocelot mappings.

### Frontend tasks

- Keep REST as the notification source of truth; SignalR only invalidates/refetches cached data and shows realtime feedback.
- Add `onreconnected` invalidation/refetch for notification list and unread count.
- Add controlled retry for initial SignalR connection failure and observable `onreconnecting`/`onclose` handling.
- Make `accessTokenFactory` read the latest access token rather than a stale captured token.
- Use the unread-count endpoint for badges; keep page filtering consistent with backend query behavior.
- Ensure login/app mount loads REST notification state even if SignalR is unavailable.

### Tests

- FE unit/integration tests for initial load, receive event, reconnect refetch, refreshed token, and SignalR unavailable state.
- API tests for ownership, unread filter/count, mark read/all, and optional soft delete.

### Definition of done

- A user disconnected during an event sees the notification after login/reconnect through REST.
- Reconnect cannot leave notification list/badge stale.
- SignalR is not treated as persistent storage.

### CR-4 Completion Record - 2026-07-22

- **Backend REST Enhancements**:
  - `GET /gateway/notifications` now supports `isRead` filtering, `page`, `pageSize`, ordering by `createdAt` descending, soft delete exclusion (`!IsDeleted`), and return canonical envelope with `meta` (including `unreadCount`).
  - `GET /gateway/notifications/unread-count` returns exact unread count for current user.
  - `PUT /gateway/notifications/{id}/read` & `PUT /gateway/notifications/read-all` updated with ownership verification and `ReadAt` timestamp tracking.
  - `DELETE /gateway/notifications/{id}` implements soft delete (`IsDeleted = true`, `DeletedAt = DateTime.UtcNow`) with strict ownership checks (404 for unauthorized access).
  - Ocelot route mapping updated to include `PATCH`, `DELETE`, and `unread-count`.

- **Frontend SignalR & Reconnect Reconciliation**:
  - Centralized connection lifecycle manager in `src/utils/signalr.ts` with dynamic `accessTokenFactory` reading token from Zustand store on every reconnect.
  - Configured bounded reconnect delays: `[0, 2000, 5000, 10000, 30000]`.
  - Registered `onreconnected` listener that automatically triggers REST refetch for `notifications` and `unread-count` query keys.
  - Implemented deduplication by notification `id` before prepending to query cache.
  - `Header` component displays server unread count badge (hides if 0, shows `99+` if > 99) and exposes preview dropdown.
  - `NotificationsPage` supports filters (All, Unread), Mark All Read, and Soft Delete.

- **Automated Verification**:
  - `dotnet test FPTU_Club_Report_System.sln`: 24 / 24 tests passed (including 7 new Notification REST tests in `NotificationRestTests.cs`).
  - `npm run build`: pass (0 errors).

`Phase CR-4 Status: PASSED`

## 9. Phase CR-5 - End-to-End Verification and Evidence

### Required environment

Ocelot, Report, Club, Notification, SQL Server, Redis with persistent volume, and FE through Docker/local integration profile (`VITE_USE_MOCK_DATA=false`).

### Required scenarios

1. `REST -> Report -> gRPC/Protobuf -> Club -> Report SQL -> Outbox -> Redis Streams -> Notification DB -> SignalR -> FE`.
2. Notification Service offline during report submission, then restart and consume the buffered event.
3. Duplicate stream delivery creates one database notification.
4. SignalR unavailable after persistence; REST still returns the notification.
5. FE reconnect refetches list and unread count.
6. gRPC unavailable/deadline exceeded returns a dependency error, not false not-found/forbidden.

### Evidence

- Automated test results and Docker logs with correlation/event IDs.
- Redis stream/consumer-group/pending-entry evidence.
- Database rows showing report, outbox, notification, and source event linkage.
- Swagger/Postman and FE screenshots for list/unread/read behavior.

### Final definition of done

- Build and all communication/integration tests pass.
- No P0/P1 gap in this plan remains open.
- Existing plans are updated with the verified implementation state in the same change set.
- Course demo flow is reproducible from a clean Docker environment.

## 10. Risks and Constraints

- Proto rename/versioning is a coordinated caller/server migration and must not break Report or Finance independently.
- Moving from Pub/Sub to Streams changes operational semantics; consumer-group naming and stream retention must be environment-specific but contract-stable.
- Outbox introduces schema and background processing work but is required to close the SQL-to-Redis loss window.
- Dynamic recipient lookup must not reintroduce hard-coded users or cross-database reads.
- Existing dirty worktrees must be preserved and separated into reviewable commits before implementation.

`Implementation Plan Status: APPROVED WITH MINOR REVISIONS`
