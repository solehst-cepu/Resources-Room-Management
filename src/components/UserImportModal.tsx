import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Users,
  Check,
  AlertTriangle
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: Omit<User, 'id'>[]) => number;
  existingUsers: User[];
  units: { code: string; name: string }[];
}

interface ParsedUserRow {
  name: string;
  email: string;
  username: string;
  role: UserRole;
  unit: string;
  department: string;
  phone?: string;
  status: 'Aktif' | 'Nonaktif';
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export const UserImportModal: React.FC<UserImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingUsers,
  units
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle');
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Download Template CSV
  const handleDownloadTemplate = () => {
    const headers = 'nama_lengkap,email,username,role,unit_sekolah,departemen,no_telepon,status';
    const exampleRows = [
      'Ahmad Fauzi S.Pd,ahmad.fauzi@lazuardi.sch.id,ahmad.fauzi,user,SMP,Guru,081234567891,Aktif',
      'Siti Rahmawati M.Pd,siti.rahmawati@lazuardi.sch.id,siti.rahmawati,manager,SD,Manajemen,081298765432,Aktif',
      'Budi Santoso,budi.santoso@lazuardi.sch.id,budi.santoso,admin_rr,SMP,Resources Room,081345678901,Aktif',
      'Ratna Dewi S.Si,ratna.dewi@lazuardi.sch.id,ratna.dewi,user,SMA,Guru,081567890123,Aktif',
      'Hendra Wijaya,hendra.wijaya@lazuardi.sch.id,hendra.wijaya,user,TK,Tata Usaha,081789012345,Aktif'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...exampleRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Pengguna_Lazuardi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV text
  const parseCSV = (csvText: string) => {
    try {
      // Normalize line breaks
      const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      const filteredLines = lines.filter(l => l.trim().length > 0);

      if (filteredLines.length < 2) {
        setErrorMsg('File CSV kosong atau tidak memiliki baris data');
        setImportStatus('error');
        return;
      }

      // Check header
      const headerLine = filteredLines[0].toLowerCase();
      const delimiter = headerLine.includes(';') ? ';' : ',';
      
      const existingEmailSet = new Set(existingUsers.map(u => u.email.toLowerCase().trim()));
      const validRoles = ['super_admin', 'admin_rr', 'manager', 'user'];
      const validUnitCodes = new Set(units.map(u => u.code.toLowerCase()));

      const rows: ParsedUserRow[] = [];
      const currentBatchEmails = new Set<string>();

      for (let i = 1; i < filteredLines.length; i++) {
        const line = filteredLines[i].trim();
        if (!line) continue;

        // Simple CSV splitter handling quotes
        const rawCols = splitCSVLine(line, delimiter);
        if (rawCols.length < 3) continue;

        const name = (rawCols[0] || '').trim();
        const email = (rawCols[1] || '').trim();
        const username = (rawCols[2] || '').trim() || email.split('@')[0];
        
        let roleInput = (rawCols[3] || 'user').trim().toLowerCase();
        // Map common aliases
        if (roleInput === 'guru' || roleInput === 'staff' || roleInput === 'staf' || roleInput === 'guru / staff') roleInput = 'user';
        if (roleInput === 'kepala unit' || roleInput === 'pimpinan' || roleInput === 'kepsek' || roleInput === 'kepala sekolah') roleInput = 'manager';
        if (roleInput === 'admin' || roleInput === 'operator' || roleInput === 'admin rr') roleInput = 'admin_rr';
        if (roleInput === 'super admin' || roleInput === 'superadmin') roleInput = 'super_admin';

        const role: UserRole = (validRoles.includes(roleInput) ? roleInput : 'user') as UserRole;
        const unit = (rawCols[4] || 'SMP').trim().toUpperCase();
        const department = (rawCols[5] || 'Guru').trim();
        const phone = (rawCols[6] || '').trim();
        const statusInput = (rawCols[7] || 'Aktif').trim().toLowerCase();
        const status = statusInput === 'nonaktif' || statusInput === 'inactive' ? 'Nonaktif' : 'Aktif';

        const errors: string[] = [];

        if (!name) errors.push('Nama wajib diisi');
        if (!email) {
          errors.push('Email wajib diisi');
        } else if (!email.includes('@')) {
          errors.push('Format email tidak valid');
        }

        const isDuplicateExisting = email ? existingEmailSet.has(email.toLowerCase()) : false;
        const isDuplicateBatch = email ? currentBatchEmails.has(email.toLowerCase()) : false;

        if (isDuplicateExisting) {
          errors.push('Email sudah terdaftar di sistem');
        }
        if (isDuplicateBatch) {
          errors.push('Email duplikat dalam file CSV');
        }

        if (email) {
          currentBatchEmails.add(email.toLowerCase());
        }

        rows.push({
          name,
          email,
          username,
          role,
          unit,
          department,
          phone,
          status,
          isValid: errors.length === 0,
          errors,
          isDuplicate: isDuplicateExisting || isDuplicateBatch
        });
      }

      if (rows.length === 0) {
        setErrorMsg('Tidak ada baris data valid yang terbaca dari berkas CSV');
        setImportStatus('error');
        return;
      }

      setParsedRows(rows);
      setImportStatus('preview');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg('Gagal memproses berkas CSV. Pastikan format CSV terstandar.');
      setImportStatus('error');
    }
  };

  // Helper split line by delimiter respecting double quotes
  const splitCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSV(text);
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca berkas');
      setImportStatus('error');
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Execute Import
  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const payload: Omit<User, 'id'>[] = validRows.map(r => ({
      name: r.name,
      email: r.email,
      username: r.username,
      password: 'password123',
      role: r.role,
      unit: r.unit,
      department: r.department,
      phone: r.phone || '',
      status: r.status,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=80`
    }));

    const count = onImport(payload);
    setImportedCount(count);
    setImportStatus('success');
  };

  // Reset Modal
  const handleResetModal = () => {
    setParsedRows([]);
    setFileName('');
    setImportStatus('idle');
    setImportedCount(0);
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Data Pengguna dari CSV</h3>
              <p className="text-xs text-slate-500">Unggah berkas spreadsheet CSV untuk menambahkan akun guru &amp; staf secara massal</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: DOWNLOAD TEMPLATE & INSTRUCTIONS */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-950">
                <span className="font-bold block">Gunakan Format Template Resmi Lazuardi:</span>
                <span className="text-blue-800 text-[11px] leading-relaxed">
                  Kolom yang diperlukan: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">nama_lengkap, email, username, role, unit_sekolah, departemen, no_telepon, status</code>
                </span>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Unduh Template CSV</span>
            </button>
          </div>

          {/* STATE: SUCCESS SCREEN */}
          {importStatus === 'success' ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Import Pengguna Berhasil!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Sebanyak <strong>{importedCount} akun pengguna baru</strong> telah berhasil ditambahkan dan disinkronkan ke dalam sistem Lazuardi Resources Room.
              </p>
              <div className="pt-3 flex justify-center gap-2">
                <button
                  onClick={() => {
                    handleResetModal();
                    onClose();
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 2: UPLOAD DROPZONE */}
              {importStatus === 'idle' || importStatus === 'error' ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Klik atau Seret Berkas CSV ke Sini
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Mendukung file <code className="font-mono font-bold text-slate-700">.csv</code> hasil ekspor Excel atau Google Sheets.
                  </p>
                </div>
              ) : null}

              {/* ERROR MESSAGE IF ANY */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 3: PREVIEW TABLE */}
              {importStatus === 'preview' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-800">{fileName}</span>
                      <span className="text-slate-500 font-medium">({parsedRows.length} baris data)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {validCount} Siap Import
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {invalidCount} Bermasalah (Dilewati)
                        </span>
                      )}
                      <button
                        onClick={handleResetModal}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline ml-1 cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Nama &amp; Email</th>
                          <th className="p-2.5">Role</th>
                          <th className="p-2.5">Unit &amp; Dept</th>
                          <th className="p-2.5">Status Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/70' : 'bg-rose-50/40'}>
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5">
                              <strong className="text-slate-900 block font-semibold">{row.name || '(Kosong)'}</strong>
                              <span className="text-[11px] text-slate-500 font-mono">{row.email || '(Kosong)'}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded text-[10px]">
                                {row.role}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 font-medium">
                              <div>{row.unit}</div>
                              <span className="text-[10px] text-slate-400">{row.department}</span>
                            </td>
                            <td className="p-2.5">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Valid
                                </span>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Dilewati
                                  </span>
                                  <p className="text-[10px] text-rose-600 mt-0.5">{row.errors.join(', ')}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        {importStatus !== 'success' && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => {
                handleResetModal();
                onClose();
              }}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>

            {importStatus === 'preview' && (
              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  validCount > 0 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Import {validCount} Pengguna ke Sistem</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
