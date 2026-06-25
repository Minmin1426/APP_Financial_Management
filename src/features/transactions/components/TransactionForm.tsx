import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../../db/db';
import { TransactionService } from '../services/transactionService';
import { BudgetService } from '../../budget/services/budgetService';
import { X, AlertTriangle } from 'lucide-react';

interface TransactionFormProps {
  transactionId?: string; // Cung cấp ID nếu đang ở chế độ chỉnh sửa
  onClose: () => void;
  onSave: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ transactionId, onClose, onSave }) => {
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  // Các state quản lý form
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [destinationWalletId, setDestinationWalletId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // State cảnh báo ngân sách chi tiêu
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load dữ liệu cũ nếu ở chế độ Sửa (Edit mode)
  useEffect(() => {
    if (transactionId) {
      db.transactions.get(transactionId).then((tx) => {
        if (tx) {
          setType(tx.type);
          setAmount(tx.amount.toString());
          setWalletId(tx.walletId);
          setDestinationWalletId(tx.destinationWalletId || '');
          setCategoryId(tx.categoryId || '');
          setNotes(tx.notes);
          setTransactionDate(new Date(tx.transactionDate).toISOString().split('T')[0]);
        }
      });
    }
  }, [transactionId]);

  // Kiểm tra cảnh báo ngân sách chi tiêu thực tế (Phase 5 integration)
  useEffect(() => {
    async function checkBudget() {
      // Chỉ kiểm tra khi là Chi phí, có số tiền, có danh mục và ngày hợp lệ
      if (type === 'expense' && amount && categoryId && transactionDate) {
        const numAmount = parseInt(amount, 10);
        if (!isNaN(numAmount) && numAmount > 0) {
          try {
            const dateObj = new Date(transactionDate);
            const status = await BudgetService.getBudgetStatus(categoryId, dateObj);
            
            if (status) {
              const currentSpent = status.spentAmount;
              const limit = status.limitAmount;
              
              // Nếu đang sửa đổi giao dịch cũ, ta cần trừ bớt số tiền giao dịch cũ khỏi tổng đã tiêu trước khi so sánh
              let oldAmount = 0;
              if (transactionId) {
                const oldTx = await db.transactions.get(transactionId);
                if (oldTx && oldTx.categoryId === categoryId) {
                  oldAmount = oldTx.amount;
                }
              }

              const projectedSpent = currentSpent - oldAmount + numAmount;

              if (projectedSpent > limit) {
                const overAmount = projectedSpent - limit;
                setBudgetWarning(
                  `Cảnh báo: Hạn mức ngân sách tháng của danh mục này là ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(limit)}. Giao dịch này sẽ làm vượt hạn mức chi tiêu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overAmount)}.`
                );
                return;
              }
            }
          } catch (e) {
            console.error('Lỗi khi kiểm tra ngân sách:', e);
          }
        }
      }
      setBudgetWarning(null);
    }

    checkBudget();
  }, [type, amount, categoryId, transactionDate, transactionId]);

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const parsedAmount = parseInt(amount, 10);

    // Xác thực đầu vào cơ bản
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      setLoading(false);
      return;
    }

    if (!walletId) {
      setError('Vui lòng chọn ví tài khoản thực hiện.');
      setLoading(false);
      return;
    }

    if (type === 'transfer') {
      if (!destinationWalletId) {
        setError('Vui lòng chọn ví nhận chuyển khoản.');
        setLoading(false);
        return;
      }
      if (walletId === destinationWalletId) {
        setError('Ví nhận phải khác ví chuyển tiền đi.');
        setLoading(false);
        return;
      }
    } else {
      if (!categoryId) {
        setError('Vui lòng chọn danh mục thu chi.');
        setLoading(false);
        return;
      }
    }

    try {
      const txData = {
        amount: parsedAmount,
        type,
        walletId,
        destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        notes: notes.trim(),
        transactionDate: new Date(transactionDate)
      };

      if (transactionId) {
        // Thực hiện cập nhật giao dịch
        await TransactionService.updateTransaction(transactionId, txData);
      } else {
        // Thực hiện thêm mới giao dịch
        await TransactionService.addTransaction(txData);
      }

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
        maxWidth: '500px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '30px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Nút đóng */}
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
          {transactionId ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Lựa chọn loại giao dịch */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                backgroundColor: type === 'expense' ? 'var(--color-expense)' : 'transparent',
                color: type === 'expense' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Chi phí
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                backgroundColor: type === 'income' ? 'var(--color-income)' : 'transparent',
                color: type === 'income' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Thu nhập
            </button>
            <button
              type="button"
              onClick={() => { setType('transfer'); setCategoryId(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                backgroundColor: type === 'transfer' ? 'var(--color-transfer)' : 'transparent',
                color: type === 'transfer' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Chuyển khoản
            </button>
          </div>

          {/* Nhập số tiền */}
          <div className="form-group">
            <label htmlFor="tx-amount" className="form-label">Số tiền (₫)</label>
            <input
              id="tx-amount"
              type="number"
              className="form-control"
              placeholder="0 ₫"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Chọn ví gửi/nguồn */}
          <div className="form-group">
            <label htmlFor="tx-wallet" className="form-label">{type === 'transfer' ? 'Ví chuyển' : 'Ví tài khoản'}</label>
            <select
              id="tx-wallet"
              className="form-control"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              required
            >
              <option value="">-- Chọn ví tài khoản --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Số dư: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Chọn ví nhận (chỉ hiển thị khi Chuyển tiền) */}
          {type === 'transfer' && (
            <div className="form-group">
              <label htmlFor="tx-dest-wallet" className="form-label">Ví nhận</label>
              <select
                id="tx-dest-wallet"
                className="form-control"
                value={destinationWalletId}
                onChange={(e) => setDestinationWalletId(e.target.value)}
                required
              >
                <option value="">-- Chọn ví nhận --</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Số dư: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chọn danh mục (ẩn khi Chuyển tiền) */}
          {type !== 'transfer' && (
            <div className="form-group">
              <label htmlFor="tx-category" className="form-label">Danh mục</label>
              <select
                id="tx-category"
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Nhập ngày giao dịch */}
          <div className="form-group">
            <label htmlFor="tx-date" className="form-label">Ngày giao dịch</label>
            <input
              id="tx-date"
              type="date"
              className="form-control"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          {/* Ghi chú */}
          <div className="form-group">
            <label htmlFor="tx-notes" className="form-label">Ghi chú</label>
            <textarea
              id="tx-notes"
              className="form-control"
              rows={2}
              placeholder="Mô tả chi tiết giao dịch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Chỉ báo lỗi */}
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

          {/* Cảnh báo ngân sách */}
          {budgetWarning && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(241, 196, 15, 0.12)',
              border: '1px solid rgba(241, 196, 15, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#d35400',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '15px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{budgetWarning}</span>
            </div>
          )}

          {/* Nhóm nút lưu/hủy */}
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
              {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
