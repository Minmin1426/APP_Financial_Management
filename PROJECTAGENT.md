# PROJECTAGENT.md - Quy chuẩn Dự án Web Quản lý Tài chính

Tài liệu này cung cấp bối cảnh nghiệp vụ, cấu trúc dự án, mô hình dữ liệu và các quy tắc kỹ thuật đặc thù cho **Dự án Web Quản lý Tài chính (Financial Management Web Application)**.

---

## 1. Tổng quan Dự án (Project Overview)

- **Mục tiêu:** Xây dựng ứng dụng web (Web Application) quản lý tài chính cá nhân/gia đình thông minh, giúp người dùng theo dõi thu chi, quản lý ngân sách, thiết lập mục tiêu tiết kiệm và phân tích xu hướng dòng tiền trực quan ngay trên trình duyệt.
- **Các phân hệ chính:**
  1. **Quản lý Tài khoản / Ví (Accounts & Wallets):** Tiền mặt, tài khoản ngân hàng, thẻ tín dụng, ví điện tử.
  2. **Quản lý Thu chi (Transactions Ledger):** Ghi chép thu nhập, chi phí, chuyển khoản giữa các ví.
  3. **Quản lý Ngân sách (Budgets):** Thiết lập hạn mức chi tiêu theo danh mục (ví dụ: Ăn uống, Di chuyển) theo tháng/tuần và cảnh báo khi vượt định mức.
  4. **Báo cáo & Phân tích (Reports & Analytics):** Biểu đồ cơ cấu thu chi, xu hướng dòng tiền trực quan (sử dụng SVG/Canvas hoặc thư viện Chart.js/Recharts).
  5. **Mục tiêu Tiết kiệm (Savings Goals):** Đặt mục tiêu tích lũy và theo dõi tiến độ.
  6. **Đồng bộ & Bảo mật (Sync & Security):** Xác thực người dùng, đồng bộ đám mây và hỗ trợ hoạt động ngoại tuyến (Offline-First) trên trình duyệt.

---

## 2. Kiến trúc & Cấu trúc Thư mục (Architecture & Project Structure)

Dự án áp dụng mô hình kiến trúc sạch (**Clean Architecture** hoặc **Feature-based**) được tối ưu hóa cho ứng dụng Web (ví dụ: Vite + React hoặc Next.js):

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
└── main.tsx (hoặc App.tsx)
```

---

## 3. Quy chuẩn Nghiệp vụ Tài chính (Financial Domain Rules)

Khi triển khai code cho dự án này, Agent phải tuân thủ tuyệt đối các quy tắc nghiệp vụ sau:

### 3.1. Độ chính xác của Tiền tệ (Monetary Precision)
- **CẤM SỬ DỤNG số thực dấu phẩy động (Float/Double) để tính toán tiền tệ** trực tiếp nhằm tránh lỗi làm tròn dấu phẩy động trên JavaScript (ví dụ: `0.1 + 0.2 !== 0.3`).
- **Giải pháp:**
  - Đối với VND (không thập phân): Sử dụng số nguyên (`Math.round()`, `BigInt` hoặc kiểm tra `Number.isInteger`).
  - Đối với các loại tiền tệ có phần thập phân: Nhân với 100 để đưa về đơn vị nhỏ nhất (ví dụ: Cent) và lưu dưới dạng số nguyên, HOẶC dùng các thư viện toán học chính xác cao như `decimal.js` hay `big.js`.
  - Cấu trúc lưu trữ DB: Sử dụng kiểu dữ liệu `DECIMAL` hoặc `NUMERIC` (ví dụ: `DECIMAL(15, 2)`).

### 3.2. Định dạng Hiển thị trên Web (Web Formatting)
- Tiền tệ phải được định dạng theo locale tương ứng qua hàm `Intl.NumberFormat`. Ví dụ:
  - Tiếng Việt: `1.250.000 ₫` hoặc `1,250,000 VND`.
  - Quy ước màu sắc UI trực quan trên web:
    - **Thu nhập (Income):** Màu xanh lá (Green - ví dụ: `#2ECC71` hoặc tương tự).
    - **Chi phí (Expense):** Màu đỏ (Red - ví dụ: `#E74C3C` hoặc tương tự).
    - **Chuyển khoản (Transfer):** Màu trung tính/xanh dương.

### 3.3. Quy tắc Ràng buộc Giao dịch
- **Giao dịch (Transaction):** Phải liên kết với **Ví/Tài khoản (Account)** và **Danh mục (Category)**.
- **Giao dịch Chuyển khoản (Transfer):** Phải ghi nhận ví gửi và ví nhận. Cần đảm bảo cập nhật đồng thời số dư cả hai ví trong một Transaction duy nhất để đảm bảo tính toàn vẹn dữ liệu.

---

## 4. Thiết kế Cơ sở Dữ liệu & Lưu trữ (Database & Storage)

### Các Thực thể Chính (Core Schema Entities)
- `User`: ID, Email, Name, Preferences (Currency, Language, Theme).
- `Account/Wallet`: ID, Name, Type (Cash, Bank, Credit), Balance (Số dư hiện tại), Currency.
- `Category`: ID, Name, Type (Income, Expense), Icon, Color.
- `Transaction`: ID, AccountID, DestinationAccountID (chuyển khoản), CategoryID, Amount, Type (Income, Expense, Transfer), Notes, TransactionDate, CreatedAt.
- `Budget`: ID, CategoryID, LimitAmount, SpentAmount, StartDate, EndDate.

---

## 5. Quy tắc Kỹ thuật Đặc thù cho Web (Technical Constraints)

- **Offline-First & Local Caching:**
  - Sử dụng **IndexedDB** (qua thư viện bổ trợ như `Dexie.js`) hoặc **LocalStorage** làm bộ nhớ đệm (Cache) trên trình duyệt giúp ứng dụng hoạt động ngay cả khi mất kết nối mạng.
  - Tích hợp **Service Workers** (PWA - Progressive Web App) để cache tài nguyên tĩnh (HTML/CSS/JS) giúp web tải nhanh hơn.
- **Hiệu năng & Trải nghiệm Người dùng (Web Performance):**
  - Tránh tải quá nhiều dòng dữ liệu giao dịch cùng lúc làm đơ trình duyệt. Bắt buộc sử dụng phân trang (Pagination), cuộn vô hạn (Infinite Scroll), hoặc Virtual Scroll cho bảng lịch sử giao dịch.
  - Tối ưu hóa render danh sách giao dịch bằng cách sử dụng `React.memo` hoặc các giải pháp tránh re-render không cần thiết.
- **Bảo mật Web (Web Security):**
  - Không lưu các thông tin nhạy cảm của người dùng (Token truy cập dài hạn, mật khẩu) trực tiếp vào `localStorage` không mã hóa. Khuyên dùng **HttpOnly Cookies** hoặc cơ chế **Refresh Token** trong bộ nhớ tạm (Memory/State).
  - Phòng chống các lỗ hổng web cơ bản như XSS (Cross-Site Scripting) bằng cách sanitize input đầu vào của người dùng trước khi render lên UI, và CSRF bằng các token an toàn.
- **Responsive Design:** Giao diện web phải tối ưu trên cả Desktop, Tablet và Mobile Web bằng cách sử dụng CSS Flexbox, Grid và Media Queries linh hoạt.
