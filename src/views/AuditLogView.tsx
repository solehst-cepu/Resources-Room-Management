import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Search, Filter, History, Clock, User, Layers } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchQ = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMod = selectedModule === 'all' || log.module === selectedModule;
    const matchAct = selectedAction === 'all' || log.action === selectedAction;

    return matchQ && matchMod && matchAct;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'UPDATE': return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'DELETE': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'APPROVE': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'REJECT': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'STATUS_CHANGE': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'STOCK_ADJUST': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-800 text-white rounded-xl shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Audit Trail &amp; Log Aktivitas Sistem</h2>
            <p className="text-xs text-slate-500">
              Rekam jejak seluruh transaksi, perubahan status, persetujuan, dan penyesuaian stok
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Log: <strong className="text-slate-900">{auditLogs.length} Aktivitas</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama petugas, modul, detail aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent border-none outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="all">Semua Modul</option>
            <option value="Pelayanan Seragam">Pelayanan Seragam</option>
            <option value="Pelayanan ATK">Pelayanan ATK</option>
            <option value="Fotocopy & Print">Fotocopy &amp; Print</option>
            <option value="Air Galon">Air Galon</option>
            <option value="Inventori Barang">Inventori Barang</option>
            <option value="Stock Opname">Stock Opname</option>
            <option value="Stock In">Stock In</option>
            <option value="Stock Out">Stock Out</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="all">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="STOCK_ADJUST">STOCK_ADJUST</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Waktu</th>
                <th className="p-3.5">Pengguna &amp; Role</th>
                <th className="p-3.5">Modul Layanan</th>
                <th className="p-3.5">Aksi</th>
                <th className="p-3.5">Rincian / Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada log aktivitas yang cocok
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'medium'
                      })}
                    </td>
                    <td className="p-3.5">
                      <strong className="text-slate-900 block">{log.userName}</strong>
                      <span className="text-[10px] text-slate-400 capitalize">{log.userRole.replace('_', ' ')}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">{log.module}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium max-w-lg">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
