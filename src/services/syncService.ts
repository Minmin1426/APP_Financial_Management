import db from '../db/db';

const API_URL = 'http://localhost:5000/api';

export interface SyncResult {
  success: boolean;
  sentCount: {
    wallets: number;
    categories: number;
    transactions: number;
    budgets: number;
  };
  receivedCount: {
    wallets: number;
    categories: number;
    transactions: number;
    budgets: number;
  };
  message: string;
}

/**
 * Lớp dịch vụ quản lý việc đồng bộ dữ liệu giữa IndexedDB (Client) và PostgreSQL (Server).
 */
export class SyncService {
  /**
   * Lấy thời điểm đồng bộ hóa thành công cuối cùng lưu trong localStorage.
   */
  private static getLastSyncTime(): string | null {
    return localStorage.getItem('finance_last_sync_time');
  }

  /**
   * Cập nhật thời điểm đồng bộ thành công mới vào localStorage.
   */
  private static setLastSyncTime(timeStr: string): void {
    localStorage.setItem('finance_last_sync_time', timeStr);
  }

  /**
   * Thực hiện đồng bộ dữ liệu hai chiều.
   */
  public static async sync(): Promise<SyncResult> {
    try {
      console.log('Bắt đầu quy trình đồng bộ dữ liệu...');
      
      const lastSyncTime = this.getLastSyncTime();

      // 1. Thu thập tất cả dữ liệu được tạo mới hoặc chỉnh sửa dưới Client (chưa đồng bộ hoặc updatedAt > lastSyncedAt)
      const unsyncedWallets = await db.wallets
        .filter(w => !w.lastSyncedAt || w.updatedAt > w.lastSyncedAt)
        .toArray();

      const unsyncedCategories = await db.categories
        .filter(c => !c.lastSyncedAt || c.updatedAt > c.lastSyncedAt)
        .toArray();

      const unsyncedTransactions = await db.transactions
        .filter(t => !t.lastSyncedAt || t.updatedAt > t.lastSyncedAt)
        .toArray();

      const unsyncedBudgets = await db.budgets
        .filter(b => !b.lastSyncedAt || b.updatedAt > b.lastSyncedAt)
        .toArray();

      console.log(`Đang gửi lên server: ${unsyncedWallets.length} ví, ${unsyncedCategories.length} danh mục, ${unsyncedTransactions.length} giao dịch, ${unsyncedBudgets.length} ngân sách.`);

      // 2. Gửi yêu cầu HTTP POST tới Express API
      const response = await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastSyncTime,
          wallets: unsyncedWallets,
          categories: unsyncedCategories,
          transactions: unsyncedTransactions,
          budgets: unsyncedBudgets
        })
      });

      if (!response.ok) {
        throw new Error(`Phản hồi mạng không hợp lệ: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Lỗi không rõ từ server');
      }

      const { syncTime, wallets: serverWallets, categories: serverCategories, transactions: serverTransactions, budgets: serverBudgets } = result;

      // Mốc thời gian đồng bộ từ server
      const syncDate = new Date(syncTime);

      // 3. Thực hiện cập nhật cục bộ và giải quyết xung đột trong một Dexie Transaction duy nhất
      await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.budgets], async () => {
        // A. Cập nhật trạng thái "đã đồng bộ" cho các bản ghi cục bộ vừa gửi lên
        for (const w of unsyncedWallets) {
          await db.wallets.update(w.id, { lastSyncedAt: syncDate });
        }
        for (const c of unsyncedCategories) {
          await db.categories.update(c.id, { lastSyncedAt: syncDate });
        }
        for (const t of unsyncedTransactions) {
          await db.transactions.update(t.id, { lastSyncedAt: syncDate });
        }
        for (const b of unsyncedBudgets) {
          await db.budgets.update(b.id, { lastSyncedAt: syncDate });
        }

        // B. Lưu các thay đổi từ server về cơ sở dữ liệu IndexedDB cục bộ (ép kiểu về đối tượng Date)
        
        // Cập nhật ví từ server
        for (const w of serverWallets) {
          const localWallet = await db.wallets.get(w.id);
          const serverUpdatedDate = new Date(w.updated_at);
          // Chỉ cập nhật nếu client chưa sửa đổi gì mới hơn
          if (!localWallet || localWallet.updatedAt <= serverUpdatedDate) {
            await db.wallets.put({
              id: w.id,
              name: w.name,
              type: w.type,
              balance: Number(w.balance),
              createdAt: new Date(w.created_at),
              updatedAt: serverUpdatedDate,
              lastSyncedAt: syncDate
            });
          }
        }

        // Cập nhật danh mục từ server
        for (const c of serverCategories) {
          const localCat = await db.categories.get(c.id);
          const serverUpdatedDate = new Date(c.updated_at);
          if (!localCat || localCat.updatedAt <= serverUpdatedDate) {
            await db.categories.put({
              id: c.id,
              name: c.name,
              type: c.type,
              icon: c.icon,
              color: c.color,
              createdAt: new Date(c.created_at),
              updatedAt: serverUpdatedDate,
              lastSyncedAt: syncDate
            });
          }
        }

        // Cập nhật giao dịch từ server
        for (const t of serverTransactions) {
          const localTx = await db.transactions.get(t.id);
          const serverUpdatedDate = new Date(t.updated_at);
          if (!localTx || localTx.updatedAt <= serverUpdatedDate) {
            await db.transactions.put({
              id: t.id,
              amount: Number(t.amount),
              type: t.type,
              walletId: t.wallet_id,
              destinationWalletId: t.destination_wallet_id || undefined,
              categoryId: t.category_id || undefined,
              notes: t.notes,
              transactionDate: new Date(t.transaction_date),
              createdAt: new Date(t.created_at),
              updatedAt: serverUpdatedDate,
              lastSyncedAt: syncDate
            });
          }
        }

        // Cập nhật ngân sách từ server
        for (const b of serverBudgets) {
          const localB = await db.budgets.get(b.id);
          const serverUpdatedDate = new Date(b.updated_at);
          if (!localB || localB.updatedAt <= serverUpdatedDate) {
            await db.budgets.put({
              id: b.id,
              categoryId: b.category_id,
              limitAmount: Number(b.limit_amount),
              startDate: new Date(b.start_date),
              endDate: new Date(b.end_date),
              createdAt: new Date(b.created_at),
              updatedAt: serverUpdatedDate,
              lastSyncedAt: syncDate
            });
          }
        }
      });

      // 4. Lưu lại mốc đồng bộ hóa mới nhất
      this.setLastSyncTime(syncTime);
      console.log('Đồng bộ dữ liệu thành công!');

      return {
        success: true,
        sentCount: {
          wallets: unsyncedWallets.length,
          categories: unsyncedCategories.length,
          transactions: unsyncedTransactions.length,
          budgets: unsyncedBudgets.length
        },
        receivedCount: {
          wallets: serverWallets.length,
          categories: serverCategories.length,
          transactions: serverTransactions.length,
          budgets: serverBudgets.length
        },
        message: 'Đồng bộ hóa thành công dữ liệu với máy chủ.'
      };
    } catch (error) {
      console.error('LỖI trong quá trình gọi đồng bộ phía client:', error);
      return {
        success: false,
        sentCount: { wallets: 0, categories: 0, transactions: 0, budgets: 0 },
        receivedCount: { wallets: 0, categories: 0, transactions: 0, budgets: 0 },
        message: `Đồng bộ thất bại: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}
export default SyncService;
