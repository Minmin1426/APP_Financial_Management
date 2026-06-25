# Implementation Plan: Financial Management Core (Web Application)

**Branch**: `feat/financial-management-core` | **Date**: 2026-06-25 | **Spec**: [spec.md](file:///c:/Users/Minmin/Desktop/APP_FinancialManagement/specs/financial-management-core/spec.md)

**Input**: Đặc tả tính năng từ `specs/financial-management-core/spec.md`.

---

## Summary

Dự án sẽ xây dựng một ứng dụng Single Page Application (SPA) quản lý tài chính cá nhân sử dụng **Vite + React + TypeScript**. Giao diện ứng dụng được thiết kế hoàn toàn bằng **Vanilla CSS** (CSS Variables) để đảm bảo hiệu năng tối đa và tính tùy biến cao mà không cần thư viện UI nặng nề. Toàn bộ cơ sở dữ liệu sẽ được lưu trữ dưới Client sử dụng **IndexedDB** (thông qua thư viện **Dexie.js**) để đáp ứng nguyên tắc **Offline-First**.

---

## Technical Context

- **Language/Version:** TypeScript >= 5.0, JavaScript (ES6+)
- **Framework:** React 18+ (Vite làm build tool)
- **Primary Dependencies:** 
  - `dexie` & `dexie-react-hooks` (Xử lý IndexedDB an toàn, reactive)
  - `lucide-react` (Bộ icon mượt mà, tối giản)
  - Thư viện biểu đồ: vẽ biểu đồ trực tiếp bằng SVG hoặc tích hợp `recharts` nhẹ.
- **Storage:** IndexedDB (Dexie.js) cho lưu trữ bền vững ngoại tuyến; LocalStorage cho tùy chọn cài đặt giao diện (Theme).
- **Testing:** Jest + React Testing Library (cho unit & integration test).
- **Target Platform:** Mọi trình duyệt web hiện đại hỗ trợ Service Worker và IndexedDB.
- **Performance Goals:** 
  - Điểm Lighthouse Performance > 90.
  - Phản hồi lưu trữ < 100ms.
- **Constraints:** Hoạt động không cần mạng (Offline-capable), không dùng float cho tính toán số dư/số tiền.

---

## Constitution Check

*GATE: Đảm bảo thiết kế kỹ thuật tuân thủ tài liệu Constitution.*

| Nguyên tắc | Đánh giá tuân thủ | Giải pháp thiết kế |
|---|---|---|
| **I. Web-First & Offline-Capable** | ĐẠT | Sử dụng Dexie.js để đồng bộ và truy cập IndexedDB trực tiếp. Sử dụng Vite PWA Plugin để tạo Service Worker cache tĩnh. |
| **II. Strict Monetary Precision** | ĐẠT | Tiền tệ lưu dưới dạng số nguyên (VND). Hàm tính toán cộng/trừ số dư được đóng gói riêng trong `utils/finance.ts` sử dụng kiểu dữ liệu `BigInt` hoặc `number` (kiểm tra Integer). |
| **III. Responsive & Clean UI** | ĐẠT | Sử dụng CSS Grid/Flexbox và Media Queries. Thiết kế hệ màu sắc với CSS Variables tại `styles/theme.css`. |
| **IV. Security & Privacy First** | ĐẠT | Không lưu trữ dữ liệu tài chính thô không an toàn. Triển khai phân tách ví cục bộ và sẵn sàng mã hóa trường ghi chú/số dư nếu cần. |
| **V. Component-Driven** | ĐẠT | Mỗi folder tính năng trong `features/` sẽ chứa các component nhỏ, biệt lập. Ví dụ: `features/transactions/components/TransactionForm.tsx`. |

---

## Project Structure

Dự án áp dụng mô hình Feature-based kết hợp kiến trúc sạch cho Web:

```text
specs/financial-management-core/
├── spec.md              # Đặc tả tính năng
├── plan.md              # Kế hoạch triển khai (file này)
└── tasks.md             # Danh sách tác vụ chi tiết

src/
├── assets/              # Tài nguyên tĩnh (Logo, SVGs)
├── components/          # UI components dùng chung (Modal, Card, Button, Input)
│   └── ui/
├── db/                  # Cấu hình cơ sở dữ liệu IndexedDB (schema.ts, db.ts)
├── features/            # Các folder chứa logic theo tính năng
│   ├── dashboard/       # Tổng quan số dư, danh sách ví
│   ├── transactions/    # Logic thêm/sửa/xóa và bảng lịch sử giao dịch
│   ├── budget/          # Thiết lập và kiểm tra ngân sách chi tiêu
│   └── reports/         # Biểu đồ và báo cáo phân tích
├── hooks/               # Custom React Hooks dùng chung (useTheme, useOnlineStatus)
├── styles/              # CSS toàn cục, CSS Variables (index.css, theme.css)
├── utils/               # Tiện ích định dạng số, ngày tháng, tính toán tài chính
├── App.tsx              # Component gốc điều hướng màn hình
└── main.tsx             # Entrypoint khởi tạo React
```

---

## Technical Design Details

### 1. Cơ sở dữ liệu IndexedDB (Dexie.js)
Định nghĩa database schema tại `src/db/db.ts`:
```typescript
import Dexie, { type Table } from 'dexie';

export interface Wallet {
  id?: string;
  userId: string; // Định danh người dùng
  name: string;
  type: 'cash' | 'bank' | 'credit';
  balance: number; // Lưu trữ dưới dạng số nguyên (VND)
  createdAt: Date;
  deletedAt?: Date; // Trường xóa mềm
  deletedBy?: string; // Người xóa
}

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Transaction {
  id?: string;
  userId: string; // Định danh người dùng
  amount: number; // Lưu dạng số nguyên
  type: 'income' | 'expense' | 'transfer';
  walletId: string;
  destinationWalletId?: string; // Chỉ dùng khi transfer
  categoryId?: string; // Tùy chọn (transfer không cần category)
  notes: string;
  transactionDate: Date;
  createdAt: Date;
  deletedAt?: Date; // Trường xóa mềm
  deletedBy?: string; // Người xóa
}

export interface Budget {
  id?: string;
  categoryId: string;
  limitAmount: number;
  startDate: Date;
  endDate: Date;
}

export interface AuditLog {
  id?: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'wallet' | 'transaction' | 'budget';
  entityId: string;
  oldValue?: string; // Dữ liệu cũ dạng JSON string
  newValue?: string; // Dữ liệu mới dạng JSON string
  timestamp: Date;
}

class FinancialDB extends Dexie {
  wallets!: Table<Wallet>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super('FinancialDB');
    this.version(1).stores({
      wallets: '++id, name, type, userId, deletedAt',
      categories: '++id, name, type',
      transactions: '++id, amount, type, walletId, categoryId, transactionDate, deletedAt',
      budgets: '++id, categoryId, startDate, endDate',
      auditLogs: '++id, userId, action, entity, timestamp'
    });
  }
}

export const db = new FinancialDB();
```

### 2. Xử lý Giao dịch và Tính toán Số dư (ACID-like Transactions)
Để đảm bảo số dư ví luôn khớp với danh sách giao dịch, mọi thao tác ghi chép giao dịch phải được thực hiện trong cơ chế transaction của Dexie:
- **Thêm Expense**: Giảm số dư ví liên quan.
- **Thêm Income**: Tăng số dư ví liên quan.
- **Thêm Transfer**: Giảm ví nguồn, tăng ví đích.
- Sửa/Xóa giao dịch: Hoàn trả số dư cũ và áp dụng số dư mới.
Ví dụ triển khai:
```typescript
db.transaction('rw', [db.transactions, db.wallets], async () => {
  // 1. Thêm giao dịch
  await db.transactions.add(newTransaction);
  // 2. Cập nhật ví tương ứng
  const wallet = await db.wallets.get(newTransaction.walletId);
  if (wallet) {
    const newBalance = wallet.balance - newTransaction.amount; // Nếu là expense
    await db.wallets.update(newTransaction.walletId, { balance: newBalance });
  }
});
```
