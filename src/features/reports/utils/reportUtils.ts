import { type Transaction, type Category } from '../../../db/db';

export interface ExpenseStructureItem {
  name: string;
  value: number; // Tỷ lệ phần trăm (%)
  amount: number; // Số tiền thực tế (VND)
  color: string; // Mã màu hiển thị
}

export interface CashFlowTrendItem {
  month: string; // Tên tháng (ví dụ: "Tháng 01")
  income: number; // Tổng thu nhập (VND)
  expense: number; // Tổng chi tiêu (VND)
}

/**
 * Phân tích cơ cấu chi tiêu:
 * Gom nhóm tất cả giao dịch 'expense' theo danh mục chi phí, tính tổng tiền và tỷ lệ phần trăm tương ứng.
 */
export function getExpenseStructure(
  transactions: Transaction[],
  categories: Category[]
): ExpenseStructureItem[] {
  // 1. Lọc giao dịch chi tiêu
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpenseAmount = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpenseAmount === 0) {
    return [];
  }

  // 2. Gom nhóm theo categoryId
  const categoryAmounts: Record<string, number> = {};
  expenses.forEach((t) => {
    if (t.categoryId) {
      categoryAmounts[t.categoryId] = (categoryAmounts[t.categoryId] || 0) + t.amount;
    }
  });

  // 3. Ghép thông tin danh mục và tính tỷ lệ phần trăm
  const structure: ExpenseStructureItem[] = Object.keys(categoryAmounts).map((catId) => {
    const category = categories.find((c) => c.id === catId);
    const name = category ? category.name : 'Chưa phân loại';
    const color = category ? category.color : '#95a5a6';
    const amount = categoryAmounts[catId];
    
    // Phần trăm làm tròn đến 2 chữ số thập phân
    const value = Math.round((amount / totalExpenseAmount) * 10000) / 100;

    return {
      name,
      value,
      amount,
      color
    };
  });

  // Sắp xếp giảm dần theo số tiền để hiển thị đẹp mắt hơn trên biểu đồ
  return structure.sort((a, b) => b.amount - a.amount);
}

/**
 * Tổng hợp xu hướng dòng tiền thu chi theo từng tháng của một năm cụ thể.
 * Đảm bảo sinh đầy đủ dữ liệu cho cả 12 tháng để biểu đồ Recharts hiển thị liên mạch, cân đối.
 */
export function getCashFlowTrend(
  transactions: Transaction[],
  year: number
): CashFlowTrendItem[] {
  // Khởi tạo mảng chứa 12 tháng mặc định có thu và chi bằng 0
  const trendData: CashFlowTrendItem[] = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = String(index + 1).padStart(2, '0');
    return {
      month: `Th. ${monthNumber}`,
      income: 0,
      expense: 0
    };
  });

  // Gom nhóm giao dịch trong năm được chọn
  transactions.forEach((t) => {
    const txDate = new Date(t.transactionDate);
    if (txDate.getFullYear() === year) {
      const monthIndex = txDate.getMonth(); // 0 - 11
      if (monthIndex >= 0 && monthIndex < 12) {
        if (t.type === 'income') {
          trendData[monthIndex].income += t.amount;
        } else if (t.type === 'expense') {
          trendData[monthIndex].expense += t.amount;
        }
      }
    }
  });

  return trendData;
}
