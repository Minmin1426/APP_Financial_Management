import db, { type Budget } from '../../../db/db';


export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  limitAmount: number;
  spentAmount: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Lớp dịch vụ quản lý Hạn mức Ngân sách chi tiêu của từng danh mục theo tháng.
 */
export class BudgetService {
  /**
   * Tính toán ngày đầu tháng và ngày cuối tháng từ một đối tượng Date.
   */
  public static getMonthBounds(date: Date): { start: Date; end: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Lấy tình trạng hạn mức chi tiêu của một danh mục trong tháng của ngày chỉ định.
   * Tính toán tổng chi tiêu thực tế đã thực hiện dưới client để so sánh với hạn mức.
   * 
   * @param categoryId ID danh mục chi phí
   * @param date Ngày nằm trong tháng cần kiểm tra
   * @returns Tình trạng ngân sách chi tiết hoặc null nếu chưa đặt hạn mức
   */
  public static async getBudgetStatus(categoryId: string, date: Date): Promise<BudgetStatus | null> {
    const { start, end } = this.getMonthBounds(date);

    // 1. Tìm ngân sách được đặt cho danh mục này trong khoảng thời gian tháng đó
    const budget = await db.budgets
      .filter((b) => {
        return (
          b.categoryId === categoryId &&
          new Date(b.startDate) >= start &&
          new Date(b.endDate) <= end
        );
      })
      .first();

    if (!budget) {
      return null;
    }

    // 2. Tính tổng số tiền chi tiêu thực tế của các giao dịch trong tháng đó thuộc danh mục này
    const transactions = await db.transactions
      .filter((t) => {
        const txDate = new Date(t.transactionDate);
        return (
          t.type === 'expense' &&
          t.categoryId === categoryId &&
          txDate >= start &&
          txDate <= end
        );
      })
      .toArray();

    // Tính tổng số tiền chi tiêu
    const spentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      limitAmount: budget.limitAmount,
      spentAmount,
      startDate: new Date(budget.startDate),
      endDate: new Date(budget.endDate)
    };
  }

  /**
   * Thiết lập hoặc cập nhật hạn mức ngân sách cho một danh mục trong tháng.
   */
  public static async setBudget(categoryId: string, limitAmount: number, date: Date): Promise<string> {
    const { start, end } = this.getMonthBounds(date);
    const now = new Date();

    if (limitAmount <= 0) {
      throw new Error('Hạn mức ngân sách phải lớn hơn 0.');
    }

    let budgetId = '';

    await db.transaction('rw', [db.budgets], async () => {
      // Tìm xem đã có ngân sách cho danh mục này trong tháng chưa
      const existing = await db.budgets
        .filter((b) => {
          return (
            b.categoryId === categoryId &&
            new Date(b.startDate) >= start &&
            new Date(b.endDate) <= end
          );
        })
        .first();

      if (existing) {
        budgetId = existing.id;
        await db.budgets.update(budgetId, {
          limitAmount,
          updatedAt: now,
          lastSyncedAt: null // Đánh dấu chưa đồng bộ lên server
        });
      } else {
        budgetId = crypto.randomUUID();
        const newBudget: Budget = {
          id: budgetId,
          categoryId,
          limitAmount,
          startDate: start,
          endDate: end,
          createdAt: now,
          updatedAt: now,
          lastSyncedAt: null
        };
        await db.budgets.put(newBudget);
      }
    });

    return budgetId;
  }
}
export default BudgetService;
