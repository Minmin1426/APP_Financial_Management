import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type ExpenseStructureItem } from '../utils/reportUtils';
import { formatCurrency } from '../../../utils/finance';

interface ExpensePieChartProps {
  data: ExpenseStructureItem[];
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '0.9rem'
      }}>
        Không có dữ liệu chi tiêu trong khoảng thời gian này
      </div>
    );
  }

  // Bộ format tooltip tùy chỉnh để hiển thị thông tin tiền tệ VND & tỷ lệ phần trăm
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload as ExpenseStructureItem;
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.85rem'
        }}>
          <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{itemData.name}</p>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
            Số tiền: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(itemData.amount)}</strong>
          </p>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
            Tỷ lệ: <strong>{itemData.value}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '350px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            labelLine={false}
            outerRadius={100}
            innerRadius={60} // Donut chart cho cảm giác hiện đại hơn
            fill="#8884d8"
            dataKey="amount"
            nameKey="name"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none', cursor: 'pointer' }} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend 
            verticalAlign="bottom" 
            height={60}
            iconType="circle"
            formatter={(value, entry: any) => {
              const item = entry.payload as ExpenseStructureItem;
              return (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {value} ({item?.value}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpensePieChart;
