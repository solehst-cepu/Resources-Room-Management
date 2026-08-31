import React, { useState } from 'react';
import { 
  Printer, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  FileCheck, 
  ArrowRight, 
  AlertCircle, 
  XCircle, 
  Copy, 
  Check, 
  ExternalLink,
  MapPin,
  Sparkles,
  Search,
  ChevronRight
} from 'lucide-react';
import { Modal } from './Modal';
import { StatusBadge, UrgencyBadge } from './Badge';
import { ServiceRequest, RequestStatus } from '../../types';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onOpenReceipt?: (req: ServiceRequest) => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  request,
  onOpenReceipt
}) => {
  const [copiedTicket, setCopiedTicket] = useState(false);

  if (!request) return null;

  const isPhotocopy = request.serviceType === 'fotocopy';
  const isLaminating = request.serviceType === 'laminating';
  const photoDetail = request.photocopyDetail;
  const laminDetail = request.laminatingDetail;

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(request.requestNumber);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // Determine Stepper Stages
  const isRejected = request.status === 'Ditolak' || request.status === 'Dibatalkan';

  interface StepItem {
    id: number;
    key: string;
    title: string;
    description: string;
    locationNote: string;
    status: 'completed' | 'current' | 'upcoming' | 'rejected';
    timestamp?: string;
  }

  const getStepStatus = (stepIndex: number, currentStatus: RequestStatus): 'completed' | 'current' | 'upcoming' | 'rejected' => {
    if (isRejected) {
      if (stepIndex === 1) return 'completed';
      return 'rejected';
    }

    const statusHierarchy: Record<RequestStatus, number> = {
      'Draft': 0,
      'Diajukan': 1,
      'Menunggu Approval': 1,
      'Disetujui': 2,
      'Sedang Disiapkan': 3,
      'Siap Diambil': 4,
      'Selesai': 5,
      'Ditolak': -1,
      'Dibatalkan': -1,
      'Stok Tidak Tersedia': -1
    };

    const currentRank = statusHierarchy[currentStatus] ?? 1;

    if (currentRank > stepIndex) return 'completed';
    if (currentRank === stepIndex) return 'current';
    return 'upcoming';
  };

  const steps: StepItem[] = [
    {
      id: 1,
      key: 'submitted',
      title: 'Order Diajukan',
      description: 'Permintaan & spesifikasi dokumen telah terdaftar di sistem',
      locationNote: 'Sistem Terbuka RR',
      status: getStepStatus(1, request.status),
      timestamp: request.requestDate ? new Date(request.requestDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : undefined
    },
    {
      id: 2,
      key: 'approved',
      title: 'Validasi & Antrean Mesin',
      description: request.status === 'Menunggu Approval' 
        ? 'Menunggu verifikasi kuota atau persetujuan kepala unit' 
        : 'Dokumen tervalidasi dan masuk antrean produksi RR',
      locationNote: 'Loket Resources Room',
      status: getStepStatus(2, request.status),
      timestamp: request.approvalDate ? new Date(request.approvalDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : undefined
    },
    {
      id: 3,
      key: 'processing',
      title: isPhotocopy ? 'Sedang Dicopy Mesin' : isLaminating ? 'Sedang Dilaminasi Mesin' : 'Proses Pengerjaan',
      description: isPhotocopy 
        ? 'Proses cetak penggandaan dokumen, penyusunan halaman, & penjilidan' 
        : isLaminating 
          ? 'Proses pemanasan roller film & pelapisan dokumen presisi' 
          : 'Pengerjaan berkas oleh operator',
      locationNote: isPhotocopy ? 'Mesin Fotokopi Canon/Xerox RR' : 'Mesin Laminating Panas RR',
      status: getStepStatus(3, request.status),
      timestamp: request.processedBy ? `Operator: ${request.processedBy}` : undefined
    },
    {
      id: 4,
      key: 'ready',
      title: 'Siap Diambil di Loket',
      description: 'Produksi selesai dan dokumen siap diambil oleh pemohon',
      locationNote: 'Rak Pengambilan Dokumen Resources Room',
      status: getStepStatus(4, request.status)
    },
    {
      id: 5,
      key: 'completed',
      title: 'Selesai & Diserahterimakan',
      description: 'Dokumen telah diserahkan dan tanda terima dikonfirmasi',
      locationNote: 'Pemohon / Unit Penerima',
      status: getStepStatus(5, request.status),
      timestamp: request.completedDate ? new Date(request.completedDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : undefined
    }
  ];

  // Helper current status description
  const getCurrentStatusOverview = () => {
    switch (request.status) {
      case 'Diajukan':
      case 'Menunggu Approval':
        return {
          title: 'Permintaan Berhasil Diajukan',
          desc: 'Order Anda telah masuk ke sistem Resources Room dan menunggu validasi petugas/kepala unit.',
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badgeBg: 'bg-amber-500'
        };
      case 'Disetujui':
        return {
          title: 'Order Disetujui & Masuk Antrean',
          desc: 'Dokumen Anda telah disetujui dan dijadwalkan untuk diproses pada mesin RR.',
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          badgeBg: 'bg-blue-600'
        };
      case 'Sedang Disiapkan':
        return {
          title: isPhotocopy ? 'Mesin Fotokopi Sedang Bekerja' : 'Mesin Sedang Melaminasi',
          desc: isPhotocopy 
            ? 'Petugas Resources Room sedang melakukan penggandaan, sortir halaman, atau penjilidan dokumen Anda.'
            : 'Dokumen Anda sedang diproses melalui mesin laminasi panas berkecepatan standar.',
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          badgeBg: 'bg-indigo-600'
        };
      case 'Siap Diambil':
        return {
          title: '🎉 Dokumen Siap Diambil di Loket RR!',
          desc: 'Proses pengerjaan selesai 100%. Silakan datang ke Resources Room untuk serah terima dokumen.',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          badgeBg: 'bg-emerald-600'
        };
      case 'Selesai':
        return {
          title: 'Transaksi Selesai',
          desc: `Dokumen telah diserahkan ${request.pickedUpBy ? `kepada ${request.pickedUpBy}` : 'kepada pemohon'}. Terima kasih!`,
          bg: 'bg-slate-50 border-slate-200 text-slate-900',
          badgeBg: 'bg-slate-700'
        };
      case 'Ditolak':
        return {
          title: 'Permintaan Ditolak',
          desc: request.rejectionReason ? `Alasan: "${request.rejectionReason}"` : 'Permintaan ini tidak dapat diproses oleh petugas.',
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badgeBg: 'bg-rose-600'
        };
      default:
        return {
          title: request.status,
          desc: 'Status pengerjaan saat ini.',
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          badgeBg: 'bg-slate-600'
        };
    }
  };

  const overview = getCurrentStatusOverview();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pelacakan Progres Order (Live Tracker)"
      subtitle={`No. Tiket: ${request.requestNumber} • Layanan ${isPhotocopy ? 'Foto Copy Dokumen' : isLaminating ? 'Laminating Presisi' : request.serviceType.toUpperCase()}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        
        {/* Status Live Banner */}
        <div className={`p-4 rounded-xl border ${overview.bg} space-y-1.5 shadow-2xs`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${overview.badgeBg} animate-ping`} />
              <h4 className="text-sm font-extrabold">{overview.title}</h4>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} size="sm" />
              <UrgencyBadge urgency={request.urgency} />
            </div>
          </div>
          <p className="text-xs leading-relaxed opacity-90">{overview.desc}</p>
        </div>

        {/* Visual Stepper / Progress Timeline */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Tahapan Pengerjaan Order
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {request.unit} • {request.userName}
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((step) => {
              let circleClass = 'bg-white border-2 border-slate-300 text-slate-400';
              let lineTitleClass = 'text-slate-500 font-semibold';
              let lineDescClass = 'text-slate-400';

              if (step.status === 'completed') {
                circleClass = 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs';
                lineTitleClass = 'text-slate-900 font-bold';
                lineDescClass = 'text-slate-600';
              } else if (step.status === 'current') {
                circleClass = 'bg-blue-600 border-2 border-blue-600 text-white shadow-md ring-4 ring-blue-100 animate-pulse';
                lineTitleClass = 'text-blue-900 font-extrabold text-xs sm:text-sm';
                lineDescClass = 'text-blue-700 font-medium';
              } else if (step.status === 'rejected') {
                circleClass = 'bg-rose-600 border-2 border-rose-600 text-white';
                lineTitleClass = 'text-rose-800 font-semibold';
                lineDescClass = 'text-rose-600';
              }

              return (
                <div key={step.id} className="relative group">
                  {/* Stepper Dot */}
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${circleClass}`}>
                    {step.status === 'completed' ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : step.status === 'rejected' ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      step.id
                    )}
                  </div>

                  {/* Step Body */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h5 className={`${lineTitleClass}`}>{step.title}</h5>
                      {step.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {step.timestamp}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed ${lineDescClass}`}>{step.description}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Lokasi: {step.locationNote}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Document Specification Card */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                {isPhotocopy ? <Printer className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spesifikasi Pesanan</span>
                <strong className="text-xs text-slate-900">
                  {isPhotocopy ? photoDetail?.documentType || request.purpose : laminDetail?.documentType || request.purpose}
                </strong>
              </div>
            </div>

            <button
              onClick={handleCopyTicket}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Salin Nomor Tiket"
            >
              {copiedTicket ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span className="font-mono">{request.requestNumber}</span>
            </button>
          </div>

          {/* Photocopy Specs Grid */}
          {isPhotocopy && photoDetail && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Ukuran Kertas</span>
                <span className="font-bold text-slate-800">{photoDetail.paperSize}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Volume Copy</span>
                <span className="font-bold text-slate-800">{photoDetail.pageCount} Hal × {photoDetail.copyCount} Eks</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Lembar</span>
                <span className="font-extrabold text-blue-900 bg-blue-100/70 px-1.5 py-0.5 rounded">
                  {photoDetail.totalSheets} Lembar
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Finishing / Jilid</span>
                <span className="font-semibold text-slate-700">{photoDetail.binding || 'Tanpa Jilid'}</span>
              </div>
            </div>
          )}

          {/* Laminating Specs Grid */}
          {isLaminating && laminDetail && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-teal-50/50 p-3 rounded-lg border border-teal-100 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Ukuran Dokumen & Film</span>
                <span className="font-bold text-teal-950">{laminDetail.paperSize}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jumlah Dokumen</span>
                <span className="font-extrabold text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded">
                  {laminDetail.quantity} Lembar
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ketebalan Plastik</span>
                <span className="font-semibold text-slate-700">{laminDetail.thickness || '100 Micron Standar'}</span>
              </div>
            </div>
          )}

          {/* Secondary Details & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Batas Waktu (Deadline):</span>
              <strong className="text-rose-700">
                {isPhotocopy && photoDetail?.deadlineDate 
                  ? new Date(photoDetail.deadlineDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                  : isLaminating && laminDetail?.deadlineDate
                    ? new Date(laminDetail.deadlineDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                    : '-'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Pemilik Order:</span>
              <span className="font-semibold text-slate-800">{request.userName} ({request.unit})</span>
            </div>
          </div>

          {/* Notes / Attachment */}
          {(photoDetail?.notes || laminDetail?.notes || request.notes) && (
            <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] border border-slate-100">
              <span className="text-slate-500 font-semibold block mb-0.5">Catatan Khusus Pemohon:</span>
              <p className="italic text-slate-700">"{photoDetail?.notes || laminDetail?.notes || request.notes}"</p>
            </div>
          )}

          {/* File Attachment Link */}
          {(photoDetail?.photoUrl || photoDetail?.fileName || laminDetail?.photoUrl || laminDetail?.fileName) && (
            <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-semibold text-slate-800">
                  {photoDetail?.fileName || laminDetail?.fileName || 'Lampiran Berkas Digital Dokumen'}
                </span>
              </div>
              {(photoDetail?.photoUrl || laminDetail?.photoUrl) && (
                <a
                  href={photoDetail?.photoUrl || laminDetail?.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-blue-700 border border-blue-200 rounded font-bold text-[10px] hover:bg-blue-50 transition-colors"
                >
                  <span>Buka Berkas</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Admin Operational Notes / Processor */}
          {(request.processedBy || request.pickedUpBy || request.adminNotes) && (
            <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-[11px] space-y-1">
              <span className="text-emerald-950 font-bold block">Keterangan Petugas Resources Room:</span>
              {request.processedBy && (
                <div>Operator Pengerja: <strong>{request.processedBy}</strong></div>
              )}
              {request.pickedUpBy && (
                <div>Dokumen Diserahterimakan kepada: <strong>{request.pickedUpBy}</strong></div>
              )}
              {request.adminNotes && (
                <div className="italic text-emerald-900">"{request.adminNotes}"</div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          {onOpenReceipt ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReceipt(request);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-slate-600" />
              <span>Cetak Bukti / Tanda Terima SPK</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Tutup Pelacakan
          </button>
        </div>

      </div>
    </Modal>
  );
};
