# Tasks: Financial Management Core (Web Application)

**Input**: Tài liệu thiết kế từ `specs/financial-management-core/`

**Prerequisites**: [plan.md](file:///c:/Users/Minmin/Desktop/APP_FinancialManagement/specs/financial-management-core/plan.md), [spec.md](file:///c:/Users/Minmin/Desktop/APP_FinancialManagement/specs/financial-management-core/spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khởi tạo cấu trúc dự án và cài đặt cấu hình ban đầu cho ứng dụng Web.

- [ ] T001 Khởi tạo dự án React + TypeScript với Vite sử dụng `npx -y create-vite@latest ./ --template react-ts`
- [ ] T002 Cài đặt các thư viện phụ thuộc: `dexie`, `dexie-react-hooks`, `lucide-react`, `recharts` và công cụ phát triển `prettier`, `eslint`
- [ ] T003 Thiết lập hệ thống CSS toàn cục `src/styles/index.css` và biến giao diện (CSS Variables) tại `src/styles/theme.css`
- [ ] T004 Cấu hình Jest và React Testing Library cho các bài test frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cơ sở dữ liệu IndexedDB và các hàm tiện ích tính toán tiền tệ.

- [ ] T005 Triển khai lớp quản lý cơ sở dữ liệu `src/db/db.ts` với Dexie.js (định nghĩa schemas cho ví, giao dịch, ngân sách, danh mục, auditLogs; bao gồm các trường userId và trường xóa mềm deletedAt/deletedBy)
- [ ] T006 Tạo tệp populate dữ liệu mặc định `src/db/populate.ts` để sinh ra các Danh mục thu chi cơ bản (Ăn uống, Di chuyển, Mua sắm, Lương, v.v.)
- [ ] T007 Xây dựng các hàm tiện ích tài chính tại `src/utils/finance.ts` (format tiền tệ `Intl.NumberFormat`, cộng trừ tiền tệ bằng số nguyên an toàn)
- [ ] T008 Triển khai Hook quản lý trạng thái kết nối mạng `src/hooks/useOnlineStatus.ts`
- [ ] T008a Xây dựng service ghi nhật ký kiểm toán `src/services/auditLogService.ts` để lưu vết các hành động CREATE, UPDATE, DELETE tài chính

**Checkpoint**: Foundation ready - cơ sở dữ liệu hoạt động, các danh mục cơ bản được khởi tạo, sẵn sàng phát triển tính năng.

---

## Phase 3: User Story 1 - Giao dịch Thu chi (P1) 🎯 MVP

**Goal**: Cho phép người dùng ghi chép giao dịch Thu/Chi và hiển thị lịch sử kèm cập nhật số dư ví tương ứng.

### Tests cho User Story 1
- [ ] T009 Viết Unit Test cho logic cập nhật số dư ví khi thêm/sửa/xóa giao dịch tại `src/features/transactions/services/__tests__/transactionService.test.ts` (bao gồm test cho trường hợp Xóa mềm và sinh Nhật ký kiểm toán)
- [ ] T010 Viết Integration Test cho form nhập giao dịch và bảng lịch sử giao dịch tại `src/features/transactions/components/__tests__/TransactionFlow.test.ts`

### Implementation cho User Story 1
- [ ] T011 Xây dựng service quản lý giao dịch `src/features/transactions/services/transactionService.ts` thực hiện các truy vấn ACID-like (Dexie Transaction), tích hợp cơ chế Xóa mềm (cập nhật deletedAt/deletedBy) và gọi `auditLogService`
- [ ] T012 Phát triển component UI Form thêm mới giao dịch `src/features/transactions/components/TransactionForm.tsx` (nhập số tiền, loại giao dịch, danh mục, ví, ngày tháng, định nghĩa màu sắc UI xanh `#2ECC71` / đỏ `#E74C3C` chuẩn nghiệp vụ)
- [ ] T013 Phát triển component danh sách lịch sử giao dịch `src/features/transactions/components/TransactionList.tsx` hỗ trợ phân trang, cuộn vô hạn kết hợp Virtual Scroll (cuộn ảo) khi số phần tử vượt quá 100 bản ghi để đảm bảo hiệu năng mượt mà
- [ ] T014 Tạo component Tổng quan số dư tài khoản `src/features/dashboard/components/BalanceSummary.tsx` hiển thị tổng số tiền của tất cả các ví
- [ ] T015 Tích hợp Form, Bảng lịch sử và Dashboard vào màn hình chính `src/features/dashboard/DashboardPage.tsx`

**Checkpoint**: User Story 1 hoàn thành độc lập - người dùng có thể mở web ghi chép thu chi và xem số dư được cập nhật.

---

## Phase 4: User Story 2 - Quản lý Ví & Chuyển khoản (P2)

**Goal**: Tạo thêm ví mới và thực hiện chuyển tiền nội bộ giữa các ví.

### Tests cho User Story 2
- [ ] T016 Viết Unit Test cho nghiệp vụ chuyển khoản (giảm ví nguồn, tăng ví đích) tại `src/features/transactions/services/__tests__/transferService.test.ts`

### Implementation cho User Story 2
- [ ] T017 Phát triển Form tạo mới ví tài khoản `src/features/dashboard/components/WalletForm.tsx` (nhập tên ví, loại ví, số dư ban đầu)
- [ ] T018 Bổ sung loại giao dịch "Chuyển khoản" vào `TransactionForm.tsx` hiển thị thêm trường lựa chọn "Ví nhận" (Destination Wallet)
- [ ] T019 Cập nhật logic xử lý transaction trong `transactionService.ts` để xử lý các giao dịch loại `transfer`

**Checkpoint**: Người dùng có thể tạo ví ngân hàng mới và chuyển tiền từ ví tiền mặt sang ví ngân hàng.

---

## Phase 5: User Story 3 - Quản lý Ngân sách & Cảnh báo (P2)

**Goal**: Thiết lập hạn mức ngân sách chi tiêu cho từng danh mục và hiển thị thanh tiến trình cảnh báo.

### Tests cho User Story 3
- [ ] T020 Viết Unit Test tính toán lượng ngân sách đã tiêu và so sánh hạn mức tại `src/features/budget/utils/__tests__/budgetUtils.test.ts`

### Implementation cho User Story 3
- [ ] T021 Xây dựng service quản lý ngân sách tại `src/features/budget/services/budgetService.ts`
- [ ] T022 Phát triển UI quản lý ngân sách `src/features/budget/components/BudgetManager.tsx` (tạo hạn mức theo danh mục, chọn tháng)
- [ ] T023 Tạo UI component thanh tiến trình ngân sách `src/features/budget/components/BudgetProgressBar.tsx` (chuyển màu cam khi tiêu > 80%, màu đỏ khi > 100%)
- [ ] T024 Tích hợp cảnh báo ngân sách vào Dashboard và Form thêm giao dịch (cảnh báo khi giao dịch sắp nhập vượt ngân sách)

**Checkpoint**: Người dùng nhận được cảnh báo trực quan khi chi tiêu ăn uống vượt quá ngân sách định sẵn.

---

## Phase 6: User Story 4 - Báo cáo & Phân tích trực quan (P3)

**Goal**: Vẽ biểu đồ tròn cơ cấu chi tiêu và biểu đồ cột xu hướng dòng tiền.

### Implementation cho User Story 4
- [ ] T025 Xây dựng logic tổng hợp dữ liệu báo cáo theo tháng/năm tại `src/features/reports/utils/reportUtils.ts`
- [ ] T026 Phát triển component biểu đồ cơ cấu chi phí `src/features/reports/components/ExpensePieChart.tsx` (Sử dụng SVG động hoặc Recharts)
- [ ] T027 Phát triển component biểu đồ xu hướng thu chi `src/features/reports/components/CashFlowBarChart.tsx`
- [ ] T028 Tích hợp các biểu đồ vào trang Báo cáo `src/features/reports/ReportsPage.tsx` kèm bộ lọc theo tháng

**Checkpoint**: Hoàn thiện toàn bộ các tính năng cốt lõi của ứng dụng.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Tối ưu hiệu năng, cài đặt hoạt động offline và hoàn thiện tài liệu.

- [ ] T029 Cấu hình PWA cho ứng dụng sử dụng plugin `@vite-pwa/assets-generator` và `vite-plugin-pwa` để tạo Manifest và Service Worker
- [ ] T030 Tối ưu hóa UI CSS Variables cho giao diện sáng/tối (Light/Dark Mode) và kiểm tra khả năng hiển thị Responsive trên thiết bị di động thực tế
- [ ] T031 Xây dựng tài liệu hướng dẫn nhanh `docs/quickstart.md` để khởi chạy và phát triển dự án
- [ ] T032 Thực hiện rà soát cuối cùng (Spec-Driven Convergence check), xóa bỏ các dòng code debug, console.log thừa và hoàn thiện ứng dụng

---

## Dependencies & Execution Order

1. **Phase 1 (Setup)** và **Phase 2 (Foundational)** phải hoàn thành trước tiên. chúng là các tác vụ chặn (blocking).
2. **Phase 3 (Giao dịch - MVP)** được thực hiện ngay sau đó. Đây là điều kiện cần để chạy thử ứng dụng thực tế.
3. Các Phase **4 (Ví/Chuyển khoản)**, **5 (Ngân sách)** và **6 (Báo cáo)** có thể thực hiện song song hoặc tuần tự tùy theo nguồn lực phát triển.
4. **Phase 7 (Polish)** là bước cuối cùng trước khi đóng gói phát hành sản phẩm.
