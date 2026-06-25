import React from 'react';
import { calculateProgressPercentage, getBudgetStatusColor } from '../utils/budgetUtils';
import { formatCurrency } from '../../../utils/finance';

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  categoryName?: string;
  showDetails?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  limit,
  categoryName,
  showDetails = true
}) => {
  const percentage = calculateProgressPercentage(spent, limit);
  const status = getBudgetStatusColor(percentage);
  
  // Giới hạn phần trăm hiển thị tối đa thanh bar là 100% để giao diện không bị tràn
  const displayPercentage = Math.min(percentage, 100);

  // Xác định màu sắc của thanh tiến trình
  let barColor = 'var(--color-income, #2ecc71)'; // Safe
  let glowColor = 'rgba(46, 204, 113, 0.4)';

  if (status === 'warning') {
    barColor = '#e67e22'; // Màu cam cảnh báo
    glowColor = 'rgba(230, 126, 34, 0.4)';
  } else if (status === 'danger') {
    barColor = 'var(--color-expense, #e74c3c)'; // Màu đỏ cảnh báo vượt hạn mức
    glowColor = 'rgba(231, 76, 60, 0.4)';
  }

  return (
    <div className="budget-progress-container" style={{ marginBottom: '1.25rem', width: '100%' }}>
      {/* CSS Nhúng cục bộ để xử lý hiệu ứng nhấp nháy/pulse của thanh màu đỏ */}
      <style>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 5px rgba(231, 76, 60, 0.5); }
          50% { box-shadow: 0 0 15px rgba(231, 76, 60, 0.8); }
          100% { box-shadow: 0 0 5px rgba(231, 76, 60, 0.5); }
        }
        .progress-bar-fill.status-danger {
          animation: pulse-red 2s infinite ease-in-out;
        }
      `}</style>

      {categoryName && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {categoryName}
          </span>
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            color: barColor,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: status === 'danger' ? 'rgba(231, 76, 60, 0.1)' : status === 'warning' ? 'rgba(230, 126, 34, 0.1)' : 'rgba(46, 204, 113, 0.1)'
          }}>
            {percentage}%
          </span>
        </div>
      )}

      {/* Thanh tiến trình bên ngoài */}
      <div style={{
        height: '10px',
        width: '100%',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border-glass)'
      }}>
        {/* Phần lấp đầy tiến trình */}
        <div 
          className={`progress-bar-fill status-${status}`}
          style={{
            height: '100%',
            width: `${displayPercentage}%`,
            background: barColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-slow)',
            boxShadow: `0 0 8px ${glowColor}`
          }}
        />
      </div>

      {showDetails && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Đã chi: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(spent)}</strong></span>
          <span>Hạn mức: <strong>{formatCurrency(limit)}</strong></span>
        </div>
      )}

      {status === 'danger' && showDetails && (
        <div style={{ 
          fontSize: '0.775rem', 
          color: 'var(--color-expense)', 
          marginTop: '0.25rem', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⚠️ Đã vượt hạn mức chi tiêu {formatCurrency(spent - limit)}!
        </div>
      )}
    </div>
  );
};

export default BudgetProgressBar;
