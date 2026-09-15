import { supabase, PROJECT_METADATA } from '../lib/supabase';
import {
  User,
  RoleConfig,
  MasterItem,
  UniformItem,
  WaterLocation,
  WaterInventory,
  WaterProviderLog,
  WaterOpnameRecord,
  ServiceRequest,
  StockTransaction,
  AuditLog,
  AppNotification,
  MasterUnit,
  MasterDepartment,
  MasterSupplier,
  MasterLocation,
} from '../types';

export interface DatabaseStatusInfo {
  connected: boolean;
  hasTables: boolean;
  isConfigured?: boolean;
  tableDetails: Record<string, { exists: boolean; count: number }>;
  message: string;
  latencyMs?: number;
  lastChecked: string;
}

// -------------------------------------------------------------------------
// TRANSFORMERS (CamelCase Frontend <--> Snake_Case Supabase DB)
// -------------------------------------------------------------------------

export const transformUserToDB = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  username: u.username || u.email.split('@')[0],
  password: u.password || 'password123',
  role: u.role,
  unit: u.unit,
  department: u.department,
  phone: u.phone || null,
  avatar: u.avatar || null,
  status: u.status || 'Aktif',
});

export const transformUserFromDB = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username || row.email?.split('@')[0],
  password: row.password || 'password123',
  role: row.role || 'user',
  unit: row.unit || 'SMP',
  department: row.department || 'Guru',
  phone: row.phone || undefined,
  avatar: row.avatar || undefined,
  status: row.status || 'Aktif',
});

export const transformItemToDB = (item: MasterItem) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  category: item.category,
  unit_measure: item.unitMeasure,
  stock: Number(item.stock),
  min_stock: Number(item.minStock),
  location: item.location || '',
  price: Number(item.price || 0),
  supplier: item.supplier || null,
  status: item.status || 'available',
  description: item.description || null,
});

export const transformItemFromDB = (row: any): MasterItem => ({
  id: row.id,
  code: row.code,
  name: row.name,
  category: row.category,
  unitMeasure: row.unit_measure,
  stock: Number(row.stock || 0),
  minStock: Number(row.min_stock || 0),
  location: row.location || '',
  price: Number(row.price || 0),
  supplier: row.supplier || undefined,
  status: row.status || 'available',
  description: row.description || undefined,
});

export const transformUniformToDB = (u: UniformItem) => ({
  id: u.id,
  code: u.code,
  name: u.name,
  category: u.category,
  size: u.size,
  color: u.color || '',
  target_unit: u.targetUnit || 'Semua Unit',
  stock: Number(u.stock),
  min_stock: Number(u.minStock),
  location: u.location || '',
  price: Number(u.price || 0),
  status: u.status || 'available',
});

export const transformUniformFromDB = (row: any): UniformItem => ({
  id: row.id,
  code: row.code,
  name: row.name,
  category: row.category,
  size: row.size,
  color: row.color || '',
  targetUnit: row.target_unit || 'Semua Unit',
  stock: Number(row.stock || 0),
  minStock: Number(row.min_stock || 0),
  location: row.location || '',
  price: Number(row.price || 0),
  status: row.status || 'available',
});

export const transformWaterLocationToDB = (w: WaterLocation) => ({
  id: w.id,
  unit: w.unit,
  room_name: w.roomName,
  floor: w.floor || '',
  dispenser_count: Number(w.dispenserCount || 1),
  active_gallons: Number(w.activeGallons || 1),
  empty_gallons: Number(w.emptyGallons || 0),
  last_refill_date: w.lastRefillDate || null,
});

export const transformWaterLocationFromDB = (row: any): WaterLocation => ({
  id: row.id,
  code: row.code || `TG-${(row.unit || 'LOC').toUpperCase()}-${String(row.id || '').slice(-2)}`,
  unit: row.unit,
  unitId: row.unit_id || undefined,
  department: row.department || undefined,
  departmentId: row.department_id || undefined,
  roomName: row.room_name,
  building: row.building || undefined,
  floor: row.floor || '',
  dispenserCount: Number(row.dispenser_count || 1),
  dispenserBrand: row.dispenser_brand || undefined,
  activeGallons: Number(row.active_gallons || 1),
  emptyGallons: Number(row.empty_gallons || 0),
  picName: row.pic_name || undefined,
  status: row.status || 'Aktif',
  notes: row.notes || undefined,
  lastRefillDate: row.last_refill_date || undefined,
});

