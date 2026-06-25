// Khởi tạo IndexedDB ảo cho môi trường Node/Jest
import 'fake-indexeddb/auto';
import db from '../../../../db/db';
import { TransactionService } from '../transactionService';

describe('Kiểm thử TransactionService (Giao dịch Thu chi)', () => {
  const TEST_WALLET_ID = 'test-wallet-1';
  const TEST_CATEGORY_ID = 'test-category-1';

  beforeEach(async () => {
    // Xóa sạch cơ sở dữ liệu ảo trước mỗi ca test
    await db.transactions.clear();
    await db.wallets.clear();
    await db.categories.clear();

    // Thiết lập ví thử nghiệm và danh mục thử nghiệm ban đầu
    await db.wallets.put({
      id: TEST_WALLET_ID,
      name: 'Ví tiền mặt Test',
      type: 'cash',
      balance: 1000000, // 1.000.000 ₫
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    });

    await db.categories.put({
      id: TEST_CATEGORY_ID,
      name: 'Ăn uống',
      type: 'expense',
      icon: 'Utensils',
      color: '#e67e22',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    });
  });



  test('Thêm giao dịch CHI PHÍ phải trừ số dư ví chính xác', async () => {
    const transactionData = {
      id: 'tx-1',
      amount: 150000, // 150.000 ₫
      type: 'expense' as const,
      walletId: TEST_WALLET_ID,
      categoryId: TEST_CATEGORY_ID,
      notes: 'Ăn tối nhà hàng',
      transactionDate: new Date()
    };

    // Thực hiện thêm giao dịch
    await TransactionService.addTransaction(transactionData);

    // Kiểm tra giao dịch đã được thêm vào DB chưa
    const tx = await db.transactions.get('tx-1');
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(150000);

    // Kiểm tra số dư ví giảm còn 850.000 ₫ (1.000.000 - 150.000)
    const wallet = await db.wallets.get(TEST_WALLET_ID);
    expect(wallet?.balance).toBe(850000);
  });

  test('Thêm giao dịch THU NHẬP phải cộng số dư ví chính xác', async () => {
    const transactionData = {
      id: 'tx-2',
      amount: 500000, // 500.000 ₫
      type: 'income' as const,
      walletId: TEST_WALLET_ID,
      categoryId: TEST_CATEGORY_ID, // Mặc dù là danh mục ăn uống, dùng tạm cho việc test loại thu nhập
      notes: 'Bán đồ cũ',
      transactionDate: new Date()
    };

    await TransactionService.addTransaction(transactionData);

    const tx = await db.transactions.get('tx-2');
    expect(tx).toBeDefined();

    // Kiểm tra số dư ví tăng lên 1.500.000 ₫ (1.000.000 + 500.000)
    const wallet = await db.wallets.get(TEST_WALLET_ID);
    expect(wallet?.balance).toBe(1500000);
  });

  test('Sửa đổi giao dịch phải cập nhật lại số dư ví tương ứng', async () => {
    // 1. Thêm giao dịch chi phí ban đầu 200.000 ₫ (Ví ban đầu 1.000.000 ₫ -> 800.000 ₫)
    const transactionId = 'tx-edit-test';
    await TransactionService.addTransaction({
      id: transactionId,
      amount: 200000,
      type: 'expense',
      walletId: TEST_WALLET_ID,
      categoryId: TEST_CATEGORY_ID,
      notes: 'Mua sắm',
      transactionDate: new Date()
    });

    // 2. Chỉnh sửa giao dịch tăng số tiền lên thành 350.000 ₫
    // Ví sẽ được hoàn trả lại 200.000 ₫ (thành 1.000.000 ₫) và trừ đi số tiền mới 350.000 ₫ (thành 650.000 ₫)
    await TransactionService.updateTransaction(transactionId, {
      amount: 350000,
      notes: 'Mua sắm đồ dùng gia đình'
    });

    const tx = await db.transactions.get(transactionId);
    expect(tx?.amount).toBe(350000);
    expect(tx?.notes).toBe('Mua sắm đồ dùng gia đình');

    const wallet = await db.wallets.get(TEST_WALLET_ID);
    expect(wallet?.balance).toBe(650000);
  });

  test('Xóa giao dịch phải hoàn trả lại số dư ví ban đầu', async () => {
    const transactionId = 'tx-delete-test';
    // 1. Thêm giao dịch chi phí 100.000 ₫ (Ví 1.000.000 ₫ -> 900.000 ₫)
    await TransactionService.addTransaction({
      id: transactionId,
      amount: 100000,
      type: 'expense',
      walletId: TEST_WALLET_ID,
      categoryId: TEST_CATEGORY_ID,
      notes: 'Hóa đơn nước',
      transactionDate: new Date()
    });

    // 2. Thực hiện xóa giao dịch
    await TransactionService.deleteTransaction(transactionId);

    // Giao dịch không được tồn tại trong DB
    const tx = await db.transactions.get(transactionId);
    expect(tx).toBeUndefined();

    // Số dư ví phải được khôi phục về 1.000.000 ₫
    const wallet = await db.wallets.get(TEST_WALLET_ID);
    expect(wallet?.balance).toBe(1000000);
  });

  test('Báo lỗi khi số tiền giao dịch không hợp lệ (số âm)', async () => {
    const invalidTransaction = {
      id: 'tx-invalid',
      amount: -5000,
      type: 'expense' as const,
      walletId: TEST_WALLET_ID,
      categoryId: TEST_CATEGORY_ID,
      notes: 'Lỗi',
      transactionDate: new Date()
    };

    await expect(TransactionService.addTransaction(invalidTransaction)).rejects.toThrow();
  });
});
