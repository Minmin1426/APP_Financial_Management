import sql from './db';

/**
 * Script khởi tạo các bảng và chỉ mục trong cơ sở dữ liệu PostgreSQL (Neon).
 * Đảm bảo các kiểu dữ liệu và ràng buộc được thiết lập chính xác theo nghiệp vụ tài chính.
 */
async function initializeDatabase() {
  console.log('Bắt đầu khởi tạo cấu trúc cơ sở dữ liệu trên PostgreSQL...');
  
  try {
    // 1. Tạo bảng danh mục (categories)
    console.log('Tạo bảng "categories"...');
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Tạo bảng ví tài khoản (wallets)
    console.log('Tạo bảng "wallets"...');
    await sql`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit')),
        balance BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Tạo bảng giao dịch (transactions)
    console.log('Tạo bảng "transactions"...');
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount BIGINT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        destination_wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        notes TEXT NOT NULL DEFAULT '',
        transaction_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 4. Tạo bảng ngân sách chi tiêu (budgets)
    console.log('Tạo bảng "budgets"...');
    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        limit_amount BIGINT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 5. Tạo các chỉ mục (indices) để tối ưu hóa truy vấn tìm kiếm/phân trang
    console.log('Tạo các chỉ mục truy vấn...');
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id)`;

    console.log('Khởi tạo cơ sở dữ liệu PostgreSQL THÀNH CÔNG!');
  } catch (error) {
    console.error('LỖI khi khởi tạo cơ sở dữ liệu:', error);
    process.exit(1);
  }
}

// Chạy script khởi tạo trực tiếp
initializeDatabase();