export const transformWaterInventoryToDB = (w: WaterInventory) => ({
  id: 'main_inventory',
  initial_total_assets: Number(w.initialTotalAssets || 100),
  filled_gallons: Number(w.filledGallons || 0),
  empty_gallons: Number(w.emptyGallons || 0),
  in_distribution: Number(w.inDistribution || 0),
  damaged_gallons: Number(w.damagedGallons || 0),
  lost_gallons: Number(w.lostGallons || 0),
  last_opname_date: w.lastOpnameDate || null,
  last_opname_by: w.lastOpnameBy || null,
});

export const transformWaterInventoryFromDB = (row: any): WaterInventory => ({
  initialTotalAssets: Number(row.initial_total_assets || 100),
  filledGallons: Number(row.filled_gallons || 0),
  emptyGallons: Number(row.empty_gallons || 0),
  inDistribution: Number(row.in_distribution || 0),
  damagedGallons: Number(row.damaged_gallons || 0),
  lostGallons: Number(row.lost_gallons || 0),
  lastOpnameDate: row.last_opname_date || undefined,
  lastOpnameBy: row.last_opname_by || undefined,
});

export const transformRequestToDB = (r: ServiceRequest) => ({
  id: r.id,
  request_number: r.requestNumber,
  service_type: r.serviceType,
  user_id: r.userId,
  user_name: r.userName,
  user_email: r.userEmail,
  unit: r.unit,
  department: r.department,
  request_date: r.requestDate,
  status: r.status,
  urgency: r.urgency || 'Biasa',
  purpose: r.purpose || '',
  notes: r.notes || '',
  items: r.items || [],
  photocopy_detail: r.photocopyDetail || null,
  laminating_detail: r.laminatingDetail || null,
  water_detail: r.waterDetail || null,
  approved_by: r.approvedBy || null,
  approval_date: r.approvalDate || null,
  rejection_reason: r.rejectionReason || null,
  processed_by: r.processedBy || null,
  completed_date: r.completedDate || null,
  picked_up_by: r.pickedUpBy || null,
  admin_notes: r.adminNotes || null,
});

export const transformRequestFromDB = (row: any): ServiceRequest => ({
  id: row.id,
  requestNumber: row.request_number,
  serviceType: row.service_type,
  userId: row.user_id,
  userName: row.user_name,
  userEmail: row.user_email,
  unit: row.unit,
  department: row.department,
  requestDate: row.request_date,
  status: row.status,
  urgency: row.urgency || 'Biasa',
  purpose: row.purpose || '',
  notes: row.notes || '',
  items: Array.isArray(row.items) ? row.items : [],
  photocopyDetail: row.photocopy_detail || undefined,
  laminatingDetail: row.laminating_detail || undefined,
  waterDetail: row.water_detail || undefined,
  approvedBy: row.approved_by || undefined,
  approvalDate: row.approval_date || undefined,
  rejectionReason: row.rejection_reason || undefined,
  processedBy: row.processed_by || undefined,
  completedDate: row.completed_date || undefined,
  pickedUpBy: row.picked_up_by || undefined,
  adminNotes: row.admin_notes || undefined,
});

export const transformStockTransactionToDB = (st: StockTransaction) => ({
  id: st.id,
  transaction_number: st.transactionNumber,
  item_id: st.itemId,
  item_name: st.itemName,
  category: st.category || '',
  type: st.type,
  source_reason: st.sourceReason,
  quantity: Number(st.quantity),
  before_stock: Number(st.beforeStock),
  after_stock: Number(st.afterStock),
  unit_measure: st.unitMeasure,
  date: st.date,
  reference_no: st.referenceNo || null,
  user_id: st.userId,
  user_name: st.userName,
  notes: st.notes || null,
});

