# Backend Gap Completion Plan

## 1. Muc tieu va pham vi

Tai lieu nay la plan ban giao cho team Backend de hoan thien FPTU Club Report System. Tai lieu chi mo ta gap, contract va acceptance criteria; khong uy quyen cho Frontend sua source Backend.

Plan duoc doi chieu theo cac nguon sau:

1. `FPTU_Club_Report_Proposal.md`: nguon chinh cho nghiep vu va pham vi san pham.
2. `PRN232- LAB 1 - Rest API Basics and Deployment.pdf`: REST design, model separation, list API, response format, Docker va Swagger.
3. `LAB 2 - Advanced REST API & Security.pdf`: validation, routing, versioning, middleware, JWT, refresh token va Swagger security.
4. `LAB 3 - gRPC & Microservices Architecture.pdf`: database-per-service, gRPC, API Gateway, Docker Compose, logging va kiem thu.
5. Source BE hien tai: dung de xac dinh trang thai da implement.
6. FE mock contract: dung de thong nhat du lieu ban giao, khong tu dong tro thanh yeu cau nghiep vu.

Nhung quyet dinh can thong nhat truoc khi implement da duoc chot tai `docs/plans/backend_contract_freeze.md`. Tai lieu contract freeze la nguon chinh cho role, status, response envelope, route, JWT, gRPC, event, migration va environment convention.

Thu tu uu tien khi co mau thuan:

- Nghiep vu: proposal va quyet dinh da duoc team thong nhat.
- Tieu chi ky thuat mon hoc: Lab 1, Lab 2, Lab 3.
- Ten endpoint/field: thong nhat bang OpenAPI contract giua FE va BE.

## 2. Quyet dinh nghiep vu can ghi ro

### 2.1 Authentication da thay doi so voi proposal

Proposal ghi dang nhap tai khoan FPT bang Google OAuth. Du an hien tai da chon email/password va gui mail qua Brevo, dong thoi bo nut dang nhap Google tren FE.

Contract v1 da chot:

- Email/password + Brevo thay the Google OAuth trong proposal.
- User phai verify email truoc khi login.
- Domain email lay tu `Email__AllowedDomains`; demo mac dinh cho phep `fpt.edu.vn` va `fe.edu.vn`, khong hard-code trong controller.

### 2.2 Role he thong va role trong CLB la hai khai niem khac nhau

Proposal dinh nghia system role: `FPTUAdmin`, `ClubManager`, `ClubMember`; membership role: `Member`, `Leader`, `Treasurer`.

BE hien tai dung `Admin`, `Advisor`, `ClubManager`, `Student` va club role `Member`, `Manager`, `President`. Contract v1 chot system role `Admin`, `ClubManager`, `Student`; membership role `Member`, `Leader`, `Treasurer`. `Advisor` bi loai khoi contract v1.

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
- Docker Compose co gateway, SQL Server, Redis va bon service hien tai.

### 3.2 Gateway hien tai

Ocelot chi expose:

- `/gateway/auth/{everything}`
- `/gateway/clubs/{everything}`
- `/gateway/reports/{everything}`
- `/gateway/hubs/notification`

Chua expose Events va Notification REST. Chua co route cho Users, Finance, KPI va Dashboard vi service/controller tuong ung chua san sang.

Ocelot la lua chon hop le theo Lab 3. Khong bat buoc doi sang YARP chi de khop ten cong nghe trong proposal, tru khi giang vien/team yeu cau dung dung YARP.

### 3.3 Chua co hoac chua du

- Users/Admin management API.
- Finance service/API/database.
- KPI criteria, score history va leaderboard API.
- Dashboard/statistics API.
- Upload/file storage cho logo, report evidence va receipt.
- Email verification/resend verification va Brevo integration.
- RabbitMQ/MassTransit flow day du theo proposal.
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

Can co API cho Admin:

- List/search/filter/sort/page user.
- User detail.
- Activate/deactivate.
- Gan system role va membership role theo role matrix.
- Bo nhiem Club Manager/Leader/Treasurer cho CLB.
- Chan privilege escalation va chan user thuong sua role cua minh.

BE phai lay actor tu JWT claim; khong nhan `performedBy`, `reviewedBy` hay actor user ID tu payload FE.

### 4.4 Membership approval

Join hien tao membership pending nhung chua co action nghiep vu ro rang de duyet/tu choi. Can:

- List join requests theo CLB.
- Approve request.
- Reject request kem reason bat buoc.
- Khong dung update role nhu thay the semantic cho approve/reject.
- Chi manager cua dung CLB hoac Admin hop le moi duoc xu ly.

