import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Shirt, 
  PenTool, 
  Printer, 
  Droplet, 
  ClipboardList, 
  FileText, 
  Settings, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle,
  History,
  X,
  Sparkles,
  School,
  LogOut
} from 'lucide-react';
import { RoleBadge } from '../common/Badge';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { currentUser, requests, logout } = useApp();

  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    layanan: true,
    permintaan: false,
    laporan: false,
    pengaturan: false
  });

  const toggleSubmenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Badge calculations
  const pendingRequestsCount = requests.filter(r => r.status === 'Menunggu Approval' || r.status === 'Diajukan').length;
  const inProgressRequestsCount = requests.filter(r => r.status === 'Sedang Disiapkan' || r.status === 'Disetujui' || r.status === 'Siap Diambil').length;

  const handleNavClick = (tabKey: string) => {
    setCurrentTab(tabKey);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm">
                L
              </div>
              <div>
                <h1 className="text-white font-bold leading-tight text-xs tracking-wide">
                  LAZUARDI <span className="text-blue-400 block font-semibold text-[11px]">RESOURCES ROOM</span>
                </h1>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-2.5">
            One Stop School Service
          </p>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          
          {/* Main Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-white' : 'text-blue-400'}`} />
            <span>Dashboard</span>
          </button>

          {/* SECTION: Layanan */}
          <div>
            <button
              onClick={() => toggleSubmenu('layanan')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors mt-3"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>Layanan Utama</span>
              </div>
              {expandedMenus.layanan ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {expandedMenus.layanan && (
              <div className="pl-2 space-y-0.5 mt-1 border-l border-slate-800 ml-3">
                <button
                  onClick={() => handleNavClick('layanan_fotocopy')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'layanan_fotocopy'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Foto Copy</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('layanan_laminating')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'layanan_laminating'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Laminating</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('layanan_air')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'layanan_air'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Droplet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Penyediaan Air Galon</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: Permintaan & Tracking */}
          <div>
            <button
              onClick={() => toggleSubmenu('permintaan')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors mt-3"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                <span>Permintaan</span>
              </div>
              <div className="flex items-center gap-1.5">
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                    {pendingRequestsCount}
                  </span>
                )}
                {expandedMenus.permintaan ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </div>
            </button>

            {expandedMenus.permintaan && (
              <div className="pl-2 space-y-0.5 mt-1 border-l border-slate-800 ml-3">
                <button
                  onClick={() => handleNavClick('permintaan_all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'permintaan_all' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Semua Permintaan</span>
                  <span className="text-[10px] text-slate-400 font-mono">{requests.length}</span>
                </button>

                <button
                  onClick={() => handleNavClick('permintaan_pending')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'permintaan_pending' ? 'bg-amber-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Permintaan Masuk</span>
                  {pendingRequestsCount > 0 && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('permintaan_processing')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'permintaan_processing' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Sedang Diproses</span>
                  {inProgressRequestsCount > 0 && (
                    <span className="text-[10px] bg-blue-500/40 text-blue-200 font-bold px-1.5 py-0.2 rounded">
                      {inProgressRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('permintaan_history')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'permintaan_history' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat Transaksi</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: Laporan Rekapitulasi */}
          <button
            onClick={() => handleNavClick('laporan_rekapitulasi')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer mt-2 ${
              currentTab === 'laporan_rekapitulasi' || currentTab.startsWith('laporan_')
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className={`w-4 h-4 ${currentTab === 'laporan_rekapitulasi' || currentTab.startsWith('laporan_') ? 'text-white' : 'text-blue-400'}`} />
            <span>Laporan Rekapitulasi</span>
          </button>

          {/* Audit Log */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
            <button
              onClick={() => handleNavClick('audit_log')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer mt-2 ${
                currentTab === 'audit_log'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Audit Log Sistem</span>
            </button>
          )}

          {/* SECTION: Pengaturan */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
            <div>
              <button
                onClick={() => toggleSubmenu('pengaturan')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors mt-3"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pengaturan</span>
                </div>
                {expandedMenus.pengaturan ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {expandedMenus.pengaturan && (
                <div className="pl-2 space-y-0.5 mt-1 border-l border-slate-800 ml-3">
                  <button
                    onClick={() => handleNavClick('pengaturan_roles')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'pengaturan_roles' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Setting Role &amp; Hak Akses</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('pengaturan_user')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'pengaturan_user' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Data Pengguna (User)</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('pengaturan_unit')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'pengaturan_unit' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Unit &amp; Departemen</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('pengaturan_system')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'pengaturan_system' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Sistem &amp; Reset Data</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* User Card in Bottom Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <RoleBadge role={currentUser?.role || 'user'} />
                  <span className="text-[10px] text-slate-400 truncate">{currentUser?.unit}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Keluar / Menu Login"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full mt-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Kembali ke Menu Login</span>
          </button>
        </div>

      </aside>
    </>
  );
};
