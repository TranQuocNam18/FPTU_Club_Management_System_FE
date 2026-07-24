# Backend Implementation and Gap Completion Plan

## 1. Muc tieu va pham vi

Tai lieu nay la plan ban giao cho team Backend de hoan thien FPTU Club Report System. Tai lieu chi mo ta gap, contract va acceptance criteria; khong uy quyen cho Frontend sua source Backend.

Plan duoc doi chieu theo cac nguon sau:

1. `FPTU_Club_Report_Proposal.md`: nguon chinh cho nghiep vu va pham vi san pham.
2. `PRN232- LAB 1 - Rest API Basics and Deployment.pdf`: REST design, model separation, list API, response format, Docker va Swagger.
3. `LAB 2 - Advanced REST API & Security.pdf`: validation, routing, versioning, middleware, JWT, refresh token va Swagger security.
4. `LAB 3 - gRPC & Microservices Architecture.pdf`: database-per-service, gRPC, API Gateway, Docker Compose, logging va kiem thu.
5. `PRN232 - Final Assignment`: rubric chinh thuc cho REST, background job, Redis message broker, gRPC, Docker va deliverables.
6. Source BE hien tai: dung de xac dinh trang thai da implement.
7. FE mock contract: dung de thong nhat du lieu ban giao, khong tu dong tro thanh yeu cau nghiep vu.

Nhung quyet dinh can thong nhat truoc khi implement da duoc chot tai `docs/plans/backend_contract_freeze.md`. Tai lieu contract freeze la nguon chinh cho role, status, response envelope, route, JWT, gRPC, event, migration va environment convention.

Thu tu uu tien khi co mau thuan:

- Nghiep vu: proposal va quyet dinh da duoc team thong nhat.
- Tieu chi ky thuat mon hoc: Final Assignment rubric, sau do den Lab 1, Lab 2 va Lab 3.
- Ten endpoint/field: thong nhat bang OpenAPI contract giua FE va BE.

## 2. Quyet dinh nghiep vu can ghi ro

### 2.1 Authentication baseline

Proposal va implementation baseline thong nhat su dung email/password, verification code qua Brevo, JWT access token va refresh token.

Contract v1 da chot:

- Email/password + Brevo la contract chinh thuc.
- User phai verify email truoc khi login.
- Domain email lay tu `Email__AllowedDomains`; demo mac dinh cho phep `fpt.edu.vn` va `fe.edu.vn`, khong hard-code trong controller.

### 2.2 Role he thong va role trong CLB la hai khai niem khac nhau

Proposal baseline dinh nghia system role chinh thuc: `StudentAffairsAdmin`, `ClubManager`, `Student`; club role: `ClubLeader`, `Treasurer`, `Member`.

BE hien tai dung legacy system roles `Admin`, `Advisor` va club roles `Manager`, `President`. Migration chinh thuc: `Admin`/`Advisor` -> `StudentAffairsAdmin`, `President` -> `ClubLeader`; giu `Treasurer`/`Member`; `Manager` phai duoc phan tich tung record de migrate hoac loai bo, khong tiep tuc la club role chung.

## 3. Current Backend Snapshot

### 3.1 Da co

- Auth: register, login, refresh token, me, change password, forgot password, reset password.
- Clubs: list/detail/create/update/soft delete/review.
- Membership: list member, join, update role/status, remove member.
- Events trong Club service: list by club, create, update, cancel, permanent delete.
- Reports: create, update, review, list by club, detail.
- Notifications: list cua user, mark read, mark all read, SignalR hub.
- JWT, role authorization, BCrypt, global exception middleware va Swagger Bearer da co o cac service chinh.
- Report service co gRPC client kiem tra club va quyen manager.
- Docker Compose hien chay Gateway, Auth, Club, Report, Finance, Notification, SQL Server va Redis; cac health endpoint da tra `200` trong lan audit gan nhat.

### 3.2 Gateway hien tai

Ocelot hien expose cac nhom route:

- `/gateway/auth/{everything}`
- `/gateway/clubs/{everything}`
- `/gateway/reports/{everything}`
- `/gateway/users/{everything}`
- `/gateway/events/{everything}`
- `/gateway/kpi/{everything}`
- `/gateway/finance/{everything}`
- `/gateway/notifications/{everything}`
- `/gateway/hubs/notification`

Dashboard hien van la placeholder `501`; cac route Finance health/proposal da hoat dong. FE chi duoc goi route da co trong Gateway contract.

Ocelot la lua chon hop le theo Lab 3. Khong bat buoc doi sang YARP chi de khop ten cong nghe trong proposal, tru khi giang vien/team yeu cau dung dung YARP.

### 3.3 Chua co hoac chua du

- User management da co nhung con legacy role migration va authorization hardening.
- Finance proposal lifecycle da co; transaction, receipt va settlement workflow con thieu.
- KPI rules/leaderboard da co nhung Semester model, score history va calculation theo rule con thieu.
- Dashboard/statistics API.
- Upload/file storage cho logo, report evidence va receipt.
- Auth verify/resend va Brevo da co; cooldown/rate limit va production hardening con thieu.
- Redis producer/consumer hien moi co `ReportSubmittedEvent` o muc co ban; can hoan thien recipient resolution, idempotency, logging va demo evidence.
- Hangfire jobs theo proposal.
- Serilog/request logging day du theo Lab 3.
- REST collection capabilities day du theo Lab 1.

## 4. P0 - Blocking de tich hop FE qua Gateway

### 4.1 Hoan thien Gateway

Them route cho service da co:

- `/gateway/events/{everything}` -> Club service `/api/v1/events/{everything}`.
- `/gateway/notifications/{everything}` -> Notification service `/api/v1/notifications/{everything}`.

Them route Users, Finance, KPI, Dashboard sau khi module tuong ung ton tai. Gateway phai:

