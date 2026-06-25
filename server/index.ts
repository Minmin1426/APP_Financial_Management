import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from './db';

// Khởi tạo Express
const app = express();

// Thiết lập đọc cấu hình môi trường
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Log các yêu cầu API
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint kiểm tra sức khỏe hệ thống (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tinhtrang: 'Hoạt động bình thường', database: 'PostgreSQL (Neon)' });
});

/**
 * REST API /api/sync: Đồng bộ hóa dữ liệu hai chiều (Bi-directional Sync)
 * Nhận dữ liệu thay đổi từ Client và trả về dữ liệu mới được cập nhật trên Server.
 */
app.post('/api/sync', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { lastSyncTime, wallets, categories, transactions, budgets } = req.body;
    
    console.log(`Bắt đầu đồng bộ cho client. Thời điểm đồng bộ cuối: ${lastSyncTime || 'Chưa từng đồng bộ'}`);

    // Sử dụng mốc thời gian hiện tại làm mốc đồng bộ mới
    const currentSyncTime = new Date().toISOString();

    // 1. Lưu/cập nhật dữ liệu từ Client lên PostgreSQL (Neon)
    
    // Đồng bộ danh mục (Categories)
    if (categories && categories.length > 0) {
      console.log(`Đang đồng bộ ${categories.length} danh mục từ client...`);
      for (const cat of categories) {
        await sql`
          INSERT INTO categories (id, name, type, icon, color, created_at, updated_at)
          VALUES (${cat.id}, ${cat.name}, ${cat.type}, ${cat.icon}, ${cat.color}, ${cat.createdAt}, ${cat.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            icon = EXCLUDED.icon,
            color = EXCLUDED.color,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    // Đồng bộ ví tài khoản (Wallets)
    if (wallets && wallets.length > 0) {
      console.log(`Đang đồng bộ ${wallets.length} ví tài khoản từ client...`);
      for (const w of wallets) {
        await sql`
          INSERT INTO wallets (id, name, type, balance, created_at, updated_at)
          VALUES (${w.id}, ${w.name}, ${w.type}, ${w.balance}, ${w.createdAt}, ${w.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            balance = EXCLUDED.balance,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    // Đồng bộ giao dịch (Transactions)
    if (transactions && transactions.length > 0) {
      console.log(`Đang đồng bộ ${transactions.length} giao dịch từ client...`);
      for (const t of transactions) {
        // Đảm bảo xử lý đúng các giá trị null cho destination_wallet_id và category_id
        const destWalletId = t.destinationWalletId || null;
        const categoryId = t.categoryId || null;
        
        await sql`
          INSERT INTO transactions (id, amount, type, wallet_id, destination_wallet_id, category_id, notes, transaction_date, created_at, updated_at)
          VALUES (${t.id}, ${t.amount}, ${t.type}, ${t.walletId}, ${destWalletId}, ${categoryId}, ${t.notes}, ${t.transactionDate}, ${t.createdAt}, ${t.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            amount = EXCLUDED.amount,
            type = EXCLUDED.type,
            wallet_id = EXCLUDED.wallet_id,
            destination_wallet_id = EXCLUDED.destination_wallet_id,
            category_id = EXCLUDED.category_id,
            notes = EXCLUDED.notes,
            transaction_date = EXCLUDED.transaction_date,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    // Đồng bộ ngân sách (Budgets)
    if (budgets && budgets.length > 0) {
      console.log(`Đang đồng bộ ${budgets.length} hạn mức ngân sách từ client...`);
      for (const b of budgets) {
        await sql`
          INSERT INTO budgets (id, category_id, limit_amount, start_date, end_date, created_at, updated_at)
          VALUES (${b.id}, ${b.categoryId}, ${b.limitAmount}, ${b.startDate}, ${b.endDate}, ${b.createdAt}, ${b.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            category_id = EXCLUDED.category_id,
            limit_amount = EXCLUDED.limit_amount,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    // 2. Lấy dữ liệu mới được cập nhật trên Server kể từ mốc đồng bộ trước để gửi ngược lại cho Client
    let serverWallets = [];
    let serverCategories = [];
    let serverTransactions = [];
    let serverBudgets = [];

    if (lastSyncTime) {
      const lastSyncDate = new Date(lastSyncTime);
      console.log(`Đang lấy dữ liệu thay đổi trên server từ sau ngày: ${lastSyncDate.toISOString()}`);
      
      serverWallets = await sql`SELECT * FROM wallets WHERE updated_at > ${lastSyncDate}`;
      serverCategories = await sql`SELECT * FROM categories WHERE updated_at > ${lastSyncDate}`;
      serverTransactions = await sql`SELECT * FROM transactions WHERE updated_at > ${lastSyncDate}`;
      serverBudgets = await sql`SELECT * FROM budgets WHERE updated_at > ${lastSyncDate}`;
    } else {
      console.log('Lấy toàn bộ dữ liệu từ server lần đầu...');
      serverWallets = await sql`SELECT * FROM wallets`;
      serverCategories = await sql`SELECT * FROM categories`;
      serverTransactions = await sql`SELECT * FROM transactions`;
      serverBudgets = await sql`SELECT * FROM budgets`;
    }

    console.log(`Kết quả đồng bộ ngược cho client: ${serverWallets.length} ví, ${serverCategories.length} danh mục, ${serverTransactions.length} giao dịch, ${serverBudgets.length} ngân sách.`);

    res.json({
      success: true,
      syncTime: currentSyncTime,
      wallets: serverWallets,
      categories: serverCategories,
      transactions: serverTransactions,
      budgets: serverBudgets
    });
  } catch (error) {
    console.error('LỖI trong quá trình đồng bộ dữ liệu:', error);
    res.status(500).json({ success: false, error: 'Đồng bộ thất bại', details: String(error) });
  }
});

// Khởi chạy server lắng nghe kết nối
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Express Server đang chạy tại cổng: ${PORT}`);
  console.log(`  Địa chỉ API: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
