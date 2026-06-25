# PROJECTAGENT.md - Quy chuẩn Kỹ thuật & Nghiệp vụ Dự án

Tài liệu này cung cấp bối cảnh nghiệp vụ, cấu trúc dự án, mô hình dữ liệu và các quy tắc kỹ thuật chi tiết dành cho **Dự án Web Quản lý Tài chính (Financial Management Web Application)**.

---

## 1. Tổng quan Dự án (Project Overview)

- **Mục tiêu:** Xây dựng ứng dụng web quản lý tài chính cá nhân/gia đình thông minh, giúp người dùng theo dõi thu chi, quản lý ngân sách, thiết lập mục tiêu tiết kiệm và phân tích xu hướng dòng tiền trực quan.
- **Các phân hệ chính:**
  1. **Quản lý Tài khoản/Ví (Accounts/Wallets):** Tiền mặt, tài khoản ngân hàng, thẻ tín dụng, ví điện tử.
  2. **Quản lý Thu chi (Transactions Ledger):** Ghi chép thu nhập, chi phí, chuyển khoản giữa các ví.
  3. **Quản lý Ngân sách (Budgets):** Thiết lập hạn mức chi tiêu theo danh mục (Ăn uống, Di chuyển...) theo tháng/tuần và cảnh báo vượt hạn mức.
  4. **Báo cáo & Phân tích (Reports & Analytics):** Biểu đồ cơ cấu thu chi, xu hướng dòng tiền trực quan (sử dụng SVG/Canvas hoặc thư viện Chart.js/Recharts).
  5. **Mục tiêu Tiết kiệm (Savings Goals):** Đặt mục tiêu tích lũy và theo dõi tiến độ.
  6. **Đồng bộ & Bảo mật (Sync & Security):** Xác thực người dùng, đồng bộ đám mây và hỗ trợ hoạt động ngoại tuyến (Offline-First).

---

## 2. Kiến trúc & Cấu trúc Thư mục (Architecture & Project Structure)

Dự án áp dụng mô hình kiến trúc sạch (**Clean Architecture** hoặc **Feature-based**) được tối ưu hóa cho ứng dụng Web (ví dụ: Vite + React hoặc Next.js):

### Cấu trúc thư mục:
```text
src/
├── assets/             # Hình ảnh, icon (SVG), font chữ
├── components/         # Các UI component dùng chung (Button, Input, Card, Modal, v.v.)
│   └── ui/             # Hệ thống Design System (sử dụng CSS thuần/Vanilla CSS)
├── features/           # Phát triển theo tính năng (Feature-based)
│   ├── dashboard/      # Màn hình chính & biểu đồ tổng quan
│   ├── transactions/   # Nghiệp vụ ghi chép & bộ lọc lịch sử giao dịch
│   │   ├── components/ # Component con (TransactionForm, TransactionTable)
│   │   ├── hooks/      # React Hooks chuyên biệt cho giao dịch
│   │   └── services/   # Gọi API giao dịch
│   ├── budget/         # Quản lý hạn mức chi tiêu
│   └── reports/        # Phân tích biểu đồ động
├── hooks/              # Custom Hooks dùng chung (useAuth, useLocalStorage)
├── services/           # Các dịch vụ dùng chung (API client, IndexedDB/Dexie service)
├── styles/             # Cấu hình CSS hệ thống (CSS Variables, theme tối/sáng)
├── utils/              # Các hàm tiện ích (Format số tiền, ngày tháng, v.v.)
├── types/              # Định nghĩa kiểu dữ liệu dùng chung (Types/Interfaces)
└── main.tsx (hoặc App.tsx)
```

### Các lớp kiến trúc (Clean Architecture Layers)
```text
Trực quan (Presentation - UI)
↓
Ứng dụng (Application - Logics, Hooks)
↓
Nghiệp vụ (Domain - Models, Types)
↓
Hạ tầng (Infrastructure - Database, API Client)
```

### Các Design Patterns được áp dụng:
- **Repository Pattern:** Tách biệt logic truy cập dữ liệu ra khỏi business logic.
- **Strategy Pattern:** Sử dụng cho các thuật toán tính toán lãi suất hoặc định dạng báo cáo khác nhau.
- **Factory Pattern:** Tạo các đối tượng giao dịch hoặc ví khác nhau dựa trên loại ví (Cash, Bank, Credit).
- **Adapter Pattern:** Dùng để chuyển đổi dữ liệu từ API bên ngoài hoặc từ IndexedDB sang domain model.

