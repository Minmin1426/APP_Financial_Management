import { formatCurrency, isValidAmount, safeAdd, safeSubtract, MAX_FINANCIAL_AMOUNT } from '../finance';

describe('Kiểm thử Tiện ích Tài chính (finance.ts)', () => {
  describe('Hàm formatCurrency (Định dạng Tiền tệ)', () => {
    test('Định dạng đúng số tiền dương', () => {
      // Vì unicode khoảng trắng khác nhau tùy node/trình duyệt, ta chuẩn hóa khoảng trắng để so sánh
      const result = formatCurrency(1500000).replace(/\s/g, ' ');
      expect(result).toMatch(/1\.500\.000\s*₫/);
    });

    test('Định dạng đúng số tiền bằng 0', () => {
      const result = formatCurrency(0).replace(/\s/g, ' ');
      expect(result).toMatch(/0\s*₫/);
    });

    test('Định dạng đúng số tiền âm', () => {
      const result = formatCurrency(-50000).replace(/\s/g, ' ');
      expect(result).toMatch(/-50\.000\s*₫/);
    });

    test('Trả về 0 ₫ nếu truyền vào NaN hoặc null', () => {
      expect(formatCurrency(NaN)).toBe('0 ₫');
      expect(formatCurrency(null as any)).toBe('0 ₫');
    });
  });

  describe('Hàm isValidAmount (Kiểm tra Số tiền Hợp lệ)', () => {
    test('Số tiền hợp lệ', () => {
      expect(isValidAmount(50000)).toBe(true);
      expect(isValidAmount(0)).toBe(true);
      expect(isValidAmount(MAX_FINANCIAL_AMOUNT)).toBe(true);
    });

    test('Số tiền không hợp lệ (số âm)', () => {
      expect(isValidAmount(-100)).toBe(false);
    });

    test('Số tiền không hợp lệ (số thực)', () => {
      expect(isValidAmount(50.5)).toBe(false);
    });

    test('Số tiền không hợp lệ (vượt giới hạn 12 chữ số)', () => {
      expect(isValidAmount(MAX_FINANCIAL_AMOUNT + 1)).toBe(false);
    });

    test('Số tiền không hợp lệ (kiểu dữ liệu không phải số)', () => {
      expect(isValidAmount('50000' as any)).toBe(false);
      expect(isValidAmount(undefined as any)).toBe(false);
    });
  });

  describe('Hàm safeAdd và safeSubtract (Cộng trừ Số nguyên an toàn)', () => {
    test('Phép cộng hợp lệ', () => {
      expect(safeAdd(100000, 50000)).toBe(150000);
      expect(safeAdd(0, 0)).toBe(0);
    });

    test('Phép trừ hợp lệ', () => {
      expect(safeSubtract(100000, 30000)).toBe(70000);
      expect(safeSubtract(50000, 100000)).toBe(-50000);
    });

    test('Cộng làm tròn số lẻ thành số nguyên', () => {
      expect(safeAdd(10.2, 20.8)).toBe(31); // 10 + 21
    });

    test('Trừ làm tròn số lẻ thành số nguyên', () => {
      expect(safeSubtract(50.4, 10.6)).toBe(39); // 50 - 11
    });

    test('Báo lỗi nếu phép cộng vượt giới hạn', () => {
      expect(() => safeAdd(MAX_FINANCIAL_AMOUNT, 1)).toThrow();
    });

    test('Báo lỗi nếu phép trừ vượt giới hạn', () => {
      expect(() => safeSubtract(-MAX_FINANCIAL_AMOUNT, 1)).toThrow();
    });
  });
});