### 4.5 Contract mismatch dang chan FE

- FE co `verify-email` va `resend-verification-email`, BE chua co.
- FE co member approve/reject, BE chua co endpoint tuong ung.
- FE co Events API, Gateway chua route.
- FE co Notification REST, Gateway chua route.
- FE co broadcast, BE chua co endpoint.
- Finance, KPI, Users va Dashboard hien chi co mock/contract du kien.

## 5. P1 - Nghiep vu bat buoc theo proposal

### 5.1 Club va membership

Bo sung/hoan thien contract Club:

- `name`, `description`, `logoUrl`, `category`, `status`, `establishedDate`.
- Response co member count va thong tin ban chu nhiem khi UI can.
- Admin tao CLB, thay doi trang thai Active/Suspended/Dissolved va bo nhiem ban chu nhiem.
- Membership role toi thieu: Member, Leader, Treasurer.

`Advisor`, social/contact fields va luong approve CLB moi la optional cho den khi nghiep vu duoc xac nhan.

### 5.2 Activities/Events

Proposal bat buoc lich hop, sinh hoat va su kien. Activity can co:

- `clubId`, `title`, `description`, `startTime`, `endTime`, `location`, `status`.
- Trang thai toi thieu: Planned, Ongoing, Completed, Cancelled.
- List public upcoming activities va list theo CLB.
- Manager chi sua/huy activity cua CLB minh.
- Lien ket report va budget proposal voi `activityId` khi phu hop.

Approval/reject event khong nam trong contract v1. Activity duoc quan ly boi Leader/Admin va dung cac trang thai Planned/Ongoing/Completed/Cancelled.

### 5.3 Periodic activity reports va KPI scoring

Can ho tro:

- Draft va submit report tuan/thang/hoc ky.
- Link tai lieu va attachment/evidence.
- Period, deadline, submittedAt, reviewedAt va late flag.
- Admin approve/reject kem feedback va KPI points.
- Pending queue va list/filter theo club, status, type, period/semester.
- ClubManager khong duoc review report cua chinh minh.
- Actor review lay tu JWT claim.
- Report co the tham chieu activity.

### 5.4 Finance

Can implement Finance service/database rieng theo proposal:

- Budget proposal gan activity, proposer va line items/budget detail.
- Requested amount, approved amount va status.
- Admin approve full, partial hoac reject kem feedback.
- Transaction/settlement sau su kien.
- Receipt URL/file metadata va doi chieu hoa don.
- Theo doi balance/allocated/spent cua CLB.
- Authorization cho Treasurer/ClubManager cua dung CLB.

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

- Ocelot hoac YARP deu dat Lab 3.
- FE chi goi public Gateway contract.
- JWT duoc validate tai Gateway va service van enforce authorization cho defense in depth.
- Swagger/Postman phai chi ra public route va internal route mapping.

## 8. P1 - Event-driven va background jobs theo proposal

RabbitMQ la bonus trong Lab 3 nhung la requirement chinh cua proposal, vi vay van bat buoc cho he thong nay.

Can MassTransit/RabbitMQ contract va consumer cho:

- `UserRegisteredEvent`.
- `ClubEstablishedEvent`.
- `ActivityCreatedEvent`.
- `ReportSubmittedEvent`.
- `ReportReviewedEvent`.
- `BudgetApprovedEvent`.

Can dam bao idempotent consumer, retry/dead-letter strategy, correlation ID va khong mat notification khi consumer tam dung.

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
- Health checks/readiness cho Gateway, database, Redis, RabbitMQ va gRPC dependencies.
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

## 11. Suggested Backend Phases

### Phase BE-1 - Contract, Gateway va Auth

- Ap dung auth deviation email/password + Brevo thay Google OAuth theo contract v1.
- Ap dung role/permission matrix trong contract v1.
- Publish OpenAPI/public Gateway routes.
- Expose Events va Notification REST.
- Hoan thien verify/resend/forgot/reset va security.
- Chuan hoa response/error/status code.

### Phase BE-2 - Core REST compliance

- Hoan thien Users, Club fields va membership approval.
- Them list query standard: search/sort/page/fields/expand.
- Hoan thien validation, versioning, middleware, Serilog va Swagger JWT.
- Test 401/403/404/validation/pagination.

### Phase BE-3 - Activities, Reports va files

