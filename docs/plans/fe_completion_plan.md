# 🎨 FE Completion Plan — FPTU Club Report System

> **Mục tiêu:** Hoàn thiện toàn bộ Frontend — từ wire-up API thực tế đến redesign UI/UX premium.  
> **Áp dụng:** `vibe_coding_guardrails.md` + Skills: `taste-skill`, `interface-design`, `ui-ux-pro-max-skill`  
> **Stack:** React 18 + TypeScript + Vite · TanStack Query · Zustand · React Router v6

---

## 📐 Design Direction (chọn trước khi làm)

> Dựa trên `interface-design` skill — "**Modern Glassmorphism & Dark Mode Cyan**" phù hợp nhất với FPTU Club System (dashboard + admin + data-heavy).

| Token | Giá trị |
|---|---|
| **Personality** | Glassmorphism & Dark Mode Cyan |
| **Font** | Inter (headings: 600–700, body: 400) |
| **Base spacing** | 4px grid (4, 8, 12, 16, 24, 32, 48) |
| **Depth** | Backdrop blur + subtle borders + shadow elevation |
| **Primary** | `#06B6D4` (Cyan-500) |
| **Secondary** | `#0891B2` (Cyan-600) |
| **Danger** | `#EF4444` |
| **Surface Base** | `#0B1120` |
| **Surface 1** | `#111827` |
| **Surface 2** | `#1F2937` |
| **Card bg** | `rgba(17, 24, 39, 0.45)` + `backdrop-filter: blur(16px)` + `border: 1px solid rgba(255, 255, 255, 0.08)` |
| **Button height** | 36px (sm: 32px, lg: 44px) |
| **Border radius** | 12px (card/button/input) |

> 💾 Lưu vào `.interface-design/system.md` sau khi xác nhận direction.

---

## 🗺️ Tổng quan Phases

| Phase | Tên | Độ ưu tiên | Ước tính |
|---|---|---|---|
| **0** | Foundation — Fix bugs + Setup Design System | 🔴 Làm ngay | 1 ngày |
| **1** | Wire-up API — Thay toàn bộ mock → real API | 🔴 Quan trọng | 2–3 ngày |
| **2** | UI/UX Redesign — Áp dụng skills | 🟡 Cốt lõi | 3–5 ngày |
| **3** | Polish & Infrastructure | 🟢 Nice-to-have | 2–3 ngày |

---

## 🚀 Phase 0 — Foundation (1 ngày)

> Unblock mọi thứ trước khi làm UI. Không phase nào có thể chạy nếu Phase 0 chưa xong.

### [FE-0.1] Fix axios 401 Auto-Refresh

**File:** `src/api/axios.ts`

> Guardrail §2: "BẮT BUỘC axios interceptor phải tự động refresh token khi 401"

- [x] Implement `failedQueue` pattern để tránh multiple refresh calls
- [x] `useAuthStore.getState()` (KHÔNG dùng hook trong interceptor)
- [x] Khi refresh fail → gọi `logout()` + redirect `/login`
- [x] Access token lưu trong **memory** (Zustand), KHÔNG localStorage

---

### [FE-0.2] Fix Role Guard "Tham gia CLB"

**File:** `src/pages/clubs/ClubDetailPage.tsx` (hoặc tương đương)

> Guardrail §2: "BUG THỰC TẾ: Admin có thể click Tham gia CLB và nhận 403"

- [x] Import `useAuthStore` lấy `user`
- [x] Wrap nút join: `{user?.role === 'Student' && !isMember && (<button...>)}`

---

### [FE-0.3] Setup Design System Tokens

**File:** `src/index.css`

> Áp dụng **interface-design** skill — thiết lập CSS variables nhất quán

- [x] Định nghĩa toàn bộ CSS custom properties (colors, spacing, radius, shadow, font)
- [x] Import font Inter từ Google Fonts
- [x] Reset CSS + base typography scale
- [x] Dark mode support via `prefers-color-scheme` hoặc `[data-theme="dark"]`

```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --color-primary:       #4F46E5;
  --color-primary-hover: #4338CA;
  --color-secondary:     #06B6D4;
  --color-danger:        #EF4444;
  --color-success:       #10B981;
  --color-warning:       #F59E0B;

  --surface-base:    #0F172A;
  --surface-1:       #1E293B;
  --surface-2:       #334155;
  --surface-border:  rgba(255, 255, 255, 0.08);

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --space-12: 48px; --space-16: 64px;

  --font-sans: 'Inter', system-ui, sans-serif;
  --text-xs: 0.75rem; --text-sm: 0.875rem;
  --text-base: 1rem;  --text-lg: 1.125rem;
  --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 1.875rem;

  --radius-sm: 4px; --radius-md: 6px;
  --radius-lg: 8px; --radius-xl: 12px; --radius-full: 9999px;

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.5);

  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}
```