export const transformStockTransactionFromDB = (row: any): StockTransaction => ({
  id: row.id,
  transactionNumber: row.transaction_number,
  itemId: row.item_id,
  itemName: row.item_name,
  category: row.category || '',
  type: row.type,
  sourceReason: row.source_reason,
  quantity: Number(row.quantity),
  beforeStock: Number(row.before_stock),
  afterStock: Number(row.after_stock),
  unitMeasure: row.unit_measure,
  date: row.date,
  referenceNo: row.reference_no || undefined,
  userId: row.user_id,
  userName: row.user_name,
  notes: row.notes || undefined,
});

export const transformAuditLogToDB = (l: AuditLog) => ({
  id: l.id,
  user_id: l.userId,
  user_name: l.userName,
  user_role: l.userRole,
  action: l.action,
  module: l.module,
  details: l.details,
  timestamp: l.timestamp,
  ip_address: l.ipAddress || null,
});

export const transformAuditLogFromDB = (row: any): AuditLog => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  userRole: row.user_role,
  action: row.action,
  module: row.module,
  details: row.details,
  timestamp: row.timestamp,
  ipAddress: row.ip_address || undefined,
});

export const transformNotificationToDB = (n: AppNotification) => ({
  id: n.id,
  user_id: n.userId || null,
  title: n.title,
  message: n.message,
  type: n.type || 'info',
  service_type: n.serviceType || null,
  request_id: n.requestId || null,
  is_read: Boolean(n.isRead),
  timestamp: n.timestamp,
});

export const transformNotificationFromDB = (row: any): AppNotification => ({
  id: row.id,
  userId: row.user_id || undefined,
  title: row.title,
  message: row.message,
  type: row.type || 'info',
  serviceType: row.service_type || undefined,
  requestId: row.request_id || undefined,
  isRead: Boolean(row.is_read),
  timestamp: row.timestamp,
});

export const transformUnitToDB = (u: MasterUnit) => ({
  id: u.id,
  code: u.code,
  name: u.name,
  head_name: u.headName || '',
  email: u.email || '',
});

export const transformUnitFromDB = (row: any): MasterUnit => ({
  id: row.id,
  code: row.code,
  name: row.name,
  headName: row.head_name || '',
  email: row.email || '',
});

export const transformDeptToDB = (d: MasterDepartment) => ({
  id: d.id,
  unit_id: d.unitId,
  unit_name: d.unitName,
  name: d.name,
});

export const transformDeptFromDB = (row: any): MasterDepartment => ({
  id: row.id,
  unitId: row.unit_id,
  unitName: row.unit_name,
  name: row.name,
});

export const transformSupplierToDB = (s: MasterSupplier) => ({
  id: s.id,
  code: s.code,
  name: s.name,
  category: s.category || '',
  contact_person: s.contactPerson || '',
  phone: s.phone || '',
  address: s.address || '',
});

export const transformSupplierFromDB = (row: any): MasterSupplier => ({
  id: row.id,
  code: row.code,
  name: row.name,
  category: row.category || '',
  contactPerson: row.contact_person || '',
  phone: row.phone || '',
  address: row.address || '',
});

export const transformLocationToDB = (l: MasterLocation) => ({
  id: l.id,
  code: l.code,
  name: l.name,
  zone: l.zone || '',
  description: l.description || '',
});

export const transformLocationFromDB = (row: any): MasterLocation => ({
  id: row.id,
  code: row.code,
  name: row.name,
  zone: row.zone || '',
  description: row.description || '',
});

export const transformRoleConfigToDB = (rc: RoleConfig) => ({
  role: rc.role,
  role_name: rc.roleName,
  badge_title: rc.badgeTitle,
  description: rc.description || '',
  security_level: rc.securityLevel || 'Sedang',
  permissions: rc.permissions || {},
});

export const transformRoleConfigFromDB = (row: any): RoleConfig => ({
  role: row.role,
  roleName: row.role_name,
  badgeTitle: row.badge_title,
  description: row.description || '',
  securityLevel: row.security_level || 'Sedang',
  permissions: row.permissions || {},
});

// -------------------------------------------------------------------------
// DATABASE STATUS & HEALTH CHECK
// -------------------------------------------------------------------------

