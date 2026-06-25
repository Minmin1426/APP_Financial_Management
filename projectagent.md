# PROJECTAGENT.md - Quy chuẩn Dự án App Quản lý Tài chính

Tài liệu này cung cấp bối cảnh nghiệp vụ, cấu trúc dự án, mô hình dữ liệu và các quy tắc kỹ thuật đặc thù cho **Dự án App Quản lý Tài chính (Financial Management Application)**.

---

## 1. Tổng quan Dự án (Project Overview)

- **Mục tiêu:** Xây dựng ứng dụng quản lý tài chính cá nhân/gia đình thông minh, giúp người dùng theo dõi thu chi, quản lý ngân sách, thiết lập mục tiêu tiết kiệm và phân tích xu hướng dòng tiền trực quan.
- **Các phân hệ chính:**
  1. **Quản lý Tài khoản / Ví (Accounts & Wallets):** Tiền mặt, tài khoản ngân hàng, thẻ tín dụng, ví điện tử.
  2. **Quản lý Thu chi (Transactions Ledger):** Ghi chép thu nhập, chi phí, chuyển khoản giữa các ví.
  3. **Quản lý Ngân sách (Budgets):** Thiết lập hạn mức chi tiêu theo danh mục (ví dụ: Ăn uống, Di chuyển) theo tháng/tuần và cảnh báo khi vượt định mức.
  4. **Báo cáo & Phân tích (Reports & Analytics):** Biểu đồ cơ cấu thu chi, xu hướng dòng tiền theo thời gian.
  5. **Mục tiêu Tiết kiệm (Savings Goals):** Đặt mục tiêu tích lũy (ví dụ: mua xe, du lịch) và theo dõi tiến độ.
  6. **Đồng bộ & Bảo mật (Sync & Security):** Bảo mật mã PIN/sinh trắc học, đồng bộ đám mây và hoạt động ngoại tuyến (Offline-First).

---

## 2. Kiến trúc & Cấu trúc Thư mục (Architecture & Project Structure)

Dự án áp dụng mô hình kiến trúc sạch (**Clean Architecture** hoặc **Feature-based Directory Structure**) tùy theo nền tảng:

```text
src/
├── assets/             # Hình ảnh, icon, font chữ
├── components/         # Các UI component dùng chung (Button, Input, Card, v.v.)
├── features/           # Phát triển theo tính năng (Feature-based)
│   ├── dashboard/      # Màn hình chính & tổng quan
│   ├── transactions/   # Nghiệp vụ ghi chép & danh sách giao dịch
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── transactionSlice.ts
│   ├── budget/         # Quản lý hạn mức chi tiêu
│   └── reports/        # Phân tích biểu đồ
├── hooks/              # Custom React/React Native Hooks dùng chung
├── navigation/         # Cấu hình định tuyến màn hình (Routing/Navigation)
├── services/           # Các dịch vụ dùng chung (API client, Local DB, Storage)
├── utils/              # Các hàm tiện ích (Format số tiền, ngày tháng, v.v.)
└── App.tsx (hoặc index.js)
```

---

## 3. Quy chuẩn Nghiệp vụ Tài chính (Financial Domain Rules)

Khi triển khai code cho dự án này, Agent phải tuân thủ tuyệt đối các quy tắc nghiệp vụ sau:

### 3.1. Độ chính xác của Tiền tệ (Monetary Precision)
- **CẤM SỬ DỤNG số thực dấu phẩy động (Float/Double) thông thường để tính toán tiền tệ** nhằm tránh lỗi làm tròn dấu phẩy động (ví dụ: `0.1 + 0.2 !== 0.3`).
- **Giải pháp:**
  - Đối với tiền tệ không có phần thập phân (như VND): Sử dụng số nguyên (`Integer` hoặc `BigInt` / `Number.isInteger`).
  - Đối với tiền tệ có phần thập phân (như USD, EUR): Lưu trữ dưới dạng đơn vị nhỏ nhất (Cent) dưới dạng số nguyên, HOẶC sử dụng thư viện xử lý số thập phân chính xác cao (ví dụ: `decimal.js`, `big.js`).
  - Khi lưu trữ vào cơ sở dữ liệu: Sử dụng kiểu dữ liệu `DECIMAL` hoặc `NUMERIC` với độ chính xác xác định (ví dụ: `DECIMAL(15, 2)`).