---

### [FE-0.4] Tạo Component Library cơ bản

**Dir:** `src/components/ui/`

> Áp dụng **taste-skill** — "anti-slop": không dùng màu generic, không padding tùy tiện

| Component | File | Props cốt lõi |
|---|---|---|
| `Button` | `Button.tsx` | `variant`, `size`, `loading`, `icon` |
| `Card` | `Card.tsx` | `padding`, `bordered`, `elevated` |
| `Badge` | `Badge.tsx` | `variant` (success/warning/danger/info) |
| `Input` | `Input.tsx` | `label`, `error`, `hint`, `icon` |
| `Select` | `Select.tsx` | `options`, `label`, `error` |
| `Modal` | `Modal.tsx` | `open`, `onClose`, `title`, `size` |
| `Table` | `Table.tsx` | `columns`, `data`, `loading`, `empty` |
| `Spinner` | `Spinner.tsx` | `size` |
| `Avatar` | `Avatar.tsx` | `name`, `src`, `size` |
| `Toast` | `Toast.tsx` | `type`, `message`, `duration` |

> ⚠️ KHÔNG tạo ad-hoc inline styles. Tất cả styles phải dùng CSS variables.

---

### [FE-0.5] Setup Sidebar Layout

**File:** `src/components/layout/AppLayout.tsx`

- [x] Collapsible sidebar với nav items theo role
- [x] Header với user avatar + notifications bell
- [x] Breadcrumb tự động từ route
- [x] Responsive: sidebar collapse thành icon-only ở mobile

---

## 🔌 Phase 1 — Wire-up API (2–3 ngày)

> Thay 100% mock data bằng real API calls. **Không redesign UI trong phase này** — chỉ wire-up.

### [FE-1.1] Wire AdminUsersPage

> Guardrail: "TUYỆT ĐỐI KHÔNG commit mock data vào production branch"

**Dependency:** BE Task 1.1 (UsersController) phải xong trước.

- [x] Thêm `userApi.getAll()`, `userApi.updateRole()`, `userApi.updateStatus()` vào `src/api/auth.api.ts`
- [x] Thay `useState mockUsers` bằng `useQuery(['admin-users'], userApi.getAll)`
- [x] `useMutation` cho updateRole + toggleStatus với `invalidateQueries`
- [x] Loading skeleton + error toast

---

### [FE-1.2] Wire Finance Page

**Dependency:** BE Finance Service phải có CRUD endpoints.

- [x] Xóa toàn bộ `mockProposals`, `mockTransactions` trong `finance.api.ts`
- [x] Implement `financeApi.getProposals()`, `financeApi.reviewProposal()`, `financeApi.getBalance()`, `financeApi.getTransactions()`
- [x] `useQuery` cho list proposals + transactions
- [x] `useMutation` cho create/review proposal + loading/empty states

---

### [FE-1.3] Wire KPI Page

**Dependency:** BE Task 1.2 (KpiController) phải xong trước.

- [x] Tạo `src/api/kpi.api.ts` — `kpiApi.getLeaderboard(semester?)`, `kpiApi.getRules()`, CRUD rules
- [x] `useQuery(['kpi-leaderboard', semester])` với select filter
- [x] Role-guard: chỉ Admin/Advisor thấy CRUD rules UI

---

### [FE-1.4] Wire Admin Broadcast

- [x] Thêm `notificationApi.broadcast({ title, message, targetRole? })` vào `notification.api.ts`
- [x] Thay `setTimeout giả lập` bằng real `useMutation`
- [x] Feedback toast: "Broadcast đã gửi thành công"

---

### [FE-1.5] Wire Notifications Bell

**Dependency:** BE Task 0.1 (Ocelot route `/gateway/notifications/*`) phải xong trước.

- [x] `notificationApi.getAll()` → badge count = unread
- [x] `notificationApi.markRead(id)` + `notificationApi.markAllRead()`
- [x] SignalR: connect `/hubs/notification` để nhận real-time push
- [x] Dropdown danh sách với timestamp relative ("2 phút trước")

---

### [FE-1.6] Wire Events Page

**Dependency:** BE Task 0.1 (Ocelot route `/gateway/events/*`) phải xong trước.

- [x] `eventApi.getByClub(clubId)` → hiển thị events list
- [x] `eventApi.create()`, `eventApi.update()`, `eventApi.cancel()`
- [x] Role-guard: chỉ Admin/ClubManager thấy nút tạo/sửa/xóa

---

### [FE-1.7] Wire Join Club Approval Flow

