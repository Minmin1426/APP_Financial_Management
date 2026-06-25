import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type CashFlowTrendItem } from '../utils/reportUtils';
import { formatCurrency } from '../../../utils/finance';

interface CashFlowBarChartProps {
  data: CashFlowTrendItem[];
}

export const CashFlowBarChart: React.FC<CashFlowBarChartProps> = ({ data }) => {
  // Bộ format tooltip tùy chỉnh
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.85rem'
        }}>
          <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{label}</p>
          <p style={{ margin: '0', color: 'var(--color-income)' }}>
            Thu nhập: <strong>{formatCurrency(payload[0].value)}</strong>
          </p>
          <p style={{ margin: '0', color: 'var(--color-expense)' }}>
            Chi tiêu: <strong>{formatCurrency(payload[1].value)}</strong>
          </p>
          <p style={{ margin: '4px 0 0 0', borderTop: '1px solid var(--border-color)', paddingTop: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
            Dòng tiền ròng: <strong style={{ color: payload[0].value - payload[1].value >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatCurrency(payload[0].value - payload[1].value)}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
          <XAxis 
            dataKey="month" 
            stroke="var(--text-tertiary)" 
            fontSize={12} 
            tickLine={false}
          />
          <YAxis 
            stroke="var(--text-tertiary)" 
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${value / 1000000}M`;
              if (value >= 1000) return `${value / 1000}k`;
              return value;
            }}
          />
          <Tooltip content={customTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
          <Legend 
            iconType="circle"
            formatter={(value) => (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {value === 'income' ? 'Thu nhập' : 'Chi tiêu'}
              </span>
            )}
          />
          <Bar 
            dataKey="income" 
            fill="var(--color-income, #2ecc71)" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
          />
          <Bar 
            dataKey="expense" 
            fill="var(--color-expense, #e74c3c)" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowBarChart;
