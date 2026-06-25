/**
 * Định dạng số tiền thành chuỗi tiền tệ Việt Nam (VND).
 * Ví dụ: 1500000 -> "1.500.000 ₫"
 * 
 * @param amount Số tiền cần định dạng (dạng số nguyên)
 * @returns Chuỗi tiền tệ đã định dạng
 */
export function formatCurrency(amount: number): string {
  // Tránh hiển thị giá trị NaN hoặc không xác định
  if (isNaN(amount) || amount === undefined || amount === null) {
    return '0 ₫';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Giới hạn số tiền tối đa của hệ thống để phòng ngừa tràn số hoặc giao diện UI bị vỡ.
 * Theo spec.md: Tối đa 999.999.999.999 ₫ (12 chữ số)
 */
export const MAX_FINANCIAL_AMOUNT = 999999999999;

/**
 * Kiểm tra xem một số tiền nhập vào có hợp lệ hay không.
 * Phải là số nguyên, lớn hơn hoặc bằng 0 và không vượt quá giới hạn tối đa.
 * 
 * @param amount Số tiền cần kiểm tra
 * @returns true nếu hợp lệ, ngược lại false
 */
export function isValidAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  
  // Phải là số nguyên
  if (!Number.isInteger(amount)) {
    return false;
  }
  
  // Phải lớn hơn hoặc bằng 0 và không vượt quá giới hạn
  return amount >= 0 && amount <= MAX_FINANCIAL_AMOUNT;
}

/**
 * Cộng hai số tiền một cách an toàn (tránh sai số làm tròn).
 * Đảm bảo kết quả trả về luôn là số nguyên.
 * 
 * @param a Số thứ nhất
 * @param b Số thứ hai
 * @returns Tổng là một số nguyên
 */
export function safeAdd(a: number, b: number): number {
  const intA = Math.round(a);
  const intB = Math.round(b);
  
  const sum = intA + intB;
  if (sum > MAX_FINANCIAL_AMOUNT) {
    throw new Error('Giao dịch vượt quá số dư tối đa cho phép.');
  }
  
  return sum;
}

/**
 * Trừ hai số tiền một cách an toàn (tránh sai số làm tròn).
 * Đảm bảo kết quả trả về luôn là số nguyên.
 * 
 * @param a Số bị trừ
 * @param b Số trừ
 * @returns Hiệu là một số nguyên
 */
export function safeSubtract(a: number, b: number): number {
  const intA = Math.round(a);
  const intB = Math.round(b);
  
  const diff = intA - intB;
  if (Math.abs(diff) > MAX_FINANCIAL_AMOUNT) {
    throw new Error('Số dư mới vượt giới hạn tối đa cho phép.');
  }
  
  return diff;
}