- [x] Sau khi join, status hiển thị "Đang chờ duyệt" (Pending)
- [x] ClubManager/Admin thấy danh sách Pending members
- [x] Nút "Duyệt" → `clubApi.approveMember(clubId, userId)`
- [x] Nút "Từ chối" → `clubApi.rejectMember(clubId, userId)`
- [x] `invalidateQueries(['club-members'])` sau mỗi action

---

### [FE-1.8] Wire Dashboard Student

- [ ] KPI score: gọi `kpiApi.getMyScore()` thay hardcode `85` (Chờ BE API hỗ trợ)
- [ ] Joined clubs: `clubApi.getMyClubs()` thay hardcode `2` (Chờ BE API hỗ trợ)
- [ ] Upcoming events: `eventApi.getUpcoming()` thay mock array (Chờ BE API hỗ trợ)

---

## 🎨 Phase 2 — UI/UX Redesign (3–5 ngày)

> Áp dụng 3 skills. Thứ tự: **interface-design** (system) → **taste-skill** (quality) → **ui-ux-pro-max-skill** (UX patterns)

### Skill Application Guide

| Skill | Áp dụng khi | Variant nên dùng |
|---|---|---|
| **interface-design** | Thiết lập design system, audit consistency | `system.md` → save sau session 1 |
| **taste-skill** | Audit & fix từng page: layout, spacing, hierarchy | `redesign-existing-projects` |
| **ui-ux-pro-max-skill** | UX patterns: empty states, loading, error, forms | Toàn bộ skill |

### [FE-2.1] Redesign: Login & Register

- [x] Centered layout, background gradient `--surface-base` → subtle noise pattern
- [x] Logo FPTU + hệ thống tên nổi bật
- [x] Input với icon (email, lock)
- [x] Animated submit button (loading spinner inlined)
- [x] Error message dưới input (không dùng alert)
- [x] Forgot password: multi-step (email → OTP → new password)

**taste-skill dials:** VARIANCE=4 · MOTION=5 · DENSITY=4

---

### [FE-2.2] Redesign: App Layout (Sidebar + Header)

> Đây là base layout — phải xong trước khi redesign các pages khác

**Sidebar:**
- [x] Dark `--surface-1`, width 240px (collapsed: 64px icon-only)
- [x] Nav groups theo section (Main / Management / Admin)
- [x] Active item: `--color-primary` left border + subtle bg highlight
- [x] Hover: micro-animation slide-in
- [x] User info card ở bottom với avatar + name + role

**Header:**
- [x] Sticky, `--surface-1`, height 56px
- [x] Breadcrumb trái | Notification bell + badge | Avatar dropdown phải
- [x] Dropdown: Profile, Settings, Logout (với confirm)

**Content area:** padding `var(--space-6)`, max-width 1280px, centered

---

### [FE-2.3] Redesign: Dashboard

**Admin Dashboard:**
- [x] Stats cards row (4 cards): Tổng CLB · Reports tháng · Members mới · Events sắp tới
  - Large number + trend indicator (↑ +12%) + mini sparkline
  - Style: `--surface-1` bg + `--surface-border` border
- [x] Monthly reports chart: Recharts LineChart với gradient fill
- [x] Recent reports table + Top clubs KPI bar chart

**Student Dashboard:**
- [x] KPI score: large circular progress ring (SVG animated)
- [x] My clubs: horizontal scroll cards
- [x] Upcoming events: timeline-style list
- [x] Notifications preview: latest 3

---

### [FE-2.4] Redesign: Clubs List & Detail

**Clubs List:**
- [x] Grid layout: 3-2-1 cols (desktop/tablet/mobile)
- [x] Club card: cover/avatar + name + member count + category badge
- [x] Search + filter by category + sort
- [x] Empty state: icon + message + CTA

**Club Detail:**
- [x] Hero: cover image/gradient + club info overlay
- [x] Tabs: Thông tin · Members · Events · Reports
- [x] Join button: prominent CTA (Student role only + not member)
- [x] Members grid: avatar + name + role badge

---

### [FE-2.5] Redesign: Reports Page

- [x] Split view: list trái + detail panel phải (desktop)
- [x] Report card: type badge (Weekly/Monthly/Activity) + status chip + date
- [x] Status flow visual:
  ```
  Draft → Submitted → Approved
                    ↘ Rejected → (Resubmit)
  ```
- [x] Submit form: multi-field + inline validation
- [x] File attachment: drag & drop UI (URL-based cho demo)

---

### [FE-2.6] Redesign: Finance Page

- [x] Tabs: Proposals · Transactions · Balance
- [x] Proposals table: amount + status badge + review button
- [x] Review modal: approve/reject + amount override + feedback
- [x] Balance card: large number + gauge so với budget cap
- [x] Transactions: timeline list với colored amounts

---

### [FE-2.7] Redesign: KPI Page

