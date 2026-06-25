/**
 * Các hàm tiện ích tính toán và phân tích ngân sách chi tiêu.
 */

/**
 * Tính toán phần trăm tiến độ chi tiêu so với hạn mức ngân sách.
 * Trả về giá trị số thực từ 0 đến 100 (hoặc cao hơn nếu vượt quá hạn mức).
 */
export function calculateProgressPercentage(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  // Làm tròn đến 2 chữ số thập phân
  return Math.round((spent / limit) * 10000) / 100;
}

/**
 * Xác định màu sắc/lớp trạng thái dựa trên phần trăm chi tiêu ngân sách.
 * - 'safe' (Màu xanh): Chi phí dưới 80% hạn mức.
 * - 'warning' (Màu cam): Chi phí từ 80% đến dưới 100% hạn mức.
 * - 'danger' (Màu đỏ): Chi phí bằng hoặc vượt quá 100% hạn mức.
 */
export function getBudgetStatusColor(percentage: number): 'safe' | 'warning' | 'danger' {
  if (percentage < 80) {
    return 'safe';
  }
  if (percentage < 100) {
    return 'warning';
  }
  return 'danger';
}

/**
 * Kiểm tra xem chi tiêu đã vượt quá hạn mức hay chưa.
 */
export function isBudgetExceeded(spent: number, limit: number): boolean {
  return spent > limit;
}
