import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'teal' | 'amber' | 'emerald' | 'rose' | 'red' | 'sky' | 'indigo' | 'purple';
  trend?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick
}) => {
  const colorMap: Record<string, { bg: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50 text-blue-700 border-blue-100', iconBg: 'bg-blue-600 text-white' },
    teal: { bg: 'bg-blue-50 text-blue-700 border-blue-100', iconBg: 'bg-blue-600 text-white' },
    emerald: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', iconBg: 'bg-emerald-600 text-white' },
    amber: { bg: 'bg-amber-50 text-amber-800 border-amber-100', iconBg: 'bg-amber-500 text-white' },
    rose: { bg: 'bg-red-50 text-red-700 border-red-100', iconBg: 'bg-red-600 text-white' },
    red: { bg: 'bg-red-50 text-red-700 border-red-100', iconBg: 'bg-red-600 text-white' },
    sky: { bg: 'bg-sky-50 text-sky-700 border-sky-100', iconBg: 'bg-sky-600 text-white' },
    indigo: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', iconBg: 'bg-indigo-600 text-white' },
    purple: { bg: 'bg-purple-50 text-purple-700 border-purple-100', iconBg: 'bg-purple-600 text-white' }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-lg ${currentTheme.iconBg} shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">{subtitle}</span>
          {trend && <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{trend}</span>}
        </div>
      )}
    </div>
  );
};
