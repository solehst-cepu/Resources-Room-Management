export type UserRole = 'super_admin' | 'admin_rr' | 'user' | 'manager';

export interface RolePermissions {
  // Permintaan & Transaksi
  createRequest: boolean;
  viewAllRequests: boolean;
  approveUnitRequest: boolean;
  processDisbursement: boolean;
  printReceipt: boolean;
  
  // Inventori & Stok
  manageStockItems: boolean;
  stockIn: boolean;
  stockOutManual: boolean;
  stockOpname: boolean;
  viewStockCard: boolean;

  // Layanan Khusus
  manageUniformCatalog: boolean;
  managePhotocopyQueue: boolean;
  manageLaminatingQueue: boolean;
  manageWaterDistribution: boolean;

  // Laporan & Analitik
  viewReports: boolean;
  exportReportsExcel: boolean;
  viewFinancialSummary: boolean;

  // Sistem & User
  manageUsers: boolean;
  manageRoles: boolean;
  manageMasterData: boolean;
  viewAuditLogs: boolean;
  resetSystemData: boolean;
}

export interface RoleConfig {
  role: UserRole;
  roleName: string;
  badgeTitle: string;
  description: string;
  securityLevel: 'Tinggi' | 'Sedang' | 'Dasar' | 'Kritis';
  permissions: RolePermissions;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  unit: string;
  department: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'Aktif' | 'Nonaktif';
}

export type ItemCategory = 
  | 'Seragam' 
  | 'ATK' 
  | 'Air Galon' 
  | 'Kertas' 
  | 'Tinta / Toner' 
  | 'Barang Operasional Lainnya';

export interface MasterItem {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  unitMeasure: string; // pcs, rim, box, pack, botol, galon, dll
  stock: number;
  minStock: number;
  location: string;
  price: number;
  supplier?: string;
  status: 'available' | 'low_stock' | 'out_of_stock';
  description?: string;
}

export interface UniformItem {
  id: string;
  code: string;
  name: string;
  category: string; // 'Seragam Guru' | 'Seragam Karyawan' | 'Seragam Security' | 'Seragam Driver' | 'Seragam CS' | 'Seragam Olahraga' | 'Seragam Event' | 'Atribut Seragam'
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'All Size';
  color: string;
  targetUnit: string; // 'Semua Unit' | 'Guru' | 'Staff' | 'Security' | 'Umum'
  stock: number;
  minStock: number;
  location: string;
  price: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
}

export interface WaterLocation {
  id: string;
  code?: string;
  unit: string;
  unitId?: string;
  department?: string;
  departmentId?: string;
  roomName: string;
  building?: string;
  floor: string;
  dispenserCount: number;
  dispenserBrand?: string;
  activeGallons: number;
  emptyGallons: number;
  picName?: string;
  status?: 'Aktif' | 'Nonaktif' | 'Perbaikan Dispenser';
  lastRefillDate?: string;
  notes?: string;
}

export interface WaterInventory {
  initialTotalAssets: number; // Jumlah galon awal yang dimiliki sekolah
  filledGallons: number;      // Galon isi di gudang RR
  emptyGallons: number;       // Galon kosong di gudang RR
  inDistribution: number;     // Galon aktif terpasang di ruangan unit
  damagedGallons: number;     // Galon rusak/afkir
  lostGallons: number;        // Galon hilang
  lastOpnameDate?: string;
  lastOpnameBy?: string;
}

export interface WaterProviderLog {
  id: string;
  date: string;
  deliveryNumber: string;    // No. Surat Jalan / Faktur
  supplierName: string;      // Nama Provider / Supplier Galon
  driverName?: string;       // Nama Pengantar / Driver
  filledReceived: number;    // Jumlah galon isi datang
  emptyReturned: number;     // Berapa galon kosong yang dibawa oleh provider
  receivedBy: string;        // Petugas RR Penerima
  notes?: string;
}

export interface WaterOpnameRecord {
  id: string;
  opnameNumber: string;
  date: string;
  auditorName: string;
  initialTotalAssets: number;
  physicalFilled: number;
  physicalEmpty: number;
  physicalInRooms: number;
  physicalDamaged: number;
  physicalLost: number;
  totalPhysical: number;
  systemTotal: number;
  variance: number;
  notes?: string;
}

