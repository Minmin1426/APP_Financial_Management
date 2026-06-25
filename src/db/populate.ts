import db, { type Category, type Wallet } from './db';

// Danh sách danh mục thu/chi mặc định với UUID tĩnh để tránh trùng lặp
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    name: 'Ăn uống',
    type: 'expense',
    icon: 'Utensils',
    color: '#e67e22', // Màu cam
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    name: 'Di chuyển',
    type: 'expense',
    icon: 'Car',
    color: '#3498db', // Xanh dương
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-a000-000000000003',
    name: 'Mua sắm',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#9b59b6', // Tím
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-a000-000000000004',
    name: 'Giải trí',
    type: 'expense',
    icon: 'Film',
    color: '#e74c3c', // Đỏ
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-a000-000000000005',
    name: 'Nhà cửa & Hóa đơn',
    type: 'expense',
    icon: 'Home',
    color: '#f1c40f', // Vàng
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-b000-000000000001',
    name: 'Lương',
    type: 'income',
    icon: 'Briefcase',
    color: '#2ecc71', // Xanh lá
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-b000-000000000002',
    name: 'Kinh doanh',
    type: 'income',
    icon: 'TrendingUp',
    color: '#1abc9c', // Ngọc bích
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  },
  {
    id: '00000000-0000-4000-b000-000000000003',
    name: 'Đầu tư',
    type: 'income',
    icon: 'Coins',
    color: '#f39c12', // Vàng cam sậm
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  }
];

// Danh sách ví tài khoản mặc định
export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: '00000000-0000-4000-c000-000000000001',
    name: 'Tiền mặt',
    type: 'cash',
    balance: 1000000, // Khởi tạo 1.000.000 ₫ cho việc test thuận tiện
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    lastSyncedAt: null
  }
];

// Hàm thực hiện tạo dữ liệu mặc định trong IndexedDB nếu chưa tồn tại
export async function populateDefaultData(): Promise<void> {
  // Đếm số lượng danh mục hiện tại
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    console.log('Đang khởi tạo danh mục mặc định trong IndexedDB...');
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  // Đếm số lượng ví hiện tại
  const walletCount = await db.wallets.count();
  if (walletCount === 0) {
    console.log('Đang khởi tạo ví mặc định trong IndexedDB...');
    await db.wallets.bulkAdd(DEFAULT_WALLETS);
  }
}
