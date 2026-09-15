import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { ServiceRequest, MasterUnit, EmailReportData, EmailNotificationLog } from '../../types';
import { 
  generateOrderCompletionEmail, 
  getGmailComposeUrl, 
  getMailtoUrl,
  saveEmailNotificationLog,
  resolveUnitHeadInfo,
  RegisteredEmailOption
} from '../../services/emailService';
import { useApp } from '../../context/AppContext';
import { 
  Mail, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  User as UserIcon, 
  CheckCircle2,
  Building,
  Info,
  Edit3,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  unitObj?: MasterUnit;
  operatorName?: string;
  onMarkSent?: (requestId: string, recipient: string) => void;
}

export const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  request,
  unitObj,
  operatorName,
  onMarkSent
}) => {
  const { units, users, currentUser } = useApp();
  const effectiveOperator = operatorName || currentUser?.name || 'Admin Resources Room';

  // Resolve accurate registered head info
  const resolution = useMemo(() => {
    if (!request) return null;
    return resolveUnitHeadInfo(request.unit, units, users);
  }, [request?.unit, units, users]);

  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [ccEmail, setCcEmail] = useState<string>('');
  const [isEditingRecipient, setIsEditingRecipient] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  const [sentSuccess, setSentSuccess] = useState(false);

  // Sync state whenever request or resolution changes
  useEffect(() => {
    if (resolution && request) {
      // Use existing sent recipient or primary registered email
      const initialEmail = request.emailSentRecipient || resolution.primaryEmail;
      setRecipientEmail(initialEmail);
      setRecipientName(resolution.headName);
      setCcEmail([request.userEmail, 'resources.room@lazuardi.sch.id'].filter(Boolean).join(', '));
      setIsEditingRecipient(false);
      setSentSuccess(false);
    }
  }, [request?.id, request?.emailSentRecipient, resolution]);

  if (!request || !resolution) return null;

  // Generate real-time email report based on current selected/edited recipient
  const emailData: EmailReportData = generateOrderCompletionEmail(
    request,
    resolution.matchedUnit || unitObj,
    effectiveOperator,
    users,
    {
      email: recipientEmail || resolution.primaryEmail,
      name: recipientName || resolution.headName,
      cc: ccEmail
    }
  );

  const handleSelectOption = (opt: RegisteredEmailOption) => {
    setRecipientEmail(opt.email);
    setRecipientName(opt.name);
    setIsEditingRecipient(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailData.plainBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  const handleOpenGmail = () => {
    const url = getGmailComposeUrl(emailData);
    window.open(url, '_blank', 'noopener,noreferrer');
    recordLog('gmail');
  };

  const handleOpenMailto = () => {
    const url = getMailtoUrl(emailData);
    window.location.href = url;
    recordLog('mailto');
  };

  const recordLog = (method: 'gmail' | 'mailto' | 'direct') => {
    const log: EmailNotificationLog = {
      id: `elog-${Date.now()}`,
      requestId: request.id,
      requestNumber: request.requestNumber,
      serviceType: request.serviceType,
      unit: request.unit,
      recipientEmail: emailData.to,
      recipientName: emailData.toName,
      subject: emailData.subject,
      sentAt: new Date().toISOString(),
      sentBy: effectiveOperator,
      method,
      status: 'Terkirim',
      bodyPreview: emailData.plainBody.slice(0, 150) + '...'
    };

    saveEmailNotificationLog(log);
    setSentSuccess(true);
    if (onMarkSent) {
      onMarkSent(request.id, emailData.to);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kirim Laporan Order ke Kepala Unit (Email)"
      subtitle={`No. Transaksi: ${request.requestNumber} • Unit Pemohon: ${request.unit}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">

        {/* Status Notification Banner */}
        {request.emailSentToHead || sentSuccess ? (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-emerald-900 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-sm">Laporan Telah Dikirimkan ke Kepala Unit</span>
                <span className="text-emerald-700">
                  Ditujukan ke <strong>{emailData.to}</strong> ({emailData.toName}) {request.emailSentDate ? `pada ${new Date(request.emailSentDate).toLocaleString('id-ID')}` : 'baru saja'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-md shrink-0">
              ✓ Terkirim
            </span>
          </div>
        ) : (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-teal-950 text-xs">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Pemberitahuan Laporan Penyelesaian Order</span>
              <span>
                Sistem secara otomatis mendeteksi alamat email resmi Kepala/Pimpinan Unit dari database pengguna dan master unit yang terdaftar.
              </span>
            </div>
          </div>
        )}

        {/* RECIPIENT CONFIGURATION CARD */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
          
          {/* Header Row: Label and Verified Indicator */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Tujuan Pengiriman: Kepala / Pimpinan Unit {resolution.unitName}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsEditingRecipient(!isEditingRecipient)}
              className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:text-teal-950 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingRecipient ? 'Tutup Pengaturan Alamat' : 'Ubah / Sesuaikan Alamat'}</span>
            </button>
          </div>

          {/* Registered Email Quick Selectors */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Pilihan Alamat Email Terdaftar Sesuai Sistem:
            </span>
            <div className="flex flex-wrap gap-2">
              {resolution.options.map((opt, idx) => {
                const isSelected = recipientEmail.toLowerCase().trim() === opt.email.toLowerCase().trim();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 text-xs ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-xs ring-1 ring-teal-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-full ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900">{opt.name}</strong>
                        {opt.isRecommended && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 bg-teal-100 text-teal-800 font-bold rounded">
                            Utama
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-teal-700 font-semibold">{opt.email}</div>
                      <span className="text-[10px] text-slate-500 block">{opt.roleOrTitle}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 ml-1 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Editable Inputs (if toggled) */}
          {isEditingRecipient && (
            <div className="p-3 bg-white border border-teal-300 rounded-lg space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px]">Ketik / Sesuaikan Manual Alamat Penerima:</span>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientEmail(resolution.primaryEmail);
                    setRecipientName(resolution.headName);
                  }}
                  className="text-[10px] text-teal-700 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Default Terdaftar</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-bold">Nama Pimpinan / Kepala Unit:</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Nurul Hidayah"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-bold">Alamat Email Penerima (@lazuardi.sch.id):</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Contoh: nurul.manager@lazuardi.sch.id"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-teal-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary Current Active Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2 border-t border-slate-200">
            <span className="sm:col-span-2 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Penerima (To):</span>
            <div className="sm:col-span-10 flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-teal-100 text-teal-900 font-bold rounded-md border border-teal-200 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-teal-700" />
                <span>{emailData.toName}</span>
              </span>
              <span className="font-mono text-teal-950 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">
                {emailData.to}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <span className="sm:col-span-2 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Tembusan (CC):</span>
            <div className="sm:col-span-10 flex items-center flex-wrap gap-2">
              <input
                type="text"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 text-xs w-full max-w-md focus:outline-hidden focus:border-teal-500"
                placeholder="pemohon@lazuardi.sch.id, resources.room@lazuardi.sch.id"
              />
              <span className="text-[11px] text-slate-500 italic">
                (Pemohon & Arsip RR)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <span className="sm:col-span-2 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Subjek:</span>
            <div className="sm:col-span-10 font-bold text-slate-800 bg-white px-2.5 py-1.5 rounded border border-slate-200 truncate">
              {emailData.subject}
            </div>
          </div>

        </div>

        {/* Tab Selector for Preview */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                activeTab === 'preview' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pratinjau Teks Laporan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                activeTab === 'html' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tampilan Resmi HTML
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Teks Laporan</span>
              </>
            )}
          </button>
        </div>

        {/* Content Box */}
        {activeTab === 'preview' ? (
          <div className="relative">
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11.5px] rounded-xl overflow-x-auto max-h-64 leading-relaxed border border-slate-800 whitespace-pre-wrap selection:bg-teal-700 selection:text-white">
              {emailData.plainBody}
            </pre>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white p-4">
            <div dangerouslySetInnerHTML={{ __html: emailData.htmlBody }} />
          </div>
        )}

        {/* DISPATCH ACTION BUTTONS */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-teal-700" />
                <span>Kirim Laporan Resmi ke Alamat Terdaftar</span>
              </h4>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Alamat tujuan pengiriman aktif: <strong>{emailData.to}</strong> ({emailData.toName})
              </p>
            </div>
            {sentSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Pengiriman dicatat
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Gmail Web */}
            <button
              type="button"
              onClick={handleOpenGmail}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" />
                <span>Buka di Google Mail</span>
              </div>
              <span className="text-[10px] font-normal opacity-90">Kirim via Akun Sekolah (@lazuardi.sch.id)</span>
            </button>

            {/* 2. Mail Client */}
            <button
              type="button"
              onClick={handleOpenMailto}
              className="p-3 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Aplikasi Email (Mailto)</span>
              </div>
              <span className="text-[10px] font-normal opacity-90">Outlook / Apple Mail / Thunderbird</span>
            </button>

            {/* 3. Mark Sent Manually */}
            <button
              type="button"
              onClick={() => recordLog('direct')}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tandai Terkirim Manual</span>
              </div>
              <span className="text-[10px] font-normal text-slate-500">Simpan status pengiriman</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Unit: <strong>{resolution.unitName}</strong> • Email Tujuan: <strong>{emailData.to}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-xs text-slate-700 cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </Modal>
  );
};
