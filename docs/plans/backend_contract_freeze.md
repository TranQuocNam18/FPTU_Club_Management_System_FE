# Backend Contract Freeze v1

## 1. Trang thai tai lieu

- Version: `v1`
- Status: `Approved for implementation`
- Pham vi: public REST API, JWT, role, status, gRPC, integration events, migration va environment convention.
- Ap dung cho: FE va 4 owner Backend trong `backend_gap_completion_plan.md`.
- Moi thay doi breaking sau khi bat dau implement phai co decision log, review cua owner lien quan va tang API/event/proto version khi can.

## 2. Quyet dinh nen tang

### 2.1 Authentication

- Dung email/password va Brevo.
- Khong implement Google OAuth trong scope hien tai.
- User phai verify email truoc khi login.
- Access token: 15 phut.
- Refresh token: 7 ngay, rotation moi lan refresh va revoke token cu.
- Verification token va reset token: one-time use, expiry 15 phut.
- Resend verification cooldown: 60 giay; toi da 5 lan trong 1 gio cho mot email/IP.
- Register/forgot-password tra message trung lap cho email ton tai/khong ton tai neu can tranh account enumeration; khong tra token/code trong response.
- Chi chap nhan email FPT theo configurable allow-list `Email__AllowedDomains`; gia tri demo mac dinh `fpt.edu.vn` va `fe.edu.vn`. Khong hard-code domain trong controller.

### 2.2 API Gateway

- Dung Ocelot hien tai; Ocelot dat yeu cau Lab 3.
- Public base URL local: `http://localhost:5000`.
- FE chi goi `/gateway/...`; internal service route `/api/v1/...` khong phai public FE contract.
- Gateway validate JWT; service van authorize lai role va resource ownership.
- Public API version: `v1` trong downstream route; Gateway giu prefix hien tai de han che breaking FE.

### 2.3 Serialization

- Public JSON dung `camelCase`.
- Enum serialize thanh string, khong serialize integer.
- Date/time dung ISO 8601 UTC, vi du `2026-07-11T09:30:00Z`.
- Money dung JSON number va BE `decimal(18,2)`; currency mac dinh `VND`.
- ID dung UUID string.
- Nullable field tra `null`; collection rong tra `[]`.

## 3. Role va authorization

### 3.1 System roles

Canonical values:

- `Admin`: quan tri P. CTSV; mapping tu `FPTUAdmin` trong proposal.
- `ClubManager`: user dang duoc bo nhiem vao ban chu nhiem it nhat mot CLB.
- `Student`: sinh vien/club member; mapping tu `ClubMember` trong proposal.

`Advisor` khong nam trong contract v1. Neu sau nay them Advisor, phai cap nhat role matrix va permission test truoc khi dung.

### 3.2 Membership roles

- `Member`
- `Leader`
- `Treasurer`

Membership role chi co hieu luc trong `clubId` tuong ung. `ClubManager` system role khong cho phep user quan ly moi CLB; moi command van phai kiem tra membership cua dung CLB.

### 3.3 Permission matrix tom tat

| Action | Student | Club Leader/Treasurer | Admin |
| --- | --- | --- | --- |
| Xem CLB/activity public | Yes | Yes | Yes |
| Gui join request | Yes | Yes | Yes |
| Duyet member cua CLB | No | Leader | Yes |
| Tao/sua activity cua CLB | No | Leader | Yes |
| Submit report | No | Leader | Yes |
| Tao budget proposal | No | Treasurer | Yes |
| Review report/finance | No | No | Yes |
| Quan ly KPI/user/club | No | No | Yes |
| Broadcast notification | No | No | Yes |

Admin override phai duoc audit. Treasurer khong mac dinh co quyen quan ly membership/activity; Leader khong mac dinh co quyen submit finance neu khong dong thoi la Treasurer.

## 4. Canonical status enums

### 4.1 AccountStatus

- `PendingVerification`
- `Active`
- `Inactive`
- `Locked`

### 4.2 ClubStatus

- `Pending`
- `Active`
- `Suspended`
- `Dissolved`

### 4.3 MembershipStatus

- `Pending`
- `Approved`
- `Rejected`
- `Left`

### 4.4 ActivityStatus

- `Planned`
- `Ongoing`
- `Completed`
- `Cancelled`

Khong co event approval trong contract v1.

### 4.5 ReportStatus

