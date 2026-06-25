import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../../db/db';
import { BudgetService, type BudgetStatus } from '../services/budgetService';
import { BudgetProgressBar } from './BudgetProgressBar';
import { AlertCircle, Calendar, Plus, Trash2 } from 'lucide-react';

export const BudgetManager: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // Định dạng YYYY-MM
  });

  const [categoryId, setCategoryId] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Lấy danh mục loại chi phí
  const expenseCategories = useLiveQuery(() => 
    db.categories.filter(c => c.type === 'expense').toArray()
  ) || [];

  // Lấy danh sách ngân sách cho tháng đã chọn và tính toán spentAmount cho từng ngân sách
  const [budgetsWithStatus, setBudgetsWithStatus] = useState<BudgetStatus[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState<boolean>(false);

  // Kích hoạt nạp lại ngân sách khi thay đổi tháng hoặc có hoạt động lưu/xóa
  const fetchBudgets = async () => {
    setLoadingBudgets(true);
    try {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const targetDate = new Date(year, month, 15); // Lấy ngày giữa tháng để tính bounds

      // Tìm tất cả các danh mục
      const categoriesList = await db.categories.filter(c => c.type === 'expense').toArray();
      const statusList: BudgetStatus[] = [];

      for (const cat of categoriesList) {
        const status = await BudgetService.getBudgetStatus(cat.id, targetDate);
        if (status) {
          statusList.push(status);
        }
      }

      setBudgetsWithStatus(statusList);
    } catch (e) {
      console.error('Lỗi khi nạp danh sách ngân sách:', e);
    } finally {
      setLoadingBudgets(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, expenseCategories.length]);

  // Xử lý tạo hoặc cập nhật ngân sách
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!categoryId) {
      setError('Vui lòng chọn danh mục chi tiêu.');
      return;
    }

    const parsedLimit = parseInt(limitAmount, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Hạn mức ngân sách phải là số nguyên dương hợp lệ.');
      return;
    }

    try {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const targetDate = new Date(year, month, 15);

      await BudgetService.setBudget(categoryId, parsedLimit, targetDate);
      setSuccess('Thiết lập hạn mức ngân sách thành công!');
      setLimitAmount('');
      setCategoryId('');
      
      // Nạp lại danh sách
      await fetchBudgets();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Xóa ngân sách
  const handleDeleteBudget = async (budgetId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hạn mức ngân sách này?')) {
      try {
        await db.budgets.delete(budgetId);
        setSuccess('Đã xóa hạn mức ngân sách.');
        await fetchBudgets();
      } catch (err: any) {
        setError('Không thể xóa ngân sách: ' + (err.message || err));
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', padding: '1rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Quản lý Ngân sách</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Đặt hạn mức chi tiêu cho từng danh mục để kiểm soát tài chính tốt hơn.
          </p>
        </div>
        
        {/* Bộ lọc Tháng */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontWeight: 600 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Cột 1: Danh sách ngân sách hiện tại */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '25px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Tiến trình Ngân sách {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}
          </h3>

          {loadingBudgets ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Đang nạp dữ liệu...</p>
          ) : budgetsWithStatus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 10px auto', display: 'block' }} />
              <p style={{ margin: 0 }}>Không có hạn mức ngân sách nào được thiết lập trong tháng này.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hãy đặt hạn mức đầu tiên của bạn ở form bên cạnh hoặc phía dưới.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {budgetsWithStatus.map((b) => {
                const category = expenseCategories.find(c => c.id === b.categoryId);
                const categoryName = category ? category.name : 'Danh mục đã xóa';
                
                return (
                  <div 
                    key={b.budgetId} 
                    style={{ 
                      padding: '16px', 
                      borderRadius: 'var(--radius-sm)', 
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-glass)',
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={() => handleDeleteBudget(b.budgetId)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-expense)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                      title="Xóa hạn mức"
                    >
                      <Trash2 size={16} />
                    </button>

                    <BudgetProgressBar 
                      spent={b.spentAmount} 
                      limit={b.limitAmount} 
                      categoryName={categoryName}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột 2: Thiết lập ngân sách mới */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '25px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Thiết lập Ngân sách
          </h3>

          <form onSubmit={handleSaveBudget}>
            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--color-expense)', fontSize: '13px', marginBottom: '15px' }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--color-income)', fontSize: '13px', marginBottom: '15px' }}>
                {success}
              </div>
            )}

            {/* Chọn danh mục */}
            <div className="form-group">
              <label htmlFor="budget-category" className="form-label">Danh mục chi tiêu</label>
              <select
                id="budget-category"
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nhập hạn mức */}
            <div className="form-group">
              <label htmlFor="budget-limit" className="form-label">Hạn mức chi tiêu tối đa (₫)</label>
              <input
                id="budget-limit"
                type="number"
                className="form-control"
                placeholder="Ví dụ: 2.000.000 ₫"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Lưu Hạn Mức Ngân Sách
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
