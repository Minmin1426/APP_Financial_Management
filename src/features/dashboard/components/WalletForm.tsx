import React, { useState } from 'react';
import db from '../../../db/db';
import { TransactionService } from '../../transactions/services/transactionService';
import { isValidAmount } from '../../../utils/finance';
import { X } from 'lucide-react';

interface WalletFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const WalletForm: React.FC<WalletFormProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit'>('cash');
  const [initialBalance, setInitialBalance] = useState<string>('0');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Submit Form tạo ví
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const parsedBalance = parseInt(initialBalance, 10);

    // Xác thực cơ bản
    if (!name.trim()) {
      setError('Vui lòng nhập tên ví tài khoản.');
      setLoading(false);
      return;
    }

    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Số dư ban đầu phải là một số nguyên không âm.');
      setLoading(false);
      return;
    }

    try {
      const walletId = crypto.randomUUID();
      const now = new Date();

      // Thực hiện nghiệp vụ tạo ví trong Transaction
      await db.transaction('rw', [db.wallets, db.transactions], async () => {
        // 1. Tạo ví với số dư ban đầu bằng 0
        await db.wallets.put({
          id: walletId,
          name: name.trim(),
          type,
          balance: 0,
          createdAt: now,
          updatedAt: now,
          lastSyncedAt: null
        });

        // 2. Nếu số dư khởi tạo > 0, tạo một giao dịch thu nhập đặc biệt để nạp tiền vào ví
        if (parsedBalance > 0) {
          if (!isValidAmount(parsedBalance)) {
            throw new Error('Số dư khởi tạo quá lớn vượt hạn mức cho phép.');
          }

          // Gọi TransactionService để tự động tính toán cộng số dư ví
          await TransactionService.addTransaction({
            id: crypto.randomUUID(),
            amount: parsedBalance,
            type: 'income',
            walletId,
            notes: `Khởi tạo số dư ví "${name.trim()}"`,
            transactionDate: now
          });
        }
      });

      onSave();
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn var(--transition-fast) forwards'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '30px',
        position: 'relative'
      }}>
        {/* Nút đóng form */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>
          Tạo Ví Tài Khoản Mới
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nhập tên ví */}
          <div className="form-group">
            <label className="form-label">Tên ví / Tài khoản</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ví dụ: Techcombank, Tiền mặt..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          {/* Chọn loại ví */}
          <div className="form-group">
            <label className="form-label">Loại tài khoản</label>
            <select
              className="form-control"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              required
            >
              <option value="cash">Tiền mặt</option>
              <option value="bank">Tài khoản ngân hàng</option>
              <option value="credit">Thẻ tín dụng</option>
            </select>
          </div>

          {/* Số dư ban đầu */}
          <div className="form-group">
            <label className="form-label">Số dư ban đầu (₫)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0 ₫"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              min="0"
              required
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              * Nếu số dư lớn hơn 0, một giao dịch "Khởi tạo số dư" tương ứng sẽ được tự động tạo lập để đảm bảo dòng tiền khớp.
            </small>
          </div>

          {/* Hiển thị thông báo lỗi */}
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              border: '1px solid rgba(231, 76, 60, 0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-expense)',
              fontSize: '13px',
              marginBottom: '15px'
            }}>
              {error}
            </div>
          )}

          {/* Nhóm nút bấm */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default WalletForm;
