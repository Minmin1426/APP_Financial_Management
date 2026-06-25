import db, { type Transaction } from '../../../db/db';
import { safeAdd, safeSubtract, isValidAmount } from '../../../utils/finance';

/**
 * Lớp dịch vụ quản lý giao dịch tài chính (Giao dịch Thu chi & Chuyển tiền).
 * Chứa logic xử lý nghiệp vụ tài chính và bảo đảm đồng bộ số dư ví trong database transactions.
 */
export class TransactionService {
  /**
   * Thêm mới một giao dịch và cập nhật số dư ví liên quan.
   * Tất cả thao tác được thực hiện trong một cơ chế Transaction duy nhất để đảm bảo tính toàn vẹn dữ liệu.
   */
  public static async addTransaction(txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string }): Promise<string> {
    const id = txData.id || crypto.randomUUID();
    const now = new Date();

    if (!isValidAmount(txData.amount)) {
      throw new Error('Số tiền giao dịch không hợp lệ. Phải là số nguyên dương và không vượt quá hạn mức.');
    }

    // Thực thi Dexie transaction
    await db.transaction('rw', [db.transactions, db.wallets], async () => {
      // 1. Kiểm tra ví thực hiện giao dịch
      const sourceWallet = await db.wallets.get(txData.walletId);
      if (!sourceWallet) {
        throw new Error('Ví thực hiện giao dịch không tồn tại.');
      }

      // 2. Tính toán và cập nhật số dư ví tương ứng
      if (txData.type === 'expense') {
        const newBalance = safeSubtract(sourceWallet.balance, txData.amount);
        await db.wallets.update(txData.walletId, {
          balance: newBalance,
          updatedAt: now,
          lastSyncedAt: null // Đánh dấu chưa đồng bộ lên server
        });
      } else if (txData.type === 'income') {
        const newBalance = safeAdd(sourceWallet.balance, txData.amount);
        await db.wallets.update(txData.walletId, {
          balance: newBalance,
          updatedAt: now,
          lastSyncedAt: null
        });
      } else if (txData.type === 'transfer') {
        if (!txData.destinationWalletId) {
          throw new Error('Giao dịch chuyển khoản yêu cầu ví nhận.');
        }
        if (txData.walletId === txData.destinationWalletId) {
          throw new Error('Ví nhận phải khác ví chuyển.');
        }

        const destWallet = await db.wallets.get(txData.destinationWalletId);
        if (!destWallet) {
          throw new Error('Ví nhận không tồn tại.');
        }

        // Trừ tiền ví gửi, cộng tiền ví nhận
        const newSourceBalance = safeSubtract(sourceWallet.balance, txData.amount);
        const newDestBalance = safeAdd(destWallet.balance, txData.amount);

        await db.wallets.update(txData.walletId, { balance: newSourceBalance, updatedAt: now, lastSyncedAt: null });
        await db.wallets.update(txData.destinationWalletId, { balance: newDestBalance, updatedAt: now, lastSyncedAt: null });
      }

      // 3. Ghi nhận giao dịch vào IndexedDB
      const newTransaction: Transaction = {
        ...txData,
        id,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: null
      };

      await db.transactions.put(newTransaction);
    });

    return id;
  }

  /**
   * Cập nhật thông tin giao dịch và tính toán lại số dư các ví bị ảnh hưởng.
   * Cho phép đổi số tiền, ví, loại giao dịch mà vẫn bảo toàn độ chính xác số dư ví.
   */
  public static async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'>>): Promise<void> {
    const now = new Date();

    await db.transaction('rw', [db.transactions, db.wallets], async () => {
      // 1. Lấy giao dịch cũ trước khi sửa đổi
      const oldTx = await db.transactions.get(id);
      if (!oldTx) {
        throw new Error('Giao dịch không tồn tại.');
      }

      // Tạo trạng thái giao dịch mới giả định sau khi gộp cập nhật
      const newTx = { ...oldTx, ...updates } as Transaction;

      if (!isValidAmount(newTx.amount)) {
        throw new Error('Số tiền cập nhật không hợp lệ.');
      }

      // 2. KHÔI PHỤC số dư ví cũ (Đảo ngược giao dịch cũ)
      const oldSourceWallet = await db.wallets.get(oldTx.walletId);
      if (oldSourceWallet) {
        if (oldTx.type === 'expense') {
          const revertBalance = safeAdd(oldSourceWallet.balance, oldTx.amount);
          await db.wallets.update(oldTx.walletId, { balance: revertBalance, updatedAt: now, lastSyncedAt: null });
        } else if (oldTx.type === 'income') {
          const revertBalance = safeSubtract(oldSourceWallet.balance, oldTx.amount);
          await db.wallets.update(oldTx.walletId, { balance: revertBalance, updatedAt: now, lastSyncedAt: null });
        } else if (oldTx.type === 'transfer' && oldTx.destinationWalletId) {
          const oldDestWallet = await db.wallets.get(oldTx.destinationWalletId);
          if (oldDestWallet) {
            const revertSourceBalance = safeAdd(oldSourceWallet.balance, oldTx.amount);
            const revertDestBalance = safeSubtract(oldDestWallet.balance, oldTx.amount);
            await db.wallets.update(oldTx.walletId, { balance: revertSourceBalance, updatedAt: now, lastSyncedAt: null });
            await db.wallets.update(oldTx.destinationWalletId, { balance: revertDestBalance, updatedAt: now, lastSyncedAt: null });
          }
        }
      }

      // 3. ÁP DỤNG số dư ví mới theo giao dịch mới
      const newSourceWallet = await db.wallets.get(newTx.walletId);
      if (!newSourceWallet) {
        throw new Error('Ví nguồn mới không tồn tại.');
      }

      if (newTx.type === 'expense') {
        const newBalance = safeSubtract(newSourceWallet.balance, newTx.amount);
        await db.wallets.update(newTx.walletId, { balance: newBalance, updatedAt: now, lastSyncedAt: null });
      } else if (newTx.type === 'income') {
        const newBalance = safeAdd(newSourceWallet.balance, newTx.amount);
        await db.wallets.update(newTx.walletId, { balance: newBalance, updatedAt: now, lastSyncedAt: null });
      } else if (newTx.type === 'transfer') {
        if (!newTx.destinationWalletId) {
          throw new Error('Giao dịch chuyển khoản yêu cầu ví nhận.');
        }
        const newDestWallet = await db.wallets.get(newTx.destinationWalletId);
        if (!newDestWallet) {
          throw new Error('Ví nhận mới không tồn tại.');
        }

        const newSourceBalance = safeSubtract(newSourceWallet.balance, newTx.amount);
        const newDestBalance = safeAdd(newDestWallet.balance, newTx.amount);

        await db.wallets.update(newTx.walletId, { balance: newSourceBalance, updatedAt: now, lastSyncedAt: null });
        await db.wallets.update(newTx.destinationWalletId, { balance: newDestBalance, updatedAt: now, lastSyncedAt: null });
      }

      // 4. Lưu lại giao dịch đã cập nhật
      const updatedTransaction: Transaction = {
        ...newTx,
        updatedAt: now,
        lastSyncedAt: null // Reset trạng thái đồng bộ
      };

      await db.transactions.put(updatedTransaction);
    });
  }

  /**
   * Xóa một giao dịch và khôi phục số dư ví ban đầu.
   */
  public static async deleteTransaction(id: string): Promise<void> {
    const now = new Date();

    await db.transaction('rw', [db.transactions, db.wallets], async () => {
      // 1. Lấy thông tin giao dịch để chuẩn bị xóa
      const tx = await db.transactions.get(id);
      if (!tx) {
        throw new Error('Giao dịch không tồn tại.');
      }

      // 2. Đảo ngược số dư ví
      const wallet = await db.wallets.get(tx.walletId);
      if (wallet) {
        if (tx.type === 'expense') {
          const revertBalance = safeAdd(wallet.balance, tx.amount);
          await db.wallets.update(tx.walletId, { balance: revertBalance, updatedAt: now, lastSyncedAt: null });
        } else if (tx.type === 'income') {
          const revertBalance = safeSubtract(wallet.balance, tx.amount);
          await db.wallets.update(tx.walletId, { balance: revertBalance, updatedAt: now, lastSyncedAt: null });
        } else if (tx.type === 'transfer' && tx.destinationWalletId) {
          const destWallet = await db.wallets.get(tx.destinationWalletId);
          if (destWallet) {
            const revertSourceBalance = safeAdd(wallet.balance, tx.amount);
            const revertDestBalance = safeSubtract(destWallet.balance, tx.amount);
            await db.wallets.update(tx.walletId, { balance: revertSourceBalance, updatedAt: now, lastSyncedAt: null });
            await db.wallets.update(tx.destinationWalletId, { balance: revertDestBalance, updatedAt: now, lastSyncedAt: null });
          }
        }
      }

      // 3. Thực hiện xóa bản ghi khỏi IndexedDB
      await db.transactions.delete(id);
    });
  }
}
export default TransactionService;
