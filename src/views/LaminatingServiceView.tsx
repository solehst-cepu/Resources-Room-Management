import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceRequest, LaminatingDetail } from '../types';
import { 
  Sparkles, 
  Plus, 
  Clock, 
  Check, 
  X, 
  FileCheck, 
  Calendar,
  Layers,
  UploadCloud, 
  FileText, 
  ShieldCheck,
  Zap,
  Info,
  Camera,
  Image as ImageIcon,
  User as UserIcon,
  Building2,
  CheckCircle2,
  BellRing,
  Send,
  Scissors,
  Compass,
  Trash2
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { UserSearchSelect } from '../components/common/UserSearchSelect';
import { TrackOrderModal } from '../components/common/TrackOrderModal';

interface LaminatingServiceViewProps {
  onOpenReceipt: (req: ServiceRequest) => void;
}

export const LaminatingServiceView: React.FC<LaminatingServiceViewProps> = ({ onOpenReceipt }) => {
  const { currentUser, users, units, requests, createRequest, updateRequestStatus, deleteRequest } = useApp();

  const [activeTab, setActiveTab] = useState<'permintaan' | 'antrean' | 'kalkulator' | 'panduan'>('permintaan');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Live Order Tracking State
  const [trackingRequest, setTrackingRequest] = useState<ServiceRequest | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isOrderPickerOpen, setIsOrderPickerOpen] = useState(false);

  // Delete transaction confirmation state
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canManageOrDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr';

  const handleOpenTracking = (req: ServiceRequest) => {
    setTrackingRequest(req);
    setIsTrackingModalOpen(true);
  };

  const handleOpenDeleteConfirm = (req: ServiceRequest) => {
    setRequestToDelete(req);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!requestToDelete) return;
    deleteRequest(requestToDelete.id);
    if (selectedRequest?.id === requestToDelete.id) {
      setIsActionModalOpen(false);
      setSelectedRequest(null);
    }
    setIsDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || (users[0]?.id ?? ''));
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUser?.unit || 'SMP');
  const [documentType, setDocumentType] = useState<string>('Piagam / Sertifikat Penghargaan');
  const [paperSize, setPaperSize] = useState<'A4' | 'Folio (F4)' | 'A3'>('A4');
  const [quantity, setQuantity] = useState<number>(10);
  const [deadlineDate, setDeadlineDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState<string>('');
  const [urgency, setUrgency] = useState<'Biasa' | 'Penting' | 'Mendesak'>('Biasa');

  // Photo & file state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  // Live Timestamp for form
  const [currentTimestamp, setCurrentTimestamp] = useState<string>(
    new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  const activeUnitInfo = units.find(
    u => u.code.toLowerCase() === selectedUnit.toLowerCase() || 
         u.name.toLowerCase().includes(selectedUnit.toLowerCase())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(
        new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When selected user changes, auto-fill unit
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const found = users.find(u => u.id === userId);
    if (found && found.unit) {
      setSelectedUnit(found.unit);
    }
  };

  // Pre-fill when modal opens
  const handleOpenModal = () => {
    if (currentUser) {
      setSelectedUserId(currentUser.id);
      setSelectedUnit(currentUser.unit || 'SMP');
    } else if (users.length > 0) {
      setSelectedUserId(users[0].id);
      setSelectedUnit(users[0].unit || 'SMP');
    }
    setDocumentType('Piagam / Sertifikat Penghargaan');
    setPaperSize('A4');
    setQuantity(10);
    setDeadlineDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setNotes('');
    setPhotoPreview(null);
    setFileName('');
    setFileSize('');
    setIsModalOpen(true);
  };

  // Action Modal State
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionPickedUpBy, setActionPickedUpBy] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  const handleOpenActionModal = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setActionPickedUpBy(req.pickedUpBy || req.userName || '');
    setIsRejecting(false);
    setRejectionReasonText('');
    setIsActionModalOpen(true);
  };

  // Calculator State
  const [calcSize, setCalcSize] = useState<'A4' | 'Folio (F4)' | 'A3'>('A4');
  const [calcQty, setCalcQty] = useState<number>(20);

  const laminatingRequests = requests.filter(r => r.serviceType === 'laminating');

  // Handle file selection / photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileName(file.name);
      setFileSize(`${sizeMB} MB`);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setPhotoPreview(uploadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview(null);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFileName('');
    setFileSize('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId) || currentUser;

    const laminatingDetail: LaminatingDetail = {
      serviceType: 'Laminating',
      documentType,
      paperSize,
      quantity: Math.max(1, quantity),
      deadlineDate,
      photoUrl: photoPreview || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      notes: notes.trim() || undefined,
      filmType: 'Glossy (Mengkilap)',
      thickness: '100 Micron (Standar Piagam)'
    };

    createRequest({
      serviceType: 'laminating',
      userId: user?.id || 'usr-guest',
      userName: user?.name || 'Karyawan Lazuardi',
      userEmail: user?.email || 'staff@lazuardi.sch.id',
      unit: selectedUnit || user?.unit || 'SMP',
      department: user?.department || 'Akademik',
      urgency,
      purpose: `${documentType} - ${quantity} Lembar ${paperSize}`,
      notes: notes.trim() || undefined,
      items: [],
      laminatingDetail
    });

    setIsModalOpen(false);
  };

  // Stats calculation
  const totalSheetsCompleted = laminatingRequests
    .filter(r => r.status === 'Selesai')
    .reduce((acc, r) => acc + (r.laminatingDetail?.quantity || 0), 0);

  const activeQueueCount = laminatingRequests.filter(r => 
    r.status === 'Sedang Disiapkan' || r.status === 'Disetujui' || r.status === 'Menunggu Approval' || r.status === 'Diajukan'
  ).length;

  const myLaminatingRequests = laminatingRequests.filter(
    r => (r.userId === currentUser?.id || r.userEmail === currentUser?.email)
  );
  const myActiveLaminatingCount = myLaminatingRequests.filter(
    r => r.status !== 'Selesai' && r.status !== 'Ditolak'
  ).length;

  const handleQuickTrackMyOrder = () => {
    const myActive = myLaminatingRequests.filter(
      r => r.status !== 'Selesai' && r.status !== 'Ditolak'
    );
    if (myActive.length === 1) {
      handleOpenTracking(myActive[0]);
    } else {
      setIsOrderPickerOpen(true);
    }
  };

  // Estimation logic
  const getEstimatedMinutes = (qty: number, size: string) => {
    const warmupTime = 4; // minutes
    let speedPerSheet = 0.5; // minutes per sheet
    if (size === 'A3') speedPerSheet = 0.9;
    return Math.ceil(warmupTime + (qty * speedPerSheet));
  };

  const quickDocTypes = [
    'Piagam / Sertifikat Penghargaan',
    'Media Pembelajaran & Flashcard Guru',
    'Bahan Modul Ajar Siswa',
    'Kartu Siswa & ID Card Panitia',
    'Dokumen Arsip Resmi Sekolah',
    'Foto Dokumentasi Kegiatan',
    'Poster & Rambu Edukasi'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">Layanan Laminating Dokumen</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                Khusus Laminating
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pelapisan piagam penghargaan, media pembelajaran guru, kartu siswa &amp; berkas resmi Sekolah Lazuardi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleQuickTrackMyOrder}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Lacak tahapan proses order laminating"
          >
            <Compass className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            <span>Lacak Order Saya</span>
            {myActiveLaminatingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">
                {myActiveLaminatingCount}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Form Permintaan Laminating</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Antrean Laminating</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{activeQueueCount} Berkas</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Dalam proses &amp; antrean mesin</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Dilaminasi</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-teal-700 mt-2">{totalSheetsCompleted} Lembar</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Presisi &amp; Bebas Gelembung</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Mesin Laminator RR</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">2 Unit Siap</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">● Suhu Roller Normal (Ready)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Ukuran Tersedia</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">A4, Folio &amp; A3</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pouch film premium tahan air</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('permintaan')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'permintaan'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Daftar Pengajuan ({laminatingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('antrean')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'antrean'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Papan Antrean Mesin ({laminatingRequests.filter(r => r.status !== 'Selesai' && r.status !== 'Ditolak').length})
        </button>

        <button
          onClick={() => setActiveTab('kalkulator')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'kalkulator'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Kalkulator &amp; Estimasi Waktu
        </button>

        <button
          onClick={() => setActiveTab('panduan')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'panduan'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Panduan Bahan Laminasi
        </button>
      </div>

      {/* TAB 1: DAFTAR PERMINTAAN */}
      {activeTab === 'permintaan' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Pengajuan Laminating</h3>
              <p className="text-xs text-slate-500">Pantau perkembangan proses laminasi sertifikat &amp; dokumen Anda</p>
            </div>
            <span className="text-xs text-slate-500">{laminatingRequests.length} permohonan tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">No. Tiket</th>
                  <th className="p-3.5">Tanggal / Jam</th>
                  <th className="p-3.5">Nama Pemohon &amp; Unit</th>
                  <th className="p-3.5">Keterangan / Jenis Dokumen</th>
                  <th className="p-3.5 text-center">Ukuran</th>
                  <th className="p-3.5 text-center">Jumlah</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5">Foto Dokumen</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laminatingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Belum ada permintaan laminating yang diajukan.
                    </td>
                  </tr>
                ) : (
                  laminatingRequests.map((req) => {
                    const detail = req.laminatingDetail;
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-900 whitespace-nowrap">
                          {req.requestNumber}
                        </td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(req.requestDate).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{req.userName}</strong>
                          <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
                            Unit: {req.unit}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900 block">{detail?.documentType || req.purpose}</span>
                          {detail?.notes && (
                            <span className="text-[11px] text-slate-500 italic block truncate max-w-xs">
                              "{detail.notes}"
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {detail?.paperSize || 'A4'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-teal-800 whitespace-nowrap">
                          <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {detail?.quantity || 1} Lembar
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{detail?.deadlineDate ? new Date(detail.deadlineDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {detail?.photoUrl ? (
                            <a
                              href={detail.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded border border-teal-200 hover:bg-teal-100 transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Lihat Foto</span>
                            </a>
                          ) : detail?.fileName ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded max-w-xs truncate">
                              <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">{detail.fileName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Hardcopy Fisik</span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenTracking(req)}
                            className="px-2.5 py-1 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Lacak Progres Pengerjaan Order Laminating"
                          >
                            <Compass className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Lacak</span>
                          </button>

                          <button
                            onClick={() => onOpenReceipt(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                          >
                            SPK / Slip
                          </button>
                          {(currentUser?.role === 'admin_rr' || currentUser?.role === 'super_admin' || currentUser?.role === 'manager') && req.status !== 'Selesai' && req.status !== 'Ditolak' && (
                            <button
                              onClick={() => handleOpenActionModal(req)}
                              className="px-2.5 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors cursor-pointer"
                            >
                              Proses Mesin
                            </button>
                          )}
                          {canManageOrDelete && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteConfirm(req)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAPAN ANTREAN MESIN */}
      {activeTab === 'antrean' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Kolom 1: Menunggu Persetujuan */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Menunggu Approval
              </h4>
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                {laminatingRequests.filter(r => r.status === 'Menunggu Approval' || r.status === 'Diajukan').length}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {laminatingRequests
                .filter(r => r.status === 'Menunggu Approval' || r.status === 'Diajukan')
                .map(req => (
                  <div key={req.id} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{req.requestNumber}</span>
                      <UrgencyBadge urgency={req.urgency} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{req.laminatingDetail?.documentType || req.purpose}</p>
                    <div className="text-[11px] text-slate-500">
                      Pemohon: <strong className="text-slate-700">{req.userName}</strong> ({req.unit})
                    </div>
                    <div className="text-[11px] text-teal-800 font-bold bg-teal-50 p-1.5 rounded">
                      {req.laminatingDetail?.quantity} Lembar • Ukuran: {req.laminatingDetail?.paperSize}
                    </div>
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenTracking(req)}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lacak</span>
                      </button>
                      {(currentUser?.role === 'admin_rr' || currentUser?.role === 'super_admin' || currentUser?.role === 'manager') && (
                        <button
                          onClick={() => handleOpenActionModal(req)}
                          className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Tinjau & Setujui
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {laminatingRequests.filter(r => r.status === 'Menunggu Approval' || r.status === 'Diajukan').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Tidak ada antrean baru</p>
              )}
            </div>
          </div>

          {/* Kolom 2: Sedang Diproses */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Sedang Dilaminasi Mesin
              </h4>
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                {laminatingRequests.filter(r => r.status === 'Sedang Disiapkan' || r.status === 'Disetujui').length}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {laminatingRequests
                .filter(r => r.status === 'Sedang Disiapkan' || r.status === 'Disetujui')
                .map(req => (
                  <div key={req.id} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{req.requestNumber}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                        {req.status === 'Disetujui' ? 'Siap Masuk Mesin' : 'Pemanasan & Roller'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{req.laminatingDetail?.documentType || req.purpose}</p>
                    <div className="text-[11px] text-slate-500">
                      Pemohon: <strong className="text-slate-700">{req.userName}</strong> ({req.unit})
                    </div>
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                      Volume: <strong>{req.laminatingDetail?.quantity} Lembar {req.laminatingDetail?.paperSize}</strong>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenTracking(req)}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lacak</span>
                      </button>
                      {(currentUser?.role === 'admin_rr' || currentUser?.role === 'super_admin' || currentUser?.role === 'manager') && (
                        <button
                          onClick={() => handleOpenActionModal(req)}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Perbarui Status
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {laminatingRequests.filter(r => r.status === 'Sedang Disiapkan' || r.status === 'Disetujui').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Tidak ada yang sedang diproses</p>
              )}
            </div>
          </div>

          {/* Kolom 3: Siap Diambil */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Siap Diambil di Loket RR
              </h4>
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                {laminatingRequests.filter(r => r.status === 'Siap Diambil').length}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {laminatingRequests
                .filter(r => r.status === 'Siap Diambil')
                .map(req => (
                  <div key={req.id} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{req.requestNumber}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Siap Diambil</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{req.laminatingDetail?.documentType || req.purpose}</p>
                    <div className="text-[11px] text-slate-500">
                      Pemohon: <strong className="text-slate-700">{req.userName}</strong> ({req.unit})
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTracking(req)}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lacak</span>
                      </button>
                      <button
                        onClick={() => onOpenReceipt(req)}
                        className="flex-1 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Slip SPK
                      </button>
                      {(currentUser?.role === 'admin_rr' || currentUser?.role === 'super_admin' || currentUser?.role === 'manager') && (
                        <button
                          onClick={() => handleOpenActionModal(req)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Serah Terima
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {laminatingRequests.filter(r => r.status === 'Siap Diambil').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Tidak ada berkas yang menunggu diambil</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: KALKULATOR & ESTIMASI WAKTU */}
      {activeTab === 'kalkulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Simulasi Laminating &amp; Perhitungan Bahan</h3>
              <p className="text-xs text-slate-500">Hitung estimasi lembar film pouch yang terpakai dan durasi pemanasan mesin</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ukuran Dokumen</label>
                <select
                  value={calcSize}
                  onChange={(e) => setCalcSize(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-900"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Folio (F4)">Folio / F4 (215 x 330 mm)</option>
                  <option value="A3">A3 (297 x 420 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Dokumen (Lembar)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 flex items-start gap-3 mt-4">
              <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-900 leading-relaxed">
                <strong>Catatan Operasional:</strong> Mesin laminasi panas membutuhkan waktu pemanasan roller 4-5 menit sebelum proses pertama. Dokumen yang dilaminasi menggunakan film pouch standar berkualitas tinggi dengan daya rekat rata bebas gelembung.
              </p>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Hasil Estimasi Pengerjaan</h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-600">Total Kebutuhan Pouch:</span>
                  <strong className="text-slate-900 font-bold">{calcQty} Pouch ({calcSize})</strong>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-600">Suhu Mesin Roller:</span>
                  <strong className="text-teal-700 font-bold">115°C - 125°C (Stabil)</strong>
                </div>

                <div className="p-3.5 bg-slate-900 text-white rounded-xl mt-4">
                  <div className="text-[11px] text-slate-300">Perkiraan Durasi Pengerjaan:</div>
                  <div className="text-2xl font-black mt-1 text-teal-400">
                    ± {getEstimatedMinutes(calcQty, calcSize)} Menit
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Termasuk waktu pemanasan mesin &amp; pendinginan</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPaperSize(calcSize);
                setQuantity(calcQty);
                setIsModalOpen(true);
              }}
              className="mt-4 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
            >
              Terapkan ke Form Permintaan
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: PANDUAN BAHAN */}
      {activeTab === 'panduan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Panduan Ukuran &amp; Ketebalan Laminasi</span>
            </div>
            
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200">
                <strong className="text-teal-900 block font-bold">Ukuran A4 (210 × 297 mm)</strong>
                <p className="text-[11px] text-teal-800 mt-0.5">Ukuran paling umum untuk piagam penghargaan, sertifikat kelulusan, dan lembar kerja materi guru.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold">Ukuran Folio / F4 (215 × 330 mm)</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Sangat pas untuk berkas ijazah nasional, lembar daftar nilai raport, dan arsip dokumen resmi sekolah.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold">Ukuran A3 (297 × 420 mm)</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Cocok untuk media pembelajaran visual ukuran besar, poster dinding kelas, peta edukasi, dan bagan struktur organisasi.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
              <Scissors className="w-4 h-4" />
              <span>Keunggulan &amp; Prosedur Laminating RR</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold">100% Anti-Air &amp; Tahan Debu</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">Melindungi dokumen penting dari tumpahan air, noda minyak, kotoran, dan pemudaran tinta akibat kelembapan.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block font-bold">Tembusan Email Otomatis</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">Setiap pengajuan laminating langsung dikirimkan pemberitahuan otomatis ke Kepala Unit dan Admin Unit terkait.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM PERMINTAAN LAMINATING                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Permintaan Laminating"
        subtitle="Layanan Pelapisan Dokumen Khusus Laminating - Resources Room Lazuardi"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Tanggal Otomatis (Timestamp Sistem) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-600 text-white rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Tanggal &amp; Waktu Pengajuan (Timestamp Otomatis)
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {currentTimestamp}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Live Timestamp
            </span>
          </div>

          {/* Nama Pemohon (Dengan Fitur Pencarian User) & Nama Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <UserSearchSelect
                users={users}
                selectedUserId={selectedUserId}
                onSelectUser={(u) => handleUserChange(u.id)}
                label="Nama Pemohon (Karyawan / Guru)"
                themeColor="teal"
                helperText="Cari nama karyawan, unit, atau departemen di daftar user"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Nama Unit Sekolah *</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-teal-500 focus:outline-hidden text-xs"
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Otomatis disesuaikan dengan unit kerja pemohon
              </span>
            </div>
          </div>

          {/* Keterangan Dokumen / Jenis Dokumen */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Keterangan Dokumen / Jenis Dokumen *
            </label>
            <input
              type="text"
              placeholder="Contoh: Piagam Juara 1 Lomba Sains Tingkat SMP"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-teal-500 focus:outline-hidden"
              required
            />
            {/* Quick choices */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center">Pilihan Cepat:</span>
              {quickDocTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setDocumentType(type)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                    documentType === type
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Ukuran Laminating & Jumlah yang di-laminating */}
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-teal-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Spesifikasi Ukuran &amp; Jumlah Lembar
              </h4>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Layanan Khusus Laminating
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ukuran Laminating */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Laminating *</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-teal-300 rounded-lg text-slate-900 font-bold focus:border-teal-600 focus:outline-hidden"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Folio (F4)">Folio / F4 (215 x 330 mm)</option>
                  <option value="A3">A3 (297 x 420 mm)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Pilihan ukuran plastik pouch resmi RR Lazuardi
                </span>
              </div>

              {/* Jumlah yang Laminating */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah yang di-Laminating (Lembar) *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-white border border-teal-300 rounded-lg text-slate-900 font-bold focus:border-teal-600 focus:outline-hidden text-lg text-center"
                  required
                />
                <span className="text-[10px] text-teal-800 font-semibold mt-0.5 block text-center">
                  Total Volume: {quantity} Lembar
                </span>
              </div>
            </div>
          </div>

          {/* Batas Waktu (Deadline) & Urgensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Batas Waktu (Deadline) *</span>
              </label>
              <input
                type="datetime-local"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tingkat Urgensi</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:border-teal-500 focus:outline-hidden"
              >
                <option value="Biasa">Biasa (Reguler)</option>
                <option value="Penting">Penting (Hari Ini)</option>
                <option value="Mendesak">Mendesak (Prioritas)</option>
              </select>
            </div>
          </div>

          {/* Foto Dokumen & Upload Dokumen Asli */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span>Foto Dokumen / Lampiran Dokumen Asli</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Opsional (bisa serahkan berkas fisik ke RR)</span>
            </label>

            {photoPreview ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Pratinjau Dokumen"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{fileName || 'Foto Dokumen Asli'}</p>
                  <p className="text-[11px] text-slate-500">{fileSize || 'Pratinjau Gambar'}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold">✓ Foto berhasil dilampirkan</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : fileName ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-teal-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate">{fileName}</p>
                    <p className="text-[10px] text-slate-500">{fileSize}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/70 relative transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xlsx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex items-center justify-center gap-2 text-teal-600 mb-1">
                  <Camera className="w-5 h-5" />
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-800">
                  Ambil Foto Dokumen atau Upload File Asli
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mendukung foto kamera (JPG, PNG) atau file PDF (Maks. 25 MB)
                </p>
              </div>
            )}
          </div>

          {/* Keterangan Tambahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan (Instruksi Khusus)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Kertas piagam fisik sudah ditaruh di loket RR. Mohon sudutnya dipotong tumpul/bulat rapi."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Box Tembusan & Pemberitahuan Otomatis ke Kepala Unit & Admin Unit via Email */}
          <div className="bg-teal-50/90 p-3.5 rounded-xl border border-teal-200 text-teal-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs text-teal-900">
                <BellRing className="w-4 h-4 text-teal-600 animate-pulse" />
                Pemberitahuan &amp; Tembusan Email Otomatis Unit
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-200/80 text-teal-800 rounded-full border border-teal-300 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Auto Email Dispatch
              </span>
            </div>

            <div className="text-[11px] text-teal-900 space-y-1.5 bg-white/90 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  Kepala Unit / Kepala Sekolah:
                </span>
                <span className="font-bold text-slate-900">
                  {activeUnitInfo?.headName || 'Pimpinan Unit'} ({activeUnitInfo?.email || `${selectedUnit.toLowerCase()}@lazuardi.sch.id`})
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-teal-50 pt-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  Admin Unit &amp; Tim Resources Room:
                </span>
                <span className="font-semibold text-slate-800">
                  Siti Rahmawati (Admin RR) &amp; Koordinator Tata Usaha ({selectedUnit})
                </span>
              </div>
            </div>

            <p className="text-[10px] text-teal-800 leading-relaxed">
              ✓ <strong>Tanpa Perlu Approval:</strong> Permintaan laminating langsung masuk antrean operasional Resources Room. Pemberitahuan email otomatis dikirimkan ke Kepala Unit ({activeUnitInfo?.name || selectedUnit}) dan Admin Unit untuk transparansi dan rekapan operasional unit.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Kirim Permintaan Laminating</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* ACTION MODAL UPDATE STATUS */}
      {selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false);
            setSelectedRequest(null);
          }}
          title="Kelola Antrean & Status Laminating"
          subtitle={`No. Permintaan: ${selectedRequest.requestNumber} (Tanpa Perlu Approval)`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-teal-50/70 rounded-lg text-xs space-y-1.5 border border-teal-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Pemohon:</span>
                <strong className="text-slate-900">{selectedRequest.userName} ({selectedRequest.unit})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dokumen:</span>
                <span className="font-semibold text-slate-800">{selectedRequest.laminatingDetail?.documentType || selectedRequest.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ukuran:</span>
                <span className="font-semibold text-slate-800">
                  {selectedRequest.laminatingDetail?.paperSize}
                </span>
              </div>
              <div className="flex justify-between border-t border-teal-200 pt-1">
                <span className="text-slate-500">Jumlah Lembar:</span>
                <strong className="text-teal-800 font-bold">{selectedRequest.laminatingDetail?.quantity} Lembar</strong>
              </div>
              {selectedRequest.laminatingDetail?.notes && (
                <div className="pt-1 text-[11px] text-slate-600 border-t border-teal-200">
                  <strong>Catatan:</strong> "{selectedRequest.laminatingDetail.notes}"
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Perbarui Alur Status Pengerjaan (Operator RR):</label>

              {/* Receiver name input for completion */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Penerima / Pengambil Berkas:
                </label>
                <input
                  type="text"
                  value={actionPickedUpBy}
                  onChange={(e) => setActionPickedUpBy(e.target.value)}
                  placeholder="Nama staf / guru pengambil..."
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  *Nama ini akan dicatat dalam histori serah terima saat status diubah ke Selesai.
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Disetujui', { adminNotes: 'Permintaan laminating disetujui operator RR dan masuk antrean' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Disetujui' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Check className="w-3.5 h-3.5 text-blue-500" />
                    <span>1. Setujui Order</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Disetujui operator RR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Sedang Disiapkan', { adminNotes: 'Sedang diproses di mesin pemanas laminator roller' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Sedang Disiapkan' ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>2. Proses di Mesin</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Laminasi roller panas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Siap Diambil', { adminNotes: 'Laminasi selesai dan siap diambil di loket Resources Room' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Siap Diambil' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <FileCheck className="w-3.5 h-3.5 text-cyan-500" />
                    <span>3. Siap Diambil</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Tersedia di loket RR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const recipient = actionPickedUpBy.trim() || selectedRequest.userName || 'Pemohon';
                    updateRequestStatus(selectedRequest.id, 'Selesai', { pickedUpBy: recipient });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Selesai' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Selesai</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Diserahkan ke pemohon</span>
                </button>
              </div>

              {/* Reject toggle and inline form */}
              {selectedRequest.status !== 'Selesai' && selectedRequest.status !== 'Ditolak' && (
                <div className="pt-1">
                  {!isRejecting ? (
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="w-full p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak / Batalkan Permintaan</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                      <label className="block text-[11px] font-bold text-rose-800">
                        Masukkan Alasan Penolakan / Pembatalan:
                      </label>
                      <input
                        type="text"
                        value={rejectionReasonText}
                        onChange={(e) => setRejectionReasonText(e.target.value)}
                        placeholder="Contoh: Dokumen tidak memungkinkan untuk dilaminasi..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-rose-300 rounded-md focus:outline-hidden font-medium"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateRequestStatus(selectedRequest.id, 'Ditolak', {
                              rejectionReason: rejectionReasonText.trim() || 'Dibatalkan oleh operator RR'
                            });
                            setIsActionModalOpen(false);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md cursor-pointer"
                        >
                          Konfirmasi Tolak
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* TRACK ORDER MODAL */}
      <TrackOrderModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingRequest(null);
        }}
        request={trackingRequest}
        onOpenReceipt={onOpenReceipt}
      />

      {/* QUICK ORDER PICKER MODAL */}
      {isOrderPickerOpen && (
        <Modal
          isOpen={isOrderPickerOpen}
          onClose={() => setIsOrderPickerOpen(false)}
          title="Pilih Order Laminating yang Ingin Dilacak"
          subtitle="Pilih dari daftar permohonan aktif atau seluruh riwayat permohonan laminating Anda"
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto p-1">
            {laminatingRequests
              .filter(r => (currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') || (r.userId === currentUser?.id || r.userEmail === currentUser?.email))
              .slice(0, 10)
              .map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    setIsOrderPickerOpen(false);
                    handleOpenTracking(req);
                  }}
                  className="p-3 bg-white hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-xs text-slate-900 group-hover:text-teal-900">{req.requestNumber}</strong>
                      <StatusBadge status={req.status} size="sm" />
                      <UrgencyBadge urgency={req.urgency} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {req.laminatingDetail?.documentType || req.purpose}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{req.userName} ({req.unit})</span>
                      <span>•</span>
                      <span>{req.laminatingDetail?.quantity || 1} Lembar ({req.laminatingDetail?.paperSize || 'A4'})</span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 bg-teal-600 group-hover:bg-teal-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Lacak</span>
                  </div>
                </div>
              ))}

            {laminatingRequests.filter(r => (currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') || (r.userId === currentUser?.id || r.userEmail === currentUser?.email)).length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum ada order laminating yang diajukan.</p>
                <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol "Form Permintaan Laminating" untuk membuat order baru.</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL FOR ADMIN */}
      {isDeleteModalOpen && requestToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
          }}
          title="Konfirmasi Hapus Transaksi Laminating"
          subtitle="Tindakan ini hanya dapat dilakukan oleh Super Admin dan Admin RR"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-sm">Apakah Anda yakin ingin menghapus data ini?</h4>
                <p className="text-rose-700 text-xs leading-relaxed">
                  Transaksi nomor <strong className="font-mono font-bold text-rose-950">{requestToDelete.requestNumber}</strong> akan dihapus secara permanen dari sistem Resources Room.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-xs">{requestToDelete.requestNumber}</span>
                <StatusBadge status={requestToDelete.status} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Pemohon:</span>
                  <strong className="text-slate-900">{requestToDelete.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit:</span>
                  <span className="font-semibold text-slate-800">{requestToDelete.unit}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