export type RequestStatus = 
  | 'Draft' 
  | 'Diajukan' 
  | 'Menunggu Approval' 
  | 'Disetujui' 
  | 'Ditolak' 
  | 'Sedang Disiapkan' 
  | 'Siap Diambil' 
  | 'Selesai'
  | 'Dibatalkan'
  | 'Stok Tidak Tersedia';

export type ServiceType = 'seragam' | 'atk' | 'fotocopy' | 'air_galon' | 'laminating';

export interface RequestItemDetail {
  itemId: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unitMeasure: string;
  quantityRequested: number;
  quantityApproved?: number;
  stockAvailable?: number;
  notes?: string;
  size?: string;
}

export interface PhotocopyDetail {
  serviceType?: string; // 'Foto Copy'
  documentType: string; // Keterangan Dokumen / Jenis Dokumen (e.g. Soal Ujian, Modul Belajar, RPP, dll)
  paperSize: 'A4' | 'Folio (F4)' | 'A3' | string;
  pageCount: number; // Jumlah Halaman Asli
  copyCount: number; // Jumlah Copy (Rangkap)
  totalSheets: number; // Total Lembar Digunakan (Otomatis)
  binding: string; // Jilid dan Finishing
  deadlineDate: string; // Batas Waktu (Deadline)
  photoUrl?: string; // Foto Dokumen / Pratinjau
  fileName?: string;
  fileSize?: string;
  notes?: string; // Keterangan Tambahan
  colorType?: 'Hitam Putih' | 'Warna';
  completedSheets?: number;
}

export interface LaminatingDetail {
  serviceType?: string; // 'Laminating'
  documentType: string; // Keterangan Dokumen / Jenis Dokumen (e.g. Piagam / Sertifikat, Media Ajar, dll)
  paperSize: 'A4' | 'Folio (F4)' | 'A3' | string;
  quantity: number; // Jumlah yang laminating (lembar)
  deadlineDate: string; // Batas Waktu (Deadline)
  photoUrl?: string; // Foto Dokumen / Lampiran
  fileName?: string;
  fileSize?: string;
  notes?: string; // Keterangan Tambahan
  filmType?: string; // Tipe Plastik Film
  thickness?: string; // Ketebalan Film
  cornerCut?: string; // Sudut Bulat / Siku
}

export interface WaterDetail {
  pickupTimestamp?: string;
  locationId?: string;
  roomName: string;
  requestType: 'Penggantian Galon Kosong' | 'Tambahan Galon' | 'Galon Baru' | string;
  gallonCount: number;          // Jumlah galon isi yang diminta
  emptyGallonsReturned: number; // Jumlah galon kosong yang dikembalikan
  notes?: string;
}

export interface ServiceRequest {
  id: string;
  requestNumber: string; // e.g. SRG-2026-00001, ATK-2026-00001
  serviceType: ServiceType;
  userId: string;
  userName: string;
  userEmail: string;
  unit: string;
  department: string;
  requestDate: string;
  status: RequestStatus;
  urgency: 'Biasa' | 'Penting' | 'Mendesak';
  purpose: string;
  notes?: string;
  items: RequestItemDetail[];
  photocopyDetail?: PhotocopyDetail;
  laminatingDetail?: LaminatingDetail;
  waterDetail?: WaterDetail;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  processedBy?: string;
  completedDate?: string;
  pickedUpBy?: string;
  adminNotes?: string;
}

export type StockTransactionType = 'IN' | 'OUT' | 'OPNAME';
export type StockSourceType = 'Pembelian' | 'Pengadaan' | 'Retur' | 'Transfer' | 'Permintaan User' | 'Distribusi Unit' | 'Barang Rusak' | 'Kehilangan' | 'Penyesuaian Stok';

export interface StockTransaction {
  id: string;
  transactionNumber: string;
  itemId: string;
  itemName: string;
  category: string;
  type: StockTransactionType;
  sourceReason: StockSourceType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  unitMeasure: string;
  date: string;
  referenceNo?: string;
  userId: string;
  userName: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AppNotification {
  id: string;
  userId?: string; // target user or undefined for broadcast
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  serviceType?: ServiceType;
  requestId?: string;
  isRead: boolean;
  timestamp: string;
}

export interface MasterUnit {
  id: string;
  code: string;
  name: string;
  headName: string;
  email: string;
}

export interface MasterDepartment {
  id: string;
  unitId: string;
  unitName: string;
  name: string;
}

export interface MasterSupplier {
  id: string;
  code: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface MasterLocation {
  id: string;
  code: string;
  name: string;
  zone: string;
  description: string;
}
