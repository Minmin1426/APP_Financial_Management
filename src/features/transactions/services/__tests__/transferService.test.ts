import 'fake-indexeddb/auto';
import db from '../../../../db/db';
import { TransactionService } from '../transactionService';

describe('Kiểm thử nghiệp vụ Chuyển khoản (Wallet Transfer)', () => {
  const SOURCE_WALLET_ID = 'wallet-source';
  const DEST_WALLET_ID = 'wallet-dest';
  const THIRD_WALLET_ID = 'wallet-third';

  beforeEach(async () => {
    // Xóa sạch cơ sở dữ liệu ảo trước mỗi ca test
    await db.transactions.clear();
    await db.wallets.clear();

    // Thiết lập các ví thử nghiệm ban đầu
    await db.wallets.put({
      id: SOURCE_WALLET_ID,
      name: 'Ví gửi (Ví chính)',
      type: 'cash',
      balance: 1000000, // 1.000.000 ₫
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    });

    await db.wallets.put({
      id: DEST_WALLET_ID,
      name: 'Ví nhận (Ví tiết kiệm)',
      type: 'bank',
      balance: 500000, // 500.000 ₫
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    });

    await db.wallets.put({
      id: THIRD_WALLET_ID,
      name: 'Ví thứ ba',
      type: 'bank',
      balance: 200000, // 200.000 ₫
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    });
  });

  test('Thêm giao dịch chuyển khoản phải trừ ví gửi và cộng ví nhận chính xác', async () => {
    const transferData = {
      id: 'tx-transfer-1',
      amount: 300000, // Chuyển 300.000 ₫
      type: 'transfer' as const,
      walletId: SOURCE_WALLET_ID,
      destinationWalletId: DEST_WALLET_ID,
      notes: 'Chuyển tiền tiết kiệm tháng này',
      transactionDate: new Date()
    };

    // Thực hiện chuyển khoản
    await TransactionService.addTransaction(transferData);

    // Kiểm tra giao dịch được lưu
    const tx = await db.transactions.get('tx-transfer-1');
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(300000);
    expect(tx?.destinationWalletId).toBe(DEST_WALLET_ID);

    // Kiểm tra số dư ví gửi: 1.000.000 - 300.000 = 700.000 ₫
    const sourceWallet = await db.wallets.get(SOURCE_WALLET_ID);
    expect(sourceWallet?.balance).toBe(700000);

    // Kiểm tra số dư ví nhận: 500.000 + 300.000 = 800.000 ₫
    const destWallet = await db.wallets.get(DEST_WALLET_ID);
    expect(destWallet?.balance).toBe(800000);
  });

  test('Báo lỗi khi ví nhận trùng với ví gửi', async () => {
    const invalidTransfer = {
      id: 'tx-invalid-transfer',
      amount: 100000,
      type: 'transfer' as const,
      walletId: SOURCE_WALLET_ID,
      destinationWalletId: SOURCE_WALLET_ID, // Trùng ví gửi
      notes: 'Lỗi chuyển khoản cùng ví',
      transactionDate: new Date()
    };

    await expect(TransactionService.addTransaction(invalidTransfer)).rejects.toThrow('Ví nhận phải khác ví chuyển.');
  });

  test('Báo lỗi khi chuyển khoản thiếu ví nhận', async () => {
    const invalidTransfer = {
      id: 'tx-invalid-transfer-2',
      amount: 100000,
      type: 'transfer' as const,
      walletId: SOURCE_WALLET_ID,
      // Không cung cấp destinationWalletId
      notes: 'Thiếu ví nhận',
      transactionDate: new Date()
    };

    await expect(TransactionService.addTransaction(invalidTransfer)).rejects.toThrow('Giao dịch chuyển khoản yêu cầu ví nhận.');
  });

  test('Sửa số tiền chuyển khoản phải tính toán và cập nhật lại số dư hai ví chính xác', async () => {
    const txId = 'tx-transfer-edit';
    // 1. Chuyển ban đầu 200.000 ₫ (Ví gửi: 1M -> 800k, Ví nhận: 500k -> 700k)
    await TransactionService.addTransaction({
      id: txId,
      amount: 200000,
      type: 'transfer',
      walletId: SOURCE_WALLET_ID,
      destinationWalletId: DEST_WALLET_ID,
      notes: 'Chuyển khoản thử nghiệm',
      transactionDate: new Date()
    });

    // 2. Cập nhật tăng số tiền chuyển lên 400.000 ₫
    // Ví gửi hoàn trả 200k (thành 1M) -> trừ 400k mới (thành 600k)
    // Ví nhận trả lại 200k (thành 500k) -> cộng 400k mới (thành 900k)
    await TransactionService.updateTransaction(txId, {
      amount: 400000
    });

    const sourceWallet = await db.wallets.get(SOURCE_WALLET_ID);
    expect(sourceWallet?.balance).toBe(600000);

    const destWallet = await db.wallets.get(DEST_WALLET_ID);
    expect(destWallet?.balance).toBe(900000);
  });

  test('Sửa ví nhận trong giao dịch chuyển khoản phải khôi phục ví nhận cũ và cập nhật ví nhận mới', async () => {
    const txId = 'tx-transfer-wallet-edit';
    // 1. Chuyển ban đầu 200.000 ₫ từ SOURCE_WALLET_ID sang DEST_WALLET_ID
    // Ví gửi: 1M -> 800k. Ví nhận cũ: 500k -> 700k. Ví nhận mới (THIRD_WALLET): 200k
    await TransactionService.addTransaction({
      id: txId,
      amount: 200000,
      type: 'transfer',
      walletId: SOURCE_WALLET_ID,
      destinationWalletId: DEST_WALLET_ID,
      notes: 'Chuyển khoản đổi ví nhận',
      transactionDate: new Date()
    });

    // 2. Cập nhật đổi ví nhận từ DEST_WALLET_ID sang THIRD_WALLET_ID
    // Ví gửi: Không đổi ví gửi, nhưng cập nhật tính toán lại (hoàn trả 200k rồi trừ lại 200k -> vẫn 800k)
    // Ví nhận cũ (DEST_WALLET): hoàn lại 200k -> quay về 500k
    // Ví nhận mới (THIRD_WALLET): được cộng 200k -> thành 400k
    await TransactionService.updateTransaction(txId, {
      destinationWalletId: THIRD_WALLET_ID
    });

    const sourceWallet = await db.wallets.get(SOURCE_WALLET_ID);
    expect(sourceWallet?.balance).toBe(800000);

    const oldDestWallet = await db.wallets.get(DEST_WALLET_ID);
    expect(oldDestWallet?.balance).toBe(500000);

    const newDestWallet = await db.wallets.get(THIRD_WALLET_ID);
    expect(newDestWallet?.balance).toBe(400000);
  });

  test('Xóa giao dịch chuyển khoản phải hoàn trả lại đầy đủ số dư ban đầu cho cả 2 ví', async () => {
    const txId = 'tx-transfer-delete';
    // 1. Chuyển khoản 100.000 ₫
    await TransactionService.addTransaction({
      id: txId,
      amount: 100000,
      type: 'transfer',
      walletId: SOURCE_WALLET_ID,
      destinationWalletId: DEST_WALLET_ID,
      notes: 'Chuyển tiền mua quà',
      transactionDate: new Date()
    });

    // 2. Xóa giao dịch chuyển khoản
    await TransactionService.deleteTransaction(txId);

    // Giao dịch biến mất
    const tx = await db.transactions.get(txId);
    expect(tx).toBeUndefined();

    // Cả 2 ví phục hồi số dư ban đầu
    const sourceWallet = await db.wallets.get(SOURCE_WALLET_ID);
    expect(sourceWallet?.balance).toBe(1000000);

    const destWallet = await db.wallets.get(DEST_WALLET_ID);
    expect(destWallet?.balance).toBe(500000);
  });
});
