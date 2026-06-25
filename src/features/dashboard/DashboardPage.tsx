import React, { useState } from 'react';
import { BalanceSummary } from './components/BalanceSummary';
import { TransactionList } from '../transactions/components/TransactionList';
import { TransactionForm } from '../transactions/components/TransactionForm';
import { WalletForm } from './components/WalletForm';
import { PlusCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [isTxFormOpen, setIsTxFormOpen] = useState<boolean>(false);
  const [isWalletFormOpen, setIsWalletFormOpen] = useState<boolean>(false);
  const [editingTxId, setEditingTxId] = useState<string | undefined>(undefined);
  
  // State kích hoạt việc làm mới dữ liệu giữa các component con
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleEditTx = (id: string) => {
    setEditingTxId(id);
    setIsTxFormOpen(true);
  };

  const handleCloseTxForm = () => {
    setIsTxFormOpen(false);
    setEditingTxId(undefined);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      animation: 'fadeIn var(--transition-normal) forwards'
    }}>
      {/* Khối thanh công cụ tiêu đề */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '10px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>
            Tổng Quan Tài Chính Của Bạn
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Quản lý số dư các ví tài khoản và ghi chép nhật ký chi tiêu hằng ngày.
          </p>
        </div>

        {/* Các nút thêm ví / thêm giao dịch nhanh */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsWalletFormOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={16} /> Thêm Ví mới
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setIsTxFormOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={16} /> Ghi Giao dịch
          </button>
        </div>
      </div>

      {/* Grid Bố cục chính Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Cột trái: Hiển thị tổng số dư tài sản và các ví tài khoản */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <BalanceSummary key={`bal-${refreshCounter}`} onUpdateTrigger={triggerRefresh} />
        </div>

        {/* Cột phải: Bảng lịch sử các giao dịch thu/chi/chuyển khoản */}
        <div style={{ gridColumn: 'span 2' }}>
          <TransactionList 
            key={`list-${refreshCounter}`} 
            onEdit={handleEditTx} 
            onUpdateTrigger={triggerRefresh} 
          />
        </div>
      </div>

      {/* Modal Form Giao dịch (Thêm/Sửa) */}
      {isTxFormOpen && (
        <TransactionForm
          transactionId={editingTxId}
          onClose={handleCloseTxForm}
          onSave={triggerRefresh}
        />
      )}

      {/* Modal Form Ví tài khoản */}
      {isWalletFormOpen && (
        <WalletForm
          onClose={() => setIsWalletFormOpen(false)}
          onSave={triggerRefresh}
        />
      )}
    </div>
  );
};
export default DashboardPage;
