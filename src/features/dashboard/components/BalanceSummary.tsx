import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../../db/db';
import { formatCurrency } from '../../../utils/finance';
import { CreditCard, Wallet as WalletIcon, Landmark, Trash2 } from 'lucide-react';

interface BalanceSummaryProps {
  onUpdateTrigger: () => void;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ onUpdateTrigger }) => {
  // Lấy danh sách ví tài khoản từ IndexedDB
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];

  // Tính toán tổng tài sản bằng số nguyên an toàn
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Xóa ví tài khoản và toàn bộ giao dịch liên quan (ACID)
  const handleDeleteWallet = async (walletId: string, name: string) => {
    const confirmMessage = `CẢNH BÁO CỰC KỲ QUAN TRỌNG:\n\nXóa ví "${name}" sẽ xóa VĨNH VIỄN toàn bộ giao dịch và lịch sử chuyển tiền liên quan đến ví này để bảo toàn số dư hệ thống.\n\nBạn có thực sự muốn xóa?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await db.transaction('rw', [db.wallets, db.transactions], async () => {
          // Xóa ví
          await db.wallets.delete(walletId);
          // Xóa giao dịch liên quan
          await db.transactions.where('walletId').equals(walletId).delete();
          await db.transactions.where('destinationWalletId').equals(walletId).delete();
        });
        
        onUpdateTrigger();
      } catch (err: any) {
        alert(`Lỗi khi xóa ví: ${err.message}`);
      }
    }
  };

  // Helper render icon theo loại ví
  const renderWalletIcon = (type: 'cash' | 'bank' | 'credit') => {
    switch (type) {
      case 'cash':
        return <WalletIcon size={20} color="#2ecc71" />;
      case 'bank':
        return <Landmark size={20} color="#3498db" />;
      case 'credit':
        return <CreditCard size={20} color="#9b59b6" />;
      default:
        return <WalletIcon size={20} />;
    }
  };

  // Helper ánh xạ tên loại ví tiếng Việt
  const getWalletTypeName = (type: 'cash' | 'bank' | 'credit') => {
    switch (type) {
      case 'cash': return 'Tiền mặt';
      case 'bank': return 'Ngân hàng';
      case 'credit': return 'Thẻ tín dụng';
      default: return 'Khác';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      animation: 'fadeIn var(--transition-normal) forwards'
    }}>
      {/* Khối hiển thị Tổng tài sản tích hợp gradient đẹp */}
      <div className="glass-panel" style={{
        padding: '30px',
        background: 'linear-gradient(135deg, var(--accent-color) 0%, #4f46e5 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
      }}>
        <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: '600' }}>
          TỔNG TÀI SẢN TÍCH LŨY
        </span>
        <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '10px 0', color: '#ffffff' }}>
          {formatCurrency(totalBalance)}
        </h2>
        <span style={{ fontSize: '12px', opacity: 0.6 }}>
          Tổng số ví đang theo dõi: {wallets.length}
        </span>
      </div>

      {/* Danh sách các ví chi tiết */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ marginBottom: '15px', fontWeight: '700' }}>Danh Sách Ví Tài Khoản</h4>
        
        {wallets.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Không có ví tài khoản nào. Hãy tạo mới một ví để bắt đầu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {wallets.map((w) => (
              <div key={w.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                transition: 'transform var(--transition-fast)'
              }} className="wallet-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {renderWalletIcon(w.type)}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{w.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {getWalletTypeName(w.type)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>
                    {formatCurrency(w.balance)}
                  </span>
                  {/* Nút xóa ví (chỉ hiển thị nếu có nhiều hơn 1 ví để tránh trường hợp không có ví nào) */}
                  {wallets.length > 1 && (
                    <button
                      onClick={() => handleDeleteWallet(w.id, w.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-expense)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                      title="Xóa ví và giao dịch liên quan"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .wallet-item:hover {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
};
export default BalanceSummary;
