import React, { useState } from 'react';
import { Modal } from './Modal';
import { ServiceRequest, MasterUnit, EmailReportData, EmailNotificationLog } from '../../types';
import { 
  generateOrderCompletionEmail, 
  getGmailComposeUrl, 
  getMailtoUrl,
  saveEmailNotificationLog 
} from '../../services/emailService';
import { 
  Mail, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle2,
  Building,
  Info
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
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'details'>('preview');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!request) return null;

  const emailData: EmailReportData = generateOrderCompletionEmail(request, unitObj, operatorName);

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
      sentBy: operatorName || 'Admin Resources Room',
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
      subtitle={`No. Transaksi: ${request.requestNumber} • Unit: ${request.unit}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">

        {/* Status Notification Banner */}
        {request.emailSentToHead || sentSuccess ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-emerald-900 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-sm">Laporan Telah Dikirimkan ke Kepala Unit</span>
                <span className="text-emerald-700">
                  Terkirim ke <strong>{emailData.to}</strong> {request.emailSentDate ? `pada ${new Date(request.emailSentDate).toLocaleString('id-ID')}` : 'baru saja'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-md">
              ✓ Terkirim
            </span>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Pemberitahuan Laporan Penyelesaian Order</span>
              <span>
                Order telah berstatus <strong>Selesai</strong>. Kirimkan laporan rincian pengerjaan dan serah terima ini kepada Kepala Unit sebagai arsip resmi.
              </span>
            </div>
          </div>
        )}

        {/* Email Header Meta Fields */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <span className="sm:col-span-2 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Kepada:</span>
            <div className="sm:col-span-10 flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-teal-100 text-teal-900 font-bold rounded-md border border-teal-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-700" />
                <span>{emailData.toName}</span>
              </span>
              <span className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                {emailData.to}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <span className="sm:col-span-2 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Tembusan (CC):</span>
            <div className="sm:col-span-10 flex items-center flex-wrap gap-2">
              <span className="text-slate-700 font-mono bg-white px-2 py-1 rounded border border-slate-200">
                {emailData.cc}
              </span>
              <span className="text-[11px] text-slate-500 italic">
                (Pemohon & Arsip RR)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1 border-t border-slate-200">
            <span className="sm:col-span-2 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Subjek:</span>
            <div className="sm:col-span-10 font-bold text-slate-800 bg-white px-2.5 py-1.5 rounded border border-slate-200 truncate">
              {emailData.subject}
            </div>
          </div>

        </div>

        {/* Tab Selector */}
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
                <span>Salin Pesan</span>
              </>
            )}
          </button>
        </div>

        {/* Content Box */}
        {activeTab === 'preview' ? (
          <div className="relative">
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11.5px] rounded-xl overflow-x-auto max-h-72 leading-relaxed border border-slate-800 whitespace-pre-wrap selection:bg-teal-700 selection:text-white">
              {emailData.plainBody}
            </pre>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-white p-4">
            <div dangerouslySetInnerHTML={{ __html: emailData.htmlBody }} />
          </div>
        )}

        {/* Dispatch Action Buttons */}
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-teal-700" />
                <span>Metode Pengiriman Email Lazuardi</span>
              </h4>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Pilih opsi pengiriman langsung ke alamat <strong>{emailData.to}</strong>:
              </p>
            </div>
            {sentSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Notifikasi dicatat
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
              <span className="text-[10px] font-normal text-slate-500">Simpan status pemberitahuan</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="text-[11px] text-slate-500">
            Ditujukan ke: <strong>{emailData.to}</strong> ({unitObj?.name || request.unit})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-xs text-slate-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </Modal>
  );
};
