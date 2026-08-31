import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Menu, 
  Search, 
  Bell, 
  Plus, 
  RotateCcw, 
  LogOut, 
  UserCheck, 
  Sparkles,
  ChevronDown,
  ExternalLink,
  Shield,
  Layers,
  Database
} from 'lucide-react';
import { RoleBadge } from '../common/Badge';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenQuickRequest: () => void;
  onNavigate: (tab: string) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenQuickRequest,
  onNavigate,
  onOpenSearch
}) => {
  const { 
    currentUser, 
    logout, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    supabaseStatus,
    resetAllData 
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 transition-all flex items-center justify-between">
      <div className="flex items-center justify-between gap-4 w-full">
        
        {/* Left: Mobile Toggle & Quick Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Lazuardi GCS
            </span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">T.A. 2026/2027</span>
          </div>
        </div>

        {/* Center: Global Search Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Cari barang, nomor transaksi, pemohon...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Cloud Database Supabase Quick Status Indicator */}
          <button
            onClick={() => onNavigate('settings')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : supabaseStatus === 'connecting'
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
            title="Status Database Supabase - Klik untuk konfigurasi"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Supabase</span>
            <span className={`w-2 h-2 rounded-full ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-500'
                : supabaseStatus === 'connecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`} />
          </button>

          {/* Active User Role & Unit Badge (Static, no demo switcher dropdown) */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/90 text-xs text-slate-700 border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-medium">Peran:</span>
            <RoleBadge role={currentUser?.role || 'user'} />
            {currentUser?.unit && (
              <span className="hidden md:inline text-[11px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {currentUser.unit}
              </span>
            )}
          </div>

          {/* Quick Request Button */}
          <button
            onClick={onOpenQuickRequest}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Permintaan Baru</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifMenu && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800">Notifikasi Sistem</h4>
                    {unreadNotifs.length > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
                        {unreadNotifs.length} baru
                      </span>
                    )}
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.serviceType) {
                            onNavigate(`layanan_${notif.serviceType}`);
                          }
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${!notif.isRead ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.timestamp).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu & Logout */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={logout}
              title="Keluar ke Menu Login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu Login</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <RoleBadge role={currentUser?.role || 'user'} />
                    <span className="text-[11px] text-slate-600">{currentUser?.unit}</span>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => onNavigate('pengaturan_roles')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Setting Role &amp; Hak Akses</span>
                  </button>

                  <button
                    onClick={() => onNavigate('pengaturan_user')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Data Pengguna (User)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Reset semua data ke data contoh awal Sekolah Lazuardi?')) {
                        resetAllData();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reset Data Demo Lazuardi</span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