- Validate JWT truoc khi forward protected request theo Lab 3.
- Forward dung HTTP method, query string va status code.
- Co CORS dung origin FE.
- Ho tro SignalR WebSocket.
- Khong expose truc tiep internal service/database ra FE trong production contract.

### 4.2 Auth, verify email va Brevo

BE hien dang tao user `IsActive = true`, khong co email verification; forgot password tra reset code trong response. Can chuyen thanh flow:

1. Register tao account chua verify.
2. Tao verification token co expiry, one-time use va luu an toan.
3. Gui link/code qua Brevo.
4. Verify thanh cong moi cho login neu policy bat buoc verify.
5. Email ton tai nhung chua verify: cho resend, co cooldown/rate limit.
6. Email da verify: tra loi than thien, goi y login/forgot password.
7. Forgot password gui token/code qua email, khong expose trong response/log production.
8. Reset token phai co expiry, one-time use va invalid sau khi doi password.

Contract FE dang can:

- `POST /gateway/auth/register`
- `POST /gateway/auth/login`
- `POST /gateway/auth/verify-email`
- `POST /gateway/auth/resend-verification-email`
- `POST /gateway/auth/forgot-password`
- `POST /gateway/auth/reset-password`
- `POST /gateway/auth/refresh-token`
- `GET /gateway/auth/me`

Ten endpoint co the thay doi neu OpenAPI contract duoc cap nhat dong bo. JWT secret va Brevo key phai lay tu environment/secret store, khong commit vao repo.

### 4.3 Users va phan quyen

Can hoan thien API cho `StudentAffairsAdmin`:

- List/search/filter/sort/page user.
- User detail.
- Activate/deactivate.
- Gan system role va membership role theo role matrix.
- Bo nhiem system role `ClubManager` va club roles `ClubLeader`/`Treasurer` cho CLB.
- Chan privilege escalation va chan user thuong sua role cua minh.

BE phai lay actor tu JWT claim; khong nhan `performedBy`, `reviewedBy` hay actor user ID tu payload FE.

### 4.4 Membership approval

Join request va approve/reject endpoint da co; can hoan thien contract va ownership:

- List join requests theo CLB.
- Approve request.
- Reject request kem reason bat buoc.
- Khong dung update role nhu thay the semantic cho approve/reject.
- Chi `ClubLeader` cua dung CLB hoac `StudentAffairsAdmin` hop le moi duoc xu ly.

### 4.5 Contract mismatch con lai

- Auth verify/resend, member approve/reject, Events, Notification, Users, KPI va Finance proposal route da co.
- Dashboard van la placeholder `501`.
- Finance transaction/settlement, Semester, full Activity workflow, Report revision va dynamic notification recipient con thieu.
- FE real mode van can sua field mapping va chi goi route da ready.

## 5. P1 - Nghiep vu bat buoc theo proposal

### 5.1 Club va membership

Bo sung/hoan thien contract Club:

- `name`, `description`, `logoUrl`, `category`, `status`, `establishedDate`.
- Response co member count va thong tin ban chu nhiem khi UI can.
- `StudentAffairsAdmin` tao CLB, thay doi trang thai `PendingApproval`/`Active`/`Suspended`/`Inactive` va bo nhiem ban chu nhiem.
- Club-level roles chinh thuc: `ClubLeader`, `Treasurer`, `Member`.

Social/contact fields la optional; `StudentAffairsAdmin` la role chinh thuc cho luong tao/duyet va quan tri CLB.

### 5.2 Activities/Events

Proposal bat buoc lich hop, sinh hoat va su kien. Activity can co:

- `clubId`, `title`, `description`, `startTime`, `endTime`, `location`, `status`.
- Workflow chinh thuc: `Draft` -> `PendingApproval` -> `Approved` hoac `Rejected` -> `Completed` hoac `Cancelled` theo transition hop le.
- List public upcoming activities va list theo CLB.
- `ClubLeader` chi sua/submit/huy/complete activity cua CLB minh theo ownership va transition rule.
- Lien ket report va budget proposal voi `activityId` khi phu hop.

Activity co submit/review workflow. `ClubLeader` tao va submit; `StudentAffairsAdmin` approve/reject; business layer enforce system role, club ownership va transition matrix.

### 5.3 Periodic activity reports va KPI scoring

Can ho tro:

- Draft va submit report tuan/thang/hoc ky.
- Link tai lieu va attachment/evidence.
- Period, deadline, submittedAt, reviewedAt va late flag.
- `StudentAffairsAdmin` review theo `Approved`, `RequestRevision` hoac `Rejected`, kem feedback va KPI points khi phu hop.
- Pending queue va list/filter theo club, status, type, period/semester.
- ClubManager khong duoc review report cua chinh minh.
- Actor review lay tu JWT claim.
- Report co the tham chieu activity.

### 5.4 Finance

Can implement Finance service/database rieng theo proposal:

- Budget proposal gan activity, proposer va line items/budget detail.
- Requested amount, approved amount va status `Draft`/`PendingApproval`/`Approved`/`PartiallyApproved`/`Rejected`.
- `StudentAffairsAdmin` approve full, partial hoac reject kem feedback.
- Transaction/settlement sau su kien.
- Receipt URL/file metadata va doi chieu hoa don.
- Theo doi balance/allocated/spent cua CLB.
- Authorization cho system role `ClubManager` co club role `Treasurer` cua dung CLB.

### 5.5 KPI

Report & KPI service can co:

- KPI criteria CRUD theo hoc ky.
- Max points, weight va rule cong/tru diem.
- KPI score history kem ly do/nguon phat sinh.
- Club KPI detail va leaderboard theo hoc ky.
- Monthly aggregation.
- Manual adjustment co audit trail.

### 5.6 Notifications va broadcast

Can co:

