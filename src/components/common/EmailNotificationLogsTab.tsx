import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterUnit, EmailNotificationLog, ServiceRequest } from '../../types';
import { 
  getEmailNotificationLogs, 
  clearEmailNotificationLogs, 
  getGmailComposeUrl, 
  getMailtoUrl,
  formatServiceTypeLabel,
  generateOrderCompletionEmail,
  saveEmailNotificationLog,
  resolveUnitHeadInfo
} from '../../services/emailService';
import { 
  Mail, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Send, 
  Search, 
  Building2, 
  User, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Modal } from './Modal';
import { EmailReportModal } from './EmailReportModal';

export const EmailNotificationLogsTab: React.FC = () => {
  const { units, users, requests, currentUser, showToast, sendOrderCompletionEmailReport } = useApp();
  
  const [logs, setLogs] = useState<EmailNotificationLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailNotificationLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Test Email Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testUnit, setTestUnit] = useState<string>(units[0]?.code || 'SMP');
  const [testEmailModalRequest, setTestEmailModalRequest] = useState<ServiceRequest | null>(null);

  const refreshLogs = () => {
    setLogs(getEmailNotificationLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleClearLogs = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh riwayat log notifikasi email?')) {
      clearEmailNotificationLogs();
      refreshLogs();
      showToast('info', 'Log Dikosongkan', 'Riwayat pengiriman email telah dibersihkan.');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('success', 'Disalin ke Clipboard', 'Teks laporan berhasil disalin.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTestEmail = (unitCode: string) => {
    const unitObj = units.find(u => u.code === unitCode);
    // Find an existing completed or active request for this unit, or create a mock one for testing
    const existingReq = requests.find(r => r.unit === unitCode) || requests[0];
    
    if (existingReq) {
      setTestEmailModalRequest(existingReq);
    } else {
      // Mock test request
      const mockReq: ServiceRequest = {
        id: `TEST-${Date.now()}`,
        requestNumber: `TEST/RR/${new Date().getFullYear()}/001`,
        userId: currentUser?.id || 'usr-test',
        userName: currentUser?.name || 'Staf Admin Penguji',
        userEmail: currentUser?.email || 'admin@lazuardi.sch.id',
        unit: unitCode,
        department: 'Guru',
        serviceType: 'fotocopy',
        urgency: 'Biasa',
        status: 'Selesai',
        purpose: 'Pencetakan Modul Pembelajaran Semester Genap',
        items: [],
        requestDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        notes: 'Uji coba pengiriman email laporan order ke Kepala Unit.',
        photocopyDetail: {
          documentType: 'Modul Pembelajaran Semester Genap',
          pageCount: 20,
          copyCount: 30,
          totalSheets: 600,
          colorType: 'Hitam Putih',
          paperSize: 'A4',
          binding: 'Staples Sudut',
          deadlineDate: new Date().toISOString(),
          notes: 'Untuk persiapan ujian semester'
        }
      };
      setTestEmailModalRequest(mockReq);
    }
    setIsTestModalOpen(true);
  };

  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (l.requestNumber && l.requestNumber.toLowerCase().includes(q)) ||
      (l.recipientEmail && l.recipientEmail.toLowerCase().includes(q)) ||
      (l.recipientName && l.recipientName.toLowerCase().includes(q)) ||
      (l.unit && l.unit.toLowerCase().includes(q)) ||
      (l.subject && l.subject.toLowerCase().includes(q))
    );
  });

  const unitsWithEmail = units.filter(u => !!u.email).length;

  return (
    <div className="space-y-6">
      
      {/* Banner Ringkasan Sistem Email */}
      <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Laporan Email Resmi Kepala Unit (Order Completion Notifications)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Sistem Aktif
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                Setiap kali order layanan (<strong>Foto Copy, Laminating, ATK, Air Galon, Seragam</strong>) dinyatakan 
                <strong className="text-emerald-700"> &quot;Selesai&quot;</strong>, sistem secara otomatis mengompilasi rincian 
                pekerjaan dan menyiapkan laporan resmi untuk dikirimkan langsung ke email <strong>Kepala Unit</strong> terkait sebagai bentuk transparansi dan pertanggungjawaban.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenTestEmail(units[0]?.code || 'SMP')}
              className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Uji Coba Kirim Email</span>
            </button>
            <button
              type="button"
              onClick={refreshLogs}
              className="p-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Perbarui data log"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Log Pengiriman
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-extrabold text-slate-900">{logs.length}</strong>
              <span className="text-xs text-slate-500">laporan tercatat</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Unit Sekolah Terhubung
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-extrabold text-emerald-800">{unitsWithEmail}</strong>
              <span className="text-xs text-emerald-600">dari {units.length} unit memiliki email resmi</span>
            </div>
          </div>

          <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200/80">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
              Kanal Pengiriman
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-sm font-bold text-sky-900">Gmail Web &amp; Mailto Client</strong>
            </div>
            <p className="text-[10px] text-sky-700 mt-0.5">Mendukung browser web serta aplikasi desktop/HP</p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolom (Kiri: Direktori Email Kepala Unit, Kanan: Panduan / Format) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Direktori Email Kepala Unit */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Direktori Email Resmi Kepala Unit Sekolah
                </h4>
                <p className="text-[11px] text-slate-500">
                  Alamat email tujuan laporan hasil order saat status diselesaikan
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              {units.length} Unit Kerja
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5">Nama Pimpinan / Kepala Unit</th>
                  <th className="p-2.5">Email Resmi Tujuan Laporan</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-right">Uji Coba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((u) => {
                  const headInfo = resolveUnitHeadInfo(u.code, units, users);
                  const effectiveEmail = headInfo.primaryEmail;
                  const isUserAccount = Boolean(headInfo.matchedManagerUser);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">
                            {u.code}
                          </span>
                          <span className="font-semibold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-700 font-medium">
                        <div>{headInfo.headName}</div>
                        {isUserAccount && (
                          <span className="text-[10px] text-teal-700 font-semibold block">
                            Akun: {headInfo.matchedManagerUser?.name} ({headInfo.matchedManagerUser?.role})
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="font-mono text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {effectiveEmail}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {u.email ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="Email resmi Kepala Unit di Master Database">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Database Unit
                          </span>
                        ) : isUserAccount ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200" title="Terhubung ke akun pimpinan terdaftar">
                            <Check className="w-3 h-3 text-teal-600" />
                            Akun Pimpinan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="Menggunakan domain @lazuardi.sch.id">
                            Standar
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenTestEmail(u.code)}
                          className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 font-bold rounded-md text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Simulasikan pembuatan email laporan untuk unit ini"
                        >
                          <Send className="w-3 h-3 text-teal-600" />
                          <span>Test</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            *Untuk mengubah nama kepala unit atau alamat email resmi di atas, Anda dapat mengaturnya melalui tab <strong>&quot;Unit &amp; Departemen&quot;</strong>.
          </p>
        </div>

        {/* Kolom Kanan: Mekanisme & Format Pengiriman */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mekanisme Laporan Otomatis
              </h4>
            </div>

            <div className="space-y-3 mt-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  <strong>Perubahan Status:</strong> Ketika operator Resources Room memilih status <span className="font-semibold text-emerald-700">4. Selesai</span> pada tiket layanan (Foto Copy, Laminating, ATK, Air Galon, atau Seragam).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  <strong>Kompilasi Laporan:</strong> Sistem otomatis menyusun email resmi lengkap dengan rincian dokumen/barang, total biaya, nama pemohon, serta nama penerima berkas.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  <strong>Pengiriman &amp; Log:</strong> Dialog review email langsung muncul di layar operator, memberikan pilihan kirim via <em>Buka di Gmail</em>, <em>Buka Mail Client</em>, atau <em>Salin Teks</em> sekaligus tercatat di buku log ini.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Dukungan Akun Google Workspace</span>
            </div>
            <p>
              Operator dapat langsung mengirim melalui akun resmi <strong>@lazuardi.sch.id</strong> menggunakan antarmuka Gmail dengan 1 klik tombol &quot;Buka di Gmail&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Pengiriman Email (Live Audit Log) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Riwayat Log Pengiriman Laporan Email</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Catatan riwayat pesan laporan penyelesaian order yang telah dibuat dan dikirim ke Kepala Unit
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor order, unit, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white"
              />
            </div>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Hapus riwayat log"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Log</span>
              </button>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Belum ada riwayat email laporan yang tersimpan.</p>
            <p className="text-[11px] text-slate-400">
              Log pengiriman akan otomatis terisi saat Anda mengubah status order menjadi &quot;Selesai&quot; atau saat melakukan pengujian email.
            </p>
            <button
              type="button"
              onClick={() => handleOpenTestEmail(units[0]?.code || 'SMP')}
              className="mt-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              Coba Buat Laporan Pengujian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Waktu Kirim</th>
                  <th className="p-3">No. Order</th>
                  <th className="p-3">Layanan</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Penerima (Kepala Unit)</th>
                  <th className="p-3">Subjek Laporan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.sentDate).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.requestNumber}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {formatServiceTypeLabel(log.serviceType)}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                        {log.unit}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.recipientName}</div>
                      <div className="text-[11px] font-mono text-teal-700">{log.recipientEmail}</div>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-600" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terkirim
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors cursor-pointer text-xs"
                      >
                        Lihat Pesan
                      </button>

                      {log.requestNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            const req = requests.find(r => r.requestNumber === log.requestNumber || r.id === log.requestId);
                            if (req) {
                              setTestEmailModalRequest(req);
                              setIsTestModalOpen(true);
                            } else {
                              showToast('info', 'Tiket Asli', 'Menampilkan preview dari data log.');
                              setSelectedLog(log);
                              setIsDetailModalOpen(true);
                            }
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-md transition-colors cursor-pointer text-xs inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim Ulang</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: DETAIL PESAN EMAIL LOG */}
      {selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLog(null);
          }}
          title="Rincian Email Laporan Kepala Unit"
          subtitle={`Log ID: ${selectedLog.id} • Dikirim: ${new Date(selectedLog.sentDate).toLocaleString('id-ID')}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            
            {/* Header Data */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kepada (To):</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedLog.recipientName} &lt;<span className="text-teal-700 font-mono">{selectedLog.recipientEmail}</span>&gt;
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unit Sekolah:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    Unit {selectedLog.unit} • Order #{selectedLog.requestNumber}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subjek Email:</span>
                <div className="font-bold text-slate-900 mt-0.5 bg-white p-2 rounded-lg border border-slate-200">
                  {selectedLog.subject}
                </div>
              </div>
            </div>

            {/* Isi Pesan (Body Text) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700">Isi Pesan Laporan:</span>
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedLog.body)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed shadow-2xs">
                {selectedLog.body}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedLog.recipientEmail)}&su=${encodeURIComponent(selectedLog.subject)}&body=${encodeURIComponent(selectedLog.body)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Gmail</span>
                </a>

                <a
                  href={`mailto:${encodeURIComponent(selectedLog.recipientEmail)}?subject=${encodeURIComponent(selectedLog.subject)}&body=${encodeURIComponent(selectedLog.body)}`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Buka Mail Client</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedLog(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* MODAL: EMAIL REPORT POPUP UNTUK TEST EMAIL */}
      <EmailReportModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestEmailModalRequest(null);
          refreshLogs();
        }}
        request={testEmailModalRequest}
        onMarkSent={(reqId, recipient) => {
          sendOrderCompletionEmailReport(reqId, recipient);
          refreshLogs();
        }}
      />

    </div>
  );
};
