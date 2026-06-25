<!--
Sync Impact Report:
- Version change: N/A -> 1.0.0
- List of modified principles:
  - Principle 1: Web-First & Offline-Capable (IndexedDB / PWA)
  - Principle 2: Strict Monetary Precision (No float for money)
  - Principle 3: Responsive & Clean UI (Vanilla CSS & Responsive)
  - Principle 4: Security & Privacy (Secure authentication & Local Encryption)
  - Principle 5: Component-Driven Development
- Added sections: Technology Stack & Constraints, Development Workflow
- Templates requiring updates:
  - ✅ plan-template.md updated
  - ✅ spec-template.md updated
  - ✅ tasks-template.md updated
- Follow-up TODOs: None.
-->

# APP_FinancialManagement Constitution

## Core Principles

### I. Web-First & Offline-Capable
Ứng dụng phải được thiết kế dưới dạng ứng dụng web tĩnh/PWA, có khả năng hoạt động ngoại tuyến (offline-first). Dữ liệu người dùng phải được lưu trữ tạm thời hoặc đồng bộ cục bộ bằng IndexedDB (qua Dexie.js) trước khi đồng bộ lên máy chủ đám mây khi có kết nối mạng.

### II. Strict Monetary Precision
Tuyệt đối không sử dụng kiểu dữ liệu số thực dấu phẩy động (Float/Double) để lưu trữ hoặc tính toán tiền tệ. Tất cả các giá trị tiền tệ phải được lưu trữ dưới dạng số nguyên (Integer/BigInt) biểu thị đơn vị tiền tệ nhỏ nhất (ví dụ: VND) hoặc sử dụng các thư viện tính toán số thập phân độ chính xác cao như `decimal.js`.

### III. Responsive & Clean UI
Giao diện ứng dụng phải hiển thị tối ưu trên mọi kích thước màn hình (Desktop, Tablet, Mobile) bằng CSS thuần (Vanilla CSS) và Responsive Design. Ưu tiên sử dụng biến CSS (CSS Variables) để quản lý màu sắc, khoảng cách và hỗ trợ Light/Dark Mode một cách nhất quán.

### IV. Security & Privacy First
Thông tin tài chính của người dùng là dữ liệu nhạy cảm. Không lưu trữ JWT token hay dữ liệu thô nhạy cảm trực tiếp vào localStorage. Sử dụng cơ chế HttpOnly Cookie cho xác thực. Mọi truy cập ngoại tuyến vào IndexedDB phải đảm bảo các biện pháp kiểm soát quyền truy cập hoặc mã hóa dữ liệu nhạy cảm cục bộ.

### V. Component-Driven Development
Mọi giao diện và tính năng phải được phát triển dưới dạng các component độc lập, tái sử dụng được, có ranh giới trách nhiệm rõ ràng (Single Responsibility). Mỗi component chính phải đi kèm với file test tương ứng (sử dụng Jest và React Testing Library).

## Technology Stack & Constraints

- **Frontend Framework:** React (Vite)
- **Styling:** Vanilla CSS (CSS Variables)
- **Database:** IndexedDB (Dexie.js) cho Client-side / PostgreSQL cho Server-side
- **Testing:** Jest + React Testing Library
- **Platform:** Web Browser (Chrome, Safari, Firefox, Edge) có hỗ trợ PWA

## Development Workflow & Quality Gates

- **Quy trình SDD (Spec-Driven Development):**
  1. Viết Đặc tả tính năng (`spec.md`) -> Người dùng duyệt.
  2. Viết Kế hoạch triển khai (`plan.md`) -> Định nghĩa kiến trúc dữ liệu và API contract.
  3. Viết Danh sách tác vụ (`tasks.md`) -> Liệt kê chi tiết từng file cần chỉnh sửa/tạo mới.
  4. Thực thi triển khai (`implement`) -> Viết code kèm test.
- **Quality Gates:** Code chỉ được merge khi:
  - 100% test pass.
  - Không có dòng debug dư thừa (`console.log`, `TODO`).
  - Đã được định dạng chuẩn bằng Prettier/ESLint.

## Governance

Tài liệu Constitution này có giá trị cao nhất trong dự án. Mọi thay đổi về nguyên tắc hoặc công nghệ cốt lõi phải được cập nhật tại đây trước, tăng phiên bản tài liệu tương ứng và tạo bản ghi thay đổi (changelog) chi tiết.

**Version**: 1.0.0 | **Ratified**: 2026-06-25 | **Last Amended**: 2026-06-25
