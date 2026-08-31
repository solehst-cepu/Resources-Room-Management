import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Shield, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Search,
  Mail,
  HelpCircle,
  AlertCircle,
  School,
  KeyRound,
  ExternalLink,
  ChevronRight,
  LogIn,
  X,
  UserCheck
} from 'lucide-react';
import { RoleBadge } from '../components/common/Badge';

export const LoginView: React.FC = () => {
  const { users, login, loginWithGoogleEmail } = useApp();
  
  // Login Mode: 'google' (default, passwordless SSO) or 'manual' (username & password)
  const [authMode, setAuthMode] = useState<'google' | 'manual'>('google');
  
  // Google SSO state
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Manual Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [manualError, setManualError] = useState('');

  // Handle Google Fast Login via Typed Email
  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleAuthError(null);
    setIsVerifyingGoogle(true);

    setTimeout(() => {
      const res = loginWithGoogleEmail(googleEmailInput);
      setIsVerifyingGoogle(false);
      if (!res.success && res.message) {
        setGoogleAuthError(res.message);
      }
    }, 200);
  };

  // Handle 1-Click Select of an Account from Registered List
  const handleSelectAccount = (email: string) => {
    setGoogleAuthError(null);
    setIsVerifyingGoogle(true);
    setTimeout(() => {
      const res = loginWithGoogleEmail(email);
      setIsVerifyingGoogle(false);
      if (!res.success && res.message) {
        setGoogleAuthError(res.message);
      }
    }, 150);
  };

  // Handle Manual Password Login
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    const ok = login(username, password);
    if (!ok) {
      setManualError('Username atau kata sandi tidak cocok. Gunakan opsi masuk cepat Google Sekolah di atas.');
    }
  };

  // Filtered active registered users for the quick Google picker
  const registeredGoogleUsers = users.filter(u => {
    if (u.status === 'inactive') return false;
    const q = googleSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      u.unit.toLowerCase().includes(q) || 
      u.department.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-blue-600 selection:text-white">
      
      {/* Main Login Card */}
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Branding Column */}
        <div className="lg:col-span-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            {/* School Brand & Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xl shadow-md border border-blue-400/30">
                L
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider text-white uppercase leading-none">
                  Sekolah Lazuardi
                </h1>
                <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">
                  Global Compassionate School
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <School className="w-3.5 h-3.5" />
                <span>Resources Room Portal</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">
                Sistem Layanan Logistik &amp; ATK Sekolah
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Akses cepat tanpa password khusus guru, staf, &amp; manajemen dengan akun Google resmi <strong className="text-blue-300">@lazuardi.sch.id</strong>.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-6 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Single Sign-On Akun Sekolah</span>
                  <span className="text-[11px] text-slate-400">Pencocokan otomatis dengan Master Data Pengguna.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Layanan Terintegrasi</span>
                  <span className="text-[11px] text-slate-400">Pengajuan ATK, seragam, fotocopy/cetak, &amp; air galon.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Langsung Isi Formulir</span>
                  <span className="text-[11px] text-slate-400">Unit kerja &amp; pemohon langsung terisi otomatis.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>© 2026 Yayasan Lazuardi</span>
            <span className="font-mono text-slate-600">v2.5.0</span>
          </div>
        </div>

        {/* Right Authentication Column */}
        <div className="lg:col-span-8 p-6 sm:p-8 bg-white flex flex-col justify-between space-y-5">
          <div>
            {/* Header & Mode Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-blue-600" />
                  <span>Menu Masuk / Login</span>
                </h3>
                <p className="text-xs text-slate-500">Pilih metode autentikasi akun Sekolah Lazuardi</p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setAuthMode('google')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    authMode === 'google'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {/* Google 'G' Icon */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Akun Google Sekolah</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    authMode === 'manual'
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Manual (Password)</span>
                </button>
              </div>
            </div>

            {/* TAB 1: GOOGLE WORKSPACE SSO (@lazuardi.sch.id) */}
            {authMode === 'google' && (
              <div className="space-y-4 pt-1">
                {/* Information Banner */}
                <div className="p-3 bg-blue-50/90 border border-blue-200/90 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 shadow-xs">
                  <div className="p-1 bg-blue-600 text-white rounded-md shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="font-bold block text-blue-950">Akses Cepat Single Sign-On (SSO)</strong>
                    <span className="text-blue-800 text-[11px]">
                      Ketik email Google Sekolah Anda atau gunakan fitur pencarian akun di bawah untuk masuk secara instan tanpa perlu kata sandi.
                    </span>
                  </div>
                </div>

                {/* Error Banner */}
                {googleAuthError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Gagal Masuk</span>
                      <span>{googleAuthError}</span>
                    </div>
                  </div>
                )}

                {/* Google Email Input Form */}
                <form onSubmit={handleGoogleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ketik Email Google Sekolah (@lazuardi.sch.id)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={googleEmailInput}
                          onChange={(e) => {
                            setGoogleEmailInput(e.target.value);
                            setGoogleAuthError(null);
                          }}
                          placeholder="contoh: budi.guru@lazuardi.sch.id atau budi.guru"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isVerifyingGoogle}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isVerifyingGoogle ? (
                          <span>Memverifikasi...</span>
                        ) : (
                          <>
                            <span>Masuk Cepat</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Account Search / Quick Finder (List hidden by default, visible upon searching) */}
                <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pencarian Akun Terdaftar:</span>
                    </label>
                    {googleSearchQuery && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {registeredGoogleUsers.length} akun ditemukan
                      </span>
                    )}
                  </div>

                  {/* Search input field */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={googleSearchQuery}
                      onChange={(e) => setGoogleSearchQuery(e.target.value)}
                      placeholder="Ketik nama, email, atau unit untuk mencari akun Anda..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {googleSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setGoogleSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                        title="Hapus pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dynamic Search Results: only shown when user searches */}
                  {googleSearchQuery.trim() ? (
                    <div className="space-y-2 pt-1">
                      {registeredGoogleUsers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="font-semibold text-slate-700">Tidak ada akun yang sesuai</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tidak ditemukan akun dengan kata kunci "{googleSearchQuery}". Pastikan nama atau email terdaftar di Master Pengguna.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {registeredGoogleUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectAccount(u.email)}
                              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 bg-white transition-all text-left group cursor-pointer flex items-center justify-between gap-2 shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                    {u.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <strong className="text-xs text-slate-900 block truncate group-hover:text-blue-700 font-semibold">
                                    {u.name}
                                  </strong>
                                  <p className="text-[10px] text-slate-500 truncate font-mono">
                                    {u.email}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500">
                                    <span className="font-semibold text-slate-600">{u.unit}</span>
                                    <span>•</span>
                                    <span className="truncate">{u.department}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-1">
                                <RoleBadge role={u.role} />
                                <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                  Masuk <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-center flex items-center justify-center gap-2 text-slate-500 text-[11px]">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ketik nama, email, atau unit di atas untuk mencari dan memilih akun dengan cepat.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL LOGIN (USERNAME & PASSWORD) */}
            {authMode === 'manual' && (
              <div className="space-y-4 pt-1">
                {manualError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{manualError}</span>
                  </div>
                )}

                <form onSubmit={handleManualLogin} className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Username / Email Master</label>
                      <span className="text-[10px] text-slate-400">Contoh: admin.super, resources.room, budi.guru</span>
                    </div>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Masukkan username atau email..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kata Sandi</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <span>Masuk dengan Kata Sandi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer Assistance */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Email belum terdaftar? Tambahkan melalui menu Pengaturan &gt; Data Pengguna.</span>
            </div>
            <span className="text-slate-500 font-semibold">Domain: lazuardi.sch.id</span>
          </div>

        </div>

      </div>

    </div>
  );
};
