import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { VEHICLE_FLEET_SOLO_SQL } from '../../lib/supabaseSqlSchema';
import { PROJECT_METADATA } from '../../lib/supabase';
import { 
  Database, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Car 
} from 'lucide-react';

export const VehicleFleetFixModal: React.FC = () => {
  const { 
    isVehicleFleetFixModalOpen, 
    setIsVehicleFleetFixModalOpen, 
    refreshSupabaseConnection, 
    syncVehicleFleetToSupabase,
    vehicleFleet,
    dbInfo,
    showToast
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isVehicleFleetFixModalOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(VEHICLE_FLEET_SOLO_SQL);
    setCopied(true);
    showToast('success', 'Skrip SQL Tersalin!', 'Tempel (paste) skrip di SQL Editor Supabase, lalu klik RUN.');
    setTimeout(() => setCopied(false), 3500);
  };

  const handleVerifyAndSync = async () => {
    setIsVerifying(true);
    try {
      await refreshSupabaseConnection();
      const success = await syncVehicleFleetToSupabase();
      if (success) {
        showToast('success', 'Tabel vehicle_fleet Berhasil Diaktifkan!', `${vehicleFleet.length} data armada telah tersinkronisasi ke Supabase Cloud.`);
        setIsVehicleFleetFixModalOpen(false);
      } else {
        showToast('warning', 'Tabel Masih Belum Terdeteksi', 'Pastikan skrip SQL sudah di-paste di Supabase SQL Editor dan tombol RUN sudah ditekan.');
      }
    } catch (err: any) {
      showToast('error', 'Gagal Verifikasi', err?.message || 'Silakan coba lagi');
    } finally {
      setIsVerifying(false);
    }
  };

  const isTableReadyInSupabase = dbInfo?.tableDetails?.['vehicle_fleet']?.exists;

  return (
    <Modal
      isOpen={isVehicleFleetFixModalOpen}
      onClose={() => setIsVehicleFleetFixModalOpen(false)}
      title="Aktivasi Tabel vehicle_fleet di Supabase"
      subtitle="Panduan 1-Klik Pembuatan Tabel Baru Modul Armada Kendaraan & Bus Sewa"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Banner Penjelasan */}
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950">
          <div className="p-2 bg-amber-200 text-amber-900 rounded-lg shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-amber-800" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-950">
              Mengapa Muncul Kalimat "Tabel vehicle_fleet belum tersedia"?
            </p>
            <p className="text-amber-800 leading-relaxed">
              Tabel <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono font-bold text-amber-950">vehicle_fleet</code> adalah tabel baru yang dirilis untuk modul manajemen kendaraan operasional &amp; katalog bus sewa. Karena skrip tabel ini baru, tabel tersebut <strong>belum ada di database PostgreSQL Supabase Anda</strong> dan perlu dibuat satu kali saja (hanya butuh ~5 detik).
            </p>
          </div>
        </div>

        {/* 3 Langkah Mudah */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>3 Langkah Cepat Mengaktifkan Tabel (Hanya 5 Detik):</span>
          </h4>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="flex-1">
                <strong className="text-slate-900 block font-bold">Salin Skrip SQL Singkat</strong>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Klik tombol <strong>"Salin Skrip SQL"</strong> di bawah untuk menyalin perintah pembuatan tabel <code>vehicle_fleet</code> dan hak aksesnya.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="flex-1">
                <strong className="text-slate-900 block font-bold">Buka SQL Editor di Supabase &amp; Klik RUN</strong>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Klik tombol <strong>"Buka Supabase SQL Editor"</strong>, tempelkan skrip (<kbd className="px-1 bg-slate-100 border rounded font-mono text-[10px]">Ctrl+V / Cmd+V</kbd>), lalu tekan tombol hijau <strong className="text-emerald-700">RUN</strong> di Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="flex-1">
                <strong className="text-slate-900 block font-bold">Klik "Cek &amp; Sinkronkan Sekarang"</strong>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Kembali ke jendela ini dan klik tombol hijau di bawah. Seluruh data armada ({vehicleFleet.length} unit) akan seketika masuk ke database Supabase dan sinkron ke seluruh device!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kotak Skrip SQL yang Siap Disalin */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Skrip SQL Tabel vehicle_fleet:</span>
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL Ini'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800">
            <pre className="whitespace-pre-wrap">{VEHICLE_FLEET_SOLO_SQL}</pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <a
            href={`https://supabase.com/dashboard/project/${PROJECT_METADATA.projectId}/sql/new`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Buka Supabase SQL Editor (Project: {PROJECT_METADATA.projectId})</span>
          </a>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsVehicleFleetFixModalOpen(false)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleVerifyAndSync}
              disabled={isVerifying}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saya Sudah Jalankan, Sinkronkan Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
