# Feature Specification: Financial Management Core (Web Application)

**Feature Branch**: `feat/financial-management-core`

**Created**: 2026-06-25

**Status**: Draft

**Input**: Hướng dẫn xây dựng hệ thống quản lý tài chính cá nhân/gia đình chạy trên môi trường Web, hoạt động offline-first.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quản lý Giao dịch Thu chi (Priority: P1) [MVP]

Người dùng muốn ghi chép các giao dịch phát sinh hàng ngày (Thu nhập, Chi phí) một cách nhanh chóng với thông tin về Số tiền, Danh mục, Ngày giao dịch, và Ví tài khoản tương ứng.

**Why this priority**: Đây là tính năng cốt lõi nhất của ứng dụng. Không có ghi chép giao dịch, người dùng không thể quản lý tài chính.

**Independent Test**: Người dùng có thể mở form thêm giao dịch, nhập số tiền 50.000đ, chọn danh mục "Ăn uống", chọn ví "Tiền mặt", và nhấn lưu. Giao dịch mới phải ngay lập tức hiển thị trong danh sách lịch sử giao dịch và số dư ví "Tiền mặt" giảm đi 50.000đ.

**Acceptance Scenarios**:
1. **Given** Người dùng ở màn hình chính có số dư ví "Tiền mặt" là 1.000.000đ, **When** Người dùng thêm giao dịch Chi phí 200.000đ cho danh mục "Mua sắm" bằng ví "Tiền mặt", **Then** Hệ thống lưu giao dịch thành công, hiển thị giao dịch trong lịch sử và số dư ví "Tiền mặt" còn lại là 800.000đ.
2. **Given** Người dùng muốn nhập giao dịch thu nhập, **When** Người dùng chọn loại "Thu nhập" và nhập số tiền 10.000.000đ cho danh mục "Lương" vào ví "Tài khoản ngân hàng", **Then** Hệ thống tăng số dư ví tương ứng lên 10.000.000đ.
3. **Given** Người dùng nhập thiếu số tiền hoặc danh mục, **When** Người dùng nhấn "Lưu", **Then** Hệ thống ngăn chặn việc lưu và hiển thị thông báo lỗi trường bắt buộc.

---

### User Story 2 - Quản lý Ví & Chuyển khoản (Priority: P2)

Người dùng muốn tạo nhiều ví khác nhau (ví dụ: Tiền mặt, Thẻ tín dụng, Tài khoản Techcombank) và thực hiện chuyển tiền qua lại giữa các ví này.

**Why this priority**: Người dùng hiện đại thường phân bổ tiền ở nhiều nơi, tính năng chuyển khoản và đa ví giúp phản ánh đúng thực tế tài chính.

**Independent Test**: Tạo một ví mới tên là "Tiết kiệm". Thực hiện chuyển khoản 500.000đ từ ví "Tiền mặt" sang ví "Tiết kiệm". Kiểm tra số dư ví "Tiền mặt" giảm 500.000đ và ví "Tiết kiệm" tăng 500.000đ.

**Acceptance Scenarios**:
1. **Given** Người dùng có ví "Tiền mặt" (1.000.000đ) và ví "Techcombank" (2.000.000đ), **When** Người dùng thực hiện chuyển khoản 300.000đ từ "Tiền mặt" sang "Techcombank", **Then** Số dư ví "Tiền mặt" cập nhật thành 700.000đ và "Techcombank" thành 2.300.000đ, đồng thời ghi nhận 1 giao dịch loại "Chuyển khoản".

---

### User Story 3 - Quản lý Ngân sách & Cảnh báo (Priority: P2)

Người dùng muốn đặt hạn mức chi tiêu (ngân sách) cho từng danh mục trong một khoảng thời gian (ví dụ: Ngân sách "Ăn uống" tối đa 3.000.000đ/tháng) và nhận cảnh báo khi chi tiêu gần đạt hoặc vượt mức.

**Why this priority**: Giúp người dùng kiểm soát hành vi chi tiêu tốt hơn, tránh vung tay quá trán.

**Independent Test**: Đặt ngân sách danh mục "Ăn uống" là 1.000.000đ. Nhập giao dịch ăn uống trị giá 950.000đ. Hệ thống hiển thị cảnh báo ngân sách đạt 95%.

**Acceptance Scenarios**:
1. **Given** Người dùng đã thiết lập ngân sách danh mục "Đi lại" là 500.000đ/tháng, **When** Tổng chi tiêu danh mục "Đi lại" trong tháng đạt 450.000đ (90% hạn mức), **Then** Hệ thống hiển thị cảnh báo trực quan (thanh tiến trình chuyển sang màu cam/đỏ).
2. **Given** Tổng chi tiêu vượt quá 500.000đ, **When** Người dùng xem trang Ngân sách, **Then** Hệ thống hiển thị trạng thái "Vượt hạn mức" kèm số tiền âm cụ thể.

