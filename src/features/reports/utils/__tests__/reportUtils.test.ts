import { getExpenseStructure, getCashFlowTrend } from '../reportUtils';
import { type Transaction, type Category } from '../../../../db/db';

describe('Kiểm thử reportUtils (Tiện ích Báo cáo)', () => {
  const TEST_CATEGORIES: Category[] = [
    {
      id: 'cat-food',
      name: 'Ăn uống',
      type: 'expense',
      icon: 'Utensils',
      color: '#e67e22',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    },
    {
      id: 'cat-rent',
      name: 'Thuê nhà',
      type: 'expense',
      icon: 'Home',
      color: '#3498db',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    },
    {
      id: 'cat-salary',
      name: 'Lương',
      type: 'income',
      icon: 'DollarSign',
      color: '#2ecc71',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    }
  ];

  const TEST_TRANSACTIONS: Transaction[] = [
    {
      id: 'tx-1',
      amount: 100000, // 100.000 ₫
      type: 'expense',
      walletId: 'w1',
      categoryId: 'cat-food',
      notes: 'Ăn trưa',
      transactionDate: new Date('2026-06-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    },
    {
      id: 'tx-2',
      amount: 300000, // 300.000 ₫
      type: 'expense',
      walletId: 'w1',
      categoryId: 'cat-rent',
      notes: 'Hóa đơn nhà',
      transactionDate: new Date('2026-06-10'),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    },
    {
      id: 'tx-3',
      amount: 15000000, // 15.000.000 ₫
      type: 'income',
      walletId: 'w1',
      categoryId: 'cat-salary',
      notes: 'Lương tháng 6',
      transactionDate: new Date('2026-06-05'),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    },
    {
      id: 'tx-4',
      amount: 100000, // 100.000 ₫
      type: 'expense',
      walletId: 'w1',
      categoryId: 'cat-food',
      notes: 'Ăn tối',
      transactionDate: new Date('2026-05-20'), // Tháng trước
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    }
  ];

  describe('getExpenseStructure', () => {
    test('Gom nhóm chi phí chính xác và tính tỷ lệ phần trăm chính xác', () => {
      const result = getExpenseStructure(TEST_TRANSACTIONS, TEST_CATEGORIES);

      // Tổng chi phí: 100k (tx-1) + 300k (tx-2) + 100k (tx-4) = 500.000 ₫
      // Ăn uống: 200k / 500k = 40%
      // Thuê nhà: 300k / 500k = 60%

      expect(result).toHaveLength(2);
      
      // Đã được sắp xếp giảm dần theo số tiền (Thuê nhà (300k) trước Ăn uống (200k))
      expect(result[0].name).toBe('Thuê nhà');
      expect(result[0].amount).toBe(300000);
      expect(result[0].value).toBe(60);
      expect(result[0].color).toBe('#3498db');

      expect(result[1].name).toBe('Ăn uống');
      expect(result[1].amount).toBe(200000);
      expect(result[1].value).toBe(40);
      expect(result[1].color).toBe('#e67e22');
    });

    test('Trả về mảng rỗng nếu không có chi phí nào', () => {
      const incomeOnly = TEST_TRANSACTIONS.filter((t) => t.type === 'income');
      const result = getExpenseStructure(incomeOnly, TEST_CATEGORIES);
      expect(result).toEqual([]);
    });
  });

  describe('getCashFlowTrend', () => {
    test('Tổng hợp thu chi 12 tháng của năm chính xác', () => {
      const result = getCashFlowTrend(TEST_TRANSACTIONS, 2026);

      expect(result).toHaveLength(12);

      // Tháng 5 (index 4 - "Th. 05"): Chi phí = 100.000 ₫, Thu nhập = 0 ₫
      expect(result[4].month).toBe('Th. 05');
      expect(result[4].expense).toBe(100000);
      expect(result[4].income).toBe(0);

      // Tháng 6 (index 5 - "Th. 06"): Chi phí = 400.000 ₫, Thu nhập = 15.000.000 ₫
      expect(result[5].month).toBe('Th. 06');
      expect(result[5].expense).toBe(400000);
      expect(result[5].income).toBe(15000000);

      // Các tháng khác phải bằng 0
      expect(result[0].expense).toBe(0);
      expect(result[0].income).toBe(0);
    });
  });
});