- Notification center: list, unread/filter, mark read, mark all.
- Admin broadcast den toan he thong, role hoac CLB.
- SignalR payload contract thong nhat voi FE.
- In-app va email cho cac event bat buoc.
- Luu notification truoc khi push realtime de user offline van doc duoc.

### 5.7 Dashboard va export

Day la requirement bat buoc, khong phai nice-to-have:

- Admin dashboard: club count, member count, allocated/spent budget, event count, pending reports.
- Club workspace: member/join request, upcoming activity, report deadline, budget va KPI.
- KPI leaderboard va export PDF/Excel theo UC-12.
- Export report/finance/member list neu nam trong man hinh nghiep vu da thong nhat.

## 6. P1 - Chuan REST API theo Lab 1 va Lab 2

### 6.1 Layering va model separation

- Controller chi bind request, authorize va tra response; khong chua business rule/data access.
- Business rule nam trong Application/Service layer.
- Repository/Infrastructure chi xu ly persistence/integration.
- Tach Entity, business/domain model, Request DTO va Response DTO.
- Khong tra EF Entity truc tiep ra API.

Clean Architecture hien tai co the dat muc tieu nay; khong can refactor ve dung ten project `Services/Repositories` neu trach nhiem da tach ro.

### 6.2 REST resource design

- URL dung plural resource nouns va `/api/v1/...`.
- Dung route/nested resource ro rang, vi du `/clubs/{clubId}/members`.
- GET detail tra 404 neu khong ton tai.
- POST create nen tra 201 va resource/identifier vua tao.
- PUT/PATCH/DELETE phai dung status code nhat quan.
- Action route nhu approve/reject/submit duoc chap nhan cho state transition, nhung phai thong nhat naming va method.

### 6.3 Tat ca list API

Theo Lab 1, list API can ho tro khi phu hop:

- `search`/filter.
- `sort` nhieu field va asc/desc.
- `page`, `pageSize`.
- `fields` selection.
- `expand` related resources.
- Pagination metadata: page, pageSize, totalItems, totalPages.

Ap dung toi thieu cho users, clubs, members/join requests, activities, reports, finance proposals/transactions, KPI leaderboard va notifications. Can whitelist field sort/select/expand de tranh truy van tuy y va lo du lieu.

### 6.4 Response va error format