---

### User Story 4 - Báo cáo & Phân tích trực quan (Priority: P3)

Người dùng muốn xem biểu đồ thống kê cơ cấu chi tiêu theo danh mục (biểu đồ tròn) và xu hướng thu chi theo tháng (biểu đồ cột) để phân tích tài chính.

**Why this priority**: Cung cấp cái nhìn tổng quan trực quan giúp người dùng dễ dàng đưa ra quyết định tài chính.

**Independent Test**: Truy cập trang Báo cáo, hệ thống tự động tổng hợp dữ liệu giao dịch trong tháng và vẽ biểu đồ tròn hiển thị tỷ lệ % của từng danh mục chi phí.

---

## Edge Cases

- **Mất kết nối Internet**: Ứng dụng chạy ngoại tuyến, lưu trữ dữ liệu vào IndexedDB. Khi trực tuyến trở lại, dữ liệu được tự động gửi lên server (nếu có).
- **Giá trị tiền tệ cực lớn**: Ngăn chặn lỗi tràn số hoặc hiển thị lỗi UI bằng cách giới hạn số tiền nhập tối đa là 999.999.999.999 ₫ (12 chữ số).
- **Xóa ví có giao dịch**: Khi xóa ví, hệ thống yêu cầu người dùng xác nhận và đưa ra lựa chọn: xóa toàn bộ giao dịch thuộc ví đó hoặc chuyển giao dịch sang ví khác.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI lưu trữ dữ liệu giao dịch, ví, ngân sách vào cơ sở dữ liệu IndexedDB cục bộ của trình duyệt để đảm bảo khả năng chạy offline.
- **FR-002**: Hệ thống PHẢI tính toán tiền tệ bằng số nguyên (Integer) đại diện cho đơn vị nhỏ nhất (VND) để ngăn ngừa lỗi làm tròn số thực.
- **FR-003**: Số dư ví PHẢI được cập nhật tự động ngay lập tức sau khi thêm, sửa hoặc xóa giao dịch liên quan.
- **FR-004**: Hệ thống PHẢI định dạng hiển thị tiền tệ theo chuẩn Việt Nam (ví dụ: `1.500.000 ₫`) sử dụng `Intl.NumberFormat`.
- **FR-005**: Danh sách giao dịch PHẢI hỗ trợ phân trang (Pagination) hoặc Lazy Loading để tránh giật lag khi số lượng giao dịch vượt quá 1000 dòng.
- **FR-006**: Hệ thống PHẢI cung cấp giao diện responsive tối ưu trên cả thiết bị di động (Mobile Web) và máy tính (Desktop Web).

### Key Entities

- **Wallet (Ví)**: Đại diện cho nguồn tiền. Thuộc tính: `id` (string), `name` (string), `type` (cash/bank/credit), `balance` (integer), `createdAt` (datetime).
- **Category (Danh mục)**: Phân loại giao dịch. Thuộc tính: `id` (string), `name` (string), `type` (income/expense), `icon` (string), `color` (string).
- **Transaction (Giao dịch)**: Bản ghi thu/chi/chuyển khoản. Thuộc tính: `id` (string), `amount` (integer), `type` (income/expense/transfer), `walletId` (string), `destinationWalletId` (string - chỉ dùng cho transfer), `categoryId` (string), `notes` (string), `transactionDate` (date).
- **Budget (Ngân sách)**: Hạn mức chi tiêu. Thuộc tính: `id` (string), `categoryId` (string), `limitAmount` (integer), `startDate` (date), `endDate` (date).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể thực hiện ghi chép một giao dịch mới hoàn chỉnh (mở form, nhập liệu, lưu) dưới 15 giây.
- **SC-002**: Thời gian lưu trữ cục bộ vào IndexedDB và cập nhật số dư ví trên giao diện phải nhỏ hơn 100ms.
- **SC-003**: Ứng dụng web tải và hoạt động được khi không có kết nối mạng (sau lần truy cập đầu tiên) nhờ Service Worker cache.
- **SC-004**: Điểm tối ưu hóa hiệu năng (Lighthouse Performance score) đạt trên 90 điểm trên cả thiết bị di động và máy tính.
- **SC-005**: 100% các phép tính tổng thu chi và số dư ví chính xác tuyệt đối, không có sai lệch làm tròn số thập phân.

---

## Assumptions

- Người dùng truy cập ứng dụng bằng các trình duyệt hiện đại (Chrome, Safari, Firefox, Edge) hỗ trợ IndexedDB và Service Workers.
- Giai đoạn MVP chỉ tập trung vào lưu trữ cục bộ và đồng bộ cơ bản, chưa tích hợp kết nối trực tiếp với API của các ngân hàng.