export async function checkSupabaseHealth(): Promise<DatabaseStatusInfo> {
  const startTime = performance.now();
  const tableList = [
    'users',
    'master_items',
    'uniform_items',
    'water_locations',
    'water_inventory',
    'service_requests',
    'stock_transactions',
    'audit_logs',
    'app_notifications',
    'master_units',
  ];

  const tableDetails: Record<string, { exists: boolean; count: number }> = {};
  let overallConnected = false;
  let overallHasTables = false;

  try {
    // Probe a quick query to users
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const latency = Math.round(performance.now() - startTime);

    if (error && error.code === '42P01') {
      // Table doesn't exist yet, but network and connection to Supabase is OK!
      overallConnected = true;
      overallHasTables = false;
      return {
        connected: true,
        hasTables: false,
        tableDetails,
        message: 'Koneksi ke Supabase berhasil! Skema tabel SQL belum dibuat di database.',
        latencyMs: latency,
        lastChecked: new Date().toLocaleTimeString('id-ID'),
      };
    }

    if (error && !['42P01', 'PGRST116'].includes(error.code)) {
      return {
        connected: false,
        hasTables: false,
        tableDetails,
        message: `Koneksi Supabase error: ${error.message} (${error.code || 'Unknown'})`,
        latencyMs: latency,
        lastChecked: new Date().toLocaleTimeString('id-ID'),
      };
    }

    overallConnected = true;
    tableDetails['users'] = { exists: true, count: count || 0 };

    // Check other core tables
    for (const tbl of tableList.slice(1)) {
      try {
        const res = await supabase.from(tbl).select('*', { count: 'exact', head: true });
        if (!res.error) {
          tableDetails[tbl] = { exists: true, count: res.count || 0 };
        } else {
          tableDetails[tbl] = { exists: false, count: 0 };
        }
      } catch {
        tableDetails[tbl] = { exists: false, count: 0 };
      }
    }

    const existingCount = Object.values(tableDetails).filter((t) => t.exists).length;
    overallHasTables = existingCount > 0;

    return {
      connected: true,
      hasTables: overallHasTables,
      isConfigured: PROJECT_METADATA.isConfigured,
      tableDetails,
      message: overallHasTables
        ? `Terhubung ke Supabase (${existingCount} tabel terdeteksi, Latency: ${latency}ms)`
        : 'Terhubung ke Supabase. Silakan jalankan Skrip SQL Schema di dashboard Supabase.',
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      connected: false,
      hasTables: false,
      isConfigured: PROJECT_METADATA.isConfigured,
      tableDetails,
      message: `Gagal menghubungi Supabase: ${err.message || 'Jaringan atau kredensial bermasalah'}`,
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

// -------------------------------------------------------------------------
// REUSABLE DB HELPERS
// -------------------------------------------------------------------------

export async function fetchAllFromTable<T>(
  tableName: string,
  transformFn?: (row: any) => T
): Promise<T[] | null> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      // Table doesn't exist or permission denied
      return null;
    }
    if (!transformFn) {
      return (data || []) as unknown as T[];
    }
    return (data || []).map(transformFn);
  } catch {
    return null;
  }
}

export async function upsertToTable(tableName: string, data: any): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).upsert(data);
    if (error) {
      console.warn(`Supabase upsert error on table [${tableName}]:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`Supabase upsert exception on [${tableName}]:`, e);
    return false;
  }
}

export async function deleteFromTable(
  tableName: string,
  idColumn: string,
  idValue: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).delete().eq(idColumn, idValue);
    if (error) {
      console.warn(`Supabase delete error on table [${tableName}]:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`Supabase delete exception on [${tableName}]:`, e);
    return false;
  }
}

// -------------------------------------------------------------------------
// SEED / SYNC INITIAL DATA TO SUPABASE
// -------------------------------------------------------------------------

