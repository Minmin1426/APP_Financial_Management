import {
  calculateProgressPercentage,
  getBudgetStatusColor,
  isBudgetExceeded
} from '../budgetUtils';

describe('Kiểm thử budgetUtils (Tiện ích Ngân sách)', () => {
  describe('calculateProgressPercentage', () => {
    test('Tính phần trăm chính xác trong điều kiện bình thường', () => {
      expect(calculateProgressPercentage(50000, 100000)).toBe(50);
      expect(calculateProgressPercentage(80000, 100000)).toBe(80);
      expect(calculateProgressPercentage(120000, 100000)).toBe(120);
    });

    test('Xử lý làm tròn số thập phân chính xác (2 chữ số)', () => {
      expect(calculateProgressPercentage(1, 3)).toBe(33.33);
      expect(calculateProgressPercentage(2, 3)).toBe(66.67);
    });

    test('Xử lý trường hợp hạn mức bằng 0 hoặc nhỏ hơn', () => {
      expect(calculateProgressPercentage(50000, 0)).toBe(0);
      expect(calculateProgressPercentage(50000, -100)).toBe(0);
    });

    test('Xử lý chi tiêu bằng 0', () => {
      expect(calculateProgressPercentage(0, 100000)).toBe(0);
    });
  });

  describe('getBudgetStatusColor', () => {
    test('Trả về "safe" khi phần trăm chi tiêu dưới 80%', () => {
      expect(getBudgetStatusColor(0)).toBe('safe');
      expect(getBudgetStatusColor(50)).toBe('safe');
      expect(getBudgetStatusColor(79.99)).toBe('safe');
    });

    test('Trả về "warning" khi phần trăm chi tiêu từ 80% đến dưới 100%', () => {
      expect(getBudgetStatusColor(80)).toBe('warning');
      expect(getBudgetStatusColor(90)).toBe('warning');
      expect(getBudgetStatusColor(99.99)).toBe('warning');
    });

    test('Trả về "danger" khi phần trăm chi tiêu từ 100% trở lên', () => {
      expect(getBudgetStatusColor(100)).toBe('danger');
      expect(getBudgetStatusColor(105)).toBe('danger');
      expect(getBudgetStatusColor(200)).toBe('danger');
    });
  });

  describe('isBudgetExceeded', () => {
    test('Trả về false khi chi tiêu chưa vượt quá hạn mức', () => {
      expect(isBudgetExceeded(50000, 100000)).toBe(false);
      expect(isBudgetExceeded(100000, 100000)).toBe(false); // Bằng hạn mức chưa gọi là vượt
    });

    test('Trả về true khi chi tiêu vượt quá hạn mức', () => {
      expect(isBudgetExceeded(100001, 100000)).toBe(true);
      expect(isBudgetExceeded(150000, 100000)).toBe(true);
    });
  });
});
