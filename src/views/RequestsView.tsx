import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceRequest, RequestStatus, ServiceType } from '../types';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Check, 
  X, 
  Eye, 
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Shirt,
  PenTool,
  Droplet,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface RequestsViewProps {
  filterStatus?: string;
  onOpenReceipt: (req: ServiceRequest) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ 
  filterStatus = 'all', 
  onOpenReceipt 
}) => {
  const { 
    currentUser, 
    requests, 
    units, 
    updateRequestStatus, 
    deleteRequest 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(filterStatus);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');

  // Detail Modal
  const [activeDetailRequest, setActiveDetailRequest] = useState<ServiceRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Action Status Modal (for Operator RR)
  const [selectedActionRequest, setSelectedActionRequest] = useState<ServiceRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionPickedUpBy, setActionPickedUpBy] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Delete Confirmation Modal (for Admin & Super Admin)
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canManageOrDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr';

  const handleOpenActionModal = (req: ServiceRequest) => {
    setSelectedActionRequest(req);
    setActionPickedUpBy(req.pickedUpBy || req.userName || '');
    setIsRejecting(false);
    setRejectionReasonText('');
    setIsActionModalOpen(true);
  };

  const handleOpenDeleteConfirm = (req: ServiceRequest) => {
    setRequestToDelete(req);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!requestToDelete) return;
    deleteRequest(requestToDelete.id);
    if (activeDetailRequest?.id === requestToDelete.id) {
      setIsDetailModalOpen(false);
      setActiveDetailRequest(null);
    }
    if (selectedActionRequest?.id === requestToDelete.id) {
      setIsActionModalOpen(false);
      setSelectedActionRequest(null);
    }
    setIsDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  // Filtered list
  const filteredRequests = requests.filter(req => {
    const matchSearch = 
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchService = selectedService === 'all' || req.serviceType === selectedService;
    
    let matchStatus = true;
    if (selectedStatus === 'pending') {
      matchStatus = req.status === 'Menunggu Approval' || req.status === 'Diajukan';
    } else if (selectedStatus === 'processing') {
      matchStatus = req.status === 'Sedang Disiapkan' || req.status === 'Disetujui' || req.status === 'Siap Diambil';
    } else if (selectedStatus === 'history') {
      matchStatus = req.status === 'Selesai' || req.status === 'Ditolak';
    } else if (selectedStatus !== 'all') {
      matchStatus = req.status === selectedStatus;
    }

    const matchUnit = selectedUnit === 'all' || req.unit === selectedUnit;
    const matchUrgency = selectedUrgency === 'all' || req.urgency === selectedUrgency;

    return matchSearch && matchService && matchStatus && matchUnit && matchUrgency;
  });

  const exportToCSV = () => {
    const headers = ['No Tiket', 'Tanggal', 'Layanan', 'Pemohon', 'Unit', 'Keperluan', 'Urgensi', 'Status'];
    const rows = filteredRequests.map(r => [
      r.requestNumber,
      new Date(r.requestDate).toLocaleDateString('id-ID'),
      r.serviceType,
      r.userName,
      r.unit,
      `"${r.purpose.replace(/"/g, '""')}"`,
      r.urgency,
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Permintaan_RR_Lazuardi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case 'seragam': return <Shirt className="w-3.5 h-3.5 text-teal-600" />;
      case 'atk': return <PenTool className="w-3.5 h-3.5 text-sky-600" />;
      case 'fotocopy': return <Printer className="w-3.5 h-3.5 text-purple-600" />;
      case 'laminating': return <Sparkles className="w-3.5 h-3.5 text-teal-600" />;
      case 'air_galon': return <Droplet className="w-3.5 h-3.5 text-cyan-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-800 text-white rounded-xl shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Manajemen &amp; Pelacakan Permintaan</h2>
            <p className="text-xs text-slate-500">
              Monitoring alur persetujuan, penyiapan barang, serah terima, dan riwayat seluruh layanan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no. tiket, nama pemohon, keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-800 bg-transparent border-none outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">Semua Layanan</option>
              <option value="fotocopy">Layanan Foto Copy</option>
              <option value="laminating">Pelayanan Laminating</option>
              <option value="air_galon">Air Minum Galon</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Permintaan Masuk (Diajukan)</option>
              <option value="processing">Sedang Diproses / Disiapkan</option>
              <option value="Siap Diambil">Siap Diambil</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">Semua Unit</option>
              {units.map(u => <option key={u.id} value={u.code}>{u.name}</option>)}
            </select>

            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">Semua Urgensi</option>
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
              <option value="Mendesak">Mendesak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Permintaan Layanan ({filteredRequests.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">No. Tiket</th>
                <th className="p-3.5">Waktu</th>
                <th className="p-3.5">Layanan</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5">Rincian Permintaan</th>
                <th className="p-3.5">Urgensi</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ditemukan permintaan yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-teal-950">
                      {req.requestNumber}
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(req.requestDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 capitalize font-semibold text-slate-900">
                        {getServiceIcon(req.serviceType)}
                        <span>{req.serviceType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <strong className="text-slate-900 block">{req.userName}</strong>
                      <span className="text-[10px] text-slate-400">{req.department}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">{req.unit}</td>
                    <td className="p-3.5">
                      <p className="text-slate-900 font-medium max-w-xs truncate">{req.purpose}</p>
                      {req.items.length > 0 && (
                        <span className="text-[11px] text-slate-500">
                          {req.items.length} item ({req.items.map(i => `${i.itemName} x${i.quantityRequested}`).join(', ')})
                        </span>
                      )}
                      {req.photocopyDetail && (
                        <span className="text-[11px] text-purple-700 font-semibold">
                          {req.photocopyDetail.serviceType} {req.photocopyDetail.totalSheets} Lembar {req.photocopyDetail.paperSize}
                        </span>
                      )}
                      {req.laminatingDetail && (
                        <span className="text-[11px] text-teal-700 font-semibold">
                          Laminating {req.laminatingDetail.quantity} Lembar {req.laminatingDetail.paperSize} ({req.laminatingDetail.filmType})
                        </span>
                      )}
                      {req.waterDetail && (
                        <span className="text-[11px] text-cyan-700 font-semibold">
                          {req.waterDetail.gallonCount} Galon @ {req.waterDetail.roomName}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <UrgencyBadge urgency={req.urgency} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setActiveDetailRequest(req);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail Lengkap"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => onOpenReceipt(req)}
                        className="px-2.5 py-1 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md transition-colors cursor-pointer"
                        title="Cetak Bukti / Slip"
                      >
                        Slip
                      </button>

                      {canManageOrDelete && req.status !== 'Selesai' && req.status !== 'Ditolak' && (
                        <button
                          onClick={() => handleOpenActionModal(req)}
                          className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
                          title="Proses & Perbarui Status"
                        >
                          Proses
                        </button>
                      )}

                      {canManageOrDelete && (
                        <button
                          onClick={() => handleOpenDeleteConfirm(req)}
                          className="px-2 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Hapus Transaksi (Admin & Super Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden xl:inline">Hapus</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {activeDetailRequest && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detail Permintaan: ${activeDetailRequest.requestNumber}`}
          subtitle={`Diajukan pada: ${new Date(activeDetailRequest.requestDate).toLocaleString('id-ID')}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            
            {/* Status & Progress Bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Status Saat Ini</span>
                <StatusBadge status={activeDetailRequest.status} size="md" />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tingkat Urgensi</span>
                <UrgencyBadge urgency={activeDetailRequest.urgency} />
              </div>
            </div>

            {/* Requester Info */}
            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Pemohon</span>
                <strong className="text-slate-900 text-sm">{activeDetailRequest.userName}</strong>
                <span className="text-slate-500 text-[11px] block">{activeDetailRequest.userEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Unit / Departemen</span>
                <strong className="text-slate-900">{activeDetailRequest.unit}</strong>
                <span className="text-slate-500 text-[11px] block">{activeDetailRequest.department}</span>
              </div>
            </div>

            {/* Purpose & Notes */}
            <div>
              <span className="text-slate-400 block text-[11px] font-bold">Keperluan / Alasan:</span>
              <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                {activeDetailRequest.purpose}
              </p>
            </div>

            {/* Item List or Service Details */}
            {activeDetailRequest.items.length > 0 && (
              <div>
                <span className="text-slate-400 block text-[11px] font-bold mb-1.5">Rincian Barang:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Kode</th>
                        <th className="p-2">Nama Barang</th>
                        <th className="p-2 text-center">Ukuran</th>
                        <th className="p-2 text-center">Jumlah Diminta</th>
                        <th className="p-2 text-center">Disetujui</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeDetailRequest.items.map((it) => (
                        <tr key={it.itemId}>
                          <td className="p-2 font-mono text-slate-500">{it.itemCode}</td>
                          <td className="p-2 font-bold text-slate-900">{it.itemName}</td>
                          <td className="p-2 text-center">{it.size || '-'}</td>
                          <td className="p-2 text-center font-bold text-slate-800">{it.quantityRequested} {it.unitMeasure}</td>
                          <td className="p-2 text-center font-bold text-teal-800">{it.quantityApproved ?? it.quantityRequested} {it.unitMeasure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Photocopy Details */}
            {activeDetailRequest.photocopyDetail && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-slate-800 space-y-1">
                <span className="font-bold text-blue-900 block">Rincian Layanan Foto Copy:</span>
                <p>Dokumen: <strong>{activeDetailRequest.photocopyDetail.documentType || activeDetailRequest.purpose}</strong> • Ukuran: <strong>{activeDetailRequest.photocopyDetail.paperSize}</strong></p>
                <p>Finishing: <strong>{activeDetailRequest.photocopyDetail.binding || 'Tanpa Jilid'}</strong> • Deadline: <strong>{new Date(activeDetailRequest.photocopyDetail.deadlineDate).toLocaleString('id-ID')}</strong></p>
                <p>Perhitungan: <strong>{activeDetailRequest.photocopyDetail.pageCount} Hal Asli × {activeDetailRequest.photocopyDetail.copyCount} Rangkap = {activeDetailRequest.photocopyDetail.totalSheets} Lembar</strong></p>
                {activeDetailRequest.photocopyDetail.photoUrl && (
                  <p>Foto Dokumen: <a href={activeDetailRequest.photocopyDetail.photoUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">Buka Pratinjau Foto</a></p>
                )}
                {activeDetailRequest.photocopyDetail.fileName && !activeDetailRequest.photocopyDetail.photoUrl && (
                  <p>File: <span className="font-mono text-blue-900">{activeDetailRequest.photocopyDetail.fileName}</span></p>
                )}
                {activeDetailRequest.photocopyDetail.notes && (
                  <p>Catatan Tambahan: <span className="italic text-slate-600">"{activeDetailRequest.photocopyDetail.notes}"</span></p>
                )}
              </div>
            )}

            {/* Laminating Details */}
            {activeDetailRequest.laminatingDetail && (
              <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-slate-800 space-y-1">
                <span className="font-bold text-teal-900 block">Rincian Layanan Laminating:</span>
                <p>Dokumen: <strong>{activeDetailRequest.laminatingDetail.documentType}</strong> • Ukuran: <strong>{activeDetailRequest.laminatingDetail.paperSize}</strong></p>
                <p>Jumlah: <strong>{activeDetailRequest.laminatingDetail.quantity} Lembar</strong> • Deadline: <strong>{new Date(activeDetailRequest.laminatingDetail.deadlineDate).toLocaleString('id-ID')}</strong></p>
                {activeDetailRequest.laminatingDetail.photoUrl && (
                  <p>Foto Dokumen: <a href={activeDetailRequest.laminatingDetail.photoUrl} target="_blank" rel="noreferrer" className="text-teal-700 font-bold underline">Buka Pratinjau Foto</a></p>
                )}
                {activeDetailRequest.laminatingDetail.fileName && !activeDetailRequest.laminatingDetail.photoUrl && (
                  <p>File: <span className="font-mono text-teal-900">{activeDetailRequest.laminatingDetail.fileName}</span></p>
                )}
                {activeDetailRequest.laminatingDetail.notes && (
                  <p>Catatan Tambahan: <span className="italic text-slate-600">"{activeDetailRequest.laminatingDetail.notes}"</span></p>
                )}
              </div>
            )}

            {/* Water Gallon Details */}
            {activeDetailRequest.waterDetail && (
              <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200 text-slate-800 space-y-1">
                <span className="font-bold text-cyan-900 block">Rincian Permintaan Air Galon:</span>
                <p>Ruangan / Lokasi: <strong>{activeDetailRequest.waterDetail.roomName}</strong> • Jenis: <strong>{activeDetailRequest.waterDetail.requestType}</strong></p>
                <p>Jumlah Galon Diminta: <strong className="text-cyan-900 font-bold">{activeDetailRequest.waterDetail.gallonCount} Galon Isi</strong> • Galon Kosong Kembali: <strong className="text-amber-900 font-bold">{activeDetailRequest.waterDetail.emptyGallonsReturned ?? 0} Galon</strong></p>
                {activeDetailRequest.waterDetail.pickupTimestamp && (
                  <p className="text-slate-500">Waktu Pengambilan / Pengajuan: <strong>{new Date(activeDetailRequest.waterDetail.pickupTimestamp).toLocaleString('id-ID')}</strong></p>
                )}
                {activeDetailRequest.waterDetail.notes && (
                  <p>Catatan: <span className="italic text-slate-600">"{activeDetailRequest.waterDetail.notes}"</span></p>
                )}
              </div>
            )}

            {/* Handover & Admin Notes */}
            {(activeDetailRequest.adminNotes || activeDetailRequest.pickedUpBy || activeDetailRequest.rejectionReason) && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                {activeDetailRequest.adminNotes && (
                  <p><strong className="text-slate-700">Catatan Petugas RR:</strong> {activeDetailRequest.adminNotes}</p>
                )}
                {activeDetailRequest.pickedUpBy && (
                  <p><strong className="text-slate-700">Diserahkan kepada / Pengambil:</strong> {activeDetailRequest.pickedUpBy} (pada {activeDetailRequest.completionDate ? new Date(activeDetailRequest.completionDate).toLocaleString('id-ID') : '-'})</p>
                )}
                {activeDetailRequest.rejectionReason && (
                  <p className="text-rose-600"><strong className="text-rose-800">Alasan Ditolak:</strong> {activeDetailRequest.rejectionReason}</p>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    onOpenReceipt(activeDetailRequest);
                    setIsDetailModalOpen(false);
                  }}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak SPK / Tanda Terima</span>
                </button>

                {canManageOrDelete && activeDetailRequest.status !== 'Selesai' && activeDetailRequest.status !== 'Ditolak' && (
                  <button
                    onClick={() => {
                      const reqToProcess = activeDetailRequest;
                      setIsDetailModalOpen(false);
                      handleOpenActionModal(reqToProcess);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proses / Perbarui Status</span>
                  </button>
                )}

                {canManageOrDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenDeleteConfirm(activeDetailRequest);
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    title="Hapus transaksi ini dari sistem"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Hapus Transaksi</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ACTION STATUS MODAL (OPERATOR RR) */}
      {selectedActionRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false);
            setSelectedActionRequest(null);
          }}
          title={`Proses Permintaan: ${selectedActionRequest.requestNumber}`}
          subtitle={`Pemohon: ${selectedActionRequest.userName} • Unit: ${selectedActionRequest.unit} • Layanan: ${selectedActionRequest.serviceType.toUpperCase()}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p>Keperluan: <strong>{selectedActionRequest.purpose}</strong></p>
              {selectedActionRequest.photocopyDetail && (
                <p className="text-purple-700 font-semibold">
                  Foto Copy: {selectedActionRequest.photocopyDetail.totalSheets} Lembar ({selectedActionRequest.photocopyDetail.paperSize}) - Deadline: {new Date(selectedActionRequest.photocopyDetail.deadlineDate).toLocaleString('id-ID')}
                </p>
              )}
              {selectedActionRequest.laminatingDetail && (
                <p className="text-teal-700 font-semibold">
                  Laminating: {selectedActionRequest.laminatingDetail.quantity} Lembar ({selectedActionRequest.laminatingDetail.paperSize})
                </p>
              )}
              {selectedActionRequest.waterDetail && (
                <p className="text-cyan-700 font-semibold">
                  Air Galon: {selectedActionRequest.waterDetail.gallonCount} Galon @ {selectedActionRequest.waterDetail.roomName}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Perbarui Alur Status Pengerjaan (Operator RR):</label>

              {/* Receiver name input for completion */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Penerima / Pengambil Berkas/Barang:
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
                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedActionRequest.id, 'Disetujui', { adminNotes: 'Disetujui operator Resources Room' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedActionRequest.status === 'Disetujui' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700'
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
                    updateRequestStatus(selectedActionRequest.id, 'Sedang Disiapkan', { adminNotes: 'Sedang dikerjakan / disiapkan operator RR' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedActionRequest.status === 'Sedang Disiapkan' ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>2. Sedang Diproses</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Pengerjaan di mesin/gudang</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedActionRequest.id, 'Siap Diambil', { adminNotes: 'Selesai dan siap diambil di loket Resources Room' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedActionRequest.status === 'Siap Diambil' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>3. Siap Diambil</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Tersedia di loket RR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const recipient = actionPickedUpBy.trim() || selectedActionRequest.userName || 'Pemohon';
                    updateRequestStatus(selectedActionRequest.id, 'Selesai', { pickedUpBy: recipient });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedActionRequest.status === 'Selesai' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Selesai</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Diserahkan ke pemohon</span>
                </button>
              </div>

              {/* Reject toggle and inline form */}
              {selectedActionRequest.status !== 'Selesai' && selectedActionRequest.status !== 'Ditolak' && (
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
                        placeholder="Contoh: Dokumen/keperluan tidak sesuai prosedur..."
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
                            updateRequestStatus(selectedActionRequest.id, 'Ditolak', {
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
                    const target = selectedActionRequest;
                    setIsActionModalOpen(false);
                    handleOpenDeleteConfirm(target);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  title="Hapus transaksi ini"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Transaksi</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => {
                  setIsActionModalOpen(false);
                  setSelectedActionRequest(null);
                }}
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
          title="Konfirmasi Hapus Transaksi"
          subtitle="Tindakan ini akan menghapus data transaksi/permohonan secara permanen dari sistem"
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
                  Apakah Anda yakin ingin menghapus transaksi ini?
                </strong>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Transaksi dengan status <strong>"{requestToDelete.status}"</strong> ini akan dihapus dari histori permohonan, pencatatan log audit, serta rekap laporan Resources Room.
                </p>
              </div>
            </div>

            {/* Transaction Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Transaksi / Tiket</span>
                  <strong className="text-sm font-mono text-slate-900">{requestToDelete.requestNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Saat Ini</span>
                  <StatusBadge status={requestToDelete.status} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Jenis Layanan:</span>
                  <strong className="text-slate-900 capitalize">{requestToDelete.serviceType.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal Diajukan:</span>
                  <span className="font-semibold text-slate-800">{new Date(requestToDelete.requestDate).toLocaleDateString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pemohon:</span>
                  <strong className="text-slate-900">{requestToDelete.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit Sekolah:</span>
                  <span className="font-semibold text-slate-800">{requestToDelete.unit}</span>
                </div>
              </div>

              {requestToDelete.purpose && (
                <div className="pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500 block">Keperluan / Keterangan:</span>
                  <span className="italic text-slate-700">"{requestToDelete.purpose}"</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
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