- Hoan thien Activity contract va public/upcoming list.
- Hoan thien periodic report, submit/review, feedback/KPI points.
- Implement evidence/file contract.
- Kiem tra gRPC Report -> Club va authorization theo dung CLB.

### Phase BE-4 - Finance va KPI

- Implement Finance service/database/API.
- Hoan thien KPI trong Report & KPI service.
- Implement dashboard aggregates va PDF/Excel leaderboard export.
- Them audit cho finance/KPI.

### Phase BE-5 - Event-driven, jobs va notifications

- RabbitMQ/MassTransit events va consumers.
- Hangfire jobs.
- Broadcast, email va SignalR contracts.
- Idempotency, retry va failure handling.

### Phase BE-6 - Docker va end-to-end verification

- Dockerfile moi service va full Docker Compose.
- Them RabbitMQ va cac dependency con thieu.
- Health checks va startup ordering hop ly.
- Postman collection, Swagger test va architecture report.
- FE chuyen `VITE_USE_MOCK_DATA=false` va test qua Gateway.

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
- Membership join request, approve/reject, remove va role Member/Leader/Treasurer.
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
- RabbitMQ/MassTransit infrastructure, consumer conventions, retry/idempotency va dead-letter strategy.
- `BudgetApprovedEvent` va consumer cho toan bo event catalog.
- Hangfire `UnusedBudgetAlertJob`.
- File storage contract dung chung cho logo/evidence/receipt.
- Docker Compose, RabbitMQ, Redis, health checks, Serilog/correlation ID va end-to-end startup.

Deliverables:

- Finance migration, API va authorization cua Treasurer/Manager/Admin.
- Notification persistence + realtime contract va broadcast API.
- Event catalog cung integration test publisher/consumer.
- Full Docker Compose va health/readiness checks.
- Test partial approval, settlement, notification offline/reconnect va duplicate message.

### 12.3 Can bang khoi luong cho team 4 nguoi

Neu Finance/Notification ton nhieu thoi gian hon du kien:

- Nguoi 1 ho tro Gateway, Docker secret/config va email sending adapter.
- Nguoi 2 ho tro file upload cho club logo/activity evidence.
- Nguoi 3 ownership toan bo Hangfire, bao gom `UnusedBudgetAlertJob`.
- Nguoi 4 tap trung Finance, RabbitMQ consumer va SignalR.

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
3. Notification + RabbitMQ integration + Docker hardening.

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

- Nguoi A ownership ha tang RabbitMQ/Docker/Notification; Nguoi B chi publish business events theo contract da chot.
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

- Finance, KPI, Dashboard, Export, RabbitMQ va Hangfire hoat dong.
- SignalR/email nhan event tu cac service.
- Hoan thanh integration tests va Postman collection.

#### Moc 4 - Final verification

- Test toan bo role va cross-service flow.
- Kiem tra 401/403/404/409, validation, pagination va failure/retry.
- Chay FE voi `VITE_USE_MOCK_DATA=false`.
- Chot architecture report, environment guide va demo script.

## 13. Acceptance Criteria

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
- Club Manager/Leader/Treasurer quan ly member/activity, nop report, de xuat/quyet toan ngan sach va xem KPI dung quyen.
- Admin quan ly club/user/role, duyet report/finance, cham KPI, xem dashboard va broadcast.
- KPI leaderboard theo hoc ky va export PDF/Excel hoat dong.
- RabbitMQ events va ba Hangfire jobs trong proposal duoc demo.
- FE build pass va chay end-to-end voi `VITE_USE_MOCK_DATA=false` cho cac module da nghiem thu.

## 14. Deliverables yeu cau team BE ban giao

- Source code va EF Core migrations.
- Dockerfile tung service va `docker-compose.yml` day du.
- OpenAPI/Swagger contract va Postman collection.
- Proto files va mo ta gRPC flow.
- Role/permission matrix.
- Event catalog: publisher, consumer, payload, retry/idempotency.
- Environment variable template khong chua secret.
- Architecture report: service decomposition, database ownership, Gateway routes va communication flow.
- Danh sach API da ready de FE tat mock theo tung module.

## 15. Notes cho team FE va BE

- Endpoint trong plan la contract goi y, khong phai ly do de bo qua OpenAPI review.
- UI mock the hien nghiep vu proposal; module chua ready tiep tuc mock/disable thay vi goi API khong ton tai.
- Khong sua logic FE chi de che gap authorization/validation cua BE.
- Moi deviation khoi proposal hoac lab rubric can duoc ghi trong decision log va duoc team/giang vien chap nhan.
