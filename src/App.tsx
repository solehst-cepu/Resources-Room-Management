import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { ReceiptModal } from './components/common/ReceiptModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickRequestModal } from './components/common/QuickRequestModal';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PhotocopyServiceView } from './views/PhotocopyServiceView';
import { LaminatingServiceView } from './views/LaminatingServiceView';
import { WaterServiceView } from './views/WaterServiceView';
import { RequestsView } from './views/RequestsView';
import { ReportsView } from './views/ReportsView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { ServiceRequest } from './types';

const MainApp: React.FC = () => {
  const { currentUser } = useApp();
  
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedReceiptRequest, setSelectedReceiptRequest] = useState<ServiceRequest | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickRequestOpen, setIsQuickRequestOpen] = useState(false);

  if (!currentUser) {
    return <LoginView />;
  }

  const handleOpenReceipt = (req: ServiceRequest) => {
    setSelectedReceiptRequest(req);
    setIsReceiptOpen(true);
  };

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileOpen(false);
  };

  const renderContent = () => {
    // Service modules
    if (currentTab === 'layanan_fotocopy') {
      return <PhotocopyServiceView onOpenReceipt={handleOpenReceipt} />;
    }
    if (currentTab === 'layanan_laminating') {
      return <LaminatingServiceView onOpenReceipt={handleOpenReceipt} />;
    }
    if (currentTab === 'layanan_air') {
      return <WaterServiceView onOpenReceipt={handleOpenReceipt} />;
    }

    // Requests tabs
    if (currentTab === 'permintaan_all') {
      return <RequestsView filterStatus="all" onOpenReceipt={handleOpenReceipt} />;
    }
    if (currentTab === 'permintaan_pending') {
      return <RequestsView filterStatus="pending" onOpenReceipt={handleOpenReceipt} />;
    }
    if (currentTab === 'permintaan_processing') {
      return <RequestsView filterStatus="processing" onOpenReceipt={handleOpenReceipt} />;
    }
    if (currentTab === 'permintaan_history') {
      return <RequestsView filterStatus="history" onOpenReceipt={handleOpenReceipt} />;
    }

    // Reports - Laporan Rekapitulasi
    if (currentTab === 'laporan_rekapitulasi' || currentTab === 'laporan_all' || currentTab.startsWith('laporan_')) {
      const serviceMatch = currentTab === 'laporan_fotocopy' ? 'fotocopy' 
        : currentTab === 'laporan_laminating' ? 'laminating'
        : currentTab === 'laporan_air' ? 'air_galon'
        : 'all';
      return <ReportsView initialServiceFilter={serviceMatch} />;
    }

    // Audit logs & Settings
    if (currentTab === 'audit_log') {
      return <AuditLogView />;
    }
    if (currentTab === 'pengaturan_roles') {
      return <SettingsView initialTab="roles" />;
    }
    if (currentTab === 'pengaturan_user') {
      return <SettingsView initialTab="users" />;
    }
    if (currentTab === 'pengaturan_unit') {
      return <SettingsView initialTab="units" />;
    }
    if (currentTab === 'pengaturan_system') {
      return <SettingsView initialTab="system" />;
    }

    // Default Dashboard
    return (
      <DashboardView 
        onNavigate={handleNavigate} 
        onOpenQuickRequest={() => setIsQuickRequestOpen(true)}
        onOpenReceipt={handleOpenReceipt}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={handleNavigate}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200 lg:pl-72">
        
        {/* Top Navbar */}
        <Navbar 
          onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickRequest={() => setIsQuickRequestOpen(true)}
          onNavigate={handleNavigate}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Global Footer */}
        <footer className="h-12 bg-white border-t border-slate-200 px-6 sm:px-8 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-600">Sistem Operasional Lazuardi GCS Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400">© 2026 Resources Room Management System</p>
        </footer>
      </div>

      {/* Global Modals & Notifications */}
      <ReceiptModal 
        request={selectedReceiptRequest}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <GlobalSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <QuickRequestModal 
        isOpen={isQuickRequestOpen}
        onClose={() => setIsQuickRequestOpen(false)}
        onSelectService={handleNavigate}
      />

      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
