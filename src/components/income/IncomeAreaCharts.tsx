import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IncomeAreaChartProps {
  data: any[];
  yearTicks: number[];
}

export const IncomePassiveActiveChart: React.FC<IncomeAreaChartProps> = ({ data, yearTicks }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorPassive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-accent-rgb), 0.05)" />
        <XAxis 
          dataKey="year" 
          ticks={yearTicks} 
          stroke="#6b7280" 
          fontSize={11} 
        />
        <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
          itemStyle={{ color: '#f8fafc', fontSize: 11 }}
          labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
          labelFormatter={(label, items) => items[0]?.payload ? items[0].payload.dateStr : label}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
        
        {/* Stacked areas */}
        <Area type="monotone" name="Chủ động" dataKey="activeIncome" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
        <Area type="monotone" name="Thụ động" dataKey="passiveIncome" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorPassive)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const IncomeCumulativeChart: React.FC<IncomeAreaChartProps> = ({ data, yearTicks }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e2b44c" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#e2b44c" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-accent-rgb), 0.05)" />
        <XAxis 
          dataKey="year" 
          ticks={yearTicks} 
          stroke="#6b7280" 
          fontSize={11} 
        />
        <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
          itemStyle={{ color: '#f8fafc', fontSize: 11 }}
          labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
          labelFormatter={(label, items) => items[0]?.payload ? items[0].payload.dateStr : label}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
        
        <Area type="monotone" name="Lũy kế trọn đời" dataKey="cumulativeIncome" stroke="#e2b44c" fillOpacity={1} fill="url(#colorCum)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};