---

## 3. Quy chuẩn Nghiệp vụ Tài chính (Financial Domain Rules)

### 3.1. Độ chính xác Tiền tệ (Monetary Precision)
- **TUYỆT ĐỐI CẤM sử dụng kiểu số thực dấu phẩy động (Float/Double) để tính toán tiền tệ trực tiếp** nhằm tránh lỗi làm tròn trên JavaScript (ví dụ: `0.1 + 0.2 !== 0.3`).
- **Giải pháp:**
  - Đối với VND (không thập phân): Sử dụng số nguyên (`Math.round()`, `BigInt` hoặc kiểm tra `Number.isInteger`).
  - Đối với các loại tiền tệ có phần thập phân: Nhân với 100 hoặc 1000 để đưa về đơn vị nhỏ nhất (ví dụ: cents) và lưu dưới dạng số nguyên, HOẶC dùng các thư viện toán học chính xác cao như `decimal.js` hay `big.js`.
  - Cơ sở dữ liệu: Sử dụng kiểu dữ liệu `DECIMAL` hoặc `NUMERIC` (ví dụ: `DECIMAL(15, 2)`).

### 3.2. Định dạng Hiển thị trên Web (Web Formatting)
- Tiền tệ phải được định dạng theo locale tương ứng qua hàm `Intl.NumberFormat`. Ví dụ:
  - Tiếng Việt: `1.250.000 ₫` hoặc `1,250,000 VND`.
- Quy ước màu sắc UI trực quan trên web:
  - **Thu nhập (Income):** Xanh lá (Green - mã màu tương ứng `#2ECC71`).
  - **Chi phí (Expense):** Đỏ (Red - mã màu tương ứng `#E74C3C`).
  - **Chuyển khoản (Transfer):** Xanh dương/Màu trung tính.

### 3.3. Quy tắc Ràng buộc Giao dịch
- **Giao dịch (Transaction):** Phải liên kết với **Ví/Tài khoản (Account)** và **Danh mục (Category)**.
- **Giao dịch Chuyển khoản (Transfer):** Phải ghi nhận ví gửi và ví nhận. Cần đảm bảo cập nhật đồng thời số dư cả hai ví trong một Transaction duy nhất để đảm bảo tính toàn vẹn dữ liệu.
- **Xác thực (Validation):** Số tiền giao dịch phải lớn hơn 0 (`Amount > 0`), tài khoản và danh mục phải tồn tại trước khi giao dịch được tạo.
- **Nhật ký Kiểm toán (Audit Log):** Mọi hành động thêm/sửa/xóa giao dịch tài chính phải được ghi nhật ký bao gồm: `UserId`, `Action`, `Entity`, `OldValue`, `NewValue`, `Timestamp`.
- **Xóa mềm (Soft Delete):** Các thực thể giao dịch, tài khoản không được xóa vật lý khỏi cơ sở dữ liệu. Sử dụng trường `DeletedAt` và `DeletedBy` để đánh dấu trạng thái xóa.

---

## 4. Quy chuẩn API RESTful (API Standards)

### Các phương thức REST tiêu chuẩn:
- `GET`: Lấy thông tin tài nguyên.
- `POST`: Tạo mới tài nguyên.
- `PUT`: Cập nhật toàn bộ tài nguyên.
- `PATCH`: Cập nhật một phần tài nguyên.
- `DELETE`: Xóa tài nguyên (xóa mềm).

### Cấu trúc Response đồng nhất (Response Contract):
Tất cả các API response phải trả về dữ liệu định dạng JSON dưới dạng:

**Thành công (200, 201 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ví chính",
    "balance": 10000000
  },
  "error": null
}
```

**Thất bại (400, 401, 403, 404, 500):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Số tiền giao dịch phải lớn hơn 0",
    "details": ["amount must be greater than 0"]
  }
}
```

---

## 5. Quy chuẩn Cơ sở dữ liệu (Database Rules)

- **Quy ước đặt tên (Naming Conventions):** Tên bảng và cột phải viết bằng chữ thường và phân cách bằng dấu gạch dưới (`snake_case`). Khóa ngoại phải kết thúc bằng `_id` (ví dụ: `account_id`).
- **Quản lý Schema:** Mọi thay đổi cấu trúc DB phải được thực hiện thông qua **Migration** và phải có file migration đảo ngược (**Reversible Migrations**) tương ứng.
- **Tối ưu hóa hiệu năng:** Đánh chỉ mục (Index) trên tất cả các cột khóa ngoại (FK) và các cột thường dùng để lọc hoặc tìm kiếm (ví dụ: `transaction_date`).
- **Giao dịch (Transactions):** Sử dụng các giao dịch ACID cho các thao tác ghi dữ liệu nhiều bảng cùng lúc.

