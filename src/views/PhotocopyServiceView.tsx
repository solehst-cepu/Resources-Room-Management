import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceRequest, PhotocopyDetail } from '../types';
import { 
  Printer, 
  Plus, 
  UploadCloud, 
  FileText, 
  Clock, 
  Check, 
  X, 
  Calendar,
  Layers,
  Sparkles,
  Search,
  Camera,
  Image as ImageIcon,
  User as UserIcon,
  Building2,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  Send,
  ShieldCheck,
  Trash2,
  Compass
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { UserSearchSelect } from '../components/common/UserSearchSelect';
import { TrackOrderModal } from '../components/common/TrackOrderModal';
import { EmailReportModal } from '../components/common/EmailReportModal';

interface PhotocopyServiceViewProps {
  onOpenReceipt: (req: ServiceRequest) => void;
}

export const PhotocopyServiceView: React.FC<PhotocopyServiceViewProps> = ({ onOpenReceipt }) => {
  const { currentUser, users, units, requests, createRequest, updateRequestStatus, deleteRequest } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete transaction confirmation state
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Live Order Tracking State
  const [trackingRequest, setTrackingRequest] = useState<ServiceRequest | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isOrderPickerOpen, setIsOrderPickerOpen] = useState(false);

  // Email Report Modal State
  const [emailModalRequest, setEmailModalRequest] = useState<ServiceRequest | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const canManageOrDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr';

  const handleOpenTracking = (req: ServiceRequest) => {
    setTrackingRequest(req);
    setIsTrackingModalOpen(true);
  };

  const handleQuickTrackMyOrder = () => {
    const myActive = photocopyRequests.filter(
      r => (r.userId === currentUser?.id || r.userEmail === currentUser?.email) && r.status !== 'Selesai' && r.status !== 'Ditolak'
    );
    if (myActive.length === 1) {
      handleOpenTracking(myActive[0]);
    } else {
      setIsOrderPickerOpen(true);
    }
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
  const [documentType, setDocumentType] = useState<string>('Soal Ujian / Penilaian');
  const [paperSize, setPaperSize] = useState<'A4' | 'Folio (F4)' | 'A3'>('A4');
  const [pageCount, setPageCount] = useState<number>(5);
  const [copyCount, setCopyCount] = useState<number>(25);
  const [binding, setBinding] = useState<string>('Staples Sudut Kiri Atas');
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
    setDocumentType('Soal Ujian / Penilaian');
    setPaperSize('A4');
    setPageCount(4);
    setCopyCount(30);
    setBinding('Staples Sudut Kiri Atas');
    setDeadlineDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setNotes('');
    setPhotoPreview(null);
    setFileName('');
    setFileSize('');
    setIsModalOpen(true);
  };

  // Action Modal
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

  const photocopyRequests = requests.filter(r => r.serviceType === 'fotocopy');

  // Filtered requests
  const filteredRequests = photocopyRequests.filter(req => {
    const matchSearch = 
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.photocopyDetail?.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchUnit = unitFilter === 'all' || req.unit === unitFilter;
    return matchSearch && matchStatus && matchUnit;
  });

  // Calculate total sheets dynamically
  const calculatedTotalSheets = Math.max(1, pageCount) * Math.max(1, copyCount);

  // File upload / Photo capture
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

    const photocopyDetail: PhotocopyDetail = {
      serviceType: 'Foto Copy',
      documentType,
      paperSize,
      pageCount: Math.max(1, pageCount),
      copyCount: Math.max(1, copyCount),
      totalSheets: calculatedTotalSheets,
      binding,
      deadlineDate,
      photoUrl: photoPreview || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      notes: notes.trim() || undefined,
      colorType: 'Hitam Putih'
    };

    createRequest({
      serviceType: 'fotocopy',
      userId: user?.id || 'usr-guest',
      userName: user?.name || 'Karyawan Lazuardi',
      userEmail: user?.email || 'staff@lazuardi.sch.id',
      unit: selectedUnit || user?.unit || 'SMP',
      department: user?.department || 'Akademik',
      urgency,
      purpose: `${documentType} - ${calculatedTotalSheets} Lembar ${paperSize}`,
      notes: notes.trim() || undefined,
      items: [],
      photocopyDetail
    });

    setIsModalOpen(false);
  };

  // Stats calculation
  const totalSheetsCompleted = photocopyRequests
    .filter(r => r.status === 'Selesai')
    .reduce((acc, r) => acc + (r.photocopyDetail?.totalSheets || 0), 0);

  const activeQueueCount = photocopyRequests.filter(
    r => r.status === 'Sedang Disiapkan' || r.status === 'Disetujui' || r.status === 'Menunggu Approval' || r.status === 'Diajukan'
  ).length;

  const totalCopiesInProgress = photocopyRequests
    .filter(r => r.status === 'Sedang Disiapkan')
    .reduce((acc, r) => acc + (r.photocopyDetail?.totalSheets || 0), 0);

  const myActivePhotocopyCount = photocopyRequests.filter(
    r => (r.userId === currentUser?.id || r.userEmail === currentUser?.email) && r.status !== 'Selesai' && r.status !== 'Ditolak'
  ).length;

  // Common quick choices for document types
  const quickDocTypes = [
    'Soal Ujian / Penilaian',
    'Modul / Handout Pembelajaran',
    'Silabus & RPP Guru',
    'Lembar Kerja Siswa (LKS)',
    'Dokumen Rapat & Notulensi',
    'Formulir Administrasi',
    'Buku Kegiatan Siswa'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">Layanan Foto Copy Dokumen</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                Khusus Foto Copy
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Penggandaan soal ujian, modul pembelajaran, silabus &amp; berkas administrasi Sekolah Lazuardi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleQuickTrackMyOrder}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Lacak tahapan proses order fotokopi"
          >
            <Compass className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            <span>Lacak Order Saya</span>
            {myActivePhotocopyCount > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">
                {myActivePhotocopyCount}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Form Permintaan Foto Copy</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Antrean Foto Copy Aktif</p>
            <h4 className="text-xl font-extrabold text-blue-900 mt-1">{activeQueueCount} Order</h4>
            <span className="text-[11px] text-slate-500">{totalCopiesInProgress} lembar dalam pengerjaan</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Lembar Selesai Dicopy</p>
            <h4 className="text-xl font-extrabold text-emerald-800 mt-1">{totalSheetsCompleted.toLocaleString('id-ID')} Lembar</h4>
            <span className="text-[11px] text-emerald-600 font-semibold">Terselesaikan tepat waktu</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Mesin Foto Copy RR</p>
            <h4 className="text-sm font-extrabold text-slate-900 mt-1">Canon IR-ADV &amp; Fuji Xerox</h4>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Siap Produksi (Toner &amp; Kertas Siap)
            </span>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <Printer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari No. Tiket, Pemohon, Jenis Dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">Semua Unit</option>
            {units.map(u => (
              <option key={u.id} value={u.code}>{u.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="Menunggu Approval">Menunggu Approval</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Sedang Disiapkan">Sedang Dicopy</option>
            <option value="Siap Diambil">Siap Diambil</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Antrean Permintaan Foto Copy
          </h3>
          <span className="text-xs text-slate-500">{filteredRequests.length} antrean ditemukan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">No. Tiket</th>
                <th className="p-3.5">Tanggal / Jam</th>
                <th className="p-3.5">Nama Pemohon &amp; Unit</th>
                <th className="p-3.5">Keterangan / Jenis Dokumen</th>
                <th className="p-3.5 text-center">Ukuran</th>
                <th className="p-3.5 text-center">Asli × Rangkap</th>
                <th className="p-3.5 text-center">Total Lembar</th>
                <th className="p-3.5">Jilid &amp; Finishing</th>
                <th className="p-3.5">Deadline</th>
                <th className="p-3.5">Foto / Dokumen</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    Belum ada data permintaan foto copy
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const detail = req.photocopyDetail;
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-900 whitespace-nowrap">{req.requestNumber}</td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(req.requestDate).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 block">{req.userName}</strong>
                        <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
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
                      <td className="p-3.5 text-center font-mono text-slate-700 whitespace-nowrap">
                        {detail?.pageCount || 1} Hal × {detail?.copyCount || 1} Rangkap
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {detail?.totalSheets || (detail?.pageCount || 1) * (detail?.copyCount || 1)} Lembar
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-[11px] text-slate-700 font-medium">{detail?.binding || 'Tanpa Jilid'}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{detail?.deadlineDate ? new Date(detail.deadlineDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {detail?.photoUrl ? (
                          <a
                            href={detail.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Lihat Foto</span>
                          </a>
                        ) : detail?.fileName ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded max-w-xs truncate">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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
                          title="Lacak Progres Pengerjaan Order Foto Copy"
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
                        
                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'manager' || currentUser?.role === 'admin_rr') && req.status !== 'Selesai' && req.status !== 'Ditolak' && (
                          <button
                            onClick={() => handleOpenActionModal(req)}
                            className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
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

      {/* ========================================================================= */}
      {/* MODAL FORM PERMINTAAN FOTO COPY                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Permintaan Foto Copy"
        subtitle="Layanan Penggandaan Dokumen Khusus Foto Copy - Resources Room Lazuardi"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Tanggal Otomatis (Timestamp Sistem) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
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

          {/* Nama Pemohon (Dengan Pencarian User) & Nama Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <UserSearchSelect
                users={users}
                selectedUserId={selectedUserId}
                onSelectUser={(u) => handleUserChange(u.id)}
                label="Nama Pemohon (Karyawan / Guru)"
                themeColor="blue"
                helperText="Cari nama karyawan, unit, atau departemen di daftar user"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Nama Unit Sekolah *</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-blue-500 focus:outline-hidden text-xs"
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
              placeholder="Contoh: Soal Ujian Tengah Semester IPA Kelas 8"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-blue-500 focus:outline-hidden"
              required
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center">Pilihan Cepat:</span>
              {quickDocTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setDocumentType(type)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                    documentType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Ukuran Kertas & Kalkulasi Lembar (Halaman Asli, Rangkap, Total Lembar Otomatis) */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Spesifikasi Kertas &amp; Perhitungan Lembar Otomatis
              </h4>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Layanan Foto Copy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Ukuran Kertas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas *</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-slate-900 font-bold focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Folio (F4)">Folio / F4 (215 x 330 mm)</option>
                  <option value="A3">A3 (297 x 420 mm)</option>
                </select>
              </div>

              {/* Jumlah Halaman Asli */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Halaman Asli *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-slate-900 font-bold focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              {/* Jumlah Copy (Rangkap) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Copy (Rangkap) *</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={copyCount}
                  onChange={(e) => setCopyCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-slate-900 font-bold focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              {/* Total Lembar Digunakan (Otomatis) */}
              <div>
                <label className="block font-bold text-blue-900 mb-1">Total Lembar (Otomatis)</label>
                <div className="p-2 bg-blue-700 text-white rounded-lg font-black text-center text-sm shadow-xs">
                  {calculatedTotalSheets} Lembar
                </div>
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between text-[11px] text-blue-900">
              <span>
                Rumus: <strong>{pageCount} Halaman Asli</strong> × <strong>{copyCount} Rangkap</strong>
              </span>
              <span className="font-extrabold text-blue-800">
                = {calculatedTotalSheets} Lembar Kertas {paperSize}
              </span>
            </div>
          </div>

          {/* Jilid dan Finishing & Batas Waktu (Deadline) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jilid dan Finishing *</label>
              <select
                value={binding}
                onChange={(e) => setBinding(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Tanpa Jilid (Lembaran Lepas)">Tanpa Jilid (Lembaran Lepas)</option>
                <option value="Staples Sudut Kiri Atas">Staples Sudut Kiri Atas</option>
                <option value="Staples Tengah / Lipat Buku (Saddle Stitch)">Staples Tengah / Lipat Buku (Saddle Stitch)</option>
                <option value="Jilid Lakban Hitam + Cover Mika">Jilid Lakban Hitam + Cover Mika Bening</option>
                <option value="Jilid Spiral Kawat">Jilid Spiral Kawat</option>
                <option value="Jilid Spiral Plastik">Jilid Spiral Plastik</option>
                <option value="Jilid Soft Cover / Buffalo">Jilid Soft Cover / Buffalo</option>
                <option value="Potong Rapih / Trimming">Potong Rapih / Trimming</option>
                <option value="Lipat Rapih">Lipat Rapih</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Batas Waktu (Deadline) *</span>
              </label>
              <input
                type="datetime-local"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:border-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Foto Dokumen & Upload Dokumen Asli */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
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
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
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
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/70 relative transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xlsx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                  <Camera className="w-5 h-5" />
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-800">
                  Ambil Foto Dokumen atau Upload File Asli
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mendukung foto kamera (JPG, PNG) atau dokumen PDF (Maks. 25 MB)
                </p>
              </div>
            )}
          </div>

          {/* Keterangan Tambahan & Urgensi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan (Instruksi Khusus)</label>
              <textarea
                rows={2}
                placeholder="Contoh: Tolong dibuat bolak-balik untuk soal pilihan ganda, dan dipisahkan per kelas 8A dan 8B"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tingkat Urgensi</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Biasa">Biasa (Reguler)</option>
                <option value="Penting">Penting (Hari Ini)</option>
                <option value="Mendesak">Mendesak (Prioritas)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Prioritas antrean mesin cetak
              </span>
            </div>
          </div>

          {/* Box Tembusan & Pemberitahuan Otomatis ke Kepala Unit & Admin Unit */}
          <div className="bg-indigo-50/90 p-3.5 rounded-xl border border-indigo-200 text-indigo-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs text-indigo-900">
                <BellRing className="w-4 h-4 text-indigo-600 animate-pulse" />
                Pemberitahuan &amp; Tembusan Otomatis Unit
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-200/80 text-indigo-800 rounded-full border border-indigo-300 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Auto-Dispatch Aktif
              </span>
            </div>

            <div className="text-[11px] text-indigo-900 space-y-1.5 bg-white/90 p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Kepala Unit / Kepala Sekolah:
                </span>
                <span className="font-bold text-slate-900">
                  {activeUnitInfo?.headName || 'Pimpinan Unit'} ({activeUnitInfo?.email || `${selectedUnit.toLowerCase()}@lazuardi.sch.id`})
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-indigo-50 pt-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Admin Unit &amp; Tim Resources Room:
                </span>
                <span className="font-semibold text-slate-800">
                  Siti Rahmawati (Admin RR) &amp; Koordinator Tata Usaha
                </span>
              </div>
            </div>

            <p className="text-[10px] text-indigo-700 leading-relaxed">
              ✓ <strong>Tanpa Perlu Approval:</strong> Permintaan foto copy langsung masuk antrean operasional Resources Room untuk segera dikerjakan. Pemberitahuan email otomatis dikirimkan ke Kepala Unit ({activeUnitInfo?.name || selectedUnit}) dan Admin Unit sebagai laporan dan transparansi penggunaan.
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Kirim Permintaan Foto Copy</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: Status Pengerjaan Foto Copy (Admin RR)                             */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Proses Pengerjaan Foto Copy: ${selectedRequest.requestNumber}`}
          subtitle={`Pemohon: ${selectedRequest.userName} • Unit: ${selectedRequest.unit} (Tanpa Perlu Approval)`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Dokumen:</span>
                <span className="font-bold text-slate-900">{selectedRequest.photocopyDetail?.documentType || selectedRequest.purpose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Spesifikasi:</span>
                <span className="font-bold text-blue-950">
                  {selectedRequest.photocopyDetail?.pageCount} Hal Asli × {selectedRequest.photocopyDetail?.copyCount} Rangkap = {selectedRequest.photocopyDetail?.totalSheets} Lembar ({selectedRequest.photocopyDetail?.paperSize})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Finishing:</span>
                <span>{selectedRequest.photocopyDetail?.binding || 'Tanpa Jilid'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Deadline:</span>
                <span className="font-bold text-rose-700">{new Date(selectedRequest.photocopyDetail?.deadlineDate || '').toLocaleString('id-ID')}</span>
              </div>
              {selectedRequest.photocopyDetail?.notes && (
                <div className="pt-1 text-[11px] text-slate-600 border-t border-blue-200">
                  <strong>Catatan Pemohon:</strong> "{selectedRequest.photocopyDetail.notes}"
                </div>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <p className="font-bold text-slate-800">Perbarui Alur Status Pengerjaan (Operator RR):</p>

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
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  *Nama ini akan dicatat dalam histori serah terima saat status diubah ke Selesai.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Setujui */}
                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Disetujui', { adminNotes: 'Permintaan disetujui operator RR dan masuk antrean cetak' });
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

                {/* 2. Sedang Disiapkan / Cetak */}
                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Sedang Disiapkan', { adminNotes: 'Sedang digandakan pada mesin fotocopy RR' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Sedang Disiapkan' ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>2. Sedang Dicopy</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Proses cetak di mesin</span>
                </button>

                {/* 3. Siap Diambil */}
                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Siap Diambil', { adminNotes: 'Selesai difotocopy & dirapikan. Berkas siap diambil di loket RR.' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Siap Diambil' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-500" />
                    <span>3. Siap Diambil</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Berkas siap di loket</span>
                </button>

                {/* 4. Selesai */}
                <button
                  type="button"
                  onClick={() => {
                    const recipient = actionPickedUpBy.trim() || selectedRequest.userName || 'Pemohon';
                    updateRequestStatus(selectedRequest.id, 'Selesai', { pickedUpBy: recipient });
                    setIsActionModalOpen(false);
                    setEmailModalRequest({
                      ...selectedRequest,
                      status: 'Selesai',
                      pickedUpBy: recipient,
                      completedDate: new Date().toISOString()
                    });
                    setIsEmailModalOpen(true);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Selesai' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Selesai & Kirim Laporan</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Diserahkan & siapkan email</span>
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
                        placeholder="Contoh: Format berkas tidak sesuai / stok kertas habis..."
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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {canManageOrDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedRequest;
                    setIsActionModalOpen(false);
                    handleOpenDeleteConfirm(target);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  title="Hapus transaksi fotokopi ini"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Transaksi</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL (ADMIN & SUPER ADMIN) */}
      {requestToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
          }}
          title="Konfirmasi Hapus Transaksi Fotokopi"
          subtitle="Tindakan ini akan menghapus data transaksi secara permanen dari sistem"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Warning Alert Banner */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
              <div className="p-2 bg-rose-100 rounded-lg shrink-0 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <strong className="block text-sm font-bold text-rose-950">
                  Hapus transaksi {requestToDelete.requestNumber}?
                </strong>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Data permohonan fotokopi ini akan dihapus dari histori, antrean cetak, rekap laporan, dan database.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Transaksi</span>
                  <strong className="text-sm font-mono text-slate-900">{requestToDelete.requestNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <StatusBadge status={requestToDelete.status} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Pemohon:</span>
                  <strong className="text-slate-900">{requestToDelete.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit:</span>
                  <span className="font-semibold text-slate-800">{requestToDelete.unit}</span>
                </div>
                {requestToDelete.photocopyDetail && (
                  <div className="col-span-2 bg-white p-2 rounded-lg border border-slate-200 text-slate-700 space-y-0.5">
                    <div>Jenis Dokumen: <strong>{requestToDelete.photocopyDetail.documentType}</strong></div>
                    <div>Volume: <strong>{requestToDelete.photocopyDetail.pageCount} Hal × {requestToDelete.photocopyDetail.copyCount} Eks = {requestToDelete.photocopyDetail.totalSheets} Lembar ({requestToDelete.photocopyDetail.paperSize})</strong></div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
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

      {/* QUICK ORDER PICKER MODAL (When multiple orders exist) */}
      {isOrderPickerOpen && (
        <Modal
          isOpen={isOrderPickerOpen}
          onClose={() => setIsOrderPickerOpen(false)}
          title="Pilih Order Foto Copy yang Ingin Dilacak"
          subtitle="Pilih dari daftar permohonan aktif atau seluruh riwayat permohonan fotokopi Anda"
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto p-1">
            {photocopyRequests
              .filter(r => (currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') || (r.userId === currentUser?.id || r.userEmail === currentUser?.email))
              .slice(0, 10)
              .map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    setIsOrderPickerOpen(false);
                    handleOpenTracking(req);
                  }}
                  className="p-3 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-xs text-slate-900 group-hover:text-indigo-900">{req.requestNumber}</strong>
                      <StatusBadge status={req.status} size="sm" />
                      <UrgencyBadge urgency={req.urgency} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {req.photocopyDetail?.documentType || req.purpose}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{req.userName} ({req.unit})</span>
                      <span>•</span>
                      <span>{req.photocopyDetail?.totalSheets || 1} Lembar ({req.photocopyDetail?.paperSize || 'A4'})</span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Lacak</span>
                  </div>
                </div>
              ))}

            {photocopyRequests.filter(r => (currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') || (r.userId === currentUser?.id || r.userEmail === currentUser?.email)).length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                <Printer className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum ada order fotokopi yang diajukan.</p>
                <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol "Form Permintaan Foto Copy" untuk membuat order baru.</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Email Report Modal */}
      {emailModalRequest && (
        <EmailReportModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setEmailModalRequest(null);
          }}
          request={emailModalRequest}
        />
      )}

    </div>
  );
};
