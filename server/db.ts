import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Thiết lập đọc tệp .env ở thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('LỖI: Biến môi trường DATABASE_URL không tồn tại trong tệp server/.env');
  process.exit(1);
}

// Khởi tạo instance kết nối cơ sở dữ liệu Neon qua giao thức HTTP (cổng 443)
export const sql = neon(connectionString);
export default sql;
