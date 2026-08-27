import React from 'react';
import { Modal } from './Modal';
import { ServiceRequest } from '../../types';
import { StatusBadge } from './Badge';
import { Printer, Download, CheckCircle, School } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  request
}) => {
  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(request.requestDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bukti Dokumen Layanan & Serah Terima"
      subtitle={`No. Registrasi: ${request.requestNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Document Sheet */}
        <div id="printable-receipt" className="border border-slate-300 rounded-lg p-6 bg-white text-slate-800 shadow-xs print:border-none print:p-0">
          
          {/* Header Kop Surat Lazuardi GCS */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-teal-800 text-white flex items-center justify-center font-black text-xl tracking-tighter">
                LZ
              </div>
              <div>
                <h2 className="text-base font-extrabold text-teal-900 tracking-wide uppercase">
                  SEKOLAH LAZUARDI GLOBAL COMPASSIONATE SCHOOL
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Integrated Resources Room & Service Management System (One Stop Service)
                </p>
                <p className="text-[11px] text-slate-500">
                  Jl. Margonda Raya / Cinere Campus | Email: resources.room@lazuardi.sch.id
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded border border-slate-300 block">
                {request.requestNumber}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Tgl: {new Date(request.requestDate).toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>

          <div className="text-center my-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 underline">
              FORMULIR PERMINTAAN & BUKTI SERAH TERIMA LAYANAN
            </h3>
            <p className="text-xs text-slate-600">Layanan: <strong className="uppercase">{request.serviceType.replace('_', ' ')}</strong></p>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded border border-slate-200">
            <div>
              <span className="text-slate-500 block">Nama Pemohon:</span>
              <strong className="text-slate-900 text-sm">{request.userName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Unit / Departemen:</span>
              <strong className="text-slate-900">{request.unit} - {request.department}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Waktu Permintaan:</span>
              <span className="text-slate-800 font-medium">{formattedDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status Saat Ini:</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Keperluan / Alasan:</span>
              <span className="text-slate-800 italic">{request.purpose}</span>
            </div>
          </div>

          {/* Details based on Service Type */}
          {request.serviceType === 'atk' && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Daftar Barang ATK Diminta:</h4>
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                    <th className="p-2 border-r border-slate-300">Kode & Nama Barang</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">Jumlah Diminta</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">Jumlah Disetujui</th>
                    <th className="p-2 text-center w-20">Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {request.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <strong>{it.itemName}</strong>
                        <span className="text-[10px] text-slate-500 block font-mono">{it.itemCode}</span>
                      </td>
                      <td className="p-2 text-center font-bold border-r border-slate-200">{it.quantityRequested}</td>
                      <td className="p-2 text-center font-bold text-teal-800 border-r border-slate-200">
                        {it.quantityApproved ?? it.quantityRequested}
                      </td>
                      <td className="p-2 text-center text-slate-600">{it.unitMeasure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {request.serviceType === 'seragam' && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Detail Permintaan Seragam:</h4>
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                    <th className="p-2 border-r border-slate-300">Jenis / Nama Seragam</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Ukuran</th>
                    <th className="p-2 text-center w-20">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {request.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <strong>{it.itemName}</strong>
                        <span className="text-[10px] text-slate-500 block font-mono">{it.itemCode}</span>
                      </td>
                      <td className="p-2 text-center font-bold border-r border-slate-200 bg-amber-50">
                        {it.size || '-'}
                      </td>
                      <td className="p-2 text-center font-bold">{it.quantityRequested} Pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {request.serviceType === 'fotocopy' && request.photocopyDetail && (
            <div className="mt-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-blue-900 uppercase">Spesifikasi Layanan Foto Copy:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">Jenis Dokumen: <strong>{request.photocopyDetail.documentType || request.purpose}</strong></div>
                <div>Ukuran Kertas: <strong>{request.photocopyDetail.paperSize}</strong></div>
                <div>Halaman Asli: <strong>{request.photocopyDetail.pageCount} Halaman</strong></div>
                <div>Jumlah Copy: <strong>{request.photocopyDetail.copyCount} Rangkap</strong></div>
                <div className="bg-blue-100 p-1 rounded font-bold text-blue-950 text-center">
                  Total: {request.photocopyDetail.totalSheets} Lembar
                </div>
                <div>Jilid &amp; Finishing: <strong>{request.photocopyDetail.binding || 'Tanpa Jilid'}</strong></div>
                <div className="col-span-2">Deadline: <strong>{new Date(request.photocopyDetail.deadlineDate).toLocaleString('id-ID')}</strong></div>
                {request.photocopyDetail.notes && (
                  <div className="col-span-3 text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                    <strong>Catatan:</strong> {request.photocopyDetail.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {request.serviceType === 'laminating' && request.laminatingDetail && (
            <div className="mt-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-teal-800 uppercase">Spesifikasi Layanan Laminating:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>Jenis Dokumen: <strong>{request.laminatingDetail.documentType}</strong></div>
                <div>Ukuran: <strong>{request.laminatingDetail.paperSize}</strong></div>
                <div>Tipe Film: <strong>{request.laminatingDetail.filmType}</strong></div>
                <div>Ketebalan: <strong>{request.laminatingDetail.thickness}</strong></div>
                <div>Finishing: <strong>{request.laminatingDetail.cornerCut || 'Siku Standar'}</strong></div>
                <div className="bg-teal-100 p-1 rounded font-bold text-teal-900 text-center">
                  Jumlah: {request.laminatingDetail.quantity} Lembar
                </div>
                <div className="col-span-3">Deadline: <strong>{new Date(request.laminatingDetail.deadlineDate).toLocaleString('id-ID')}</strong></div>
              </div>
            </div>
          )}

          {request.serviceType === 'air_galon' && request.waterDetail && (
            <div className="mt-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-cyan-900 uppercase">Detail Distribusi &amp; Penukaran Air Galon:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>Lokasi / Ruangan: <strong>{request.waterDetail.roomName}</strong></div>
                <div>Jenis Permintaan: <strong>{request.waterDetail.requestType}</strong></div>
                <div>Jumlah Galon Isi: <strong className="text-cyan-800 text-sm font-bold">{request.waterDetail.gallonCount} Galon (Aqua 19L)</strong></div>
                <div>Galon Kosong Kembali: <strong className="text-amber-800 text-sm font-bold">{request.waterDetail.emptyGallonsReturned ?? 0} Galon</strong></div>
                {request.waterDetail.pickupTimestamp && (
                  <div className="col-span-2 text-slate-500">
                    Waktu Pengambilan: <strong>{new Date(request.waterDetail.pickupTimestamp).toLocaleString('id-ID')}</strong>
                  </div>
                )}
                {request.waterDetail.notes && (
                  <div className="col-span-2 text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                    <strong>Catatan:</strong> {request.waterDetail.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500 font-medium">Pemohon Layanan,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="border-b border-slate-900 font-bold px-3 pb-0.5">{request.userName}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{request.unit}</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">Menyetujui (Kepala Unit),</p>
              <div className="h-16 flex items-end justify-center">
                <span className="border-b border-slate-900 font-bold px-3 pb-0.5">{request.approvedBy || '( ................................... )'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{request.approvalDate ? new Date(request.approvalDate).toLocaleDateString('id-ID') : 'Ttd / Tanggal'}</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">Petugas Resources Room,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="border-b border-slate-900 font-bold px-3 pb-0.5">{request.processedBy || 'Siti Rahmawati'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Resources Room Lazuardi</p>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-dotted border-slate-300 flex justify-between items-center text-[10px] text-slate-400">
            <span>Dicetak secara otomatis dari Lazuardi Resources Room Management System</span>
            <span>Ref: {request.requestNumber}</span>
          </div>

        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};
