import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../../db/db';
import { TransactionService } from '../services/transactionService';
import { formatCurrency } from '../../../utils/finance';
import { Search, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface TransactionListProps {
  onEdit: (id: string) => void;
  onUpdateTrigger: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onEdit, onUpdateTrigger }) => {
  // Đọc danh sách ví và danh mục phục vụ việc mapping tên hiển thị
  const wallets = useLiveQuery(() => db.wallets.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  // Các state lọc & phân trang
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Lấy dữ liệu giao dịch trực tiếp từ IndexedDB theo điều kiện lọc
  const transactions = useLiveQuery(async () => {
    // Sắp xếp giao dịch theo ngày mới nhất lên đầu
    let list = await db.transactions.orderBy('transactionDate').reverse().toArray();

    // 1. Lọc theo từ khóa tìm kiếm (ghi chú)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      list = list.filter(t => t.notes.toLowerCase().includes(term));
    }

    // 2. Lọc theo loại giao dịch
    if (typeFilter !== 'all') {
      list = list.filter(t => t.type === typeFilter);
    }

    // 3. Lọc theo ví tài khoản (ví gửi hoặc ví nhận đối với transfer)
    if (walletFilter !== 'all') {
      list = list.filter(t => t.walletId === walletFilter || t.destinationWalletId === walletFilter);
    }

    // 4. Lọc theo danh mục
    if (categoryFilter !== 'all') {
      list = list.filter(t => t.categoryId === categoryFilter);
    }

    return list;
  }, [searchTerm, typeFilter, walletFilter, categoryFilter]) || [];

  // Tính toán phân trang
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  // Xóa giao dịch
  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này? Số dư ví liên quan sẽ tự động khôi phục lại.')) {
      try {
        await TransactionService.deleteTransaction(id);
        onUpdateTrigger();
      } catch (e: any) {
        alert(`Lỗi khi xóa giao dịch: ${e.message}`);
      }
    }
  };

  // Helper ánh xạ tên ví từ ID
  const getWalletName = (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    return wallet ? wallet.name : 'Không rõ';
  };

  // Helper ánh xạ tên danh mục từ ID
  const getCategoryName = (id?: string) => {
    if (!id) return '';
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Không rõ';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn var(--transition-normal) forwards' }}>
      <h3 style={{ marginBottom: '20px', fontWeight: '800' }}>Lịch Sử Giao Dịch</h3>

      {/* Thanh bộ lọc */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Tìm kiếm */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)'
          }} />
          <input
            type="text"
            className="form-control"
            placeholder="Tìm theo ghi chú..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Lọc loại */}
        <select
          className="form-control"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          style={{ width: 'auto', flex: '1 1 120px' }}
        >
          <option value="all">Tất cả loại</option>
          <option value="expense">Chi phí</option>
          <option value="income">Thu nhập</option>
          <option value="transfer">Chuyển khoản</option>
        </select>

        {/* Lọc ví */}
        <select
          className="form-control"
          value={walletFilter}
          onChange={(e) => { setWalletFilter(e.target.value); setCurrentPage(1); }}
          style={{ width: 'auto', flex: '1 1 150px' }}
        >
          <option value="all">Tất cả ví</option>
          {wallets.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        {/* Lọc danh mục */}
        <select
          className="form-control"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          style={{ width: 'auto', flex: '1 1 150px' }}
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? 'Thu' : 'Chi'})</option>
          ))}
        </select>
      </div>

      {/* Bảng giao dịch */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px' }}><Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Ngày</th>
              <th style={{ padding: '12px' }}>Chi tiết</th>
              <th style={{ padding: '12px' }}>Ví</th>
              <th style={{ padding: '12px' }}>Danh mục</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Số tiền</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Không tìm thấy giao dịch nào.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t) => {
                // Xác định màu sắc theo loại giao dịch
                let amountColor = 'var(--text-primary)';
                let prefix = '';
                if (t.type === 'expense') {
                  amountColor = 'var(--color-expense)';
                  prefix = '-';
                } else if (t.type === 'income') {
                  amountColor = 'var(--color-income)';
                  prefix = '+';
                } else if (t.type === 'transfer') {
                  amountColor = 'var(--color-transfer)';
                }

                return (
                  <tr key={t.id} style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color var(--transition-fast)'
                  }} className="table-row-hover">
                    {/* Ngày */}
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(t.transactionDate).toLocaleDateString('vi-VN')}
                    </td>
                    {/* Ghi chú/Chi tiết */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600' }}>{t.notes || 'Không có ghi chú'}</div>
                      {t.type === 'transfer' && (
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          Chuyển tiền nội bộ
                        </div>
                      )}
                    </td>
                    {/* Ví */}
                    <td style={{ padding: '12px' }}>
                      {t.type === 'transfer' ? (
                        <span>
                          {getWalletName(t.walletId)} &rarr; {getWalletName(t.destinationWalletId || '')}
                        </span>
                      ) : (
                        getWalletName(t.walletId)
                      )}
                    </td>
                    {/* Danh mục */}
                    <td style={{ padding: '12px' }}>
                      {t.type === 'transfer' ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(52, 152, 219, 0.12)',
                          color: 'var(--color-transfer)'
                        }}>
                          Chuyển khoản
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: t.type === 'income' ? 'rgba(46, 204, 113, 0.12)' : 'rgba(230, 126, 34, 0.12)',
                          color: t.type === 'income' ? 'var(--color-income)' : '#e67e22'
                        }}>
                          {getCategoryName(t.categoryId)}
                        </span>
                      )}
                    </td>
                    {/* Số tiền */}
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: '700',
                      color: amountColor
                    }}>
                      {prefix} {formatCurrency(t.amount)}
                    </td>
                    {/* Thao tác */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => onEdit(t.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                          title="Sửa giao dịch"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-expense)'
                          }}
                          title="Xóa giao dịch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} trong tổng số {totalItems} giao dịch
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center' }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: '600' }}>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center' }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Sau &nbsp;<ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Style CSS bổ trợ để tạo hiệu ứng hover dòng trong bảng */}
      <style>{`
        .table-row-hover:hover {
          background-color: var(--bg-tertiary);
        }
      `}</style>
    </div>
  );
};