Thong nhat envelope cho moi service, vi du:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {},
  "errors": null,
  "pagination": null
}
```

Hien Notification response khac shape voi cac service dung `ApiResponse<T>`. Can thong nhat success/error/pagination va status code 200, 201, 400, 401, 403, 404, 409, 422 neu team su dung, 500. Khong expose stack trace/internal detail.

### 6.5 Binding, validation va content negotiation

- Dung ro `[FromRoute]`, `[FromQuery]`, `[FromBody]`, va header binding khi can request/correlation ID.
- Validation attribute cho required, length, range, email, phone/regex neu co.
- Co it nhat mot FluentValidation validator va mot custom validation rule theo Lab 2.
- Business validation van dat trong Application/Service, khong chi dua vao attribute.
- Ho tro JSON va XML content negotiation theo Lab 2; format khong ho tro tra 406 va cau hinh dong nhat tren moi service.

### 6.6 Versioning, middleware, logging va Swagger

- Route hien co `/api/v1`, nhung can cau hinh/chung minh API versioning theo yeu cau Lab 2 neu rubric doi hoi package/version explorer.
- Global exception middleware va consistent error response cho moi service.
- Request logging: path, method, status code, execution time; uu tien Serilog theo Lab 3.
- Correlation/request ID xuyen Gateway, REST va gRPC.
- Swagger/OpenAPI cho tung service, mo ta request/response/status code.
- Swagger Bearer Authorize phai test duoc protected endpoint.

## 7. P1 - Microservices va gRPC theo Lab 3

### 7.1 Service boundaries va database ownership

- Moi service la ASP.NET Core Web API doc lap, co database/schema ownership rieng.
- Cam truy cap truc tiep database cua service khac.
- Identity/Auth, Club, Report & KPI, Finance va Notification phai co ranh gio ro.
- Cross-service query dung gRPC hoac contract da thong nhat; event-driven flow dung message broker.

### 7.2 gRPC

BE da co Report -> Club gRPC cho club existence/manager check. Can dam bao:

- Co `.proto` trong source va version contract.
- Co gRPC server va strongly typed client.
- Deadline/timeout, cancellation va mapping error ro rang.
- Khong tin `clubId/userId` tu client ma bo qua authorization.
- Co test/demo luong service-to-service thanh cong va truong hop entity khong ton tai.
- Can nhac Polly retry/circuit breaker la bonus Lab 3, khong phai bat buoc, nhung huu ich cho demo on dinh.

### 7.3 API Gateway

- Ocelot la API Gateway implementation hien tai. YARP chi la phuong an thay the tuong duong neu co architecture review moi; plan nay khong yeu cau doi Gateway.
- FE chi goi public Gateway contract.
- JWT duoc validate tai Gateway va service van enforce authorization cho defense in depth.
- Swagger/Postman phai chi ra public route va internal route mapping.

## 8. P1 - Redis event-driven va background jobs theo PRN232 rubric

Redis Pub/Sub la message broker chinh thuc cho pham vi bat buoc. Redis Streams duoc phep dung cho cac flow can luu tru message, consumer group va replay. RabbitMQ/MassTransit khong nam trong pham vi bat buoc; chi ghi nhan la huong mo rong neu giang vien xac nhan chap nhan.

Can Redis event contract va consumer cho:

- `UserRegisteredEvent`.
- `ClubEstablishedEvent`.
- `ActivityCreatedEvent`.
- `ReportSubmittedEvent`.
- `ReportReviewedEvent`.
- `BudgetApprovedEvent`.

Can dam bao idempotent consumer, correlation ID, structured logging va failure strategy phu hop. Neu flow bat buoc khong duoc mat message khi consumer tam dung, su dung Redis Streams thay vi chi Redis Pub/Sub.

Hangfire jobs bat buoc theo proposal:

- `WeeklyReportReminderJob`: 17:00 Thu Sau.
- `MonthlyKPICalculatorJob`: 00:00 ngay 01 hang thang.
- `UnusedBudgetAlertJob`: 23:00 hang ngay, canh bao su kien ket thuc qua 7 ngay chua quyet toan.

Job phai persistent, idempotent, co timezone ro rang va co cach test/demo ma khong phai doi den lich that.

## 9. P2 - Production hardening

- File storage policy, file type/size validation, malware risk va signed/private URL neu can.
- Audit log cho role, report review, finance approval, KPI adjustment.
- Rate limit cho login, register, resend va forgot password.
- OpenTelemetry distributed tracing va Polly la bonus Lab 3.
- Health checks/readiness cho Gateway, database, Redis, Hangfire va gRPC dependencies.
- Integration/contract tests cho public API va cross-service flow.

## 10. API Contract Handoff cho FE

FE khong yeu cau BE phai copy y nguyen mock shape. Team BE can cung cap OpenAPI va mapping ro cho cac field toi thieu:

- User: id, fullName, email, systemRole, isActive, emailVerified.
- Club: id, name, description, category, status, logoUrl, establishedDate, memberCount.
- Membership: id, clubId, userId, member profile, roleInClub, status, joinDate.
- Activity: id, clubId, title, description, startTime, endTime, location, status.
- Report: id, clubId, activityId, reporterId, type, period, status, content, attachments, feedback, kpiPoints, submittedAt, reviewedAt.
- Finance: id, clubId, activityId, proposerId, requestedAmount, approvedAmount, lineItems/details, status, feedback, dates.
- Transaction: id, clubId, amount, type, description, referenceId, transactionDate, receiptUrl.
- KPI: clubId, semester, totalPoints, rank, criteria breakdown va history.
- Notification: id, title, message, type, isRead, createdAt, targetUrl.

ID cua actor nhu creator/reviewer/approver phai lay tu JWT o command endpoint. FE chi gui target resource va du lieu nghiep vu duoc phep.

## 11. Dependency-Ordered Implementation Phases

### Communication Layer convention for every phase

- **REST:** client-facing CRUD/authentication/external contracts go through Ocelot and are documented by Swagger/OpenAPI.
- **gRPC + Protobuf:** internal synchronous request-response is used only when the caller requires an immediate result. Each call must identify the `.proto` contract, deadline/cancellation and error mapping. Protobuf is the strongly typed binary contract/serialization format used by gRPC, not a broker or transport replacement.
- **Redis Pub/Sub / Streams:** asynchronous producer/consumer integration is used when the caller does not require an immediate consumer response. Streams is selected when buffering, consumer groups, retry or replay are required. Redis does not replace gRPC.
- **SignalR:** Notification Service pushes processed notifications to the Frontend in real time.
- **Hangfire:** scheduled/retryable jobs execute background work and may publish Redis events; Hangfire is not a communication transport.
- Every phase record below explicitly states which communication mechanisms are changed, reused or not applicable. This clarification does not change phase order, workflow, scope or service boundaries.

### Phase BE-0 - Baseline Safety

- **Muc tieu:** snapshot schema/data, API inventory, smoke tests va rollback convention.
- **Database:** thong nhat EF Core migration policy; giam dan `EnsureCreated` va raw SQL patch.
- **Communication Layer:** inventory REST routes, `.proto` contracts, Redis producers/consumers, SignalR hub and Hangfire registrations; no new communication behavior.
- **Test/DoD:** FE/BE build, Docker health va characterization tests lap lai duoc.
- **Dependency:** bat buoc truoc moi phase.

### Phase BE-1 - REST, Layering, JWT and Collection Compliance

- **Module:** Shared, Gateway, Auth va tat ca REST services.
- **API/handler:** CRUD, resource naming, status code, validation, search/filter/sort/pagination va Swagger Bearer.
- **Migration/security:** `Admin`/`Advisor` -> `StudentAffairsAdmin`; email/password, verification code, Brevo, JWT/refresh token; test `401/403`.
- **Communication Layer:** standardize REST/Gateway/Swagger contracts; gRPC, Redis, SignalR and Hangfire are unchanged in this phase.
- **DoD:** REST, layered architecture va JWT evidence dat Course Compliance Gate.
- **Dependency:** BE-0.

### Phase BE-2 - Report Workflow and gRPC Verification

- **Module:** Report, Club, Gateway; Report workflow la luong demo chinh.
- **Database/API:** migration toi thieu cho report/evidence; ClubLeader submit va StudentAffairsAdmin review.
- **gRPC/security:** Report goi Club de validate club va ownership; co deadline, cancellation va error mapping.
- **Communication Layer:** implement Report REST entry point and Report -> Club synchronous gRPC call using a backward-compatible Protobuf contract; Redis/SignalR/Hangfire are not introduced here.
- **Test/DoD:** REST -> gRPC -> EF Core/SQL Server pass integration test va co log evidence.
- **Dependency:** BE-1.

### Phase BE-3 - Redis Producer and Consumer

- **Event:** publish `ReportSubmittedEvent` co version, eventId, occurredAt va correlationId.
- **Consumer/notification:** resolve Student Affairs recipient, persist notification, push SignalR; bo recipient co dinh.
- **Reliability:** idempotency va failure logging; dung Redis Streams neu flow can persistence/replay.
- **Communication Layer:** Report is the Redis producer; Notification is the Redis consumer and SignalR publisher. Existing REST/gRPC remain synchronous entry/validation paths; no Hangfire dependency yet.
- **Test/DoD:** producer/consumer, duplicate, restart va malformed-message tests pass trong Docker.
- **Dependency:** BE-2.

### Phase BE-4 - Background Job Minimum Compliance

- **Job:** pending-report reminder co schedule va manual trigger demo; persistent, idempotent, timezone ro rang.
- **Event/notification:** job publish qua Redis; Notification consumer gui in-app/Brevo, khong doc DB cheo.
- **Communication Layer:** Hangfire schedules work, Redis carries the asynchronous event, Notification consumes it and uses SignalR/Brevo; job execution does not replace REST or gRPC.
- **Test/DoD:** retry, duplicate execution, Hangfire dashboard/log va notification evidence pass.
- **Dependency:** BE-3.

### Phase BE-5 - Docker, Swagger, README and Course Gate

- **Deployment:** SQL Server, Redis, Gateway, REST, gRPC va Hangfire chay bang Compose voi health/readiness.
- **Documentation:** Swagger/OpenAPI, proto, event catalog, setup/deployment, team responsibilities va demo script.
- **Communication Layer:** verify REST, gRPC/Protobuf, Redis producer/consumer, SignalR and Hangfire together in Docker and document evidence for each mechanism.
- **Demo/DoD:** Report REST -> gRPC -> SQL -> Redis -> consumer/SignalR -> job -> review pass tren clean environment.
- **Dependency:** BE-1 den BE-4; khong uu tien bonus truoc khi gate nay pass.

### Phase BE-6 - Ownership, Club Onboarding and Activity

- **Migration:** `President` -> `ClubLeader`; giu Treasurer/Member; phan loai legacy `Manager` truoc khi migrate/remove.
- **API/security:** atomic onboarding, membership review, activity submit/review/complete; system role + club ownership.
- **Event/test:** Club/Member/Activity events tren Redis; transition va cross-club denial tests pass.
- **Communication Layer:** REST handles onboarding/member/activity commands; gRPC exposes synchronous club/ownership checks; Redis publishes lifecycle events; Notification consumes and pushes SignalR; no new scheduled job is required unless already approved.
- **Dependency:** BE-5.

### Phase BE-7 - Semester Foundation

- **Migration:** `Semester(Id, Code, Name, StartDate, EndDate, Status, CreatedAt, UpdatedAt)`; unique Code va toi da mot Active.
- **API/security:** CRUD/activate chi `StudentAffairsAdmin` duoc mutate.
- **Communication Layer:** Semester is exposed by REST and remains owned by Report/KPI Service; no new cross-service gRPC, Redis, SignalR or Hangfire flow is introduced in this phase.
- **Test/DoD:** invalid dates, duplicate Code va concurrent activation duoc kiem soat.
- **Dependency:** BE-1; bat buoc truoc KPI theo hoc ky.

### Phase BE-8 - Revision, Settlement and KPI

- **Report:** RequestRevision, resubmission, ActivityId, SemesterId va revision history.
- **Finance:** proposal -> review -> settlement -> receipt verification -> completion; balance/transaction APIs.
- **KPI:** rules, history va leaderboard theo Semester; loai cong thuc `Approved report count * 10`.
- **Event/test/DoD:** review/finance events qua Redis; ownership, transition, semester isolation va recalculation tests pass.
- **Communication Layer:** REST handles report/finance/KPI commands and queries; gRPC + Protobuf handles immediate Club/Semester ownership validation; Redis carries review/settlement/KPI events; Notification consumes and pushes SignalR; Hangfire schedules KPI recalculation/reminders.
- **Dependency:** BE-6 va BE-7.

### Phase BE-9 - FE Integration and Final Verification

- FE chuyen module da nghiem thu sang API that, ownership-aware actions va UI `Pending Approval`.
- Hoan thien notification, settlement, KPI va dashboard; mock khong la production default.
- **Communication Layer:** FE uses REST through Gateway and SignalR for realtime updates only; service-to-service gRPC and Redis remain internal and are verified through E2E evidence; Hangfire jobs are verified through observable outcomes/logs.
- **DoD:** unit/integration/contract/E2E, FE/BE build, Docker va full operational lifecycle pass.
- **Dependency:** BE-5 cho demo toi thieu; BE-6 den BE-8 cho full product.

## 12. Phan cong cong viec cho team Backend

### 12.1 Nguyen tac phan cong

- Phuong an 4 nguoi duoc khuyen nghi vi phu hop voi service ownership va co the lam song song.
- Moi module phai co mot owner chinh, chiu trach nhiem tu entity/migration, application logic, API, authorization, Swagger den test.
- Khong chia mot feature theo kieu mot nguoi lam controller, mot nguoi lam repository; cach nay tao nhieu dependency va kho review.
- `Shared.Kernel`, Gateway contract, event contract, proto va `docker-compose.yml` la shared surface. Owner de xuat thay doi, it nhat mot nguoi khac review truoc merge.
- Moi endpoint chi duoc danh dau done khi chay qua Gateway, co validation, authorization, response/status code dung va co test/Postman example.
- Moi nguoi cap nhat OpenAPI va environment template trong cung pull request voi feature.

### 12.2 Phuong an 4 nguoi - khuyen nghi

#### Nguoi 1 - Identity, Users va API Platform

Ownership:

- Auth/Identity service va Users/Admin API.
- Register, login, refresh token, me, change/forgot/reset password.
- Email verification/resend va Brevo integration.
- Role/permission matrix o cap he thong, activate/deactivate va privilege protection.
- Gateway JWT validation, CORS va public route convention.
- Chuan response/error, API versioning va Swagger JWT dung chung.

Deliverables:

- Auth va Users OpenAPI contract.
- Migration cho verification/reset token va cac field user con thieu.
- Brevo environment template khong chua secret.
- Test register/verify/login/refresh/forgot/reset, 401 va 403.
- Gateway route cho tat ca module sau khi owner module cung cap downstream contract.

Khong ownership membership role trong CLB; phan nay thuoc Nguoi 2.

#### Nguoi 2 - Clubs, Membership va Activities

Ownership:

- Club service, club fields/status va club management.
- Membership join request, approve/reject, remove va club roles ClubLeader/Treasurer/Member.
- Activities/Events: public/upcoming, by-club, create/update/cancel/complete.
- Authorization theo dung CLB, khong chi dua vao system role.
- gRPC Club server va proto de service khac kiem tra club/member/manager.
- Publisher `ClubEstablishedEvent` va `ActivityCreatedEvent`.

Deliverables:

- Migration va API contract cho Club, Membership, Activity.
- Gateway-ready route `/clubs` va `/events`.
- List API co search/sort/page/fields/expand phu hop.
- gRPC server/proto va test valid/not-found/forbidden.
- Test join/approve/reject va manager khong duoc sua CLB khac.

#### Nguoi 3 - Reports, KPI, Dashboard va Hangfire

Ownership:

- Report & KPI service.
- Draft/submit/update/review report dinh ky, attachment metadata, feedback va KPI points.
- KPI criteria CRUD, score history, manual adjustment va leaderboard theo hoc ky.
- Dashboard aggregate cho Admin va Club workspace.
- PDF/Excel export leaderboard/report theo proposal.
- Hangfire `WeeklyReportReminderJob` va `MonthlyKPICalculatorJob`.
- gRPC client goi Club service.
- Publisher `ReportSubmittedEvent` va `ReportReviewedEvent`.

Deliverables:

- Migration va API contract cho Report/KPI.
- Pending queue, filter/page va report authorization dung CLB.
- KPI calculation co test deterministic, audit source va ly do cong/tru diem.
- Dashboard/export endpoint.
- Hai Hangfire job co cach trigger test/demo.

#### Nguoi 4 - Finance, Notifications va Integration Infrastructure

Ownership:

- Finance service/database moi.
- Budget proposal, full/partial approval, rejection, transaction, receipt va settlement.
- Notification REST, broadcast, SignalR va email consumer.
- Redis Pub/Sub/Streams infrastructure, consumer conventions, idempotency va failure strategy.
- `BudgetApprovedEvent` va consumer cho toan bo event catalog.
- Hangfire `UnusedBudgetAlertJob`.
- File storage contract dung chung cho logo/evidence/receipt.
- Docker Compose, Redis, health checks, Serilog/correlation ID va end-to-end startup.

Deliverables:

- Finance migration, API va authorization cua `Treasurer`, `ClubLeader` va `StudentAffairsAdmin` theo capability/ownership.
- Notification persistence + realtime contract va broadcast API.
- Event catalog cung integration test publisher/consumer.
- Full Docker Compose va health/readiness checks.
- Test partial approval, settlement, notification offline/reconnect va duplicate message.

### 12.3 Can bang khoi luong cho team 4 nguoi

Neu Finance/Notification ton nhieu thoi gian hon du kien:

- Nguoi 1 ho tro Gateway, Docker secret/config va email sending adapter.
- Nguoi 2 ho tro file upload cho club logo/activity evidence.
- Nguoi 3 ownership toan bo Hangfire, bao gom `UnusedBudgetAlertJob`.
- Nguoi 4 tap trung Finance, Redis consumer va SignalR.

Moi nguoi van giu ownership module; viec ho tro duoc tach thanh pull request nho va owner module review.

### 12.4 Phuong an 2 nguoi - du phong

#### Nguoi A - Platform, Identity, Clubs va Notifications

Ownership:

- Tat ca phan cua Nguoi 1 va Nguoi 2 trong phuong an 4 nguoi.
- Notification REST, broadcast, SignalR va Brevo email adapter.
- Gateway, Swagger, versioning, global middleware, logging va Docker Compose.
- Club/Activity event publishers va notification consumers.

Deliverables theo thu tu:

1. Gateway + Auth/Brevo + Users.
2. Clubs + Membership + Activities + gRPC server.
3. Notification + Redis integration + Docker hardening.

#### Nguoi B - Reports, KPI, Finance va Analytics

Ownership:

- Tat ca phan Report/KPI/Dashboard/Export cua Nguoi 3.
- Tat ca Finance domain/API cua Nguoi 4.
- Hangfire jobs, file metadata/storage contract va business event publishers.
- gRPC client va aggregate data cho dashboard.

Deliverables theo thu tu:

1. Reports + gRPC client + review flow.
2. Finance proposal/approval/settlement.
3. KPI + Dashboard + Export + Hangfire.

### 12.5 Can bang khoi luong cho team 2 nguoi

- Nguoi A ownership ha tang Redis/Docker/Notification; Nguoi B chi publish business events theo contract da chot.
- Nguoi A ownership upload transport/storage adapter; Nguoi B ownership metadata va nghiep vu attachment/receipt.
- Nguoi B ownership Hangfire business jobs; Nguoi A cau hinh Hangfire server/storage trong Docker.
- Hai nguoi review cheo authorization va OpenAPI cua nhau.
- Khong lam song song tren cung file shared; chot contract truoc, sau do moi implement tung service branch.

### 12.6 Thu tu phoi hop va moc ban giao

#### Moc 1 - Contract freeze (da chot)

- Dung `backend_contract_freeze.md` lam baseline v1.
- Moi owner review phan contract cua module minh truoc khi tao migration/API.
- Chi thay doi baseline bang decision log va review cheo; khong tu doi enum/route/payload trong branch rieng.
- FE review OpenAPI sinh ra tu baseline truoc khi BE implement dien rong.

#### Moc 2 - Core demo

- Auth/Brevo, Users, Clubs, Membership, Activities, Reports va Notification REST chay qua Gateway.
- Docker Compose khoi dong on dinh.
- FE tat mock rieng cho cac module da nghiem thu.

#### Moc 3 - Business completion

- Finance, KPI, Dashboard, Export, Redis va Hangfire hoat dong.
- SignalR/email nhan event tu cac service.
- Hoan thanh integration tests va Postman collection.

#### Moc 4 - Final verification

- Test toan bo role va cross-service flow.
- Kiem tra 401/403/404/409, validation, pagination va failure/retry.
- Chay FE voi `VITE_USE_MOCK_DATA=false`.
- Chot architecture report, environment guide va demo script.

## 13. PRN232 Course Compliance Gate

Gate nay phai pass truoc khi uu tien cac feature bonus hoac mo rong ngoai rubric:

- [ ] ASP.NET Core REST API co CRUD, resource naming va HTTP status code dung REST.
- [ ] Layered architecture the hien ro API - Application/Service - Repository/Infrastructure - Domain.
- [ ] JWT authentication va refresh token; protected APIs test dung `401/403`.
- [ ] List APIs co search/filter/sort/pagination khi phu hop.
- [ ] It nhat mot Hangfire background job co schedule va demo trigger.
- [ ] Redis co it nhat mot producer va mot consumer; co log va database evidence.
- [ ] Co `.proto`, gRPC server/client va REST-to-gRPC interaction.
- [ ] EF Core/SQL Server co migrations hoac scripts chay tren database sach.
- [ ] Docker Compose khoi dong tat ca thanh phan va health checks pass.
- [ ] Swagger/OpenAPI mo ta API va ho tro Bearer token.
- [ ] README co project description, architecture, stack, installation, deployment va team responsibilities.
- [ ] Report workflow demo chung minh REST, JWT, SQL, gRPC, Redis, consumer, background job va Docker.

## 14. Acceptance Criteria

### REST va security

- FE goi duoc tat ca supported module qua Gateway, khong goi internal service port.
- List API co search/filter/sort/paging va pagination metadata theo Lab 1.
- Response/error/status code nhat quan.
- Request validation, global exception handling va API versioning dat Lab 2.
- JWT login, refresh token, 401, 403 va role authorization test thanh cong.
- Password hash an toan; secret nam trong environment.
- Swagger JWT test duoc protected APIs.

### Microservices

- Moi service so huu database rieng; khong truy cap DB cheo.
- It nhat mot gRPC server/client/proto va business flow duoc demo thanh cong.
- Gateway route day du va validate JWT.
- Request log co path, method, status, execution time.
- Toan bo he thong khoi dong bang Docker Compose.

### Product

- Register/verify/resend/forgot password gui email Brevo dung policy da chot.
- Student browse club, gui join request, xem activity va notification.
- `ClubManager` quan ly dung CLB theo club role `ClubLeader`/`Treasurer`/`Member`, ownership va capability tuong ung.
- StudentAffairsAdmin quan ly club/user/role, duyet report/finance, cham KPI, xem dashboard va broadcast.
- KPI leaderboard theo hoc ky va export PDF/Excel hoat dong.
- Redis producer/consumer va it nhat mot Hangfire job bat buoc duoc demo; cac job con lai hoan thanh theo business phase.
- FE build pass va chay end-to-end voi `VITE_USE_MOCK_DATA=false` cho cac module da nghiem thu.

## 15. Deliverables yeu cau team BE ban giao

- Source code va EF Core migrations.
- Dockerfile tung service va `docker-compose.yml` day du.
- OpenAPI/Swagger contract va Postman collection.
- Proto files va mo ta gRPC flow.
- Role/permission matrix.
- Event catalog: publisher, consumer, payload, retry/idempotency.
- Environment variable template khong chua secret.
- Architecture report: service decomposition, database ownership, Gateway routes va communication flow.
- Danh sach API da ready de FE tat mock theo tung module.
- README co project description, system architecture, technology stack, installation/deployment guide, team responsibilities va demo evidence checklist.

## 16. Notes cho team FE va BE

- Endpoint trong plan la contract goi y, khong phai ly do de bo qua OpenAPI review.
- UI mock the hien nghiep vu proposal; module chua ready tiep tuc mock/disable thay vi goi API khong ton tai.
- Khong sua logic FE chi de che gap authorization/validation cua BE.
- Moi deviation khoi proposal hoac lab rubric can duoc ghi trong decision log va duoc team/giang vien chap nhan.

## 17. Current source audit - 2026-07-14

Muc nay cap nhat trang thai thuc te sau khi doi chieu source hien tai. Cac muc snapshot cu o phan tren co the da lac hau.

### 16.1 P0 da giai quyet hoac gan xong

- Gateway da co route cho `events`, `notifications`, `users` va `kpi`.
- Gateway da co health endpoint.
- Auth da co email verification va resend verification endpoint:
  - `POST /gateway/auth/verify-email`
  - `POST /gateway/auth/resend-verification-email`
- Auth da co Brevo env placeholder trong `.env.example`.
- Users API da ton tai cho Admin list/update role/update status.
- Membership approval da co endpoint approve/reject rieng:
  - `PUT /gateway/clubs/{id}/members/{userId}/approve`
  - `PUT /gateway/clubs/{id}/members/{userId}/reject`
- Notification REST va broadcast da co:
  - `GET /gateway/notifications`
  - `PUT /gateway/notifications/{id}/read`
  - `PUT /gateway/notifications/read-all`
  - `POST /gateway/notifications/broadcast`
- KPI leaderboard va KPI rules CRUD da co trong Report service.

### 16.2 P0/P1 van con blocker

- Finance service/database foundation da hoan thanh; proposal, review, transaction va settlement API van la blocker cho FE integration that.
- Dashboard/statistics API chua co. FE hien van phai tinh tu module rieng hoac dung mock.
- Gateway Finance health/proposal routes da active; `/gateway/dashboard/*` van la placeholder `501`.
- Response/error envelope chung da bo `statusCode` trong body, dung structured errors va tu dong gan request `traceId`.
- Source van dung legacy `Admin`/`Advisor`; plan phai migrate/map sang `StudentAffairsAdmin` va cap nhat JWT/policy/data.
- Can audit auth security: cooldown/rate limit resend, one-time token, expiry, khong expose token/code trong response/log production.
- Can audit REST list convention: search/filter/sort/paging/fields/expand cho users, clubs, members, events, reports, KPI va notifications.
- Can hoan thien Lab 2 content negotiation JSON/XML neu rubric yeu cau.
- Can hoan thien Redis producer/consumer, Hangfire jobs, file upload/storage va export PDF/Excel.

### 16.3 Current module readiness

| Module | BE status | Gateway status | FE integration status |
| --- | --- | --- | --- |
| Auth | Partial/usable | Routed | Real API available; verify-code UI added |
| Users | Partial/usable | Routed | API adapter available |
| Clubs | Partial/usable | Routed | API adapter available |
| Membership | Partial/usable | Routed through clubs | API adapter available |
| Events | Partial/usable | Routed | API adapter available |
| Reports | Partial/usable | Routed | API adapter available |
| Notifications | Completed (CR-3) | Routed | API adapter available + SignalR config |
| KPI | Partial/usable | Routed | API adapter available |
| Finance | Proposal lifecycle implemented; transactions/settlement missing | Health and proposal routes active | Mock and real proposal adapters available |
| Dashboard | Not implemented | 501 placeholder | Derived/mock only |
| Files/Export | Not implemented | Not ready | Placeholder only |

### 16.4 Next backend priority order

1. Pass REST/JWT/layering compliance and add list query capabilities consistently.
2. Verify Report REST-to-gRPC workflow with ownership tests.
3. Complete Redis producer/consumer and dynamic recipient resolution.
4. Add one demoable Hangfire background job.
5. Pass Docker, Swagger, README and Report E2E Course Compliance Gate.
6. Continue ownership, Semester, settlement, KPI, file/export and dashboard phases.
7. Add response-envelope/integration tests and upgrade vulnerable AutoMapper packages.

### 16.5 Maintenance rule

- Moi lan BE/FE thay doi contract, route, role, status, env, mock/API behavior, hoac scope module, phai cap nhat `backend_contract_freeze.md`, `backend_gap_completion_plan.md` hoac `fe_completion_plan.md` tuong ung trong cung luot sua.

## 18. Next implementation plan

Thu tu phase authoritative nam tai Muc 11. Plan chuyen nganh Finance sau chi la sub-plan va khong duoc vuot Course Compliance Gate:

- [`finance_dashboard_implementation_plan.md`](./finance_dashboard_implementation_plan.md)
- [`communication_reliability_gap_implementation_plan.md`](./communication_reliability_gap_implementation_plan.md) - approved reliability sub-plan for BE-2/BE-3/Notification/FE reconnect gaps; it does not replace the phase order in Section 11.

Thu tu uu tien hien tai: BE-0/BE-1 -> BE-2 gRPC Report demo -> BE-3 Redis -> BE-4 background job -> BE-5 Docker/Swagger/README gate -> cac phase nghiep vu con lai.

### 18.1 Progress update - 2026-07-15

- Phase 0 contract cleanup core: completed.
- Phase 1 Finance Service Foundation: implemented and self-checked; independent double-check is still pending.
- Phase 2 Budget Proposal Flow: implemented and self-checked; independent double-check is still pending.
- BE build: pass, 0 error, 2 AutoMapper vulnerability warnings.
- Docker verification: Finance/Gateway running; direct and Gateway health return `OK`; initial Finance migration applied.
- Next implementation entry point: Phase BE-0/BE-1 compliance verification; Finance Phase 3 duoc tiep tuc sau Course Compliance Gate.
- Acceptance note `2026-07-15`: do not mark Phase 1 finally accepted until an independent reviewer double-checks migration, Docker startup, Gateway routing, JWT protection and contract documentation.
- Phase 2 acceptance note `2026-07-15`: authorization, state transitions, paging and FE real-mode integration still require independent double-check.

### 18.2 Communication reliability audit - 2026-07-17

- Audit confirmed gRPC is partially implemented, durable Redis messaging is not implemented, and Notification persistence-before-push is only partial.
- Reliability sub-plan status: `APPROVED WITH MINOR REVISIONS`; the five requested revisions have been applied.
- Independent gRPC timeout/cancellation/logging and Redis infrastructure/outbox scaffolding may proceed in parallel after the minimum contract dependencies for each task are frozen.
- No source code, API, database, or configuration was changed during the audit/plan revision.

### 18.3 CR-0 minimum contract freeze - 2026-07-18

- Status: `PASSED`.
- Added versioned Club Access and Identity Directory Protobuf contracts alongside legacy `club.proto`; no service/client implementation was added.
- Frozen per-RPC timeout keys, idempotent RPCs, Redis Stream/group/DLQ names, event envelope, `ReportSubmittedV1`, recipient resolution, `(SourceEventId, RecipientUserId)`, commit-before-XACK, broadcast classification, and migration order.
- CR-1 may start. Independent Redis infrastructure/outbox scaffolding in CR-2 may proceed in parallel, but producer/consumer/database work must wait for its own frozen contract dependencies.

## 19. Document Status

`DOCUMENT FREEZE: APPROVED — AUTHORIZED TO START PHASE BE-0`

- Freeze date: `2026-07-15`.
- Authoritative baseline: `FPTU_Club_Report_Proposal`, `backend_contract_freeze.md` va dependency order tai Muc 11.
- Khi source thay doi route, role, status, payload, event, environment, mock/API behavior hoac module readiness, cap nhat plan lien quan trong cung luot phat trien.
