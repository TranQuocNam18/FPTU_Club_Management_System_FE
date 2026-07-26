# FPTU Club Report System — Frontend

React 19, TypeScript strict, Vite, TanStack Query và SignalR client cho hệ thống quản lý câu lạc bộ FPTU.

## Runtime profile

Sao chép `.env.example` thành `.env.local` khi cần tùy chỉnh:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SIGNALR_URL=http://localhost:5000/gateway/hubs/notification
VITE_USE_MOCK_DATA=false
```

Compliance profile luôn dùng `VITE_USE_MOCK_DATA=false`. Frontend chỉ gọi `/gateway/...`; không gọi trực tiếp port nội bộ của microservice và không fallback sang mock khi API lỗi.

## Chạy local

```powershell
npm install
npm run dev
npm run build
```

Backend stack phải chạy tại `http://localhost:5000`. Frontend dev server mặc định là `http://localhost:5173`.

## Quyền và module

- `StudentAffairsAdmin`: users, clubs, report/activity review, finance review, KPI/Semester và broadcast.
- `ClubManager` + membership `ClubLeader`: membership approval, activity management, report submit/revision.
- `ClubManager` + membership `Treasurer`: finance proposal, settlement, balance và transactions.
- `Student`: club list/join, approved activities, notifications và dashboard.

Access token chỉ giữ trong memory. Refresh token được persist để khôi phục phiên; refresh request được single-flight và refresh failure sẽ logout.

## Flow chính

1. Register → verify email → login.
2. Student join club → ClubLeader approve.
3. ClubLeader create/submit activity → admin review.
4. ClubLeader create report theo Active Semester → revision/resubmit → admin approve.
5. Treasurer create/submit proposal → admin approve → Treasurer settle bằng receipt URL.
6. Admin quản lý KPI rule, manual adjustment và leaderboard theo Semester.
7. Notification tải qua REST và nhận realtime qua SignalR Gateway.

## Giới hạn đã biết

- Receipt chỉ lưu URL/metadata, chưa upload file.
- Real file upload/storage và export PDF/Excel chưa được triển khai.
- Dashboard tổng hợp từ API hiện có; full Dashboard API/metric chưa có sẽ không được giả lập.
- Redis là message broker, chưa phải application cache.
- Major package upgrades, mixed database initialization refactor và consumer cho event không cần
  trong core demo được deferred.
- Bundle size warning và một số UI edge case được hoãn sang phase tối ưu.
