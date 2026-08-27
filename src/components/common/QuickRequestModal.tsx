import React from 'react';
import { Printer, Sparkles, Droplet, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';

interface QuickRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceTab: string) => void;
}

export const QuickRequestModal: React.FC<QuickRequestModalProps> = ({
  isOpen,
  onClose,
  onSelectService
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Layanan Resources Room"
      subtitle="Pilih kategori permohonan yang ingin Anda ajukan hari ini"
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        
        {/* Foto Copy */}
        <button
          onClick={() => {
            onSelectService('layanan_fotocopy');
            onClose();
          }}
          className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-2.5">Foto Copy Dokumen</h4>
            <p className="text-[11px] text-slate-500 mt-1">Penggandaan soal ujian, modul ajar, silabus &amp; berkas administrasi</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <span>Buka Formulir</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Laminating */}
        <button
          onClick={() => {
            onSelectService('layanan_laminating');
            onClose();
          }}
          className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all text-left group cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg w-fit group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-2.5">Laminating</h4>
            <p className="text-[11px] text-slate-500 mt-1">Pelapisan sertifikat piagam, media ajar flashcard, ID card &amp; poster anti-air</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-teal-600">
            <span>Buka Formulir</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Air Galon */}
        <button
          onClick={() => {
            onSelectService('layanan_air');
            onClose();
          }}
          className="p-4 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 transition-all text-left group cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg w-fit group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Droplet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-2.5">Air Minum Galon</h4>
            <p className="text-[11px] text-slate-500 mt-1">Refill galon Aqua 19L &amp; penggantian dispenser ruang guru &amp; kelas</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-cyan-600">
            <span>Buka Formulir</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

      </div>
    </Modal>
  );
};