export async function syncAllInitialDataToSupabase(data: {
  users: User[];
  roleConfigs: RoleConfig[];
  items: MasterItem[];
  uniforms: UniformItem[];
  waterLocations: WaterLocation[];
  waterInventory: WaterInventory;
  waterProviderLogs: WaterProviderLog[];
  waterOpnameRecords: WaterOpnameRecord[];
  requests: ServiceRequest[];
  stockTransactions: StockTransaction[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  units: MasterUnit[];
  departments: MasterDepartment[];
  suppliers: MasterSupplier[];
  locations: MasterLocation[];
}): Promise<{ success: boolean; message: string; details: Record<string, number> }> {
  const details: Record<string, number> = {};

  try {
    // 1. Users
    if (data.users.length > 0) {
      const dbUsers = data.users.map(transformUserToDB);
      const { error } = await supabase.from('users').upsert(dbUsers);
      if (!error) details['users'] = dbUsers.length;
    }

    // 2. Role configs
    if (data.roleConfigs.length > 0) {
      const dbRoles = data.roleConfigs.map(transformRoleConfigToDB);
      const { error } = await supabase.from('role_configs').upsert(dbRoles);
      if (!error) details['role_configs'] = dbRoles.length;
    }

    // 3. Master items
    if (data.items.length > 0) {
      const dbItems = data.items.map(transformItemToDB);
      const { error } = await supabase.from('master_items').upsert(dbItems);
      if (!error) details['master_items'] = dbItems.length;
    }

    // 4. Uniform items
    if (data.uniforms.length > 0) {
      const dbUniforms = data.uniforms.map(transformUniformToDB);
      const { error } = await supabase.from('uniform_items').upsert(dbUniforms);
      if (!error) details['uniform_items'] = dbUniforms.length;
    }

    // 5. Water Locations
    if (data.waterLocations.length > 0) {
      const dbWaterLocs = data.waterLocations.map(transformWaterLocationToDB);
      const { error } = await supabase.from('water_locations').upsert(dbWaterLocs);
      if (!error) details['water_locations'] = dbWaterLocs.length;
    }

    // 6. Water Inventory
    if (data.waterInventory) {
      const dbWaterInv = transformWaterInventoryToDB(data.waterInventory);
      const { error } = await supabase.from('water_inventory').upsert(dbWaterInv);
      if (!error) details['water_inventory'] = 1;
    }

    // 7. Service Requests
    if (data.requests.length > 0) {
      const dbRequests = data.requests.map(transformRequestToDB);
      const { error } = await supabase.from('service_requests').upsert(dbRequests);
      if (!error) details['service_requests'] = dbRequests.length;
    }

    // 8. Stock Transactions
    if (data.stockTransactions.length > 0) {
      const dbTx = data.stockTransactions.map(transformStockTransactionToDB);
      const { error } = await supabase.from('stock_transactions').upsert(dbTx);
      if (!error) details['stock_transactions'] = dbTx.length;
    }

    // 9. Units
    if (data.units.length > 0) {
      const dbUnits = data.units.map(transformUnitToDB);
      const { error } = await supabase.from('master_units').upsert(dbUnits);
      if (!error) details['master_units'] = dbUnits.length;
    }

    // 10. Departments
    if (data.departments.length > 0) {
      const dbDepts = data.departments.map(transformDeptToDB);
      const { error } = await supabase.from('master_departments').upsert(dbDepts);
      if (!error) details['master_departments'] = dbDepts.length;
    }

    // 11. Suppliers
    if (data.suppliers.length > 0) {
      const dbSuppliers = data.suppliers.map(transformSupplierToDB);
      const { error } = await supabase.from('master_suppliers').upsert(dbSuppliers);
      if (!error) details['master_suppliers'] = dbSuppliers.length;
    }

    // 12. Locations
    if (data.locations.length > 0) {
      const dbLocations = data.locations.map(transformLocationToDB);
      const { error } = await supabase.from('master_locations').upsert(dbLocations);
      if (!error) details['master_locations'] = dbLocations.length;
    }

    const totalSynced = Object.values(details).reduce((a, b) => a + b, 0);

    return {
      success: totalSynced > 0,
      message:
        totalSynced > 0
          ? `Berhasil menyinkronkan ${totalSynced} data ke database Supabase!`
          : 'Tabel database di Supabase belum dibuat. Silakan salin & jalankan skrip SQL Schema di dashboard Supabase SQL Editor terlebih dahulu.',
      details,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi data ke Supabase: ${err.message}`,
      details,
    };
  }
}
