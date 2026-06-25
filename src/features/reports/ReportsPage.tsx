import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/db';
import { getExpenseStructure, getCashFlowTrend } from './utils/reportUtils';
import { ExpensePieChart } from './components/ExpensePieChart';
import { CashFlowBarChart } from './components/CashFlowBarChart';
import { formatCurrency } from '../../utils/finance';
import { Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  // Các state lọc báo cáo
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth).padStart(2, '0')); // "01" - "12" hoặc "all"

  // Load tất cả giao dịch và danh mục từ DB
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  // 1. Sinh danh sách các năm có giao dịch để điền vào dropdown lọc
  const yearOptions = useMemo(() => {
    if (transactions.length === 0) return [currentYear];
    const years = transactions.map((t) => new Date(t.transactionDate).getFullYear());
    const uniqueYears = Array.from(new Set(years));
    if (!uniqueYears.includes(currentYear)) {
      uniqueYears.push(currentYear);
    }
    return uniqueYears.sort((a, b) => b - a); // Mới nhất lên trước
  }, [transactions, currentYear]);

  // 2. Lọc danh sách giao dịch theo Năm & Tháng đã chọn
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.transactionDate);
      const matchesYear = date.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'all' || String(date.getMonth() + 1).padStart(2, '0') === selectedMonth;
      return matchesYear && matchesMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // 3. Tính toán các chỉ số tổng quan (Tổng Thu, Tổng Chi, Dòng tiền ròng)
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
      }
    });

    const netFlow = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netFlow
    };
  }, [filteredTransactions]);

  // 4. Chuẩn bị dữ liệu cho Biểu đồ Tròn (Cơ cấu chi phí) - theo bộ lọc tháng & năm
  const expenseStructureData = useMemo(() => {
    return getExpenseStructure(filteredTransactions, categories);
  }, [filteredTransactions, categories]);

  // 5. Chuẩn bị dữ liệu cho Biểu đồ Cột (Xu hướng dòng tiền) - luôn hiển thị theo cả năm để thể hiện xu hướng
  const cashFlowTrendData = useMemo(() => {
    return getCashFlowTrend(transactions, selectedYear);
  }, [transactions, selectedYear]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }} className="animate-fade-in">
      {/* Tiêu đề & Bộ lọc */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Báo cáo Phân tích</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Xem thống kê chi tiết, cơ cấu chi tiêu và xu hướng dòng tiền thu chi của bạn.
          </p>
        </div>

        {/* Khối Bộ lọc */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {/* Lọc Năm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  Năm {year}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Tháng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="all">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                return (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Thẻ Thống kê Tổng quan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Tổng Thu Nhập */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: 'var(--color-income)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tổng thu nhập</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-income)' }}>
              {formatCurrency(stats.totalIncome)}
            </h3>
          </div>
        </div>

        {/* Tổng Chi Tiêu */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: 'var(--color-expense)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tổng chi tiêu</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-expense)' }}>
              {formatCurrency(stats.totalExpense)}
            </h3>
          </div>
        </div>

        {/* Dòng Tiền Ròng */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            backgroundColor: stats.netFlow >= 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            color: stats.netFlow >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Thặng dư / Thâm hụt</span>
            <h3 style={{
              margin: '4px 0 0 0',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: stats.netFlow >= 0 ? 'var(--color-income)' : 'var(--color-expense)'
            }}>
              {formatCurrency(stats.netFlow)}
            </h3>
          </div>
        </div>
      </div>

      {/* Khối Biểu đồ Phân tích */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* Biểu đồ Cột - Xu hướng dòng tiền */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '25px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-color)' }} /> Dòng tiền thu chi trong năm {selectedYear}
          </h3>
          <CashFlowBarChart data={cashFlowTrendData} />
        </div>

        {/* Biểu đồ Tròn - Cơ cấu chi phí */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '25px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--accent-color)' }} /> Phân tích cơ cấu chi tiêu
          </h3>
          <ExpensePieChart data={expenseStructureData} />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
