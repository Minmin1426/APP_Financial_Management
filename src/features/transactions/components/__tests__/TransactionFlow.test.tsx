// Giả lập IndexedDB trong môi trường Jest
import 'fake-indexeddb/auto';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import db from '../../../../db/db';
import { DashboardPage } from '../../../dashboard/DashboardPage';

describe('Kiểm thử luồng tích hợp Giao dịch (TransactionFlow)', () => {
  const TEST_WALLET_ID = 'test-w-1';
  const TEST_CATEGORY_ID = 'test-c-1';

  beforeEach(async () => {
    // Đảm bảo mở lại kết nối database nếu bị suite khác đóng
    await db.open();
    
    // Làm sạch database ảo trước mỗi lần chạy test
    await db.transactions.clear();
    await db.wallets.clear();
    await db.categories.clear();

    // Khởi tạo 1 ví mặc định "Tiền mặt"
    await db.wallets.put({
      id: TEST_WALLET_ID,
      name: 'Tiền mặt',
      type: 'cash',
      balance: 1000000, // 1.000.000 ₫
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: null
    });

    // Khởi tạo 1 danh mục "Ăn uống"
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

  test('Người dùng mở form, nhập chi phí ăn uống 50.000 ₫, lưu thành công và kiểm tra cập nhật số dư ví còn 950.000 ₫', async () => {
    render(<DashboardPage />);

    // 1. Chờ cho đến khi ví "Tiền mặt" hiển thị trên màn hình
    await waitFor(() => {
      expect(screen.getAllByText('Tiền mặt').length).toBeGreaterThan(0);
    });

    // Kiểm tra số dư ví ban đầu là 1.000.000 ₫ (Dùng RegExp tìm kiếm để phòng unicode khoảng trắng)
    expect(screen.getAllByText(/1\.000\.000/).length).toBeGreaterThan(0);

    // 2. Nhấn nút "Ghi Giao dịch" để mở modal nhập liệu
    const btnOpenForm = screen.getByText('Ghi Giao dịch');
    fireEvent.click(btnOpenForm);

    // Xác nhận modal hiển thị tiêu đề
    expect(screen.getByText('Thêm Giao Dịch Mới')).toBeInTheDocument();

    // 3. Nhập số tiền: 50000
    const amountInput = screen.getByLabelText('Số tiền (₫)');
    fireEvent.change(amountInput, { target: { value: '50000' } });

    // 4. Chọn ví tài khoản thực hiện: "Tiền mặt" (Chờ cho đến khi các ví được nạp vào option dropdown)
    const walletSelect = screen.getByLabelText('Ví tài khoản');
    await waitFor(() => {
      expect(screen.getByText(/Tiền mặt\s*\(Số\s*dư/i)).toBeInTheDocument();
    });
    fireEvent.change(walletSelect, { target: { value: TEST_WALLET_ID } });

    // 5. Chọn danh mục chi tiêu: "Ăn uống" (Chờ cho danh mục được nạp vào option dropdown)
    const categorySelect = screen.getByLabelText('Danh mục');
    await waitFor(() => {
      expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    });
    fireEvent.change(categorySelect, { target: { value: TEST_CATEGORY_ID } });

    // 6. Nhập ghi chú giao dịch: "Phở gà ăn sáng"
    const notesInput = screen.getByPlaceholderText('Mô tả chi tiết giao dịch...');
    fireEvent.change(notesInput, { target: { value: 'Phở gà ăn sáng' } });

    // 7. Nhấn lưu giao dịch
    const btnSubmit = screen.getByText('Lưu giao dịch');
    fireEvent.click(btnSubmit);

    // Cho phép JSDOM xử lý các macro-task database của fake-indexeddb
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 8. Chờ cho modal đóng và kiểm tra dòng giao dịch mới xuất hiện trong bảng lịch sử
    await waitFor(() => {
      expect(screen.queryByText('Thêm Giao Dịch Mới')).not.toBeInTheDocument();
    });

    // Ghi chú "Phở gà ăn sáng" phải hiển thị trong lịch sử giao dịch
    expect(screen.getByText('Phở gà ăn sáng')).toBeInTheDocument();

    // Kiểm tra số dư ví đã cập nhật thành công giảm đi 50.000 ₫ (còn lại 950.000 ₫)
    expect(screen.getAllByText(/950\.000/).length).toBeGreaterThan(0);
  });
});