- [x] Leaderboard: ranked table với medal icons (🥇🥈🥉) cho top 3
- [x] Semester filter dropdown
- [x] Score bar per club + breakdown tooltip on hover
- [x] KPI Rules tab (Admin/Advisor only): CRUD table inline

---

### [FE-2.8] Redesign: Admin Pages

- [x] Admin — Users: searchable table + role badge + active toggle + inline role change
- [x] Admin — Broadcast: compose area + target audience selector + preview + confirm send
- [x] Admin — Clubs: table + approve/reject club creation

---

### [FE-2.9] UX Patterns — Toàn bộ trang

> Áp dụng **ui-ux-pro-max-skill** patterns

| Pattern | Cách implement | Trạng thái |
|---|---|---|
| **Loading states** | Skeleton screens (không spinner toàn trang) | [x] Hoàn thành |
| **Empty states** | Icon + message + primary CTA | [x] Hoàn thành |
| **Error states** | Retry button + mô tả lỗi | [x] Hoàn thành |
| **Success feedback** | Toast notification (top-right, auto-dismiss 3s) | [x] Hoàn thành |
| **Form validation** | Inline error dưới field, validate on blur | [x] Hoàn thành |
| **Confirm dialogs** | Destructive actions phải có confirm modal | [x] Hoàn thành |
| **Pagination** | Page numbers + prev/next + items per page | [x] Hoàn thành |
| **Search** | Debounce 300ms + clear button + no-results state | [x] Hoàn thành |

---

## 🏗️ Phase 3 — Polish & Infrastructure (2–3 ngày)

### [FE-3.1] Micro-animations (taste-skill MOTION=6)

- [x] Page transitions via CSS `@keyframes` fade-in
- [x] Card hover: `translateY(-2px)` + shadow increase
- [x] Button press: `scale(0.97)` micro-bounce
- [x] Number counters: count-up animation trên Dashboard stats
- [x] Toast slide-in từ phải

---

### [FE-3.2] Responsive Design

- [x] Breakpoints: `sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px`
- [x] Mobile: sidebar → hamburger drawer
- [x] Tables: horizontal scroll on mobile
- [x] Cards: full-width on mobile

---

### [FE-3.3] Error Boundary & 404

- [x] `ErrorBoundary` component bọc các routes chính
- [x] 404 page: friendly message + back button
- [x] Network error: retry button

---

### [FE-3.4] Performance

- [x] Route-based code splitting: `React.lazy` + `Suspense`
- [x] `useQuery` staleTime hợp lý (5 phút với data ít thay đổi)
- [x] `useMemo` / `useCallback` cho expensive operations

---

## 📋 PR Checklist FE

**Functionality:**
- [x] Không còn mock data / hardcode
- [x] Tất cả API calls dùng `useQuery` / `useMutation`
- [x] Error states đã handle
- [x] Loading states đã có

**Design:**
- [x] Colors dùng CSS variables (không hardcode hex)
- [x] Spacing dùng `var(--space-N)`
- [x] Font sizes dùng `var(--text-N)`
- [x] Components mới review qua redesign-skill audit

**Security:**
- [x] Access token KHÔNG trong localStorage
- [x] Role-guard cho mọi action sensitive
- [x] axios 401 interceptor đang hoạt động

**UX:**
- [x] Empty state đã có
- [x] Destructive actions có confirm dialog
- [x] Form validation inline

---

## 🗓️ Thứ tự làm đề xuất

```
Ngày 1:   Phase 0 hoàn toàn (0.1 → 0.5)
Ngày 2:   Phase 1: FE-1.1, 1.4, 1.5 (Admin Users, Broadcast, Notifications)
Ngày 3:   Phase 1: FE-1.2, 1.3 (Finance, KPI)
Ngày 4:   Phase 1: FE-1.6, 1.7, 1.8 (Events, Approval, Student Dashboard)
Ngày 5:   Phase 2: 2.2 Layout + 2.1 Login — base xong mọi thứ nhất quán
Ngày 6:   Phase 2: 2.3 Dashboard Admin & Student
Ngày 7:   Phase 2: 2.4 Clubs + 2.5 Reports
Ngày 8:   Phase 2: 2.6 Finance + 2.7 KPI
Ngày 9:   Phase 2: 2.8 Admin pages + 2.9 UX Patterns
Ngày 10:  Phase 3: Animations + Responsive + A11y
```

---

## 🔗 Tài liệu liên quan

- [team_completion_plan.md](./team_completion_plan.md) — BE tasks dependency
- [gap_completion_plan.md](./gap_completion_plan.md) — Danh sách đầy đủ gaps
- [vibe_coding_guardrails.md](../guidelines/vibe_coding_guardrails.md) — Rules bắt buộc

---

*Soạn ngày 2026-07-01. Cập nhật sau mỗi phase hoàn thành.*