### 3.2. Định dạng Hiển thị (Formatting)
- Tiền tệ phải được định dạng theo locale tương ứng. Ví dụ:
  - Tiếng Việt: `1.250.000 ₫` hoặc `1,250,000 VND` (Sử dụng `Intl.NumberFormat`).
  - Quy ước màu sắc UI trực quan:
    - **Thu nhập (Income):** Màu xanh lá (Green - ví dụ: `#2ECC71` hoặc tương tự).
    - **Chi phí (Expense):** Màu đỏ (Red - ví dụ: `#E74C3C` hoặc tương tự).
    - **Chuyển khoản (Transfer):** Màu trung tính/xám hoặc xanh dương (Blue/Gray).

### 3.3. Quy tắc Ràng buộc Dữ liệu (Data Constraints)
- **Giao dịch (Transaction):** Phải luôn liên kết với ít nhất một **Ví/Tài khoản** và một **Danh mục (Category)**.
- **Giao dịch Chuyển khoản (Transfer):** Phải xác định rõ **Ví gửi (From Account)** và **Ví nhận (To Account)**. Số dư ví gửi giảm và số dư ví nhận tăng tương ứng trong cùng một transaction database (ACID) để đảm bảo tính nhất quán dữ liệu.
- **Ngày giao dịch (Transaction Date):** Mặc định là ngày hiện tại nhưng cho phép người dùng tùy chọn ngày trong quá khứ hoặc tương lai.

---

## 4. Thiết kế Cơ sở Dữ liệu & Lưu trữ (Database & Storage)

### Các Thực thể Chính (Core Schema Entities)
- `User`: ID, Email, Name, Preferences (Currency, Language, Dark Mode).
- `Account/Wallet`: ID, Name, Type (Cash, Bank, Credit), Balance (Số dư hiện tại), Currency.
- `Category`: ID, Name, Type (Income, Expense), Icon, Color, ParentCategoryID (cho danh mục cha-con).
- `Transaction`: ID, AccountID, DestinationAccountID (chỉ dùng cho Transfer), CategoryID, Amount, Type (Income, Expense, Transfer), Notes, CreatedAt, TransactionDate.
- `Budget`: ID, CategoryID, LimitAmount, SpentAmount, StartDate, EndDate.

---

## 5. Quy tắc Kỹ thuật Đặc thù (Technical Constraints)

- **Offline-First:** Ứng dụng cần hoạt động mượt mà ngay cả khi không có kết nối Internet.
  - Sử dụng SQLite (cho Mobile) hoặc IndexedDB (cho Web) để lưu trữ local.
  - Thiết kế cơ chế đồng bộ (Sync Queue) để đồng bộ dữ liệu lên Server khi thiết bị trực tuyến trở lại, xử lý xung đột (Conflict Resolution) theo quy tắc: "Giao dịch mới nhất ghi đè" hoặc "Hợp nhất dựa trên ID giao dịch".
- **Hiệu năng:**
  - Danh sách giao dịch có thể rất lớn theo thời gian. Bắt buộc phải triển khai phân trang (Pagination) hoặc Lazy Loading / Virtualized List cho màn hình lịch sử giao dịch.
  - Sử dụng index trên các cột truy vấn thường xuyên: `transaction_date`, `account_id`, `category_id`.
- **Bảo mật:**
  - Tuyệt đối không lưu trữ thông tin nhạy cảm của người dùng (như mật khẩu, mã PIN ngân hàng liên kết) dưới dạng text thuần (plaintext).
  - Sử dụng keychain/keystore bảo mật của hệ điều hành để lưu trữ token đăng nhập.
