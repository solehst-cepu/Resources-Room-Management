import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Package, 
  Printer, 
  Shirt, 
  Droplet, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight,
  PlusCircle,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  MapPin,
  Sparkles
} from 'lucide-react';
import { StatsCard } from '../components/common/StatsCard';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenQuickRequest: () => void;
  onOpenReceipt: (req: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickRequest,
  onOpenReceipt
}) => {
  const { currentUser, requests, items, uniforms, waterLocations, waterInventory } = useApp();
  const [chartPeriod, setChartPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');

  // Stats Calculations
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const requestsToday = requests.filter(r => r.requestDate.startsWith(todayDateStr)).length;
  const pendingRequests = requests.filter(r => r.status === 'Menunggu Approval' || r.status === 'Diajukan').length;
  const processingRequests = requests.filter(r => r.status === 'Sedang Disiapkan' || r.status === 'Disetujui' || r.status === 'Siap Diambil').length;
  const completedRequests = requests.filter(r => r.status === 'Selesai').length;

  // Usage stats
  const atkMonthlyCount = requests
    .filter(r => r.serviceType === 'atk')
    .reduce((acc, r) => acc + r.items.reduce((sum, it) => sum + (it.quantityApproved ?? it.quantityRequested), 0), 0);

  const photocopyMonthlySheets = requests
    .filter(r => r.serviceType === 'fotocopy' && r.photocopyDetail)
    .reduce((acc, r) => acc + (r.photocopyDetail?.totalSheets || 0), 0);

  const laminatingSheets = requests
    .filter(r => r.serviceType === 'laminating' && r.laminatingDetail)
    .reduce((acc, r) => acc + (r.laminatingDetail?.quantity || 0), 0);

  const uniformOutCount = requests
    .filter(r => r.serviceType === 'seragam')
    .reduce((acc, r) => acc + r.items.reduce((sum, it) => sum + (it.quantityApproved ?? it.quantityRequested), 0), 0);

  const waterGallonsCount = requests
    .filter(r => r.serviceType === 'air_galon' && r.waterDetail)
    .reduce((acc, r) => acc + (r.waterDetail?.gallonCount || 0), 0);

  // Unit usage aggregation
  const unitUsageMap: Record<string, number> = {};
  requests.forEach(r => {
    unitUsageMap[r.unit] = (unitUsageMap[r.unit] || 0) + 1;
  });

  const sortedUnits = Object.entries(unitUsageMap).sort((a, b) => b[1] - a[1]);

  // Service breakdown
  const serviceCounts = {
    fotocopy: requests.filter(r => r.serviceType === 'fotocopy').length,
    laminating: requests.filter(r => r.serviceType === 'laminating').length,
    air_galon: requests.filter(r => r.serviceType === 'air_galon').length
  };

  const activeServicesTotal = (serviceCounts.fotocopy + serviceCounts.laminating + serviceCounts.air_galon) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Sekolah Lazuardi GCS
              </span>
              <span className="text-xs text-slate-400">• Resources Room Management</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {currentUser?.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Pusat pelayanan fotocopy &amp; printing, laminating presisi, dan penyediaan air galon terpadu Sekolah Lazuardi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenQuickRequest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Permintaan</span>
            </button>
            
            <button
              onClick={() => onNavigate('permintaan_all')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              Lihat Tiket
            </button>
          </div>
        </div>
      </div>

      {/* Primary 8 Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatsCard
          title="Permintaan Hari Ini"
          value={requestsToday}
          subtitle="Permintaan masuk hari ini"
          icon={ClipboardList}
          color="blue"
          onClick={() => onNavigate('permintaan_all')}
        />
        <StatsCard
          title="Permintaan Masuk"
          value={pendingRequests}
          subtitle="Antrean baru (Tanpa approval)"
          icon={Clock}
          color="amber"
          onClick={() => onNavigate('permintaan_pending')}
        />
        <StatsCard
          title="Sedang Diproses"
          value={processingRequests}
          subtitle="Dalam penyiapan RR"
          icon={TrendingUp}
          color="sky"
          onClick={() => onNavigate('permintaan_processing')}
        />
        <StatsCard
          title="Permintaan Selesai"
          value={completedRequests}
          subtitle="Telah diserahterimakan"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => onNavigate('permintaan_history')}
        />

        <StatsCard
          title="Foto Copy Dokumen"
          value={`${photocopyMonthlySheets.toLocaleString('id-ID')} Lembar`}
          subtitle="Dokumen soal & administrasi"
          icon={Printer}
          color="blue"
          onClick={() => onNavigate('layanan_fotocopy')}
        />
        <StatsCard
          title="Laminating Presisi"
          value={`${laminatingSheets.toLocaleString('id-ID')} Lembar`}
          subtitle="Sertifikat & media ajar"
          icon={Sparkles}
          color="emerald"
          onClick={() => onNavigate('layanan_laminating')}
        />
        <StatsCard
          title="Air Galon Disalurkan"
          value={`${waterGallonsCount} Galon`}
          subtitle={`Stok terisi: ${waterInventory.filledGallons} galon`}
          icon={Droplet}
          color="sky"
          onClick={() => onNavigate('layanan_air')}
        />
        <StatsCard
          title="Titik Dispenser Kampus"
          value={`${waterLocations.length} Lokasi`}
          subtitle="Gedung TK, SD, SMP, SMA"
          icon={MapPin}
          color="blue"
          onClick={() => onNavigate('layanan_air')}
        />
      </div>

      {/* Quick Launchers for Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('layanan_fotocopy')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Printer className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2.5">Layanan Foto Copy</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Penggandaan soal, modul &amp; berkas</p>
        </button>

        <button
          onClick={() => onNavigate('layanan_laminating')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 w-fit group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2.5">Layanan Laminating</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Sertifikat, flashcard &amp; ID card</p>
        </button>

        <button
          onClick={() => onNavigate('layanan_air')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600 w-fit group-hover:bg-cyan-600 group-hover:text-white transition-colors">
            <Droplet className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2.5">Penyediaan Air Galon</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Refill dispenser ruangan &amp; kelas</p>
        </button>

        <button
          onClick={() => onNavigate('permintaan_all')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-2.5">Daftar Tiket Permintaan</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Pantau status &amp; tanda terima</p>
        </button>
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Service Distribution & Activity Graph */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Penggunaan Layanan Resources Room</h3>
              <p className="text-xs text-slate-500">Volume aktivitas per kategori layanan utama</p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start">
              {(['harian', 'mingguan', 'bulanan', 'tahunan'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                    chartPeriod === period ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Progress Breakdown */}
          <div className="space-y-3.5 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                  Foto Copy Dokumen
                </span>
                <span className="font-bold text-slate-800">{serviceCounts.fotocopy} Permintaan ({Math.round((serviceCounts.fotocopy / activeServicesTotal) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(serviceCounts.fotocopy / activeServicesTotal) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-600" />
                  Pelayanan Laminating Presisi
                </span>
                <span className="font-bold text-slate-800">{serviceCounts.laminating} Permintaan ({Math.round((serviceCounts.laminating / activeServicesTotal) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${(serviceCounts.laminating / activeServicesTotal) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                  Penyediaan Air Minum Galon
                </span>
                <span className="font-bold text-slate-800">{serviceCounts.air_galon} Permintaan ({Math.round((serviceCounts.air_galon / activeServicesTotal) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(serviceCounts.air_galon / activeServicesTotal) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Quick Simulation Stats Footer */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Rata-rata Waktu</span>
              <strong className="text-slate-800 text-sm">~35 Menit</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Tingkat Kepuasan</span>
              <strong className="text-emerald-700 text-sm">99.4%</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Ketersediaan Stok</span>
              <strong className="text-blue-700 text-sm">96.8%</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Titik Galon Aktif</span>
              <strong className="text-slate-800 text-sm">{waterLocations.length} Titik</strong>
            </div>
          </div>
        </div>

        {/* Right: Usage by Unit / Department */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Penggunaan per Unit</h3>
                <p className="text-xs text-slate-500">Unit pemohon tertinggi</p>
              </div>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>

            <div className="mt-3 space-y-2.5">
              {sortedUnits.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi per unit</p>
              ) : (
                sortedUnits.slice(0, 6).map(([unitName, count], idx) => {
                  const percent = Math.round((count / (requests.length || 1)) * 100);
                  return (
                    <div key={unitName} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center justify-center text-[10px] border border-blue-100">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{unitName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{count} permohonan</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] border border-blue-100">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('laporan_all')}
            className="mt-4 pt-3 border-t border-slate-100 w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Lihat Laporan Lengkap Unit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Recent Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Permintaan Layanan Terbaru</h3>
            <p className="text-xs text-slate-500">Daftar permohonan yang baru masuk dan sedang diproses</p>
          </div>
          <button
            onClick={() => onNavigate('permintaan_all')}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            Semua Permintaan ({requests.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">No. Tiket</th>
                <th className="p-3.5">Layanan</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5">Keperluan / Keterangan</th>
                <th className="p-3.5">Urgensi</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.slice(0, 5).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-blue-700">{req.requestNumber}</td>
                  <td className="p-3.5 capitalize font-semibold text-slate-800">
                    {req.serviceType.replace('_', ' ')}
                  </td>
                  <td className="p-3.5 font-medium">{req.userName}</td>
                  <td className="p-3.5 text-slate-500">{req.unit}</td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate">{req.purpose}</td>
                  <td className="p-3.5">
                    <UrgencyBadge urgency={req.urgency} />
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onOpenReceipt(req)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      Bukti Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
