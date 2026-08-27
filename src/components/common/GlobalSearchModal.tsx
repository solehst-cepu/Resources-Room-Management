import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, FileText, Droplet, ArrowRight, Printer, Sparkles } from 'lucide-react';
import { StatusBadge } from './Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { requests, waterLocations } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingRequests = cleanQuery ? requests.filter(
    r => r.requestNumber.toLowerCase().includes(cleanQuery) || 
         r.userName.toLowerCase().includes(cleanQuery) || 
         r.unit.toLowerCase().includes(cleanQuery) || 
         r.purpose.toLowerCase().includes(cleanQuery)
  ).slice(0, 5) : [];

  const matchingWater = cleanQuery ? waterLocations.filter(
    w => w.roomName.toLowerCase().includes(cleanQuery) || w.unit.toLowerCase().includes(cleanQuery)
  ).slice(0, 4) : [];

  const hasResults = matchingRequests.length > 0 || matchingWater.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            placeholder="Ketik nomor tiket (FC-2026-..., AIR-2026-...), nama pemohon, atau ruangan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!cleanQuery ? (
            <div className="py-8 text-center">
              <p className="text-xs font-semibold text-slate-400">Pencarian Cepat Sistem Resources Room</p>
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                <button 
                  onClick={() => setQuery('Foto')} 
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-slate-600 cursor-pointer"
                >
                  Foto Copy
                </button>
                <button 
                  onClick={() => setQuery('Laminating')} 
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-slate-600 cursor-pointer"
                >
                  Laminating
                </button>
                <button 
                  onClick={() => setQuery('Galon')} 
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-slate-600 cursor-pointer"
                >
                  Air Galon
                </button>
                <button 
                  onClick={() => setQuery('SMP')} 
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-slate-600 cursor-pointer"
                >
                  Unit SMP
                </button>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada hasil yang cocok dengan &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Requests Matching */}
              {matchingRequests.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Permintaan Layanan
                  </h4>
                  <div className="space-y-1.5">
                    {matchingRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => {
                          if (req.serviceType === 'fotocopy') {
                            onNavigate('layanan_fotocopy');
                          } else if (req.serviceType === 'laminating') {
                            onNavigate('layanan_laminating');
                          } else if (req.serviceType === 'air_galon') {
                            onNavigate('layanan_air');
                          } else {
                            onNavigate('permintaan_all');
                          }
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono">{req.requestNumber}</span>
                            <StatusBadge status={req.status} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{req.userName} ({req.unit}) • {req.purpose}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Water Matching */}
              {matchingWater.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                    Titik Dispenser Air Galon
                  </h4>
                  <div className="space-y-1.5">
                    {matchingWater.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          onNavigate('layanan_air');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{w.roomName}</p>
                          <p className="text-[11px] text-slate-500">{w.unit} • {w.floor} • {w.dispenserCount} Dispenser</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Tutup [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
