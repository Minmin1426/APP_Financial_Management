import Dexie, { type Table } from 'dexie';

// Định nghĩa giao diện ví tài khoản
export interface Wallet {
  id: string;               // Khóa chính dạng UUID
  name: string;             // Tên ví (ví dụ: Tiền mặt, Techcombank)
  type: 'cash' | 'bank' | 'credit'; // Loại ví: Tiền mặt, Ngân hàng, Thẻ tín dụng
  balance: number;          // Số dư hiện tại (luôn lưu dạng số nguyên VND)
  createdAt: Date;          // Ngày tạo ví
  updatedAt: Date;          // Ngày cập nhật ví
  lastSyncedAt: Date | null; // Thời điểm đồng bộ lên server gần nhất (null nếu chưa đồng bộ)
}

// Định nghĩa giao diện danh mục thu chi
export interface Category {
  id: string;               // Khóa chính dạng UUID
  name: string;             // Tên danh mục (ví dụ: Ăn uống, Lương)
  type: 'income' | 'expense'; // Phân loại: Thu nhập hoặc Chi phí
  icon: string;             // Icon đại diện (chuỗi kí tự lucide-react)
  color: string;            // Mã màu hiển thị (ví dụ: Hex color)
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
}

// Định nghĩa giao diện giao dịch tài chính
export interface Transaction {
  id: string;                     // Khóa chính dạng UUID
  amount: number;                 // Số tiền giao dịch (luôn là số nguyên VND)
  type: 'income' | 'expense' | 'transfer'; // Phân loại giao dịch
  walletId: string;               // ID ví thực hiện (ví gửi đối với chuyển khoản)
  destinationWalletId?: string;   // ID ví nhận (chỉ sử dụng khi chuyển khoản)
  categoryId?: string;            // ID danh mục (chuyển khoản không cần danh mục)
  notes: string;                  // Ghi chú giao dịch
  transactionDate: Date;          // Ngày diễn ra giao dịch
  createdAt: Date;                // Ngày tạo bản ghi giao dịch
  updatedAt: Date;                // Ngày cập nhật bản ghi
  lastSyncedAt: Date | null;      // Thời điểm đồng bộ lên server
}

// Định nghĩa giao diện ngân sách chi tiêu
export interface Budget {
  id: string;               // Khóa chính dạng UUID
  categoryId: string;       // ID danh mục được thiết lập ngân sách
  limitAmount: number;      // Hạn mức chi tiêu tối đa (số nguyên VND)
  startDate: Date;          // Ngày bắt đầu chu kỳ ngân sách
  endDate: Date;            // Ngày kết thúc chu kỳ ngân sách
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
}

// Lớp quản lý cơ sở dữ liệu FinancialDB sử dụng Dexie.js
class FinancialDB extends Dexie {
  wallets!: Table<Wallet, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('FinancialDB');
    
    // Định nghĩa Schema lưu trữ cục bộ
    // Không dùng '++id' tự tăng để tránh xung đột khóa chính khi đồng bộ hai chiều
    this.version(1).stores({
      wallets: 'id, name, type, lastSyncedAt',
      categories: 'id, name, type, lastSyncedAt',
      transactions: 'id, amount, type, walletId, categoryId, transactionDate, lastSyncedAt',
      budgets: 'id, categoryId, startDate, endDate, lastSyncedAt'
    });
  }
}

// Khởi tạo và export instance cơ sở dữ liệu duy nhất
export const db = new FinancialDB();
export default db;