- `Draft`
- `Submitted`
- `Approved`
- `Rejected`

FE `Pending` cu map sang `Submitted`.

### 4.6 BudgetProposalStatus

- `Draft`
- `Submitted`
- `Approved`
- `PartiallyApproved`
- `Rejected`
- `Settled`

FE `Adjusted` cu map sang `PartiallyApproved`.

### 4.7 TransactionType

- `Disbursement`
- `Expense`
- `Refund`
- `Adjustment`

## 5. REST conventions

### 5.1 Response envelope

Success:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {},
  "errors": null,
  "meta": null,
  "traceId": "00-..."
}
```

Collection:

```json
{
  "success": true,
  "message": "Resources retrieved successfully",
  "data": [],
  "errors": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  },
  "traceId": "00-..."
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "email",
      "message": "Email is invalid"
    }
  ],
  "meta": null,
  "traceId": "00-..."
}
```

Khong dua HTTP status code vao body; status code thuoc HTTP response.

### 5.2 HTTP status

- `200 OK`: GET/PUT/PATCH/action thanh cong.
- `201 Created`: POST tao resource; co `Location` header neu co detail endpoint.
- `204 No Content`: delete thanh cong khi khong can response body.
- `400 Bad Request`: malformed request/business input khong hop le.
- `401 Unauthorized`: thieu/sai/het han token.
- `403 Forbidden`: da authenticate nhung khong co quyen.
- `404 Not Found`: resource khong ton tai.
- `409 Conflict`: duplicate email, duplicate join request, invalid state transition.
- `422 Unprocessable Entity`: optional; chi dung neu toan bo service thong nhat. Contract v1 uu tien `400` cho validation de don gian.
- `429 Too Many Requests`: rate limit.
- `500 Internal Server Error`: loi khong du kien, khong expose stack trace.

### 5.3 List query

Canonical query parameters:

- `search`
- `sort`, vi du `name,-createdAt`
- `page`, bat dau tu 1
- `pageSize`, mac dinh 20, toi da 100
- `fields`, comma-separated allow-list
- `expand`, comma-separated allow-list
- Filter nghiep vu dung ten field ro rang: `status`, `role`, `clubId`, `semester`, `from`, `to`, `isRead`.

Unknown sort/fields/expand tra `400`; khong dua truc tiep chuoi client vao dynamic SQL.

### 5.4 Update va state transition

- `PUT /resources/{id}`: cap nhat toan bo editable representation.
- `PATCH /resources/{id}`: partial update cho status/role/profile neu module da cau hinh JSON Patch hoac request DTO ro rang.
- Business transition dung `POST /resources/{id}/submit|approve|reject|cancel|settle`.
- Actor ID khong nam trong request body; lay tu JWT.
- Transition khong hop le tra `409 Conflict`.
- Moi action `reject` bat buoc co `reason` dai 3-500 ky tu; report/finance co the dat ten field public la `feedback` nhung khong duoc rong khi reject.

### 5.5 Content negotiation

- Ho tro `application/json` va `application/xml` theo Lab 2.
- Ton trong `Accept` header.
- Format khong ho tro tra `406 Not Acceptable`.
- Swagger va integration test toi thieu mot endpoint detail bang JSON va XML.

## 6. Public Gateway routes v1

### 6.1 Auth va users

- `/gateway/auth/*`
- `/gateway/users/*`

### 6.2 Clubs va activities

- `/gateway/clubs/*`
- `/gateway/events/*`

Ten domain trong proposal la Activity, nhung giu `/events` de tuong thich FE/BE hien tai. Entity/domain co the ten `Activity`.

### 6.3 Reports, KPI, finance va dashboard

- `/gateway/reports/*`
- `/gateway/kpi/*`
- `/gateway/finance/*`
- `/gateway/dashboard/*`

### 6.4 Notifications va files

- `/gateway/notifications/*`
- `/gateway/files/*`
- `/gateway/hubs/notification`

## 7. Endpoint contract toi thieu

### 7.1 Auth

- `POST /gateway/auth/register`
- `POST /gateway/auth/login`
- `POST /gateway/auth/verify-email`
- `POST /gateway/auth/resend-verification-email`
- `POST /gateway/auth/refresh-token`
- `POST /gateway/auth/forgot-password`
- `POST /gateway/auth/reset-password`
- `POST /gateway/auth/change-password`
- `GET /gateway/auth/me`

### 7.2 Users

- `GET /gateway/users`
- `GET /gateway/users/{id}`
- `PATCH /gateway/users/{id}/status`
- `PATCH /gateway/users/{id}/role`

### 7.3 Clubs/members

- `GET /gateway/clubs`
- `GET /gateway/clubs/{id}`
- `POST /gateway/clubs`
- `PUT /gateway/clubs/{id}`
- `PATCH /gateway/clubs/{id}/status`
- `GET /gateway/clubs/{id}/members`
- `GET /gateway/clubs/{id}/join-requests`
- `POST /gateway/clubs/{id}/join-requests`
- `POST /gateway/clubs/{id}/join-requests/{requestId}/approve`
- `POST /gateway/clubs/{id}/join-requests/{requestId}/reject`
- `PATCH /gateway/clubs/{id}/members/{userId}/role`
- `DELETE /gateway/clubs/{id}/members/{userId}`

### 7.4 Events/activities

- `GET /gateway/events`
- `GET /gateway/events/{id}`
- `GET /gateway/events/club/{clubId}`
- `POST /gateway/events`
- `PUT /gateway/events/{id}`
- `POST /gateway/events/{id}/cancel`
- `POST /gateway/events/{id}/complete`

### 7.5 Reports

- `GET /gateway/reports`
- `GET /gateway/reports/{id}`
- `GET /gateway/reports/club/{clubId}`
- `POST /gateway/reports`
- `PUT /gateway/reports/{id}`
- `POST /gateway/reports/{id}/submit`
- `POST /gateway/reports/{id}/approve`
- `POST /gateway/reports/{id}/reject`

### 7.6 Finance

- `GET /gateway/finance/proposals`
- `GET /gateway/finance/proposals/{id}`
- `POST /gateway/finance/proposals`
- `PUT /gateway/finance/proposals/{id}`
- `POST /gateway/finance/proposals/{id}/submit`
- `POST /gateway/finance/proposals/{id}/approve`
- `POST /gateway/finance/proposals/{id}/partial-approve`
- `POST /gateway/finance/proposals/{id}/reject`
- `POST /gateway/finance/proposals/{id}/settle`
- `GET /gateway/finance/transactions`
- `POST /gateway/finance/transactions`
- `GET /gateway/finance/clubs/{clubId}/balance`

### 7.7 KPI/dashboard/export

- `GET /gateway/kpi/leaderboard`
- `GET /gateway/kpi/clubs/{clubId}`
- `GET /gateway/kpi/clubs/{clubId}/history`
- `GET|POST /gateway/kpi/rules`
- `PUT|DELETE /gateway/kpi/rules/{id}`
- `POST /gateway/kpi/adjustments`
- `GET /gateway/dashboard/admin`
- `GET /gateway/dashboard/club/{clubId}`
- `GET /gateway/kpi/leaderboard/export?format=pdf|xlsx`

### 7.8 Notifications/files

- `GET /gateway/notifications`
- `PUT /gateway/notifications/{id}/read`
- `PUT /gateway/notifications/read-all`
- `POST /gateway/notifications/broadcast`
- `POST /gateway/files`
- `GET /gateway/files/{id}`
- `DELETE /gateway/files/{id}`

## 8. JWT contract

Required access-token claims:

- `sub`: user UUID.
- `email`.
- `name`: full name.
- `role`: one canonical system role.
- `jti`.
- `iat`, `exp`, `iss`, `aud`.

Khong nhung toan bo club membership vao JWT vi role co the thay doi va token phinh to. Resource service query local projection/cache hoac goi gRPC de kiem tra membership theo club.

Refresh token la opaque random secret, chi luu hash trong DB. Revoke token family khi phat hien reuse.

## 9. gRPC contract v1

Owner: Club service. Consumer dau tien: Report & KPI service; Finance co the dung cung client.

Package/proto:

- File: `club_access_v1.proto`
- Package: `club.access.v1`
- Service: `ClubAccessService`

RPC toi thieu:

- `CheckClubExists(ClubIdRequest) -> ExistenceReply`
- `GetClubSummary(ClubIdRequest) -> ClubSummaryReply`
- `GetMembership(GetMembershipRequest) -> MembershipReply`
- `CheckClubPermission(CheckClubPermissionRequest) -> PermissionReply`

`CheckClubPermissionRequest` gom `clubId`, `userId`, `permission`; permission canonical: `ManageMembers`, `ManageActivities`, `SubmitReports`, `ManageFinance`.

Quy tac:

- Deadline mac dinh 3 giay.
- Propagate correlation ID.
- Not found map ro thanh gRPC `NotFound`; invalid input `InvalidArgument`; khong co quyen `PermissionDenied`.
- Proto field number khong duoc reuse sau khi release.

## 10. Integration event contract v1

Envelope chung:

```json
{
  "eventId": "uuid",
  "eventType": "ReportSubmittedV1",
  "occurredAt": "2026-07-11T09:30:00Z",
  "correlationId": "uuid-or-trace-id",
  "producer": "report-service",
  "data": {}
}
```

Canonical event names:

- `UserRegisteredV1`: userId, email, fullName.
- `ClubEstablishedV1`: clubId, name, establishedDate.
- `ActivityCreatedV1`: activityId, clubId, title, startTime, location.
- `ReportSubmittedV1`: reportId, clubId, reporterId, reportType, period, submittedAt.
- `ReportReviewedV1`: reportId, clubId, status, feedback, kpiPoints, reviewedAt.
- `BudgetApprovedV1`: proposalId, clubId, requestedAmount, approvedAmount, status, reviewedAt.

Quy tac:

- Exchange/topic: `fptu.club.events`.
- Routing key: lower-case dotted, vi du `report.submitted.v1`.
- Consumer idempotency theo `eventId`.
- Retry 3 lan exponential backoff; sau do dead-letter queue.
- Event chi chua du lieu can cho integration, khong chua password/token/secret.
- Breaking payload change tao `V2`, khong sua nghia field V1.

## 11. Shared ownership va file convention

- Nguoi 1 owner Gateway config, response/error contract va JWT conventions.
- Nguoi 2 owner `club_access_v1.proto`.
- Nguoi 4 owner event envelope, RabbitMQ topology va root `docker-compose.yml`.
- Nguoi 3 owner Hangfire job registration/conventions.
- Owner module owner EF migrations cua database minh.
- Khong dat entity/domain model cua service vao `Shared.Kernel`.
- `Shared.Kernel` chi chua primitive contract thuc su dung chung; moi thay doi can mot reviewer ngoai owner.

## 12. Database va migration convention

- Database-per-service; cam foreign key/query cheo database.
- SQL table/column naming phai thong nhat trong tung service; public JSON van camelCase.
- Migration name: `yyyyMMddHHmm_<Action><Entity>`, vi du `202607111030_AddEmailVerificationTokens`.
- Mot pull request feature kem migration cua chinh feature.
- Khong sua migration da merge/chay o shared environment; tao migration moi.
- Seed chi tao du lieu demo khong nhay cam va idempotent.
- Timestamp domain luu UTC.
- Concurrency-sensitive aggregate (finance/report review) dung row version/concurrency token.

## 13. Environment variable contract

Bien chung:

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `Cors__AllowedOrigins__0`

Auth/Brevo:

- `Brevo__ApiKey`
- `Brevo__SenderEmail`
- `Brevo__SenderName`
- `Email__AllowedDomains__0`
- `Email__VerificationBaseUrl`
- `Email__ResetPasswordBaseUrl`

Infrastructure:

- `ConnectionStrings__Redis`
- `RabbitMq__Host`
- `RabbitMq__Username`
- `RabbitMq__Password`
- `GrpcSettings__ClubServiceUrl`
- `FileStorage__Provider`
- `FileStorage__RootPath`

Rule:

- Repo chi commit `.env.example`/Compose placeholder, khong commit secret that.
- Production secret khong co default yeu.
- Docker service name dung cho internal host; `localhost` chi dung tu host machine.

## 14. Definition of Done cho moi owner

- Contract khop tai lieu nay hoac co decision log duoc review.
- Build pass va migration apply duoc tren database rong.
- Swagger mo ta request, response va status code; Bearer test duoc.
- Validation, authorization va resource ownership co test.
- List endpoint co paging metadata va query allow-list.
- API goi duoc qua Gateway.
- Log co traceId, path, method, status va execution time; khong log secret/token.
- Postman/integration test co happy path va it nhat 401, 403, 404/409.
- Environment template va Docker Compose duoc cap nhat neu co dependency moi.
