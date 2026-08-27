import React from 'react';
import { RequestStatus, UserRole } from '../../types';

interface BadgeProps {
  status?: RequestStatus | string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const StatusBadge: React.FC<{ status: RequestStatus | string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'Draft':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      dotColor = 'bg-slate-400';
      break;
    case 'Diajukan':
    case 'Menunggu Approval':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500 animate-pulse';
      break;
    case 'Disetujui':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      dotColor = 'bg-emerald-500';
      break;
    case 'Sedang Disiapkan':
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-300';
      dotColor = 'bg-blue-500 animate-pulse';
      break;
    case 'Siap Diambil':
      colorClasses = 'bg-cyan-50 text-cyan-800 border-cyan-300';
      dotColor = 'bg-cyan-500';
      break;
    case 'Selesai':
      colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold';
      dotColor = 'bg-emerald-600';
      break;
    case 'Ditolak':
    case 'Dibatalkan':
    case 'out_of_stock':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
      dotColor = 'bg-rose-500';
      break;
    case 'Stok Tidak Tersedia':
    case 'low_stock':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300';
      dotColor = 'bg-orange-500';
      break;
    case 'available':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} whitespace-nowrap font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status === 'available' ? 'Tersedia' : status === 'low_stock' ? 'Stok Menipis' : status === 'out_of_stock' ? 'Habis' : status}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const map: Record<UserRole, { label: string; bg: string; text: string }> = {
    super_admin: { label: 'Super Admin', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    admin_rr: { label: 'Admin RR', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    manager: { label: 'Kepala Unit', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
    user: { label: 'Guru / Staff', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' }
  };

  const current = map[role] || map.user;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${current.bg} ${current.text} whitespace-nowrap`}>
      {current.label}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: 'Biasa' | 'Penting' | 'Mendesak' }> = ({ urgency }) => {
  if (urgency === 'Mendesak') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
        🔥 Mendesak
      </span>
    );
  }
  if (urgency === 'Penting') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
        ⚡ Penting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-normal bg-slate-100 text-slate-600">
      Biasa
    </span>
  );
};
