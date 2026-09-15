import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, RoleConfig, RolePermissions, MasterUnit, MasterDepartment, WaterLocation } from '../types';
import { 
  Settings, 
  Users, 
  Building, 
  Shield, 
  ShieldCheck,
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  Info,
  Sliders,
  Sparkles,
  Droplet,
  ClipboardCheck,
  Package,
  Upload,
  Download,
  FileSpreadsheet,
  KeyRound,
  Key,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Database,
  Server,
  Copy,
  ExternalLink,
  AlertTriangle,
  Zap,
  ArrowRight,
  Cloud,
  CheckCircle,
  Mail
} from 'lucide-react';
import { RoleBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { UserImportModal } from '../components/UserImportModal';
import { EmailNotificationLogsTab } from '../components/common/EmailNotificationLogsTab';
import { SUPABASE_CONFIG_SCHEMA_SQL } from '../lib/supabaseSqlSchema';
import { PROJECT_METADATA } from '../lib/supabase';

interface SettingsViewProps {
  initialTab?: 'roles' | 'users' | 'units' | 'galon' | 'database' | 'system' | 'email_logs';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'roles' }) => {
  const { 
    currentUser, 
    users, 
    roleConfigs,
    units, 
    departments, 
    items,
    requests,
    waterLocations,
    waterInventory,
    waterProviderLogs,
    waterOpnameRecords,
    supabaseStatus,
    dbInfo,
    isSyncingToSupabase,
    syncAllToSupabase,
    refreshSupabaseConnection,
    addWaterLocation,
    updateWaterLocation,
    deleteWaterLocation,
    updateInitialWaterAssets,
    addWaterProviderDelivery,
    performWaterStockOpname,
    addUser, 
    addUsers,
    updateUser, 
    deleteUser,
    resetUserPassword,
    updateRolePermissions,
    resetRolePermissions,
    addUnit,
    updateUnit,
    deleteUnit,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'units' | 'galon' | 'database' | 'system' | 'email_logs'>(initialTab);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Selected Role for Permission Configurator
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>('super_admin');
  const [rolePermissionsDraft, setRolePermissionsDraft] = useState<RolePermissions | null>(null);
  const [isRoleDirty, setIsRoleDirty] = useState(false);

  // User Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userUnitFilter, setUserUnitFilter] = useState<string>('all');

  // User Modals & Password State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserImportModalOpen, setIsUserImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  
  // Dedicated Quick Password Reset Modal
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState<User | null>(null);
  const [targetNewPassword, setTargetNewPassword] = useState('password123');
  const [showModalPassword, setShowModalPassword] = useState(false);

  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    password: 'password123',
    role: 'user' as UserRole,
    unit: 'SMP',
    department: 'Guru',
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });

  // Unit State & Modals
  const [unitSearch, setUnitSearch] = useState('');
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MasterUnit | null>(null);
  const [unitForm, setUnitForm] = useState({
    code: '',
    name: '',
    headName: '',
    email: ''
  });
  const [deleteUnitConfirm, setDeleteUnitConfirm] = useState<MasterUnit | null>(null);

  // Department State & Modals
  const [deptSearch, setDeptSearch] = useState('');
  const [deptUnitFilter, setDeptUnitFilter] = useState<string>('all');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<MasterDepartment | null>(null);
  const [deptForm, setDeptForm] = useState({
    unitId: '',
    unitName: '',
    name: ''
  });
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState<MasterDepartment | null>(null);

  // Sub-tab in Galon Tab
  const [galonSubTab, setGalonSubTab] = useState<'titik' | 'inventori' | 'provider' | 'opname'>('titik');

  // Master Titik Galon States
  const [waterLocSearch, setWaterLocSearch] = useState('');
  const [waterLocUnitFilter, setWaterLocUnitFilter] = useState('all');
  const [waterLocDeptFilter, setWaterLocDeptFilter] = useState('all');
  const [waterLocStatusFilter, setWaterLocStatusFilter] = useState('all');
  const [isWaterLocModalOpen, setIsWaterLocModalOpen] = useState(false);
  const [editingWaterLoc, setEditingWaterLoc] = useState<WaterLocation | null>(null);
  const [deleteWaterLocConfirm, setDeleteWaterLocConfirm] = useState<WaterLocation | null>(null);

  const [waterLocForm, setWaterLocForm] = useState({
    code: '',
    unit: 'SMP',
    unitId: '',
    department: '',
    departmentId: '',
    roomName: '',
    building: '',
    floor: 'Lantai 2',
    dispenserCount: 1,
    dispenserBrand: 'Miyako WDP-300 Hot & Cool',
    activeGallons: 1,
    emptyGallons: 0,
    picName: '',
    status: 'Aktif' as 'Aktif' | 'Nonaktif' | 'Perbaikan Dispenser',
    notes: ''
  });

  // Keep permissions draft in sync when selecting a role or roleConfigs change
  useEffect(() => {
    const activeRoleConfig = roleConfigs.find(r => r.role === selectedRoleKey);
    if (activeRoleConfig) {
      setRolePermissionsDraft({ ...activeRoleConfig.permissions });
      setIsRoleDirty(false);
    }
  }, [selectedRoleKey, roleConfigs]);

  const handleTogglePermission = (key: keyof RolePermissions) => {
    if (!rolePermissionsDraft) return;
    setRolePermissionsDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
    setIsRoleDirty(true);
  };

  const handleSaveRolePermissions = () => {
    if (!rolePermissionsDraft) return;
    updateRolePermissions(selectedRoleKey, rolePermissionsDraft);
    setIsRoleDirty(false);
  };

  const handleResetRoleToDefault = () => {
    if (window.confirm('Kembalikan konfigurasi hak akses role ini ke pengaturan default Sekolah Lazuardi?')) {
      resetRolePermissions();
      setIsRoleDirty(false);
    }
  };

  const handleQuickChangeUserRole = (userId: string, newRole: UserRole) => {
    updateUser(userId, { role: newRole });
    const target = users.find(u => u.id === userId);
    showToast('success', 'Role Diperbarui', `Role ${target?.name} berhasil diubah menjadi ${newRole}`);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setShowFormPassword(false);
    setUserForm({
      username: '',
      name: '',
      email: '',
      password: 'password123',
      role: 'user',
      unit: units[0]?.code || 'SMP',
      department: departments[0]?.name || 'Guru',
      status: 'Aktif'
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPassword = userForm.password.trim() || 'password123';
    if (editingUser) {
      updateUser(editingUser.id, {
        ...userForm,
        password: finalPassword
      });
    } else {
      addUser({
        username: userForm.username.trim(),
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: finalPassword,
        role: userForm.role,
        unit: userForm.unit,
        department: userForm.department,
        status: userForm.status
      });
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setShowFormPassword(false);
    setUserForm({
      username: u.username || u.email.split('@')[0],
      name: u.name,
      email: u.email,
      password: u.password || 'password123',
      role: u.role,
      unit: u.unit,
      department: u.department,
      status: (u.status === 'active' || u.status === 'Aktif') ? 'Aktif' : 'Nonaktif'
    });
    setIsUserModalOpen(true);
  };

  const openResetPasswordModal = (u: User) => {
    setResetPasswordModalUser(u);
    setTargetNewPassword(u.password || 'password123');
    setShowModalPassword(false);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModalUser) return;
    const pwd = targetNewPassword.trim() || 'password123';
    resetUserPassword(resetPasswordModalUser.id, pwd);
    setResetPasswordModalUser(null);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let result = 'Lz';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Unit Handlers
  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({
      code: '',
      name: '',
      headName: '',
      email: ''
    });
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: MasterUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      code: unit.code,
      name: unit.name,
      headName: unit.headName,
      email: unit.email
    });
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.code.trim() || !unitForm.name.trim()) {
      showToast('error', 'Validasi Gagal', 'Kode dan Nama Unit wajib diisi');
      return;
    }

    if (editingUnit) {
      updateUnit(editingUnit.id, {
        code: unitForm.code.trim().toUpperCase(),
        name: unitForm.name.trim(),
        headName: unitForm.headName.trim(),
        email: unitForm.email.trim()
      });
    } else {
      addUnit({
        code: unitForm.code.trim().toUpperCase(),
        name: unitForm.name.trim(),
        headName: unitForm.headName.trim(),
        email: unitForm.email.trim()
      });
    }
    setIsUnitModalOpen(false);
    setEditingUnit(null);
  };

  const handleConfirmDeleteUnit = () => {
    if (!deleteUnitConfirm) return;
    deleteUnit(deleteUnitConfirm.id);
    setDeleteUnitConfirm(null);
  };

  // Department Handlers
  const handleOpenAddDept = () => {
    setEditingDept(null);
    const defaultUnit = units[0];
    setDeptForm({
      unitId: defaultUnit ? defaultUnit.id : '',
      unitName: defaultUnit ? defaultUnit.name : '',
      name: ''
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: MasterDepartment) => {
    setEditingDept(dept);
    setDeptForm({
      unitId: dept.unitId,
      unitName: dept.unitName,
      name: dept.name
    });
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama Departemen wajib diisi');
      return;
    }

    const selectedUnit = units.find(u => u.id === deptForm.unitId) || units.find(u => u.name === deptForm.unitName) || units[0];
    const finalUnitName = selectedUnit ? selectedUnit.name : (deptForm.unitName || 'Unit');
    const finalUnitId = selectedUnit ? selectedUnit.id : (deptForm.unitId || 'unit-default');

    if (editingDept) {
      updateDepartment(editingDept.id, {
        unitId: finalUnitId,
        unitName: finalUnitName,
        name: deptForm.name.trim()
      });
    } else {
      addDepartment({
        unitId: finalUnitId,
        unitName: finalUnitName,
        name: deptForm.name.trim()
      });
    }
    setIsDeptModalOpen(false);
    setEditingDept(null);
  };

  const handleConfirmDeleteDept = () => {
    if (!deleteDeptConfirm) return;
    deleteDepartment(deleteDeptConfirm.id);
    setDeleteDeptConfirm(null);
  };

  // Master Titik Galon Handlers
  const handleOpenAddWaterLoc = () => {
    setEditingWaterLoc(null);
    const defaultUnit = units[0]?.name || 'SMP';
    const defaultUnitObj = units.find(u => u.name === defaultUnit) || units[0];
    const deptForUnit = departments.find(d => d.unitName === defaultUnit || d.unitId === defaultUnitObj?.id);
    const unitPrefix = (defaultUnitObj?.code || defaultUnit).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const countInUnit = waterLocations.filter(l => l.unit === defaultUnit).length + 1;
    const generatedCode = `TG-${unitPrefix}-${countInUnit.toString().padStart(2, '0')}`;

    setWaterLocForm({
      code: generatedCode,
      unit: defaultUnit,
      unitId: defaultUnitObj?.id || '',
      department: deptForUnit ? deptForUnit.name : '',
      departmentId: deptForUnit ? deptForUnit.id : '',
      roomName: '',
      building: `Gedung ${defaultUnit}`,
      floor: 'Lantai 1',
      dispenserCount: 1,
      dispenserBrand: 'Miyako WDP-300 Hot & Cool',
      activeGallons: 1,
      emptyGallons: 0,
      picName: '',
      status: 'Aktif',
      notes: ''
    });
    setIsWaterLocModalOpen(true);
  };

  const handleOpenEditWaterLoc = (loc: WaterLocation) => {
    setEditingWaterLoc(loc);
    setWaterLocForm({
      code: loc.code || `TG-${loc.unit.slice(0, 3).toUpperCase()}-01`,
      unit: loc.unit,
      unitId: loc.unitId || '',
      department: loc.department || '',
      departmentId: loc.departmentId || '',
      roomName: loc.roomName,
      building: loc.building || '',
      floor: loc.floor || 'Lantai 1',
      dispenserCount: loc.dispenserCount || 1,
      dispenserBrand: loc.dispenserBrand || '',
      activeGallons: loc.activeGallons || 1,
      emptyGallons: loc.emptyGallons || 0,
      picName: loc.picName || '',
      status: loc.status || 'Aktif',
      notes: loc.notes || ''
    });
    setIsWaterLocModalOpen(true);
  };

  const handleSaveWaterLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterLocForm.roomName.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama Ruangan / Titik Galon wajib diisi');
      return;
    }
    if (!waterLocForm.unit) {
      showToast('error', 'Validasi Gagal', 'Pilih Unit Sekolah');
      return;
    }

    const selectedUnitObj = units.find(u => u.name === waterLocForm.unit || u.code === waterLocForm.unit);
    const selectedDeptObj = departments.find(d => d.name === waterLocForm.department);

    if (editingWaterLoc) {
      updateWaterLocation(editingWaterLoc.id, {
        code: waterLocForm.code.trim(),
        unit: waterLocForm.unit,
        unitId: selectedUnitObj?.id || waterLocForm.unitId,
        department: waterLocForm.department,
        departmentId: selectedDeptObj?.id || waterLocForm.departmentId,
        roomName: waterLocForm.roomName.trim(),
        building: waterLocForm.building.trim(),
        floor: waterLocForm.floor.trim(),
        dispenserCount: Number(waterLocForm.dispenserCount) || 1,
        dispenserBrand: waterLocForm.dispenserBrand.trim(),
        activeGallons: Number(waterLocForm.activeGallons) || 1,
        emptyGallons: Number(waterLocForm.emptyGallons) || 0,
        picName: waterLocForm.picName.trim(),
        status: waterLocForm.status,
        notes: waterLocForm.notes.trim()
      });
    } else {
      addWaterLocation({
        code: waterLocForm.code.trim(),
        unit: waterLocForm.unit,
        unitId: selectedUnitObj?.id || waterLocForm.unitId,
        department: waterLocForm.department,
        departmentId: selectedDeptObj?.id || waterLocForm.departmentId,
        roomName: waterLocForm.roomName.trim(),
        building: waterLocForm.building.trim(),
        floor: waterLocForm.floor.trim(),
        dispenserCount: Number(waterLocForm.dispenserCount) || 1,
        dispenserBrand: waterLocForm.dispenserBrand.trim(),
        activeGallons: Number(waterLocForm.activeGallons) || 1,
        emptyGallons: Number(waterLocForm.emptyGallons) || 0,
        picName: waterLocForm.picName.trim(),
        status: waterLocForm.status,
        notes: waterLocForm.notes.trim(),
        lastRefillDate: new Date().toISOString().slice(0, 10)
      });
    }
    setIsWaterLocModalOpen(false);
    setEditingWaterLoc(null);
  };

  const handleConfirmDeleteWaterLoc = () => {
    if (!deleteWaterLocConfirm) return;
    deleteWaterLocation(deleteWaterLocConfirm.id);
    setDeleteWaterLocConfirm(null);
  };

  const handleExportWaterLocationsCSV = () => {
    const headers = ['Kode Titik', 'Unit', 'Departemen', 'Nama Ruangan', 'Gedung', 'Lantai', 'Jumlah Dispenser', 'Merk Dispenser', 'Galon Aktif', 'Galon Kosong', 'PIC Ruangan', 'Status', 'Catatan'];
    const rows = waterLocations.map(l => [
      `"${l.code || ''}"`,
      `"${l.unit}"`,
      `"${l.department || ''}"`,
      `"${l.roomName}"`,
      `"${l.building || ''}"`,
      `"${l.floor || ''}"`,
      l.dispenserCount || 1,
      `"${l.dispenserBrand || ''}"`,
      l.activeGallons || 1,
      l.emptyGallons || 0,
      `"${l.picName || ''}"`,
      `"${l.status || 'Aktif'}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Titik_Galon_Lazuardi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Ekspor Berhasil', 'Data master titik galon berhasil diunduh dalam format CSV.');
  };

  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin me-reset seluruh data ke setelan awal Sekolah Lazuardi?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const currentRoleConfig = roleConfigs.find(r => r.role === selectedRoleKey) || roleConfigs[0];

  // Filtered lists
  const filteredUnits = units.filter(u => {
    const q = unitSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) || 
      u.code.toLowerCase().includes(q) || 
      u.headName.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );
  });

  const filteredDepartments = departments.filter(d => {
    const matchUnit = deptUnitFilter === 'all' || d.unitName === deptUnitFilter || d.unitId === deptUnitFilter;
    const q = deptSearch.toLowerCase().trim();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.unitName.toLowerCase().includes(q);
    return matchUnit && matchSearch;
  });

  // Filtered Users list
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase()));
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchUnit = userUnitFilter === 'all' || u.unit === userUnitFilter;
    return matchSearch && matchRole && matchUnit;
  });

  // Filtered Water Locations list
  const filteredWaterLocations = waterLocations.filter(loc => {
    const q = waterLocSearch.toLowerCase().trim();
    const matchSearch = 
      !q || 
      (loc.roomName && loc.roomName.toLowerCase().includes(q)) ||
      (loc.code && loc.code.toLowerCase().includes(q)) ||
      (loc.building && loc.building.toLowerCase().includes(q)) ||
      (loc.floor && loc.floor.toLowerCase().includes(q)) ||
      (loc.picName && loc.picName.toLowerCase().includes(q)) ||
      (loc.unit && loc.unit.toLowerCase().includes(q)) ||
      (loc.department && loc.department.toLowerCase().includes(q)) ||
      (loc.dispenserBrand && loc.dispenserBrand.toLowerCase().includes(q));

    const matchUnit = waterLocUnitFilter === 'all' || loc.unit === waterLocUnitFilter;
    const matchDept = waterLocDeptFilter === 'all' || loc.department === waterLocDeptFilter;
    const matchStatus = waterLocStatusFilter === 'all' || (loc.status || 'Aktif') === waterLocStatusFilter;

    return matchSearch && matchUnit && matchDept && matchStatus;
  });

  const totalDispensersCount = waterLocations.reduce((sum, l) => sum + (l.dispenserCount || 1), 0);
  const totalActiveGallonsInLocations = waterLocations.reduce((sum, l) => sum + (l.activeGallons || 1), 0);
  const totalEmptyGallonsInLocations = waterLocations.reduce((sum, l) => sum + (l.emptyGallons || 0), 0);
  const uniqueUnitsWithLocations = Array.from(new Set(waterLocations.map(l => l.unit))).length;

  // Permission Groups Definition
  const permissionGroups = [
    {
      title: '1. Pelayanan & Transaksi Permintaan',
      description: 'Hak pengajuan, verifikasi, approval, serta penyelesaian tiket layanan',
      items: [
        {
          key: 'createRequest' as keyof RolePermissions,
          label: 'Buat Permintaan Layanan',
          desc: 'Dapat membuat pengajuan fotocopy, cetak modul/ujian, dan refill air galon'
        },
        {
          key: 'viewAllRequests' as keyof RolePermissions,
          label: 'Lihat Semua Tiket Permintaan',
          desc: 'Dapat melihat seluruh permohonan dari semua unit sekolah di sistem'
        },
        {
          key: 'approveUnitRequest' as keyof RolePermissions,
          label: 'Otorisasi & Approval Permintaan Unit',
          desc: 'Wewenang menyetujui (Approve) atau menolak (Reject) permohonan staf unit'
        },
        {
          key: 'processDisbursement' as keyof RolePermissions,
          label: 'Eksekusi Penyerahan & Potong Stok',
          desc: 'Wewenang menyiapkan barang dan menandai status selesai dengan auto-deduct stok'
        },
        {
          key: 'printReceipt' as keyof RolePermissions,
          label: 'Cetak Surat Perintah Kerja & Bukti Serah Terima',
          desc: 'Dapat mencetak tanda terima fisik dan SPK dokumen fotocopy/printing'
        }
      ]
    },
    {
      title: '2. Manajemen Inventori & Stok',
      description: 'Pengelolaan master barang, stok masuk, stok keluar manual, dan stock opname',
      items: [
        {
          key: 'manageStockItems' as keyof RolePermissions,
          label: 'Kelola Master Barang & ATK',
          desc: 'Tambah, edit, dan hapus master data katalog barang dan batas minimum stok'
        },
        {
          key: 'stockIn' as keyof RolePermissions,
          label: 'Pemasukan Stok (Stock In)',
          desc: 'Dapat mencatat penerimaan pengadaan barang baru'
        },
        {
          key: 'stockOutManual' as keyof RolePermissions,
          label: 'Pengeluaran Stok Manual (Stock Out)',
          desc: 'Dapat mengeluarkan stok untuk barang rusak, retur, atau pemakaian internal'
        },
        {
          key: 'stockOpname' as keyof RolePermissions,
          label: 'Stock Opname Fisik & Ledger Penyesuaian',
          desc: 'Dapat melakukan audit fisik stok berkala dan mencatat selisih stok sistem'
        },
        {
          key: 'viewStockCard' as keyof RolePermissions,
          label: 'Akses Kartu Stok & Riwayat Mutasi',
          desc: 'Dapat membuka ledger kartu stok barang dan melacak jejak transaksi inventori'
        }
      ]
    },
    {
      title: '3. Operasional Khusus Resources Room',
      description: 'Pengaturan antrean percetakan/fotocopy, laminating presisi, dan dispenser air galon',
      items: [
        {
          key: 'managePhotocopyQueue' as keyof RolePermissions,
          label: 'Kelola Antrean Cetak & Fotocopy',
          desc: 'Memproses antrean cetak dokumen, status pengerjaan, dan jilid/finishing'
        },
        {
          key: 'manageLaminatingQueue' as keyof RolePermissions,
          label: 'Kelola Antrean & Mesin Laminating',
          desc: 'Memproses pesanan laminasi dokumen piagam, pemanasan mesin, dan corner rounding'
        },
        {
          key: 'manageWaterDistribution' as keyof RolePermissions,
          label: 'Distribusi & Pemantauan Galon Kampus',
          desc: 'Memantau titik dispenser lantai/gedung dan mencatat pergantian galon kosong'
        }
      ]
    },
    {
      title: '4. Laporan, Rekapitulasi & Finansial',
      description: 'Akses laporan analitik, pemakaian per unit, dan ekspor data',
      items: [
        {
          key: 'viewReports' as keyof RolePermissions,
          label: 'Akses Laporan & Rekapitulasi Penggunaan',
          desc: 'Melihat grafik statistik dan rekap permohonan seluruh unit Lazuardi'
        },
        {
          key: 'exportReportsExcel' as keyof RolePermissions,
          label: 'Ekspor Data Laporan (Excel / CSV)',
          desc: 'Dapat mendownload file CSV dan spreadsheet rekapitulasi operasional'
        },
        {
          key: 'viewFinancialSummary' as keyof RolePermissions,
          label: 'Lihat Estimasi Biaya & Anggaran',
          desc: 'Melihat nominal estimasi pengeluaran per unit dan nilai stok inventori'
        }
      ]
    },
    {
      title: '5. Kontrol Sistem, Pengguna & Keamanan',
      description: 'Pengelolaan data pengguna, hak akses peran, audit log, dan master data yayasan',
      items: [
        {
          key: 'manageUsers' as keyof RolePermissions,
          label: 'Kelola Akun Pengguna (User)',
          desc: 'Menambah, mengedit data guru/staff, dan mengaktifkan/nonaktifkan akun'
        },
        {
          key: 'manageRoles' as keyof RolePermissions,
          label: 'Konfigurasi Role & Matriks Hak Akses',
          desc: 'Mengubah izin fitur untuk masing-masing peran pengguna aplikasi'
        },
        {
          key: 'manageMasterData' as keyof RolePermissions,
          label: 'Kelola Master Unit & Departemen',
          desc: 'Mengatur data unit sekolah dan departemen kerja yayasan'
        },
        {
          key: 'viewAuditLogs' as keyof RolePermissions,
          label: 'Lihat Audit Log Aktivitas Sistem',
          desc: 'Memantau jejak audit log keamanan, login user, dan riwayat transaksi'
        },
        {
          key: 'resetSystemData' as keyof RolePermissions,
          label: 'Reset & Pemulihan Database',
          desc: 'Wewenang administratif untuk membersihkan dan mereset data sistem'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pengaturan Sistem &amp; Hak Akses Pengguna</h2>
            <p className="text-xs text-slate-500">
              Konfigurasi peran (role), izin akses pengguna, master unit kerja, inventori galon, dan sistem Lazuardi GCS
            </p>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUserImportModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Pengguna (CSV)</span>
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({
                  username: '',
                  name: '',
                  email: '',
                  role: 'user',
                  unit: 'SMP',
                  department: 'Guru',
                  status: 'Aktif'
                });
                setIsUserModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>
        )}

        {activeTab === 'units' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddUnit}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Building className="w-4 h-4" />
              <span>Tambah Unit Baru</span>
            </button>
            <button
              onClick={handleOpenAddDept}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Departemen</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'roles' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Setting Role &amp; Hak Akses</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'units' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Unit &amp; Departemen</span>
        </button>

        <button
          onClick={() => setActiveTab('galon')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'galon' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Droplet className="w-4 h-4 text-cyan-400" />
          <span>Master Galon &amp; Stock Opname</span>
        </button>

        <button
          onClick={() => setActiveTab('email_logs')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'email_logs' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4 text-teal-300" />
          <span>Laporan Email Kepala Unit</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'database' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Database Supabase Cloud</span>
          <span className={`w-2 h-2 rounded-full ${
            supabaseStatus === 'connected' 
              ? 'bg-emerald-400' 
              : supabaseStatus === 'connecting'
              ? 'bg-amber-400 animate-ping'
              : 'bg-rose-400'
          }`} />
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'system' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Sistem &amp; Reset</span>
        </button>
      </div>

      {/* TAB 1: SETTING ROLE & HAK AKSES */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          
          {/* Top 4 Role Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Peran Pengguna (User Roles)</h3>
                <p className="text-xs text-slate-500">Pilih salah satu peran di bawah untuk melihat dan mengonfigurasi hak akses modul</p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                Total 4 Peran Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {roleConfigs.map((r) => {
                const userCount = users.filter(u => u.role === r.role).length;
                const isSelected = selectedRoleKey === r.role;
                
                return (
                  <div
                    key={r.role}
                    onClick={() => setSelectedRoleKey(r.role)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <RoleBadge role={r.role} />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          r.securityLevel === 'Kritis' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          r.securityLevel === 'Tinggi' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          r.securityLevel === 'Sedang' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          Level: {r.securityLevel}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1">{r.roleName}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        <strong className="text-slate-900 font-bold">{userCount}</strong> Pengguna Aktif
                      </span>
                      {isSelected ? (
                        <span className="text-blue-700 font-bold flex items-center gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          Terpilih
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Klik untuk edit</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Configuration Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Konfigurasi Izin: {currentRoleConfig.roleName}
                    </h3>
                    <RoleBadge role={currentRoleConfig.role} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktifkan atau nonaktifkan kewenangan fitur untuk semua pengguna dengan peran ini
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleResetRoleToDefault}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  disabled={!isRoleDirty}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isRoleDirty
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRoleDirty ? 'Simpan Perubahan Hak Akses' : 'Tersimpan'}</span>
                </button>
              </div>
            </div>

            {/* Permission Checklist by Modules */}
            <div className="p-5 space-y-6">
              {permissionGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                  <div className="pb-1.5 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{group.title}</h4>
                    <p className="text-[11px] text-slate-500">{group.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((item) => {
                      const isAllowed = rolePermissionsDraft ? rolePermissionsDraft[item.key] : currentRoleConfig.permissions[item.key];
                      
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleTogglePermission(item.key)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isAllowed
                              ? 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isAllowed ? 'bg-blue-600 text-white' : 'border border-slate-400 bg-white'
                          }`}>
                            {isAllowed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-semibold ${isAllowed ? 'text-slate-900' : 'text-slate-600'}`}>
                                {item.label}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isAllowed ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isAllowed ? 'Diberikan' : 'Dibatasi'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Role Assignment Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Penugasan Role Pengguna (User Role Assignment)</h3>
                <p className="text-xs text-slate-500">Ubah peran guru, staf, atau pimpinan secara langsung dengan memilih role baru</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Cari nama / email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-48"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Semua Role</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin_rr">Admin RR</option>
                  <option value="manager">Kepala Unit</option>
                  <option value="user">Guru / Staff</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama Pengguna</th>
                    <th className="p-3.5">Unit &amp; Departemen</th>
                    <th className="p-3.5">Role Saat Ini</th>
                    <th className="p-3.5">Ubah Role Pengguna</th>
                    <th className="p-3.5">Status Akun</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} 
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <strong className="text-slate-900 block font-semibold">{u.name}</strong>
                            <span className="text-[11px] text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        <div>{u.unit}</div>
                        <div className="text-[10px] text-slate-400">{u.department}</div>
                      </td>
                      <td className="p-3.5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleQuickChangeUserRole(u.id, e.target.value as UserRole)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                        >
                          <option value="super_admin">Super Administrator</option>
                          <option value="admin_rr">Admin Resources Room</option>
                          <option value="manager">Kepala Unit / Manager</option>
                          <option value="user">Guru / Staff Pemohon</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'Aktif' || u.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {u.status === 'active' ? 'Aktif' : u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openResetPasswordModal(u)}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                          title="Atur / Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus akun pengguna ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari nama, email, username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin_rr">Admin RR</option>
                <option value="manager">Kepala Unit</option>
                <option value="user">Guru / Staff</option>
              </select>

              <select
                value={userUnitFilter}
                onChange={(e) => setUserUnitFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.code}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden lg:inline mr-1">
                Menampilkan <strong>{filteredUsers.length}</strong> dari {users.length} Pengguna
              </span>
              <button
                onClick={handleOpenAddUser}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Tambah akun pengguna baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengguna</span>
              </button>
              <button
                onClick={() => setIsUserImportModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Unggah CSV atau unduh template CSV pengguna"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Import CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama Pengguna</th>
                    <th className="p-3.5">Email / Username</th>
                    <th className="p-3.5">Role / Hak Akses</th>
                    <th className="p-3.5">Unit Sekolah</th>
                    <th className="p-3.5">Departemen</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} 
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <strong className="text-slate-900 block font-semibold">{u.name}</strong>
                            <span className="text-[11px] text-slate-500">{u.phone || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>@{u.username || u.email.split('@')[0]}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-600 font-medium font-sans">Password Aktif</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{u.unit}</td>
                      <td className="p-3.5 text-slate-600">{u.department}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'Aktif' || u.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {u.status === 'active' ? 'Aktif' : u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openResetPasswordModal(u)}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                          title="Atur / Ubah Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus pengguna ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNIT & DEPARTEMEN */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KOLOM KIRI: MASTER UNIT SEKOLAH */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daftar Unit Sekolah Lazuardi</h3>
                  <p className="text-[11px] text-slate-500">Unit kerja operasional &amp; jenjang pendidikan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                  {units.length} Unit
                </span>
                <button
                  onClick={handleOpenAddUnit}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Unit</span>
                </button>
              </div>
            </div>

            {/* Search Unit */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode unit, nama, pimpinan, atau email..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* List Units */}
            <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {filteredUnits.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Tidak ada unit sekolah ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau tambah unit baru</p>
                </div>
              ) : (
                filteredUnits.map((unit) => {
                  const deptCount = departments.filter(
                    (d) => d.unitId === unit.id || d.unitName === unit.name || d.unitName === unit.code
                  ).length;

                  return (
                    <div
                      key={unit.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-200 bg-white hover:bg-blue-50/20 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                            {unit.code}
                          </span>
                          <strong className="text-slate-900 font-semibold text-xs">{unit.name}</strong>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>
                            Pimpinan: <strong className="text-slate-700">{unit.headName || '-'}</strong>
                          </span>
                          <span>•</span>
                          <span>{unit.email || 'Tanpa email'}</span>
                          <span>•</span>
                          <span className="text-blue-600 font-medium">{deptCount} Departemen</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleOpenEditUnit(unit)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-blue-300"
                          title="Edit Unit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteUnitConfirm(unit)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-red-300"
                          title="Hapus Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN: MASTER DEPARTEMEN / BAGIAN KERJA */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Departemen &amp; Bagian Kerja</h3>
                  <p className="text-[11px] text-slate-500">Struktur divisi &amp; bagian di bawah unit sekolah</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                  {filteredDepartments.length} Bagian
                </span>
                <button
                  onClick={handleOpenAddDept}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Departemen</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama departemen..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={deptUnitFilter}
                onChange={(e) => setDeptUnitFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Unit Induk ({departments.length})</option>
                {units.map((u) => {
                  const countInUnit = departments.filter(
                    (d) => d.unitId === u.id || d.unitName === u.name || d.unitName === u.code
                  ).length;
                  return (
                    <option key={u.id} value={u.name}>
                      {u.name} ({countInUnit})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* List Departments */}
            <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {filteredDepartments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Tidak ada departemen ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah filter unit atau tambah departemen baru</p>
                </div>
              ) : (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/20 transition-all shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <strong className="text-slate-900 font-semibold text-xs block">{dept.name}</strong>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-600">Unit Induk:</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          {dept.unitName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 hidden sm:inline">
                        Aktif
                      </span>
                      <button
                        onClick={() => handleOpenEditDept(dept)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-emerald-300"
                        title="Edit Departemen"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteDeptConfirm(dept)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-red-300"
                        title="Hapus Departemen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: DATABASE SUPABASE CLOUD */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-800/50 shadow-md text-white">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-2xl">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">Supabase Cloud Database Integration</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    supabaseStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : supabaseStatus === 'connecting'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      supabaseStatus === 'connected'
                        ? 'bg-emerald-400'
                        : supabaseStatus === 'connecting'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-400'
                    }`} />
                    {supabaseStatus === 'connected'
                      ? 'Terhubung (Online)'
                      : supabaseStatus === 'connecting'
                      ? 'Menghubungkan...'
                      : 'Belum Ada Tabel / Error'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Penyimpanan cloud PostgreSQL terdistribusi &amp; Real-time WebSocket synchronization untuk Sekolah Lazuardi GCS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={refreshSupabaseConnection}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Uji Koneksi Ulang</span>
              </button>
              <a
                href={`https://supabase.com/dashboard/project/${PROJECT_METADATA.projectId}/sql`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <span>Buka Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 3 Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Project Name &amp; ID</span>
              <strong className="text-sm font-extrabold text-slate-900 block mt-1">
                {PROJECT_METADATA.projectName}
              </strong>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">ID: {PROJECT_METADATA.projectId}</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                  PostgreSQL
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">REST Endpoint URL</span>
              <p className="text-xs font-mono font-semibold text-slate-800 truncate mt-1" title={PROJECT_METADATA.url}>
                {PROJECT_METADATA.url}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Auth Mode: Anon Key (JWT)</span>
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                  SSL Encrypted
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Real-time Synchronization</span>
              <strong className="text-sm font-extrabold text-slate-900 block mt-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                WebSocket postgres_changes
              </strong>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Auto Live Update</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Database Setup & SQL Execution Helper */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Langkah Inisialisasi Database Supabase</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ikuti 2 langkah mudah di bawah ini untuk mengaktifkan seluruh tabel database di cloud Supabase Anda
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_CONFIG_SCHEMA_SQL);
                    setCopiedSql(true);
                    showToast('success', 'SQL Disalin ke Clipboard!', 'Tempel (paste) di SQL Editor Supabase.');
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedSql ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin Skema SQL Lengkap'}</span>
                </button>

                <button
                  onClick={() => setShowSqlViewer(!showSqlViewer)}
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  {showSqlViewer ? 'Sembunyikan SQL' : 'Lihat Skema SQL'}
                </button>
              </div>
            </div>

            {/* Stepper Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <strong className="text-xs text-slate-900">Jalankan Skema SQL di Supabase</strong>
                </div>
                <p className="text-[11px] text-slate-600">
                  Klik tombol <strong>Salin Skema SQL Lengkap</strong>, lalu buka <strong>Supabase SQL Editor</strong> dan jalankan (<kbd className="px-1 bg-white border border-slate-300 rounded font-mono text-[10px]">Run / Cmd+Enter</kbd>) untuk membuat 14 tabel database.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://supabase.com/dashboard/project/${PROJECT_METADATA.projectId}/sql`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    <span>Buka URL: supabase.com/dashboard/project/{PROJECT_METADATA.projectId}/sql</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <strong className="text-xs text-emerald-950">Migrasikan / Sinkronkan Data Awal</strong>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Setelah SQL selesai dijalankan, klik tombol hijau <strong>Migrasikan &amp; Sinkronkan Data Awal</strong> di bawah untuk memasukkan seluruh Master Data Lazuardi GCS ke Supabase.
                </p>
                <div className="pt-2">
                  <button
                    onClick={syncAllToSupabase}
                    disabled={isSyncingToSupabase}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    {isSyncingToSupabase ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang Memigrasikan Data...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Migrasikan &amp; Sinkronkan Data Awal ke Supabase</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Code Preview if toggled */}
            {showSqlViewer && (
              <div className="mt-4 p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] max-h-80 overflow-y-auto border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>Skema SQL Database (DDL + Constraints + Indices)</span>
                  <span className="text-[10px]">14 Tables</span>
                </div>
                <pre className="whitespace-pre-wrap">{SUPABASE_CONFIG_SCHEMA_SQL}</pre>
              </div>
            )}
          </div>

          {/* Database Tables Inventory List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Status 14 Tabel Database Supabase
                </h4>
                <p className="text-[11px] text-slate-500">
                  Pemetaan tabel database PostgreSQL untuk semua entitas modul sistem Resources Room
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                14 Tabel Terdefinisi
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Nama Tabel (Postgres)</th>
                  <th className="p-3">Modul Terkait</th>
                  <th className="p-3">Jumlah Record Lokal</th>
                  <th className="p-3">Kunci Primer (PK)</th>
                  <th className="p-3 text-center">Status Cloud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">users</td>
                  <td className="p-3 text-slate-800">Master Pengguna &amp; Akun Guru/Staff</td>
                  <td className="p-3 font-bold text-slate-900">{users.length} Akun</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">service_requests</td>
                  <td className="p-3 text-slate-800">Permintaan ATK, Seragam, Foto Copy, Laminating, Galon</td>
                  <td className="p-3 font-bold text-slate-900">{requests.length} Permintaan</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Realtime Live
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">master_items</td>
                  <td className="p-3 text-slate-800">Katalog Barang ATK &amp; Inventori Umum</td>
                  <td className="p-3 font-bold text-slate-900">{items.length} Item</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">uniform_items</td>
                  <td className="p-3 text-slate-800">Katalog Seragam Sekolah Per Jenjang &amp; Ukuran</td>
                  <td className="p-3 font-bold text-slate-900">{waterInventory ? 'Tersedia' : '-'}</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">water_locations</td>
                  <td className="p-3 text-slate-800">Titik Ruangan &amp; Dispenser Galon Air Minum</td>
                  <td className="p-3 font-bold text-slate-900">Tercatat</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">water_inventory</td>
                  <td className="p-3 text-slate-800">Inventori Total Galon (Modal, Isi, Kosong, Ruangan)</td>
                  <td className="p-3 font-bold text-slate-900">{waterInventory?.initialTotalAssets || 68} Galon</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">stock_transactions</td>
                  <td className="p-3 text-slate-800">Jurnal Mutasi Stok Masuk, Keluar, dan Stock Opname</td>
                  <td className="p-3 font-bold text-slate-900">Tercatat</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">master_units</td>
                  <td className="p-3 text-slate-800">Daftar Unit Sekolah Lazuardi GCS (SMP, SD, TK, SMA)</td>
                  <td className="p-3 font-bold text-slate-900">{units.length} Unit</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">master_departments</td>
                  <td className="p-3 text-slate-800">Departemen &amp; Bagian Kerja Unit</td>
                  <td className="p-3 font-bold text-slate-900">{departments.length} Bagian</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-blue-900">role_configs</td>
                  <td className="p-3 text-slate-800">Matriks Hak Akses &amp; Izin Peran Pengguna</td>
                  <td className="p-3 font-bold text-slate-900">{roleConfigs.length} Peran</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">id (TEXT)</td>
                  <td className="p-3 text-center">
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Ready
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM & RESET */}
      {activeTab === 'system' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Informasi Aplikasi &amp; Lingkungan</h3>
            <p className="text-xs text-slate-500 mt-0.5">LAZUARDI RESOURCES ROOM - Versi 1.0.0 Pro Enterprise</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Institusi:</span>
              <strong className="text-slate-900">Sekolah Lazuardi Global Compassionate School</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tahun Ajaran:</span>
              <strong className="text-slate-900">2026 / 2027</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penyimpanan State:</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                LocalStorage (Persistent Real-time)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Audit Logging:</span>
              <span className="font-semibold text-blue-700">Aktif &amp; Terarsip Otomatis</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-red-700 mb-1">Zona Bahaya (Reset Data Demo &amp; Factory Settings)</h4>
            <p className="text-xs text-slate-500 mb-3">
              Tombol ini akan menghapus semua data transaksi yang tersimpan di browser dan mengembalikan seluruh master data serta hak akses peran ke pengaturan awal Sekolah Lazuardi.
            </p>
            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seluruh Data ke Data Awal</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: MASTER GALON & STOCK OPNAME */}
      {activeTab === 'galon' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 text-white rounded-xl shadow-xs">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Master Data Titik Galon, Inventori &amp; Stock Opname</h3>
                <p className="text-xs text-slate-500">
                  Manajemen master titik penempatan dispenser ruangan per unit &amp; departemen, mutasi galon isi/kosong, dan audit aset
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-cyan-50 text-cyan-800 font-bold px-3 py-1.5 rounded-lg border border-cyan-200">
                Total Aset Yayasan: {waterInventory.initialTotalAssets || 68} Galon
              </span>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setGalonSubTab('titik')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                galonSubTab === 'titik'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Master Titik Penempatan Galon ({waterLocations.length})</span>
            </button>
            <button
              onClick={() => setGalonSubTab('inventori')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                galonSubTab === 'inventori'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Ringkasan Inventori &amp; Aset</span>
            </button>
            <button
              onClick={() => setGalonSubTab('provider')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                galonSubTab === 'provider'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Riwayat Pengiriman Provider ({waterProviderLogs.length})</span>
            </button>
            <button
              onClick={() => setGalonSubTab('opname')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                galonSubTab === 'opname'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Riwayat Stock Opname ({waterOpnameRecords.length})</span>
            </button>
          </div>

          {/* SUBTAB 1: MASTER TITIK PENEMPATAN GALON RUANGAN */}
          {galonSubTab === 'titik' && (
            <div className="space-y-4">
              {/* 4 Cards Summary Titik Galon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-xs">
                  <span className="text-[11px] font-bold text-cyan-800 uppercase block">1. Total Titik Penempatan</span>
                  <strong className="text-2xl font-extrabold text-cyan-950 block mt-1">
                    {waterLocations.length} <span className="text-xs font-normal text-slate-500">Ruangan</span>
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1">Tersebar di seluruh unit Lazuardi</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-800 uppercase block">2. Total Dispenser Terpasang</span>
                  <strong className="text-2xl font-extrabold text-blue-700 block mt-1">
                    {totalDispensersCount} <span className="text-xs font-normal text-slate-500">Unit</span>
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1">Perangkat dispenser aktif &amp; siap pakai</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">3. Galon Aktif Terpasang</span>
                  <strong className="text-2xl font-extrabold text-emerald-700 block mt-1">
                    {totalActiveGallonsInLocations} <span className="text-xs font-normal text-slate-500">Galon</span>
                  </strong>
                  <p className="text-[11px] text-emerald-600 mt-1">Sedang melayani guru &amp; siswa</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
                  <span className="text-[11px] font-bold text-purple-800 uppercase block">4. Unit Terdistribusi</span>
                  <strong className="text-2xl font-extrabold text-purple-700 block mt-1">
                    {uniqueUnitsWithLocations} <span className="text-xs font-normal text-slate-500">Unit/Bagian</span>
                  </strong>
                  <p className="text-[11px] text-purple-600 mt-1">TK, SD, SMP, SMA, GA, Security, dll</p>
                </div>
              </div>

              {/* Filter & Action Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari kode titik, ruangan, gedung, PIC..."
                      value={waterLocSearch}
                      onChange={(e) => setWaterLocSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-cyan-600 focus:bg-white"
                    />
                  </div>

                  {/* Filter Unit */}
                  <select
                    value={waterLocUnitFilter}
                    onChange={(e) => {
                      setWaterLocUnitFilter(e.target.value);
                      setWaterLocDeptFilter('all');
                    }}
                    className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-cyan-600 font-medium text-slate-700"
                  >
                    <option value="all">Semua Master Unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>

                  {/* Filter Departemen */}
                  <select
                    value={waterLocDeptFilter}
                    onChange={(e) => setWaterLocDeptFilter(e.target.value)}
                    className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-cyan-600 font-medium text-slate-700"
                  >
                    <option value="all">Semua Departemen</option>
                    {departments
                      .filter(d => waterLocUnitFilter === 'all' || d.unitName === waterLocUnitFilter || d.unitId === waterLocUnitFilter)
                      .map(d => (
                        <option key={d.id} value={d.name}>{d.name} ({d.unitName})</option>
                      ))}
                  </select>

                  {/* Filter Status */}
                  <select
                    value={waterLocStatusFilter}
                    onChange={(e) => setWaterLocStatusFilter(e.target.value)}
                    className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-cyan-600 font-medium text-slate-700"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Perbaikan Dispenser">Perbaikan Dispenser</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                {/* Actions: Add & Export */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                  <button
                    onClick={handleExportWaterLocationsCSV}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                    title="Unduh daftar master titik galon dalam format CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV</span>
                  </button>

                  <button
                    onClick={handleOpenAddWaterLoc}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Titik Galon</span>
                  </button>
                </div>
              </div>

              {/* Table of Water Locations */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Daftar Master Titik Galon &amp; Dispenser Ruangan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Penempatan galon air minum Aqua 19L di ruang kelas, laboratorium, kantor unit &amp; pos staf
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Menampilkan {filteredWaterLocations.length} dari {waterLocations.length} titik
                  </span>
                </div>

                {filteredWaterLocations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <Droplet className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">Tidak ada titik galon yang sesuai dengan filter.</p>
                    <button
                      onClick={() => {
                        setWaterLocSearch('');
                        setWaterLocUnitFilter('all');
                        setWaterLocDeptFilter('all');
                        setWaterLocStatusFilter('all');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-cyan-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Kode Titik</th>
                          <th className="p-3">Nama Ruangan &amp; Penempatan</th>
                          <th className="p-3">Master Unit &amp; Departemen</th>
                          <th className="p-3">Dispenser</th>
                          <th className="p-3 text-center">Galon (Aktif/Kosong)</th>
                          <th className="p-3">PIC Ruangan</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredWaterLocations.map((loc) => {
                          const statusColor = 
                            loc.status === 'Perbaikan Dispenser' 
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : loc.status === 'Nonaktif'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                          return (
                            <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3">
                                <span className="font-mono font-extrabold text-cyan-900 bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200 text-[11px]">
                                  {loc.code || `TG-${loc.unit.slice(0, 3).toUpperCase()}-01`}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{loc.roomName}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span>{loc.building || `Gedung ${loc.unit}`}</span>
                                  <span>&bull;</span>
                                  <span>{loc.floor || 'Lantai 1'}</span>
                                </div>
                                {loc.notes && (
                                  <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                                    Catatan: {loc.notes}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                    {loc.unit}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {loc.department || 'Umum Unit'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">
                                  {loc.dispenserCount || 1} Unit
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {loc.dispenserBrand || 'Dispenser Standar'}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-[11px]">
                                  <span className="text-emerald-700">{loc.activeGallons || 1} Isi</span>
                                  <span className="text-slate-300">/</span>
                                  <span className="text-amber-700">{loc.emptyGallons || 0} Kosong</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-slate-800">
                                  {loc.picName || '-'}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                  {loc.status || 'Aktif'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditWaterLoc(loc)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Titik Galon"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteWaterLocConfirm(loc)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Titik Galon"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 2: RINGKASAN INVENTORI & ASET */}
          {galonSubTab === 'inventori' && (
            <div className="space-y-6">
              {/* 4 Cards Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-xs">
                  <span className="text-[11px] font-bold text-cyan-800 uppercase block">1. Modal Galon Awal</span>
                  <strong className="text-2xl font-extrabold text-cyan-950 block mt-1">
                    {waterInventory.initialTotalAssets || 68} <span className="text-xs font-normal text-slate-500">Galon</span>
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1">Total kepemilikan aset yayasan</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">2. Galon Isi Siap (RR)</span>
                  <strong className="text-2xl font-extrabold text-emerald-700 block mt-1">
                    {waterInventory.filledGallons} <span className="text-xs font-normal text-slate-500">Galon</span>
                  </strong>
                  <p className="text-[11px] text-emerald-600 mt-1">Tersedia di gudang RR</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">3. Galon Kosong (RR)</span>
                  <strong className="text-2xl font-extrabold text-amber-700 block mt-1">
                    {waterInventory.emptyGallons} <span className="text-xs font-normal text-slate-500">Galon</span>
                  </strong>
                  <p className="text-[11px] text-amber-600 mt-1">Siap tukar saat provider datang</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-800 uppercase block">4. Aktif di Ruangan</span>
                  <strong className="text-2xl font-extrabold text-blue-700 block mt-1">
                    {waterInventory.inDistribution} <span className="text-xs font-normal text-slate-500">Galon</span>
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1">Terpasang pada dispenser unit</p>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: RIWAYAT PROVIDER */}
          {galonSubTab === 'provider' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Riwayat Pengiriman &amp; Pertukaran Galon Provider
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Data saat galon isi datang dan berapa galon kosong yang dibawa oleh provider
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">{waterProviderLogs.length} catatan pengiriman</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tanggal &amp; Waktu</th>
                      <th className="p-3">No. Surat Jalan</th>
                      <th className="p-3">Distributor / Supplier</th>
                      <th className="p-3">Driver</th>
                      <th className="p-3 text-center bg-emerald-50 text-emerald-900 font-bold">Galon Isi Datang (+)</th>
                      <th className="p-3 text-center bg-amber-50 text-amber-900 font-bold">Galon Kosong Dibawa (-)</th>
                      <th className="p-3">Penerima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waterProviderLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(log.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-900">{log.deliveryNumber}</td>
                        <td className="p-3 font-semibold text-slate-800">{log.supplierName}</td>
                        <td className="p-3 text-slate-600">{log.driverName || '-'}</td>
                        <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                          +{log.filledReceived} Galon
                        </td>
                        <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/30">
                          -{log.emptyReturned} Galon
                        </td>
                        <td className="p-3 text-slate-700">{log.receivedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB 4: RIWAYAT OPNAME */}
          {galonSubTab === 'opname' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Riwayat Audit Stock Opname Galon
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Hasil audit fisik berkala galon di gudang RR dan ruang-ruang sekolah
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">{waterOpnameRecords.length} audit</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">No. Opname</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Auditor</th>
                      <th className="p-3 text-center">Fisik Isi</th>
                      <th className="p-3 text-center">Fisik Kosong</th>
                      <th className="p-3 text-center">Di Ruangan</th>
                      <th className="p-3 text-center">Rusak / Hilang</th>
                      <th className="p-3 text-center font-bold">Total Fisik</th>
                      <th className="p-3 text-center">Selisih</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waterOpnameRecords.map((opn) => (
                      <tr key={opn.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-900">{opn.opnameNumber}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {new Date(opn.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{opn.auditorName}</td>
                        <td className="p-3 text-center font-semibold text-emerald-800">{opn.physicalFilled}</td>
                        <td className="p-3 text-center font-semibold text-amber-800">{opn.physicalEmpty}</td>
                        <td className="p-3 text-center font-semibold text-blue-800">{opn.physicalInRooms}</td>
                        <td className="p-3 text-center font-semibold text-rose-800">{opn.physicalDamaged + opn.physicalLost}</td>
                        <td className="p-3 text-center font-extrabold text-cyan-900 bg-cyan-50/40">{opn.totalPhysical}</td>
                        <td className="p-3 text-center font-bold">
                          {opn.variance === 0 ? (
                            <span className="text-emerald-700">0 (Klop)</span>
                          ) : (
                            <span className="text-rose-700">{opn.variance > 0 ? `+${opn.variance}` : opn.variance}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{opn.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: LAPORAN EMAIL RESMI KEPALA UNIT */}
      {activeTab === 'email_logs' && (
        <EmailNotificationLogsTab />
      )}

      {/* USER MODAL */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
        subtitle="Manajemen Pengguna & Penugasan Role Sekolah Lazuardi"
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso, S.Pd"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                placeholder="budi.santoso"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Sekolah *</label>
            <input
              type="email"
              placeholder="budi@lazuardi.sch.id"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role) *</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="super_admin">Super Admin (Akses Penuh)</option>
                <option value="admin_rr">Admin Resources Room</option>
                <option value="manager">Kepala Unit / Pimpinan</option>
                <option value="user">Guru / Staff Pemohon</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900">
            <div className="flex items-center gap-1 font-bold mb-0.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Deskripsi Role yang Dipilih:</span>
            </div>
            <p className="text-slate-600">
              {roleConfigs.find(r => r.role === userForm.role)?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Sekolah</label>
              <select
                value={userForm.unit}
                onChange={(e) => setUserForm({ ...userForm, unit: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {units.map(u => <option key={u.id} value={u.code}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Departemen / Bidang</label>
              <select
                value={userForm.department}
                onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from(new Set([
                  ...departments.map(d => d.name),
                  'Guru', 'Tata Usaha', 'Manajemen', 'Fasilitas & Maintenance', 'Umum & Operasional', 'Resources Room', 'IT'
                ])).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* PENGATURAN KATA SANDI (MANUAL LOGIN) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Kata Sandi (Password Akun) *</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, password: 'password123' })}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                  title="Gunakan kata sandi default"
                >
                  Set Standar (password123)
                </button>
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, password: generateRandomPassword() })}
                  className="text-[10px] text-slate-600 hover:text-slate-900 font-semibold bg-white px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Buat kata sandi acak yang aman"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Acak</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showFormPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi..."
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowFormPassword(!showFormPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showFormPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Kata sandi ini digunakan untuk login manual. Pengguna dengan email <strong className="text-slate-700">@lazuardi.sch.id</strong> juga tetap bisa langsung masuk instan menggunakan Akun Google Sekolah tanpa password.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
            >
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ATUR & RESET KATA SANDI PENGGUNA */}
      <Modal
        isOpen={!!resetPasswordModalUser}
        onClose={() => setResetPasswordModalUser(null)}
        title="Atur Kata Sandi Pengguna"
        subtitle="Manajemen Kredensial & Autentikasi Manual Sekolah Lazuardi"
        maxWidth="sm"
      >
        {resetPasswordModalUser && (
          <form onSubmit={handleSaveResetPassword} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <img
                src={resetPasswordModalUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                alt={resetPasswordModalUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{resetPasswordModalUser.name}</h4>
                <div className="text-[11px] text-slate-500 font-mono truncate">{resetPasswordModalUser.email}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <RoleBadge role={resetPasswordModalUser.role} />
                  <span className="text-[10px] text-slate-500 font-mono">@{resetPasswordModalUser.username || resetPasswordModalUser.email.split('@')[0]}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-700">Kata Sandi Baru *</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetNewPassword('password123')}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                  >
                    Reset (password123)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetNewPassword(generateRandomPassword())}
                    className="text-[10px] text-slate-600 hover:text-slate-900 font-semibold bg-white px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Acak</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showModalPassword ? "text" : "password"}
                  value={targetNewPassword}
                  onChange={(e) => setTargetNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showModalPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Pengguna dapat menggunakan kata sandi ini untuk login manual dengan username <span className="font-mono font-semibold text-slate-700">@{resetPasswordModalUser.username || resetPasswordModalUser.email.split('@')[0]}</span> atau email.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetPasswordModalUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Simpan Kata Sandi</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: TAMBAH / EDIT UNIT SEKOLAH */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          setEditingUnit(null);
        }}
        title={editingUnit ? 'Edit Data Unit Sekolah' : 'Tambah Unit Sekolah Baru'}
      >
        <form onSubmit={handleSaveUnit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kode Singkatan Unit * <span className="text-slate-400 font-normal">(Contoh: SMP, SD, TK, SMA, YAYASAN)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: SMP"
              value={unitForm.code}
              onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value.toUpperCase() })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Unit Sekolah *</label>
            <input
              type="text"
              placeholder="Contoh: Lazuardi SMP Global Compassionate School"
              value={unitForm.name}
              onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kepala Unit / Pimpinan *</label>
              <input
                type="text"
                placeholder="Contoh: Fauzan S.Pd"
                value={unitForm.headName}
                onChange={(e) => setUnitForm({ ...unitForm, headName: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Resmi Unit / Kepala Unit *</label>
              <input
                type="email"
                placeholder="Contoh: smp@lazuardi.sch.id"
                value={unitForm.email}
                onChange={(e) => setUnitForm({ ...unitForm, email: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                📧 Laporan penyelesaian order otomatis dikirimkan ke alamat email Kepala Unit ini.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsUnitModalOpen(false);
                setEditingUnit(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
            >
              {editingUnit ? 'Simpan Perubahan Unit' : 'Tambahkan Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: KONFIRMASI HAPUS UNIT */}
      <Modal
        isOpen={deleteUnitConfirm !== null}
        onClose={() => setDeleteUnitConfirm(null)}
        title="Konfirmasi Hapus Unit Sekolah"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1">
            <p className="font-bold text-sm">Apakah Anda yakin ingin menghapus unit ini?</p>
            <p className="text-red-700">
              Unit <strong className="font-bold text-red-950">{deleteUnitConfirm?.name} ({deleteUnitConfirm?.code})</strong> akan dihapus dari daftar unit master.
            </p>
          </div>

          <p className="text-slate-500 text-[11px]">
            Tindakan ini akan tercatat dalam audit log sistem. Pastikan tidak ada transaksi aktif yang bergantung pada unit ini.
          </p>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteUnitConfirm(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteUnit}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
            >
              Ya, Hapus Unit
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: TAMBAH / EDIT DEPARTEMEN */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => {
          setIsDeptModalOpen(false);
          setEditingDept(null);
        }}
        title={editingDept ? 'Edit Data Departemen / Bagian' : 'Tambah Departemen Baru'}
      >
        <form onSubmit={handleSaveDept} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Unit Induk Sekolah *</label>
            <select
              value={deptForm.unitId || (units.find(u => u.name === deptForm.unitName)?.id || (units[0]?.id || ''))}
              onChange={(e) => {
                const targetUnit = units.find(u => u.id === e.target.value);
                setDeptForm({
                  ...deptForm,
                  unitId: e.target.value,
                  unitName: targetUnit ? targetUnit.name : deptForm.unitName
                });
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Departemen / Bagian Kerja * <span className="text-slate-400 font-normal">(Contoh: Guru, Tata Usaha, Lab IPA, Security)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Tata Usaha"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsDeptModalOpen(false);
                setEditingDept(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
            >
              {editingDept ? 'Simpan Perubahan' : 'Tambahkan Departemen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: KONFIRMASI HAPUS DEPARTEMEN */}
      <Modal
        isOpen={deleteDeptConfirm !== null}
        onClose={() => setDeleteDeptConfirm(null)}
        title="Konfirmasi Hapus Departemen"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1">
            <p className="font-bold text-sm">Apakah Anda yakin ingin menghapus departemen ini?</p>
            <p className="text-red-700">
              Departemen <strong className="font-bold text-red-950">{deleteDeptConfirm?.name}</strong> dari unit <strong className="font-bold text-red-950">{deleteDeptConfirm?.unitName}</strong> akan dihapus.
            </p>
          </div>

          <p className="text-slate-500 text-[11px]">
            Tindakan ini akan tercatat dalam audit log sistem.
          </p>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteDeptConfirm(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteDept}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
            >
              Ya, Hapus Departemen
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL TAMBAH / EDIT TITIK GALON */}
      <Modal
        isOpen={isWaterLocModalOpen}
        onClose={() => setIsWaterLocModalOpen(false)}
        title={editingWaterLoc ? 'Edit Titik Penempatan Galon' : 'Tambah Titik Penempatan Galon Baru'}
        subtitle="Registrasi Lokasi Dispenser Berdasarkan Master Unit & Departemen"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveWaterLoc} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode Titik Galon *
              </label>
              <input
                type="text"
                placeholder="Contoh: TG-SMP-01"
                value={waterLocForm.code}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, code: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold outline-cyan-600 uppercase"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: TG-[UNIT]-[NOMOR], misal: TG-SMP-01, TG-TK-02
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Status Titik Dispenser *
              </label>
              <select
                value={waterLocForm.status}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, status: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600 font-semibold"
                required
              >
                <option value="Aktif">Aktif (Beroperasi Normal)</option>
                <option value="Perbaikan Dispenser">Perbaikan Dispenser (Maintenance)</option>
                <option value="Nonaktif">Nonaktif (Sementara Tidak Dipakai)</option>
              </select>
            </div>
          </div>

          {/* Master Unit & Master Departemen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-cyan-950 mb-1">
                Pilih Master Unit Sekolah *
              </label>
              <select
                value={waterLocForm.unit}
                onChange={(e) => {
                  const newUnit = e.target.value;
                  const unitObj = units.find(u => u.name === newUnit);
                  const depts = departments.filter(d => d.unitName === newUnit || d.unitId === unitObj?.id);
                  const prefix = (unitObj?.code || newUnit).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
                  const countInUnit = waterLocations.filter(l => l.unit === newUnit).length + 1;
                  const autoCode = editingWaterLoc ? waterLocForm.code : `TG-${prefix}-${countInUnit.toString().padStart(2, '0')}`;

                  setWaterLocForm(prev => ({
                    ...prev,
                    unit: newUnit,
                    unitId: unitObj?.id || '',
                    department: depts.length > 0 ? depts[0].name : '',
                    departmentId: depts.length > 0 ? depts[0].id : '',
                    building: prev.building || `Gedung ${newUnit}`,
                    code: autoCode
                  }));
                }}
                className="w-full p-2.5 bg-white border border-cyan-300 rounded-lg text-slate-900 font-bold outline-cyan-600"
                required
              >
                {units.map(u => (
                  <option key={u.id} value={u.name}>Unit {u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-cyan-950 mb-1">
                Pilih Master Departemen *
              </label>
              <select
                value={waterLocForm.department}
                onChange={(e) => {
                  const newDeptName = e.target.value;
                  const deptObj = departments.find(d => d.name === newDeptName);
                  setWaterLocForm(prev => ({
                    ...prev,
                    department: newDeptName,
                    departmentId: deptObj?.id || ''
                  }));
                }}
                className="w-full p-2.5 bg-white border border-cyan-300 rounded-lg text-slate-900 font-medium outline-cyan-600"
              >
                <option value="">-- Pilih Departemen / Umum Unit --</option>
                {departments
                  .filter(d => d.unitName === waterLocForm.unit || d.unitId === waterLocForm.unitId)
                  .map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Nama Ruangan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Ruangan / Titik Penempatan *
            </label>
            <input
              type="text"
              placeholder="Contoh: Ruang Guru &amp; Staff SMP, Laboratorium IPA Kimia, Lobi Perpustakaan"
              value={waterLocForm.roomName}
              onChange={(e) => setWaterLocForm({ ...waterLocForm, roomName: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600 font-semibold"
              required
            />
          </div>

          {/* Gedung & Lantai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Gedung / Sayap Kampus *
              </label>
              <input
                type="text"
                placeholder="Contoh: Gedung SMP Lazuardi, Gedung Utama"
                value={waterLocForm.building}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, building: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Posisi Lantai *
              </label>
              <select
                value={waterLocForm.floor}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, floor: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600 font-medium"
              >
                <option value="Lantai 1">Lantai 1 (Dasar)</option>
                <option value="Lantai 2">Lantai 2</option>
                <option value="Lantai 3">Lantai 3</option>
                <option value="Lantai 4">Lantai 4</option>
                <option value="Basement">Basement / Semi-outdoor</option>
                <option value="Pos Satpam / Gerbang">Pos Satpam / Gerbang</option>
              </select>
            </div>
          </div>

          {/* Dispenser Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Jumlah Perangkat Dispenser
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={waterLocForm.dispenserCount}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, dispenserCount: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold outline-cyan-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Merk / Tipe Dispenser
              </label>
              <input
                type="text"
                placeholder="Contoh: Miyako WDP-300 Hot &amp; Cool, Modena Bottom Loading"
                value={waterLocForm.dispenserBrand}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, dispenserBrand: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600"
              />
            </div>
          </div>

          {/* Kuota Galon Aktif & Kosong */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-emerald-900 mb-1">
                Galon Aktif Terpasang Saat Ini
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={waterLocForm.activeGallons}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, activeGallons: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-emerald-950 font-bold outline-cyan-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Galon isi terpasang di dispenser</span>
            </div>

            <div>
              <label className="block font-bold text-amber-900 mb-1">
                Galon Kosong Cadangan di Titik
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={waterLocForm.emptyGallons}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, emptyGallons: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-amber-950 font-bold outline-cyan-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Galon kosong yang belum ditarik ke RR</span>
            </div>
          </div>

          {/* PIC Ruangan & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Penanggung Jawab Ruangan (PIC)
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso, M.Pd / Koordinator Lab"
                value={waterLocForm.picName}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, picName: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Catatan Penempatan / Posisi
              </label>
              <input
                type="text"
                placeholder="Contoh: Dekat pintu samping, stop kontak aman"
                value={waterLocForm.notes}
                onChange={(e) => setWaterLocForm({ ...waterLocForm, notes: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600"
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWaterLocModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingWaterLoc ? 'Simpan Perubahan Titik' : 'Tambahkan Titik Galon'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL HAPUS TITIK GALON */}
      <Modal
        isOpen={!!deleteWaterLocConfirm}
        onClose={() => setDeleteWaterLocConfirm(null)}
        title="Konfirmasi Hapus Titik Penempatan Galon"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1">
            <p className="font-bold text-sm">Apakah Anda yakin ingin menghapus titik galon ini?</p>
            <p className="text-red-700">
              Titik galon <strong className="font-bold text-red-950">[{deleteWaterLocConfirm?.code}] {deleteWaterLocConfirm?.roomName}</strong> dari unit <strong className="font-bold text-red-950">{deleteWaterLocConfirm?.unit}</strong> ({deleteWaterLocConfirm?.department || 'Umum'}) akan dihapus dari sistem.
            </p>
          </div>

          <p className="text-slate-500 text-[11px]">
            Tindakan ini akan tercatat dalam audit log sistem.
          </p>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteWaterLocConfirm(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteWaterLoc}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
            >
              Ya, Hapus Titik Galon
            </button>
          </div>
        </div>
      </Modal>

      {/* CSV User Import Modal */}
      <UserImportModal
        isOpen={isUserImportModalOpen}
        onClose={() => setIsUserImportModalOpen(false)}
        onImport={(importedUsers) => {
          const count = addUsers(importedUsers);
          showToast('success', 'Import CSV Berhasil', `${count} akun pengguna baru berhasil ditambahkan ke sistem.`);
          return count;
        }}
        existingUsers={users}
        units={units}
      />

    </div>
  );
};