---

## 6. Frontend Guidelines (React & Performance)

- **Công nghệ chính:** React (Vite), TypeScript, CSS thuần/Vanilla CSS để tối ưu hóa thiết kế hệ thống UI (tránh dùng TailwindCSS trừ khi có yêu cầu cụ thể).
- **Quản lý Trạng thái:**
  - Trạng thái máy chủ (Server State): Sử dụng **React Query (TanStack Query)**.
  - Trạng thái giao diện (UI State): Sử dụng **Zustand** hoặc **React Context**.
- **Hiệu năng hiển thị (Web Performance):**
  - Sử dụng phân trang (Pagination) hoặc cuộn vô hạn (Infinite Scroll) cho lịch sử giao dịch.
  - Sử dụng cuộn ảo (Virtual Scroll) cho danh sách có từ 100 phần tử trở lên.
  - Tối ưu hóa render bằng `React.memo`, `useCallback`, `useMemo` khi cần thiết.
- **Tiêu chuẩn Khả năng Tiếp cận (Accessibility):** Tuân thủ tiêu chuẩn WCAG, sử dụng HTML5 mang tính ngữ nghĩa (`<main>`, `<section>`, `<nav>`, `<article>`) và thuộc tính `aria-*` đầy đủ.

---

## 7. Backend Guidelines

- **Thiết kế phân lớp:** Controller mỏng (Thin Controllers) chỉ có nhiệm vụ nhận req/res, chuyển logic nghiệp vụ sang lớp Service (Service Layer), và truy xuất DB thông qua lớp Repository.
- **Xử lý lỗi tập trung (Centralized Errors):** Toàn bộ lỗi phát sinh phải được bắt bởi Middleware xử lý lỗi tập trung để định dạng lỗi theo đúng cấu trúc của Response Contract trước khi gửi về client.

---

## 8. Bảo mật (Security Guidelines)

- **Phòng chống các lỗ hổng OWASP:**
  - **SQL Injection:** Luôn sử dụng truy vấn có tham số (parameterized queries) hoặc ORM an toàn.
  - **XSS (Cross-Site Scripting):** Làm sạch dữ liệu đầu vào (input sanitization) và thoát ký tự nguy hiểm (escaping) trước khi render trên Frontend.
  - **CSRF (Cross-Site Request Forgery):** Sử dụng CSRF Tokens và cấu hình SameSite Cookie phù hợp.
  - **SSRF (Server-Side Request Forgery):** Xác thực và giới hạn các domain/IP mà backend được phép gửi request tới.
- **Xác thực & Phân quyền (Auth & RBAC):**
  - Sử dụng **JWT Access Token** (lưu trong memory/state của client) kết hợp **Refresh Token** (lưu trong HttpOnly, Secure, SameSite Cookie).
  - Áp dụng phân quyền dựa trên vai trò (**Role-Based Access Control - RBAC**).

---

## 9. Kiểm thử (Testing Guidelines)

- **Chỉ tiêu bao phủ (Coverage Target):** Tối thiểu **80%+** mã nguồn phải được kiểm thử.
- **Các loại kiểm thử:**
  - **Unit Tests:** Kiểm thử các hàm logic nghiệp vụ, các helper và custom hooks độc lập.
  - **Integration Tests:** Kiểm thử tương tác giữa các API, DB và các service.
  - **E2E Tests:** Kiểm thử luồng nghiệp vụ hoàn chỉnh của người dùng trên giao diện.
- **Cú pháp chạy test:** Quy định câu lệnh kiểm thử cụ thể trong tệp `package.json` (ví dụ: `npm run test`, `npm run test:cov`).

---

## 10. DevOps & Triển khai (DevOps Practices)

- **Quy trình CI/CD:**
  ```text
  Mã nguồn mới → Lint (ESLint) → Chạy Tests → Build sản phẩm → Deploy Staging/Production
  ```
- **Containerization (Docker):** Toàn bộ ứng dụng phải có `Dockerfile` cấu hình môi trường chạy ổn định cho từng môi trường Staging và Production.
