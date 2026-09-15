import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  RoleConfig, 
  RolePermissions, 
  MasterItem, 
  UniformItem, 
  WaterLocation, 
  WaterInventory, 
  WaterProviderLog, 
  WaterOpnameRecord, 
  WaterDetail, 
  ServiceRequest, 
  StockTransaction, 
  AuditLog, 
  AppNotification, 
  MasterUnit, 
  MasterDepartment, 
  MasterSupplier, 
  MasterLocation, 
  ServiceType, 
  RequestStatus 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_ROLES, 
  INITIAL_ITEMS, 
  INITIAL_UNIFORMS, 
  INITIAL_WATER_LOCATIONS, 
  INITIAL_WATER_INVENTORY, 
  INITIAL_WATER_PROVIDER_LOGS, 
  INITIAL_WATER_OPNAME_RECORDS, 
  INITIAL_REQUESTS, 
  INITIAL_STOCK_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_UNITS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_LOCATIONS 
} from '../data/initialData';
import { 
  supabase, 
  PROJECT_METADATA 
} from '../lib/supabase';
import {
  checkSupabaseHealth,
  DatabaseStatusInfo,
  syncAllInitialDataToSupabase,
  fetchAllFromTable,
  upsertToTable,
  deleteFromTable,
  transformUserToDB,
  transformUserFromDB,
  transformItemToDB,
  transformItemFromDB,
  transformUniformToDB,
  transformUniformFromDB,
  transformWaterLocationToDB,
  transformWaterLocationFromDB,
  transformWaterInventoryToDB,
  transformWaterInventoryFromDB,
  transformRequestToDB,
  transformRequestFromDB,
  transformStockTransactionToDB,
  transformStockTransactionFromDB,
  transformAuditLogToDB,
  transformAuditLogFromDB,
  transformNotificationToDB,
  transformNotificationFromDB,
  transformUnitToDB,
  transformUnitFromDB,
  transformDeptToDB,
  transformDeptFromDB,
  transformSupplierToDB,
  transformSupplierFromDB,
  transformLocationToDB,
  transformLocationFromDB,
  transformRoleConfigToDB,
  transformRoleConfigFromDB
} from '../services/supabaseService';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export type SupabaseConnectionStatus = 'connected' | 'connecting' | 'error' | 'local_fallback';

interface AppContextType {
  currentUser: User | null;
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
  toasts: ToastInfo[];

  // Supabase Status & Cloud Sync
  supabaseStatus: SupabaseConnectionStatus;
  dbInfo: DatabaseStatusInfo | null;
  isSyncingToSupabase: boolean;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string; details: Record<string, number> }>;
  refreshSupabaseConnection: () => Promise<void>;
  
  // Auth & User Switch
  login: (emailOrUsername: string, roleOrPassword?: string) => boolean;
  loginWithGoogleEmail: (email: string) => { success: boolean; message?: string; user?: User };
  logout: () => void;
  switchUser: (userId: string) => void;
  switchUserRole: (role: UserRole) => void;
  
  // Requests
  createRequest: (data: Omit<ServiceRequest, 'id' | 'requestNumber' | 'requestDate' | 'status'>) => ServiceRequest;
  updateRequestStatus: (
    requestId: string, 
    status: RequestStatus, 
    extraData?: {
      rejectionReason?: string;
      adminNotes?: string;
      pickedUpBy?: string;
      quantityApprovedMap?: Record<string, number>;
    }
  ) => void;
  deleteRequest: (requestId: string) => void;
  
  // Inventory
  addMasterItem: (item: Omit<MasterItem, 'id' | 'status'>) => void;
  updateMasterItem: (id: string, item: Partial<MasterItem>) => void;
  deleteMasterItem: (id: string) => void;
  
  // Uniforms
  addUniform: (uniform: Omit<UniformItem, 'id' | 'status'>) => void;
  updateUniform: (id: string, uniform: Partial<UniformItem>) => void;
  deleteUniform: (id: string) => void;
  
  // Stock operations
  processStockIn: (
    itemId: string, 
    quantity: number, 
    sourceReason: any, 
    notes: string, 
    referenceNo?: string,
    isUniform?: boolean
  ) => void;
  processStockOut: (
    itemId: string, 
    quantity: number, 
    sourceReason: any, 
    notes: string, 
    referenceNo?: string,
    isUniform?: boolean
  ) => void;
  processStockOpname: (
    itemId: string, 
    physicalCount: number, 
    notes: string,
    isUniform?: boolean
  ) => void;
  
  // Water
  addWaterLocation: (loc: Omit<WaterLocation, 'id'>) => void;
  updateWaterLocation: (id: string, data: Partial<WaterLocation>) => void;
  deleteWaterLocation: (id: string) => void;
  updateWaterInventory: (data: Partial<WaterInventory>) => void;
  updateWaterTransaction: (
    requestId: string,
    data: {
      gallonCount: number;
      emptyGallonsReturned: number;
      pickedUpBy?: string;
      notes?: string;
    }
  ) => void;
  addWaterProviderDelivery: (log: Omit<WaterProviderLog, 'id'>) => void;
  performWaterStockOpname: (data: {
    auditorName: string;
    initialTotalAssets: number;
    physicalFilled: number;
    physicalEmpty: number;
    physicalInRooms: number;
    physicalDamaged: number;
    physicalLost: number;
    notes?: string;
  }) => void;
  updateInitialWaterAssets: (total: number) => void;
  
  // Master Setup & Roles
  addUser: (user: Omit<User, 'id'>) => void;
  addUsers: (usersList: Omit<User, 'id'>[]) => number;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (userId: string, newPassword?: string) => string;
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>) => void;
  resetRolePermissions: () => void;
  addUnit: (unit: Omit<MasterUnit, 'id'>) => void;
  updateUnit: (id: string, data: Partial<MasterUnit>) => void;
  deleteUnit: (id: string) => void;
  addDepartment: (dept: Omit<MasterDepartment, 'id'>) => void;
  updateDepartment: (id: string, data: Partial<MasterDepartment>) => void;
  deleteDepartment: (id: string) => void;
  addSupplier: (sup: Omit<MasterSupplier, 'id'>) => void;
  addLocation: (loc: Omit<MasterLocation, 'id'>) => void;
  
  // Notifications & Logs
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addAuditLog: (action: string, module: string, details: string) => void;
  showToast: (type: ToastInfo['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  
  // Reset demo data
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'lazuardi_rr_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states from LocalStorage or defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
      return (saved && saved !== 'null' && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}role_configs`);
    return saved ? JSON.parse(saved) : INITIAL_ROLES;
  });

  const [items, setItems] = useState<MasterItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}items`);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [uniforms, setUniforms] = useState<UniformItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}uniforms`);
    return saved ? JSON.parse(saved) : INITIAL_UNIFORMS;
  });

  const [waterLocations, setWaterLocations] = useState<WaterLocation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}water_locations`);
    return saved ? JSON.parse(saved) : INITIAL_WATER_LOCATIONS;
  });

  const [waterInventory, setWaterInventory] = useState<WaterInventory>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}water_inventory`);
    return saved ? JSON.parse(saved) : INITIAL_WATER_INVENTORY;
  });

  const [waterProviderLogs, setWaterProviderLogs] = useState<WaterProviderLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}water_provider_logs`);
    return saved ? JSON.parse(saved) : INITIAL_WATER_PROVIDER_LOGS;
  });

  const [waterOpnameRecords, setWaterOpnameRecords] = useState<WaterOpnameRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}water_opname_records`);
    return saved ? JSON.parse(saved) : INITIAL_WATER_OPNAME_RECORDS;
  });

  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}requests`);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}stock_transactions`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSACTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit_logs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [units, setUnits] = useState<MasterUnit[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}units`);
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  const [departments, setDepartments] = useState<MasterDepartment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}departments`);
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [suppliers, setSuppliers] = useState<MasterSupplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [locations, setLocations] = useState<MasterLocation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}locations`);
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Supabase State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>('connecting');
  const [dbInfo, setDbInfo] = useState<DatabaseStatusInfo | null>(null);
  const [isSyncingToSupabase, setIsSyncingToSupabase] = useState(false);

  // Check Supabase Health & Auto-load data if available
  const refreshSupabaseConnection = async () => {
    try {
      setSupabaseStatus('connecting');
      const health = await checkSupabaseHealth();
      setDbInfo(health);

      if (!health.isConfigured) {
        setSupabaseStatus('local_fallback');
        return;
      }

      if (!health.connected) {
        setSupabaseStatus('error');
        return;
      }

      setSupabaseStatus('connected');

      // If tables exist in Supabase, load remote records
      if (health.hasTables) {
        try {
          const [
            remoteUsers,
            remoteItems,
            remoteUniforms,
            remoteWaterLocs,
            remoteWaterInv,
            remoteWaterLogs,
            remoteWaterOpname,
            remoteRequests,
            remoteTrx,
            remoteUnits,
            remoteDepts,
            remoteSuppliers,
            remoteLocations,
            remoteRoles
          ] = await Promise.all([
            fetchAllFromTable<any>('users', transformUserFromDB),
            fetchAllFromTable<any>('master_items', transformItemFromDB),
            fetchAllFromTable<any>('uniform_items', transformUniformFromDB),
            fetchAllFromTable<any>('water_locations', transformWaterLocationFromDB),
            fetchAllFromTable<any>('water_inventory', transformWaterInventoryFromDB),
            fetchAllFromTable<any>('water_provider_logs'),
            fetchAllFromTable<any>('water_opname_records'),
            fetchAllFromTable<any>('service_requests', transformRequestFromDB),
            fetchAllFromTable<any>('stock_transactions', transformStockTransactionFromDB),
            fetchAllFromTable<any>('master_units', transformUnitFromDB),
            fetchAllFromTable<any>('master_departments', transformDeptFromDB),
            fetchAllFromTable<any>('master_suppliers', transformSupplierFromDB),
            fetchAllFromTable<any>('master_locations', transformLocationFromDB),
            fetchAllFromTable<any>('role_configs', transformRoleConfigFromDB)
          ]);

          if (remoteUsers && remoteUsers.length > 0) {
            setUsers(prev => {
              const remoteIds = new Set(remoteUsers.map((u: User) => u.id));
              const remoteEmails = new Set(remoteUsers.map((u: User) => u.email.toLowerCase().trim()));
              const localOnly = prev.filter(u => !remoteIds.has(u.id) && !remoteEmails.has(u.email.toLowerCase().trim()));
              localOnly.forEach(u => upsertToTable('users', transformUserToDB(u)).catch(console.warn));
              return [...remoteUsers, ...localOnly];
            });
          }

          if (remoteItems && remoteItems.length > 0) {
            setItems(prev => {
              const remoteIds = new Set(remoteItems.map((i: MasterItem) => i.id));
              const remoteCodes = new Set(remoteItems.map((i: MasterItem) => i.code.toLowerCase().trim()));
              const localOnly = prev.filter(i => !remoteIds.has(i.id) && !remoteCodes.has(i.code.toLowerCase().trim()));
              localOnly.forEach(i => upsertToTable('master_items', transformItemToDB(i)).catch(console.warn));
              return [...remoteItems, ...localOnly];
            });
          }

          if (remoteUniforms && remoteUniforms.length > 0) {
            setUniforms(prev => {
              const remoteIds = new Set(remoteUniforms.map((u: UniformItem) => u.id));
              const remoteCodes = new Set(remoteUniforms.map((u: UniformItem) => u.code.toLowerCase().trim()));
              const localOnly = prev.filter(u => !remoteIds.has(u.id) && !remoteCodes.has(u.code.toLowerCase().trim()));
              localOnly.forEach(u => upsertToTable('uniform_items', transformUniformToDB(u)).catch(console.warn));
              return [...remoteUniforms, ...localOnly];
            });
          }

          if (remoteWaterLocs && remoteWaterLocs.length > 0) {
            setWaterLocations(prev => {
              const remoteIds = new Set(remoteWaterLocs.map((w: WaterLocation) => w.id));
              const localOnly = prev.filter(w => !remoteIds.has(w.id));
              localOnly.forEach(w => upsertToTable('water_locations', transformWaterLocationToDB(w)).catch(console.warn));
              return [...remoteWaterLocs, ...localOnly];
            });
          }

          if (remoteWaterInv && remoteWaterInv.length > 0) {
            setWaterInventory(remoteWaterInv[0]);
          }

          if (remoteWaterLogs && remoteWaterLogs.length > 0) {
            setWaterProviderLogs(remoteWaterLogs);
          }

          if (remoteWaterOpname && remoteWaterOpname.length > 0) {
            setWaterOpnameRecords(remoteWaterOpname);
          }

          if (remoteRequests && remoteRequests.length > 0) {
            setRequests(prev => {
              const remoteIds = new Set(remoteRequests.map((r: ServiceRequest) => r.id));
              const localOnly = prev.filter(r => !remoteIds.has(r.id));
              localOnly.forEach(r => upsertToTable('service_requests', transformRequestToDB(r)).catch(console.warn));
              return [...localOnly, ...remoteRequests];
            });
          }

          if (remoteTrx && remoteTrx.length > 0) {
            setStockTransactions(prev => {
              const remoteIds = new Set(remoteTrx.map((t: StockTransaction) => t.id));
              const localOnly = prev.filter(t => !remoteIds.has(t.id));
              localOnly.forEach(t => upsertToTable('stock_transactions', transformStockTransactionToDB(t)).catch(console.warn));
              return [...localOnly, ...remoteTrx];
            });
          }

          if (remoteUnits && remoteUnits.length > 0) {
            setUnits(prev => {
              const remoteIds = new Set(remoteUnits.map((u: MasterUnit) => u.id));
              const remoteCodes = new Set(remoteUnits.map((u: MasterUnit) => u.code.toLowerCase().trim()));
              const localOnly = prev.filter(u => !remoteIds.has(u.id) && !remoteCodes.has(u.code.toLowerCase().trim()));
              localOnly.forEach(u => upsertToTable('master_units', transformUnitToDB(u)).catch(console.warn));
              return [...remoteUnits, ...localOnly];
            });
          }

          if (remoteDepts && remoteDepts.length > 0) {
            setDepartments(prev => {
              const remoteIds = new Set(remoteDepts.map((d: MasterDepartment) => d.id));
              const localOnly = prev.filter(d => !remoteIds.has(d.id));
              localOnly.forEach(d => upsertToTable('master_departments', transformDeptToDB(d)).catch(console.warn));
              return [...remoteDepts, ...localOnly];
            });
          }

          if (remoteSuppliers && remoteSuppliers.length > 0) {
            setSuppliers(prev => {
              const remoteIds = new Set(remoteSuppliers.map((s: MasterSupplier) => s.id));
              const localOnly = prev.filter(s => !remoteIds.has(s.id));
              localOnly.forEach(s => upsertToTable('master_suppliers', transformSupplierToDB(s)).catch(console.warn));
              return [...remoteSuppliers, ...localOnly];
            });
          }

          if (remoteLocations && remoteLocations.length > 0) {
            setLocations(prev => {
              const remoteIds = new Set(remoteLocations.map((l: MasterLocation) => l.id));
              const localOnly = prev.filter(l => !remoteIds.has(l.id));
              localOnly.forEach(l => upsertToTable('master_locations', transformLocationToDB(l)).catch(console.warn));
              return [...remoteLocations, ...localOnly];
            });
          }

          if (remoteRoles && remoteRoles.length > 0) {
            setRoleConfigs(remoteRoles);
          }
        } catch (err) {
          console.warn('[Supabase] Non-blocking initial fetch error:', err);
        }
      }
    } catch (err) {
      console.warn('[Supabase] Health check error:', err);
      setSupabaseStatus('error');
    }
  };

  useEffect(() => {
    refreshSupabaseConnection();
  }, []);

  // Supabase Real-time listener for Service Requests
  useEffect(() => {
    if (!supabase || supabaseStatus !== 'connected') return;

    try {
      const channel = supabase
        .channel('public:service_requests_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_requests' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newReq = transformRequestFromDB(payload.new);
              setRequests(prev => {
                if (prev.some(r => r.id === newReq.id)) return prev;
                return [newReq, ...prev];
              });
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedReq = transformRequestFromDB(payload.new);
              setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              const oldId = payload.old.id;
              setRequests(prev => prev.filter(r => r.id !== oldId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[Supabase] Realtime subscription error:', e);
    }
  }, [supabaseStatus]);

  // One-click Sync All Data to Supabase
  const syncAllToSupabase = async (): Promise<{ success: boolean; message: string; details: Record<string, number> }> => {
    setIsSyncingToSupabase(true);
    try {
      const result = await syncAllInitialDataToSupabase({
        users,
        items,
        uniforms,
        waterLocations,
        waterInventory,
        waterProviderLogs,
        waterOpnameRecords,
        requests,
        stockTransactions,
        auditLogs,
        notifications,
        units,
        departments,
        suppliers,
        locations,
        roleConfigs
      });

      if (result.success) {
        showToast('success', 'Sinkronisasi Supabase Berhasil!', result.message);
        await refreshSupabaseConnection();
      } else {
        showToast('warning', 'Peringatan Sinkronisasi', result.message);
      }
      return result;
    } catch (error: any) {
      const errMsg = error?.message || 'Gagal sinkronisasi data ke Supabase';
      showToast('error', 'Sinkronisasi Gagal', errMsg);
      return { success: false, message: errMsg, details: {} };
    } finally {
      setIsSyncingToSupabase(false);
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}role_configs`, JSON.stringify(roleConfigs));
  }, [roleConfigs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}items`, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}uniforms`, JSON.stringify(uniforms));
  }, [uniforms]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}water_locations`, JSON.stringify(waterLocations));
  }, [waterLocations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}water_inventory`, JSON.stringify(waterInventory));
  }, [waterInventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}water_provider_logs`, JSON.stringify(waterProviderLogs));
  }, [waterProviderLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}water_opname_records`, JSON.stringify(waterOpnameRecords));
  }, [waterOpnameRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}requests`, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}stock_transactions`, JSON.stringify(stockTransactions));
  }, [stockTransactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}units`, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}departments`, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}locations`, JSON.stringify(locations));
  }, [locations]);

  // Toast functions
  const showToast = (type: ToastInfo['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Audit Logger
  const addAuditLog = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistem Otomatis',
      userRole: currentUser?.role || 'user',
      action,
      module,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Auth & Switch
  const login = (emailOrUsername: string, roleOrPassword?: string): boolean => {
    const cleanInput = (emailOrUsername || '').trim().toLowerCase();
    
    // Check if matching email, username, name, or ID
    let found = users.find(u => 
      u.email.toLowerCase() === cleanInput || 
      (u.username && u.username.toLowerCase() === cleanInput) ||
      u.email.toLowerCase().startsWith(cleanInput) ||
      u.name.toLowerCase().includes(cleanInput) ||
      u.id.toLowerCase() === cleanInput
    );

    // Also match keywords like "admin.rr", "admin.super", "budi.guru", "nurul.manager", "super_admin", "admin_rr", "user", "manager"
    if (!found) {
      if (cleanInput.includes('super') || cleanInput === 'super_admin' || cleanInput === 'super.admin') {
        found = users.find(u => u.role === 'super_admin');
      } else if (cleanInput.includes('rr') || cleanInput.includes('resources') || cleanInput === 'admin_rr' || cleanInput === 'admin.rr') {
        found = users.find(u => u.role === 'admin_rr');
      } else if (cleanInput.includes('guru') || cleanInput === 'user' || cleanInput === 'staff' || cleanInput === 'user.guru') {
        found = users.find(u => u.role === 'user');
      } else if (cleanInput.includes('manager') || cleanInput.includes('kepala') || cleanInput === 'manager' || cleanInput === 'manager.ks') {
        found = users.find(u => u.role === 'manager');
      }
    }

    if (found) {
      // If password provided and it's not a direct role switcher keyword
      if (roleOrPassword && !['super_admin', 'admin_rr', 'user', 'manager'].includes(roleOrPassword)) {
        const expectedPassword = found.password || 'password123';
        if (roleOrPassword !== expectedPassword) {
          showToast('error', 'Kata Sandi Salah', `Kata sandi yang dimasukkan untuk akun "${found.name}" tidak sesuai`);
          return false;
        }
      }

      setCurrentUser(found);
      addAuditLog('User Login', 'Autentikasi', `User ${found.name} (${found.role}) berhasil masuk`);
      showToast('success', 'Selamat Datang!', `Berhasil masuk sebagai ${found.name}`);
      return true;
    }

    // If role specified directly as fallback shortcut
    if (roleOrPassword && ['super_admin', 'admin_rr', 'user', 'manager'].includes(roleOrPassword)) {
      const matchRole = users.find(u => u.role === roleOrPassword as UserRole);
      if (matchRole) {
        setCurrentUser(matchRole);
        addAuditLog('User Login', 'Autentikasi', `Login cepat sebagai ${matchRole.name}`);
        showToast('success', 'Mode Pengguna Aktif', `Masuk sebagai ${matchRole.name} (${matchRole.role})`);
        return true;
      }
    }

    showToast('error', 'Login Gagal', 'Username atau email tidak ditemukan');
    return false;
  };

  const loginWithGoogleEmail = (email: string): { success: boolean; message?: string; user?: User } => {
    const raw = (email || '').trim().toLowerCase();
    if (!raw) {
      const msg = 'Silakan masukkan email akun Google Sekolah (@lazuardi.sch.id)';
      showToast('error', 'Email Kosong', msg);
      return { success: false, message: msg };
    }

    // Auto append domain if user only typed username prefix
    const fullEmail = raw.includes('@') ? raw : `${raw}@lazuardi.sch.id`;

    // Match exact email, or username portion, or full email
    let found = users.find(u => 
      u.email.toLowerCase() === fullEmail || 
      u.email.toLowerCase() === raw ||
      u.email.toLowerCase().split('@')[0] === raw
    );

    if (!found) {
      const msg = `Email "${fullEmail}" belum terdaftar pada Master Data Pengguna. Hubungi Super Admin atau Admin RR untuk menambahkan akun Anda.`;
      showToast('error', 'Akun Tidak Ditemukan', msg);
      return { success: false, message: msg };
    }

    if (found.status === 'inactive') {
      const msg = `Akun "${found.name}" saat ini berstatus Nonaktif. Hubungi Super Admin.`;
      showToast('warning', 'Akun Nonaktif', msg);
      return { success: false, message: msg };
    }

    // Success login without password
    setCurrentUser(found);
    addAuditLog('Login Google SSO', 'Autentikasi', `Login cepat Google Workspace (@lazuardi.sch.id): ${found.name} (${found.email}) [${found.role}]`);
    showToast('success', 'Autentikasi Google Berhasil', `Selamat datang, ${found.name}! Masuk sebagai ${found.role === 'super_admin' ? 'Super Admin' : found.role === 'admin_rr' ? 'Admin RR' : found.role === 'manager' ? 'Kepala Unit' : 'Guru / Staff'} (${found.unit}).`);
    return { success: true, user: found };
  };

  const switchUserRole = (role: UserRole) => {
    const matchRole = users.find(u => u.role === role);
    if (matchRole) {
      setCurrentUser(matchRole);
      addAuditLog('User Login', 'Autentikasi', `Login cepat sebagai ${matchRole.name} (${matchRole.role})`);
      showToast('success', 'Mode Pengguna Aktif', `Masuk sebagai ${matchRole.name} (${matchRole.role})`);
    } else {
      showToast('error', 'Gagal', `Tidak ditemukan akun dengan peran ${role}`);
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', 'Autentikasi', `User ${currentUser.name} keluar dari sistem`);
    }
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
    showToast('info', 'Anda telah keluar', 'Sesi telah diakhiri. Silakan login kembali.');
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      addAuditLog('Ganti Pengguna', 'Sistem', `Beralih profil ke ${target.name} (${target.role})`);
      showToast('info', 'Beralih Akun', `Sekarang bertindak sebagai ${target.name} (${target.role})`);
    }
  };

  // Helper for Auto Number Generator
  const generateRequestNumber = (type: ServiceType): string => {
    const prefixMap: Record<ServiceType, string> = {
      seragam: 'SRG',
      atk: 'ATK',
      fotocopy: 'FCP',
      laminating: 'LAM',
      air_galon: 'AIR'
    };
    const prefix = prefixMap[type] || 'REQ';
    const year = new Date().getFullYear();
    const count = requests.filter(r => r.serviceType === type).length + 1;
    const padded = String(count).padStart(5, '0');
    return `${prefix}-${year}-${padded}`;
  };

  // Helper for Stock Transaction Number
  const generateTrxNumber = (type: string): string => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 900 + 100);
    return `TRX-${type}-${dateStr}-${rand}`;
  };

  // Create Service Request
  const createRequest = (data: Omit<ServiceRequest, 'id' | 'requestNumber' | 'requestDate' | 'status'>): ServiceRequest => {
    const reqNumber = generateRequestNumber(data.serviceType);
    const isWater = data.serviceType === 'air_galon';

    const newRequest: ServiceRequest = {
      ...data,
      id: `req-${Date.now()}`,
      requestNumber: reqNumber,
      requestDate: new Date().toISOString(),
      status: isWater ? 'Selesai' : 'Diajukan',
      completedDate: isWater ? new Date().toISOString() : undefined,
      pickedUpBy: isWater ? (data.pickedUpBy || data.userName) : undefined,
      processedBy: isWater ? (currentUser?.name || 'Petugas Resources Room') : undefined
    };

    setRequests(prev => [newRequest, ...prev]);

    // Save immediately to Supabase
    upsertToTable('service_requests', transformRequestToDB(newRequest)).catch(err => {
      console.warn('[Supabase] Failed to persist new service request:', err);
    });

    // Update Water Inventory directly if air_galon (Pengambilan Langsung tanpa proses otorisasi)
    if (isWater && data.waterDetail) {
      const qty = Number(data.waterDetail.gallonCount) || 1;
      const returnedQty = Number(data.waterDetail.emptyGallonsReturned) ?? 0;

      setWaterInventory(prev => {
        const updated = {
          ...prev,
          filledGallons: Math.max(0, prev.filledGallons - qty),
          emptyGallons: prev.emptyGallons + returnedQty,
          inDistribution: Math.max(0, prev.inDistribution + (qty - returnedQty))
        };
        upsertToTable('water_inventory', transformWaterInventoryToDB(updated)).catch(console.warn);
        return updated;
      });

      if (data.waterDetail.locationId) {
        setWaterLocations(prev => prev.map(loc => {
          if (loc.id === data.waterDetail?.locationId) {
            const updatedLoc = {
              ...loc,
              activeGallons: Math.max(1, loc.activeGallons + (qty - returnedQty)),
              lastRefillDate: new Date().toISOString().slice(0, 10),
              emptyGallons: 0
            };
            upsertToTable('water_locations', transformWaterLocationToDB(updatedLoc)).catch(console.warn);
            return updatedLoc;
          }
          return loc;
        }));
      }
    }

    // Cari Kepala Unit dari data unit
    const unitObj = units.find(
      u => u.code.toLowerCase() === data.unit.toLowerCase() || 
           u.name.toLowerCase().includes(data.unit.toLowerCase())
    );
    const headName = unitObj?.headName || 'Kepala Unit';
    const headEmail = unitObj?.email || `${data.unit.toLowerCase()}@lazuardi.sch.id`;

    const newNotifications: AppNotification[] = [];

    // 1. Notifikasi Khusus Pemberitahuan Email untuk Kepala Unit & Admin Unit (Tanpa Perlu Approval)
    if (data.serviceType === 'fotocopy') {
      newNotifications.push({
        id: `notif-head-${Date.now()}`,
        title: `[Pemberitahuan Email Kepala Unit ${data.unit}] Order Foto Copy Baru`,
        message: `Guru/Staff ${data.userName} mengajukan foto copy: "${data.photocopyDetail?.documentType || data.purpose}" (${data.photocopyDetail?.totalSheets || 0} Lembar). Permintaan langsung diproses RR. Pemberitahuan email terkirim ke ${headName} (${headEmail}) dan Admin Unit.`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });

      newNotifications.push({
        id: `notif-rr-${Date.now() + 1}`,
        title: `Antrean Foto Copy Masuk: ${reqNumber} (${data.unit})`,
        message: `${data.userName} mengajukan foto copy ${data.photocopyDetail?.totalSheets || 0} lembar ${data.photocopyDetail?.paperSize || 'A4'} (Deadline: ${data.photocopyDetail?.deadlineDate ? new Date(data.photocopyDetail.deadlineDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}). Siap diproses tanpa approval.`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });
    } else if (data.serviceType === 'laminating') {
      newNotifications.push({
        id: `notif-head-${Date.now()}`,
        title: `[Pemberitahuan Email Kepala Unit ${data.unit}] Order Laminating Baru`,
        message: `Guru/Staff ${data.userName} mengajukan laminating: "${data.laminatingDetail?.documentType || data.purpose}" (${data.laminatingDetail?.quantity || 1} Lembar ${data.laminatingDetail?.paperSize || 'A4'}). Permintaan langsung diproses RR. Pemberitahuan email terkirim ke ${headName} (${headEmail}) dan Admin Unit.`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });

      newNotifications.push({
        id: `notif-rr-${Date.now() + 1}`,
        title: `Antrean Laminating Masuk: ${reqNumber} (${data.unit})`,
        message: `${data.userName} mengajukan laminasi ${data.laminatingDetail?.quantity || 1} lembar ${data.laminatingDetail?.paperSize || 'A4'} (Deadline: ${data.laminatingDetail?.deadlineDate ? new Date(data.laminatingDetail.deadlineDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}). Siap diproses tanpa approval.`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });
    } else if (data.serviceType === 'air_galon') {
      newNotifications.push({
        id: `notif-head-${Date.now()}`,
        title: `[Pemberitahuan Email Kepala Unit ${data.unit}] Serah Terima Air Galon`,
        message: `Staff/Guru ${data.userName} (${data.unit}) telah mengambil ${data.waterDetail?.gallonCount || 1} galon isi & menyerahkan ${data.waterDetail?.emptyGallonsReturned ?? 0} galon kosong untuk ${data.waterDetail?.roomName || data.purpose}. Data tercatat otomatis & tembusan email terkirim ke ${headName} (${headEmail}) dan Admin Unit ${data.unit}.`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });

      newNotifications.push({
        id: `notif-rr-${Date.now() + 1}`,
        title: `Serah Terima Galon: ${reqNumber} (${data.unit})`,
        message: `${data.userName} mengambil ${data.waterDetail?.gallonCount || 1} galon isi & mengembalikan ${data.waterDetail?.emptyGallonsReturned ?? 0} galon kosong (${data.waterDetail?.roomName || 'Ruangan'}). Stok RR langsung tersinkronisasi.`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });
    } else {
      newNotifications.push({
        id: `notif-${Date.now()}`,
        title: `Permintaan Baru: ${reqNumber}`,
        message: `${data.userName} (${data.unit}) mengajukan permohonan ${data.serviceType.toUpperCase()} - Pemberitahuan ke ${headName}`,
        type: 'info',
        serviceType: data.serviceType,
        requestId: newRequest.id,
        isRead: false,
        timestamp: new Date().toISOString()
      });
    }

    setNotifications(prev => [...newNotifications, ...prev]);

    if (isWater) {
      addAuditLog(
        'Serah Terima Galon Langsung',
        'AIR_GALON',
        `Pengambilan langsung ${reqNumber}: ${data.waterDetail?.gallonCount || 1} galon isi diambil, ${data.waterDetail?.emptyGallonsReturned ?? 0} galon kosong diserahkan (${data.waterDetail?.roomName || data.unit})`
      );
    } else {
      addAuditLog(
        'Membuat Permintaan',
        data.serviceType.toUpperCase(),
        `Membuat permohonan ${reqNumber} (${data.purpose}) tanpa approval - Pemberitahuan dikirim ke ${headName} (${data.unit})`
      );
    }

    let toastMsg = `Nomor Transaksi: ${reqNumber}`;
    if (data.serviceType === 'fotocopy') {
      toastMsg = `Nomor Transaksi: ${reqNumber}. Permintaan langsung masuk ke antrean Resources Room & pemberitahuan email telah dikirimkan ke Kepala Unit (${headName}).`;
    } else if (data.serviceType === 'laminating') {
      toastMsg = `Nomor Transaksi: ${reqNumber}. Permintaan langsung masuk ke antrean Resources Room & pemberitahuan email telah dikirimkan ke Kepala Unit (${headName}).`;
    } else if (data.serviceType === 'air_galon') {
      toastMsg = `Nomor Bukti: ${reqNumber}. Pengambilan ${data.waterDetail?.gallonCount || 1} galon isi & penyerahan ${data.waterDetail?.emptyGallonsReturned ?? 0} galon kosong berhasil dicatat (Stok langsung disinkronkan).`;
    }

    showToast('success', isWater ? 'Pengambilan Galon Berhasil Dicatat' : 'Permintaan Berhasil Diajukan', toastMsg);
    return newRequest;
  };

  // Update Request Status with Auto-Stock Deduction
  const updateRequestStatus = (
    requestId: string, 
    status: RequestStatus, 
    extraData?: {
      rejectionReason?: string;
      adminNotes?: string;
      pickedUpBy?: string;
      quantityApprovedMap?: Record<string, number>;
    }
  ) => {
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return;

    const req = requests[reqIndex];
    const prevStatus = req.status;

    let updatedReq: ServiceRequest = {
      ...req,
      status,
      ...extraData
    };

    if (status === 'Disetujui') {
      updatedReq.approvedBy = currentUser?.name || 'Manager';
      updatedReq.approvalDate = new Date().toISOString();
      if (extraData?.quantityApprovedMap) {
        updatedReq.items = updatedReq.items.map(item => ({
          ...item,
          quantityApproved: extraData.quantityApprovedMap?.[item.itemId] ?? item.quantityRequested
        }));
      } else {
        updatedReq.items = updatedReq.items.map(item => ({
          ...item,
          quantityApproved: item.quantityRequested
        }));
      }
    } else if (status === 'Ditolak') {
      updatedReq.approvedBy = currentUser?.name || 'Manager';
      updatedReq.approvalDate = new Date().toISOString();
      updatedReq.rejectionReason = extraData?.rejectionReason || 'Ditolak oleh atasan / admin';
    } else if (status === 'Sedang Disiapkan') {
      updatedReq.processedBy = currentUser?.name || 'Admin Resources Room';
    } else if (status === 'Selesai') {
      updatedReq.completedDate = new Date().toISOString();
      updatedReq.processedBy = currentUser?.name || 'Admin Resources Room';
      updatedReq.pickedUpBy = extraData?.pickedUpBy || req.userName;

      // AUTOMATIC STOCK DEDUCTION IF MOVING TO 'Selesai'
      if (prevStatus !== 'Selesai') {
        if (req.serviceType === 'atk' || req.serviceType === 'seragam') {
          req.items.forEach(reqItem => {
            const qtyToDeduct = reqItem.quantityApproved ?? reqItem.quantityRequested;
            
            if (req.serviceType === 'atk') {
              // Master item
              const targetItem = items.find(i => i.id === reqItem.itemId);
              if (targetItem) {
                const before = targetItem.stock;
                const after = Math.max(0, before - qtyToDeduct);
                const newStatus = after === 0 ? 'out_of_stock' : (after <= targetItem.minStock ? 'low_stock' : 'available');
                
                // Update item
                const updatedItem = { ...targetItem, stock: after, status: newStatus };
                setItems(prevItems => prevItems.map(it => it.id === targetItem.id ? updatedItem : it));
                upsertToTable('master_items', transformItemToDB(updatedItem)).catch(console.warn);
                
                // Create Stock Transaction
                const trx: StockTransaction = {
                  id: `stk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  transactionNumber: generateTrxNumber('OUT'),
                  itemId: targetItem.id,
                  itemName: targetItem.name,
                  category: targetItem.category,
                  type: 'OUT',
                  sourceReason: 'Permintaan User',
                  quantity: qtyToDeduct,
                  beforeStock: before,
                  afterStock: after,
                  unitMeasure: targetItem.unitMeasure,
                  date: new Date().toISOString(),
                  referenceNo: req.requestNumber,
                  userId: currentUser?.id || 'usr-2',
                  userName: currentUser?.name || 'Admin Resources',
                  notes: `Distribusi untuk ${req.userName} (${req.unit})`
                };
                setStockTransactions(prev => [trx, ...prev]);
                upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);

                // Check low stock alert
                if (after <= targetItem.minStock) {
                  setNotifications(prev => [{
                    id: `notif-${Date.now()}-${Math.random()}`,
                    title: '⚠️ Peringatan Stok Menipis!',
                    message: `Stok ${targetItem.name} sisa ${after} ${targetItem.unitMeasure} (Batas min: ${targetItem.minStock}).`,
                    type: 'warning',
                    serviceType: 'atk',
                    isRead: false,
                    timestamp: new Date().toISOString()
                  }, ...prev]);
                }
              }
            } else if (req.serviceType === 'seragam') {
              // Uniform Item
              const targetUniform = uniforms.find(u => u.id === reqItem.itemId);
              if (targetUniform) {
                const before = targetUniform.stock;
                const after = Math.max(0, before - qtyToDeduct);
                const newStatus = after === 0 ? 'out_of_stock' : (after <= targetUniform.minStock ? 'low_stock' : 'available');
                
                const updatedUniform = { ...targetUniform, stock: after, status: newStatus };
                setUniforms(prevUnis => prevUnis.map(u => u.id === targetUniform.id ? updatedUniform : u));
                upsertToTable('uniform_items', transformUniformToDB(updatedUniform)).catch(console.warn);

                const trx: StockTransaction = {
                  id: `stk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  transactionNumber: generateTrxNumber('OUT'),
                  itemId: targetUniform.id,
                  itemName: `${targetUniform.name} (${targetUniform.size})`,
                  category: 'Seragam',
                  type: 'OUT',
                  sourceReason: 'Permintaan User',
                  quantity: qtyToDeduct,
                  beforeStock: before,
                  afterStock: after,
                  unitMeasure: 'Pcs',
                  date: new Date().toISOString(),
                  referenceNo: req.requestNumber,
                  userId: currentUser?.id || 'usr-2',
                  userName: currentUser?.name || 'Admin Resources',
                  notes: `Penyerahan seragam untuk ${req.userName} (${req.unit})`
                };
                setStockTransactions(prev => [trx, ...prev]);
                upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);
              }
            }
          });
        } else if (req.serviceType === 'air_galon' && req.waterDetail) {
          // Gallon distribution update
          const qty = req.waterDetail.gallonCount || 1;
          const returnedQty = req.waterDetail.emptyGallonsReturned ?? 0;
          setWaterInventory(prev => {
            const updated = {
              ...prev,
              filledGallons: Math.max(0, prev.filledGallons - qty),
              emptyGallons: prev.emptyGallons + returnedQty,
              inDistribution: Math.max(0, prev.inDistribution + (qty - returnedQty))
            };
            upsertToTable('water_inventory', transformWaterInventoryToDB(updated)).catch(console.warn);
            return updated;
          });
          // Update location last refill
          if (req.waterDetail.locationId) {
            setWaterLocations(prev => prev.map(loc => {
              if (loc.id === req.waterDetail?.locationId) {
                const updatedLoc = {
                  ...loc,
                  activeGallons: Math.max(1, loc.activeGallons + (qty - returnedQty)),
                  lastRefillDate: new Date().toISOString().slice(0, 10),
                  emptyGallons: 0
                };
                upsertToTable('water_locations', transformWaterLocationToDB(updatedLoc)).catch(console.warn);
                return updatedLoc;
              }
              return loc;
            }));
          }
        }
      }
    }

    setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    upsertToTable('service_requests', transformRequestToDB(updatedReq)).catch(err => {
      console.warn('[Supabase] Failed to update request in cloud:', err);
    });

    // Send notification to user
    const userNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: req.userId,
      title: `Status ${req.requestNumber}: ${status}`,
      message: `Permintaan ${req.serviceType.toUpperCase()} Anda telah diperbarui menjadi ${status}${extraData?.rejectionReason ? ` (Alasan: ${extraData.rejectionReason})` : ''}`,
      type: status === 'Ditolak' ? 'error' : (status === 'Selesai' ? 'success' : 'info'),
      serviceType: req.serviceType,
      requestId: req.id,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [userNotif, ...prev]);

    addAuditLog(
      'Update Status Permintaan',
      req.serviceType.toUpperCase(),
      `Mengubah status ${req.requestNumber} dari "${prevStatus}" ke "${status}"`
    );

    showToast('info', 'Status Diperbarui', `${req.requestNumber} sekarang berstatus ${status}`);
  };

  const deleteRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    
    setRequests(prev => prev.filter(r => r.id !== requestId));
    
    // Sync deletion to Supabase cloud ('service_requests')
    deleteFromTable('service_requests', 'id', requestId).catch(err => {
      console.warn('Cloud delete request sync error:', err);
    });

    addAuditLog(
      'Hapus Transaksi',
      req.serviceType.toUpperCase(),
      `Menghapus data transaksi/permohonan ${req.requestNumber} (Status: ${req.status}, Pemohon: ${req.userName}, Unit: ${req.unit})`
    );
    showToast('success', 'Transaksi Dihapus', `Transaksi ${req.requestNumber} berhasil dihapus dari sistem`);
  };

  // Master Items CRUD
  const addMasterItem = (data: Omit<MasterItem, 'id' | 'status'>) => {
    const status = data.stock === 0 ? 'out_of_stock' : (data.stock <= data.minStock ? 'low_stock' : 'available');
    const newItem: MasterItem = {
      ...data,
      id: `itm-${Date.now()}`,
      status
    };
    setItems(prev => [...prev, newItem]);
    upsertToTable('master_items', transformItemToDB(newItem)).catch(console.warn);
    addAuditLog('Tambah Master Barang', 'Inventori', `Menambahkan barang baru: ${data.name} (${data.code})`);
    showToast('success', 'Barang Ditambahkan', `${data.name} berhasil disimpan`);
  };

  const updateMasterItem = (id: string, data: Partial<MasterItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...data };
        updated.status = updated.stock === 0 ? 'out_of_stock' : (updated.stock <= updated.minStock ? 'low_stock' : 'available');
        upsertToTable('master_items', transformItemToDB(updated)).catch(console.warn);
        return updated;
      }
      return item;
    }));
    addAuditLog('Update Master Barang', 'Inventori', `Mengubah data barang ID ${id}`);
    showToast('success', 'Barang Diperbarui', 'Data barang berhasil diperbarui');
  };

  const deleteMasterItem = (id: string) => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    deleteFromTable('master_items', 'id', id).catch(console.warn);
    addAuditLog('Hapus Master Barang', 'Inventori', `Menghapus barang ${item?.name || id}`);
    showToast('info', 'Barang Dihapus', 'Data barang telah dihapus dari sistem');
  };

  // Uniform CRUD
  const addUniform = (data: Omit<UniformItem, 'id' | 'status'>) => {
    const status = data.stock === 0 ? 'out_of_stock' : (data.stock <= data.minStock ? 'low_stock' : 'available');
    const newUniform: UniformItem = {
      ...data,
      id: `srg-${Date.now()}`,
      status
    };
    setUniforms(prev => [...prev, newUniform]);
    upsertToTable('uniform_items', transformUniformToDB(newUniform)).catch(console.warn);
    addAuditLog('Tambah Master Seragam', 'Seragam', `Menambahkan seragam ${data.name} size ${data.size}`);
    showToast('success', 'Seragam Ditambahkan', `${data.name} (${data.size}) tersimpan`);
  };

  const updateUniform = (id: string, data: Partial<UniformItem>) => {
    setUniforms(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...data };
        updated.status = updated.stock === 0 ? 'out_of_stock' : (updated.stock <= updated.minStock ? 'low_stock' : 'available');
        upsertToTable('uniform_items', transformUniformToDB(updated)).catch(console.warn);
        return updated;
      }
      return u;
    }));
    addAuditLog('Update Master Seragam', 'Seragam', `Memperbarui data seragam ID ${id}`);
    showToast('success', 'Seragam Diperbarui', 'Data seragam berhasil diperbarui');
  };

  const deleteUniform = (id: string) => {
    setUniforms(prev => prev.filter(u => u.id !== id));
    deleteFromTable('uniform_items', 'id', id).catch(console.warn);
    addAuditLog('Hapus Master Seragam', 'Seragam', `Menghapus seragam ID ${id}`);
    showToast('info', 'Seragam Dihapus', 'Seragam dihapus dari katalog');
  };

  // Stock In
  const processStockIn = (
    itemId: string, 
    quantity: number, 
    sourceReason: any, 
    notes: string, 
    referenceNo?: string,
    isUniform = false
  ) => {
    const trxNo = generateTrxNumber('IN');
    if (!isUniform) {
      const target = items.find(i => i.id === itemId);
      if (!target) return;
      const before = target.stock;
      const after = before + quantity;
      const newStatus = after === 0 ? 'out_of_stock' : (after <= target.minStock ? 'low_stock' : 'available');

      const updatedItem = { ...target, stock: after, status: newStatus };
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      upsertToTable('master_items', transformItemToDB(updatedItem)).catch(console.warn);

      const trx: StockTransaction = {
        id: `stk-${Date.now()}`,
        transactionNumber: trxNo,
        itemId: target.id,
        itemName: target.name,
        category: target.category,
        type: 'IN',
        sourceReason,
        quantity,
        beforeStock: before,
        afterStock: after,
        unitMeasure: target.unitMeasure,
        date: new Date().toISOString(),
        referenceNo: referenceNo || `PO-${Date.now().toString().slice(-4)}`,
        userId: currentUser?.id || 'usr-1',
        userName: currentUser?.name || 'Petugas RR',
        notes
      };
      setStockTransactions(prev => [trx, ...prev]);
      upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);
    } else {
      const target = uniforms.find(u => u.id === itemId);
      if (!target) return;
      const before = target.stock;
      const after = before + quantity;
      const newStatus = after === 0 ? 'out_of_stock' : (after <= target.minStock ? 'low_stock' : 'available');

      const updatedUniform = { ...target, stock: after, status: newStatus };
      setUniforms(prev => prev.map(u => u.id === itemId ? updatedUniform : u));
      upsertToTable('uniform_items', transformUniformToDB(updatedUniform)).catch(console.warn);

      const trx: StockTransaction = {
        id: `stk-${Date.now()}`,
        transactionNumber: trxNo,
        itemId: target.id,
        itemName: `${target.name} (${target.size})`,
        category: 'Seragam',
        type: 'IN',
        sourceReason,
        quantity,
        beforeStock: before,
        afterStock: after,
        unitMeasure: 'Pcs',
        date: new Date().toISOString(),
        referenceNo: referenceNo || `PO-SRG-${Date.now().toString().slice(-4)}`,
        userId: currentUser?.id || 'usr-1',
        userName: currentUser?.name || 'Petugas RR',
        notes
      };
      setStockTransactions(prev => [trx, ...prev]);
      upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);
    }

    addAuditLog('Stock In', 'Inventori', `Pemasukan stok (${quantity}) untuk item ${itemId} via ${sourceReason}`);
    showToast('success', 'Stok Masuk Berhasil', `+${quantity} unit telah ditambahkan ke sistem`);
  };

  // Stock Out Manual
  const processStockOut = (
    itemId: string, 
    quantity: number, 
    sourceReason: any, 
    notes: string, 
    referenceNo?: string,
    isUniform = false
  ) => {
    const trxNo = generateTrxNumber('OUT');
    if (!isUniform) {
      const target = items.find(i => i.id === itemId);
      if (!target) return;
      const before = target.stock;
      const after = Math.max(0, before - quantity);
      const newStatus = after === 0 ? 'out_of_stock' : (after <= target.minStock ? 'low_stock' : 'available');

      const updatedItem = { ...target, stock: after, status: newStatus };
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      upsertToTable('master_items', transformItemToDB(updatedItem)).catch(console.warn);

      const trx: StockTransaction = {
        id: `stk-${Date.now()}`,
        transactionNumber: trxNo,
        itemId: target.id,
        itemName: target.name,
        category: target.category,
        type: 'OUT',
        sourceReason,
        quantity,
        beforeStock: before,
        afterStock: after,
        unitMeasure: target.unitMeasure,
        date: new Date().toISOString(),
        referenceNo: referenceNo || `OUT-${Date.now().toString().slice(-4)}`,
        userId: currentUser?.id || 'usr-1',
        userName: currentUser?.name || 'Petugas RR',
        notes
      };
      setStockTransactions(prev => [trx, ...prev]);
      upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);

      if (after <= target.minStock) {
        setNotifications(prev => [{
          id: `notif-${Date.now()}`,
          title: '⚠️ Peringatan Stok Menipis!',
          message: `Stok ${target.name} saat ini ${after} ${target.unitMeasure} (Batas minimum: ${target.minStock}).`,
          type: 'warning',
          serviceType: 'atk',
          isRead: false,
          timestamp: new Date().toISOString()
        }, ...prev]);
      }
    } else {
      const target = uniforms.find(u => u.id === itemId);
      if (!target) return;
      const before = target.stock;
      const after = Math.max(0, before - quantity);
      const newStatus = after === 0 ? 'out_of_stock' : (after <= target.minStock ? 'low_stock' : 'available');

      const updatedUniform = { ...target, stock: after, status: newStatus };
      setUniforms(prev => prev.map(u => u.id === itemId ? updatedUniform : u));
      upsertToTable('uniform_items', transformUniformToDB(updatedUniform)).catch(console.warn);

      const trx: StockTransaction = {
        id: `stk-${Date.now()}`,
        transactionNumber: trxNo,
        itemId: target.id,
        itemName: `${target.name} (${target.size})`,
        category: 'Seragam',
        type: 'OUT',
        sourceReason,
        quantity,
        beforeStock: before,
        afterStock: after,
        unitMeasure: 'Pcs',
        date: new Date().toISOString(),
        referenceNo: referenceNo || `OUT-SRG-${Date.now().toString().slice(-4)}`,
        userId: currentUser?.id || 'usr-1',
        userName: currentUser?.name || 'Petugas RR',
        notes
      };
      setStockTransactions(prev => [trx, ...prev]);
      upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);
    }

    addAuditLog('Stock Out', 'Inventori', `Pengeluaran stok (${quantity}) untuk item ${itemId} (${sourceReason})`);
    showToast('info', 'Stok Keluar Tercatat', `-${quantity} unit berhasil dikurangi`);
  };

  // Stock Opname
  const processStockOpname = (
    itemId: string, 
    physicalCount: number, 
    notes: string,
    isUniform = false
  ) => {
    const trxNo = generateTrxNumber('OPN');
    if (!isUniform) {
      const target = items.find(i => i.id === itemId);
      if (!target) return;
      const before = target.stock;
      const diff = physicalCount - before;
      const newStatus = physicalCount === 0 ? 'out_of_stock' : (physicalCount <= target.minStock ? 'low_stock' : 'available');

      const updatedItem = { ...target, stock: physicalCount, status: newStatus };
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      upsertToTable('master_items', transformItemToDB(updatedItem)).catch(console.warn);

      const trx: StockTransaction = {
        id: `stk-${Date.now()}`,
        transactionNumber: trxNo,
        itemId: target.id,
        itemName: target.name,
        category: target.category,
        type: 'OPNAME',
        sourceReason: 'Penyesuaian Stok',
        quantity: diff,
        beforeStock: before,
        afterStock: physicalCount,
        unitMeasure: target.unitMeasure,
        date: new Date().toISOString(),
        referenceNo: `OPNAME-${new Date().toISOString().slice(0, 7)}`,
        userId: currentUser?.id || 'usr-1',
        userName: currentUser?.name || 'Petugas Opname',
        notes: `Opname Fisik: ${physicalCount} ${target.unitMeasure} (Selisih: ${diff > 0 ? `+${diff}` : diff}). Catatan: ${notes}`
      };
      setStockTransactions(prev => [trx, ...prev]);
      upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);
    } else {
      const target = uniforms.find(u => u.id === itemId);
      if (!target) return;
      const before = target.stock;
      const diff = physicalCount - before;
      const newStatus = physicalCount === 0 ? 'out_of_stock' : (physicalCount <= target.minStock ? 'low_stock' : 'available');

      const updatedUniform = { ...target, stock: physicalCount, status: newStatus };
      setUniforms(prev => prev.map(u => u.id === itemId ? updatedUniform : u));
      upsertToTable('uniform_items', transformUniformToDB(updatedUniform)).catch(console.warn);

      const trx: StockTransaction = {
        id: `stk-${Date.now()}`,
        transactionNumber: trxNo,
        itemId: target.id,
        itemName: `${target.name} (${target.size})`,
        category: 'Seragam',
        type: 'OPNAME',
        sourceReason: 'Penyesuaian Stok',
        quantity: diff,
        beforeStock: before,
        afterStock: physicalCount,
        unitMeasure: 'Pcs',
        date: new Date().toISOString(),
        referenceNo: `OPNAME-SRG-${new Date().toISOString().slice(0, 7)}`,
        userId: currentUser?.id || 'usr-1',
        userName: currentUser?.name || 'Petugas Opname',
        notes: `Opname Fisik: ${physicalCount} Pcs (Selisih: ${diff > 0 ? `+${diff}` : diff}). ${notes}`
      };
      setStockTransactions(prev => [trx, ...prev]);
      upsertToTable('stock_transactions', transformStockTransactionToDB(trx)).catch(console.warn);
    }

    addAuditLog('Stock Opname', 'Inventori', `Stock opname untuk ${itemId}: Fisik=${physicalCount}`);
    showToast('success', 'Stock Opname Selesai', `Stok sistem telah disesuaikan ke ${physicalCount}`);
  };

  // Water locations & inventory
  const addWaterLocation = (loc: Omit<WaterLocation, 'id'>) => {
    const unitPrefix = (loc.unit || 'LOC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const countInUnit = waterLocations.filter(l => l.unit === loc.unit).length + 1;
    const generatedCode = loc.code || `TG-${unitPrefix}-${countInUnit.toString().padStart(2, '0')}`;
    
    const newLoc: WaterLocation = { 
      ...loc, 
      id: `wloc-${Date.now()}`,
      code: generatedCode,
      status: loc.status || 'Aktif'
    };
    setWaterLocations(prev => [...prev, newLoc]);
    upsertToTable('water_locations', transformWaterLocationToDB(newLoc)).catch(console.warn);
    addAuditLog('Tambah Lokasi Galon', 'Air Galon', `Titik Galon baru: ${newLoc.code} - ${loc.roomName} (${loc.unit})`);
    showToast('success', 'Titik Galon Ditambahkan', `${newLoc.code} - ${loc.roomName}`);
  };

  const updateWaterLocation = (id: string, data: Partial<WaterLocation>) => {
    setWaterLocations(prev => prev.map(l => {
      if (l.id === id) {
        const updated = { ...l, ...data };
        upsertToTable('water_locations', transformWaterLocationToDB(updated)).catch(console.warn);
        return updated;
      }
      return l;
    }));
    const target = waterLocations.find(l => l.id === id);
    addAuditLog('Ubah Lokasi Galon', 'Air Galon', `Memperbarui data titik galon: ${target?.roomName || id}`);
    showToast('success', 'Titik Galon Diperbarui', 'Data penempatan galon & dispenser telah disimpan');
  };

  const deleteWaterLocation = (id: string) => {
    const target = waterLocations.find(l => l.id === id);
    setWaterLocations(prev => prev.filter(l => l.id !== id));
    deleteFromTable('water_locations', 'id', id).catch(console.warn);
    addAuditLog('Hapus Lokasi Galon', 'Air Galon', `Menghapus titik galon ${target?.code || ''} - ${target?.roomName || id}`);
    showToast('info', 'Titik Galon Dihapus', `${target?.roomName || 'Lokasi'} telah dihapus`);
  };

  const updateWaterInventory = (data: Partial<WaterInventory>) => {
    setWaterInventory(prev => {
      const updated = { ...prev, ...data };
      upsertToTable('water_inventory', transformWaterInventoryToDB(updated)).catch(console.warn);
      return updated;
    });
    showToast('success', 'Inventori Galon Diperbarui', 'Jumlah stok galon telah disesuaikan');
  };

  const updateWaterTransaction = (
    requestId: string,
    data: {
      gallonCount: number;
      emptyGallonsReturned: number;
      pickedUpBy?: string;
      notes?: string;
    }
  ) => {
    const req = requests.find(r => r.id === requestId);
    if (!req || req.serviceType !== 'air_galon' || !req.waterDetail) return;

    const oldFilled = Number(req.waterDetail.gallonCount) || 1;
    const oldReturned = Number(req.waterDetail.emptyGallonsReturned) ?? 0;
    const newFilled = Number(data.gallonCount) || 1;
    const newReturned = Number(data.emptyGallonsReturned) ?? 0;

    const deltaFilled = newFilled - oldFilled; // if positive, more filled taken (reduce filled stock)
    const deltaReturned = newReturned - oldReturned; // if positive, more empty returned (increase empty stock)

    const updatedWaterInv = {
      ...waterInventory,
      filledGallons: Math.max(0, waterInventory.filledGallons - deltaFilled),
      emptyGallons: Math.max(0, waterInventory.emptyGallons + deltaReturned),
      inDistribution: Math.max(0, waterInventory.inDistribution + (deltaFilled - deltaReturned))
    };
    setWaterInventory(updatedWaterInv);
    upsertToTable('water_inventory', transformWaterInventoryToDB(updatedWaterInv)).catch(console.warn);

    if (req.waterDetail.locationId) {
      setWaterLocations(prev => prev.map(loc => {
        if (loc.id === req.waterDetail?.locationId) {
          const updatedLoc = {
            ...loc,
            activeGallons: Math.max(1, loc.activeGallons + (deltaFilled - deltaReturned))
          };
          upsertToTable('water_locations', transformWaterLocationToDB(updatedLoc)).catch(console.warn);
          return updatedLoc;
        }
        return loc;
      }));
    }

    const updatedWaterDetail: WaterDetail = {
      ...req.waterDetail,
      gallonCount: newFilled,
      emptyGallonsReturned: newReturned,
      notes: data.notes ?? req.waterDetail.notes
    };

    const updatedReq: ServiceRequest = {
      ...req,
      pickedUpBy: data.pickedUpBy || req.pickedUpBy,
      notes: data.notes ?? req.notes,
      waterDetail: updatedWaterDetail
    };

    setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    upsertToTable('service_requests', transformRequestToDB(updatedReq)).catch(console.warn);

    addAuditLog(
      'Koreksi Data Galon',
      'Air Galon',
      `Koreksi data ${req.requestNumber}: Galon Isi ${oldFilled} -> ${newFilled}, Galon Kosong ${oldReturned} -> ${newReturned}`
    );

    showToast(
      'success',
      'Data Galon Diperbarui',
      `Data serah terima ${req.requestNumber} berhasil disesuaikan & stok galon tersinkronisasi.`
    );
  };

  const addWaterProviderDelivery = (logData: Omit<WaterProviderLog, 'id'>) => {
    const newLog: WaterProviderLog = {
      ...logData,
      id: `wplog-${Date.now()}`
    };
    setWaterProviderLogs(prev => [newLog, ...prev]);
    upsertToTable('water_provider_logs', newLog).catch(console.warn);

    // Galon isi bertambah di RR, galon kosong berkurang karena ditukar provider
    const updatedInv = {
      ...waterInventory,
      filledGallons: waterInventory.filledGallons + logData.filledReceived,
      emptyGallons: Math.max(0, waterInventory.emptyGallons - logData.emptyReturned)
    };
    setWaterInventory(updatedInv);
    upsertToTable('water_inventory', transformWaterInventoryToDB(updatedInv)).catch(console.warn);

    addAuditLog(
      'Penerimaan Provider Galon',
      'Air Galon',
      `Restock Galon dari ${logData.supplierName}: Masuk +${logData.filledReceived} galon isi, Dibawa/Ditukar -${logData.emptyReturned} galon kosong (Surat Jalan: ${logData.deliveryNumber})`
    );

    showToast(
      'success',
      'Penerimaan Provider Tersimpan',
      `+${logData.filledReceived} Galon Isi masuk, -${logData.emptyReturned} Galon Kosong ditukar provider`
    );
  };

  const performWaterStockOpname = (data: {
    auditorName: string;
    initialTotalAssets: number;
    physicalFilled: number;
    physicalEmpty: number;
    physicalInRooms: number;
    physicalDamaged: number;
    physicalLost: number;
    notes?: string;
  }) => {
    const totalPhysical = data.physicalFilled + data.physicalEmpty + data.physicalInRooms + data.physicalDamaged + data.physicalLost;
    const systemTotal = waterInventory.filledGallons + waterInventory.emptyGallons + waterInventory.inDistribution + waterInventory.damagedGallons + waterInventory.lostGallons;
    const variance = totalPhysical - systemTotal;

    const opnRecord: WaterOpnameRecord = {
      id: `wopn-${Date.now()}`,
      opnameNumber: `OPN-GAL-${new Date().toISOString().slice(0, 7)}-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      auditorName: data.auditorName,
      initialTotalAssets: data.initialTotalAssets,
      physicalFilled: data.physicalFilled,
      physicalEmpty: data.physicalEmpty,
      physicalInRooms: data.physicalInRooms,
      physicalDamaged: data.physicalDamaged,
      physicalLost: data.physicalLost,
      totalPhysical,
      systemTotal,
      variance,
      notes: data.notes
    };

    setWaterOpnameRecords(prev => [opnRecord, ...prev]);
    upsertToTable('water_opname_records', opnRecord).catch(console.warn);

    const updatedInv: WaterInventory = {
      ...waterInventory,
      initialTotalAssets: data.initialTotalAssets,
      filledGallons: data.physicalFilled,
      emptyGallons: data.physicalEmpty,
      inDistribution: data.physicalInRooms,
      damagedGallons: data.physicalDamaged,
      lostGallons: data.physicalLost,
      lastOpnameDate: new Date().toISOString().slice(0, 10),
      lastOpnameBy: data.auditorName
    };
    setWaterInventory(updatedInv);
    upsertToTable('water_inventory', transformWaterInventoryToDB(updatedInv)).catch(console.warn);

    addAuditLog(
      'Stock Opname Galon',
      'Air Galon',
      `Audit Opname Galon oleh ${data.auditorName}: Total Fisik=${totalPhysical}, Aset Awal=${data.initialTotalAssets}, Selisih=${variance >= 0 ? `+${variance}` : variance}`
    );

    showToast(
      'success',
      'Stock Opname Galon Tersimpan',
      `Hasil audit fisik (${totalPhysical} galon) berhasil disinkronkan ke master inventori`
    );
  };

  const updateInitialWaterAssets = (total: number) => {
    setWaterInventory(prev => {
      const updated = { ...prev, initialTotalAssets: total };
      upsertToTable('water_inventory', transformWaterInventoryToDB(updated)).catch(console.warn);
      return updated;
    });
    addAuditLog('Update Aset Galon Awal', 'Air Galon', `Jumlah galon awal aset diubah menjadi ${total} unit`);
    showToast('success', 'Jumlah Aset Awal Diperbarui', `Total modal galon awal: ${total} unit`);
  };

  // Master Setup
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `usr-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    upsertToTable('users', transformUserToDB(newUser)).catch(console.warn);
    addAuditLog('Tambah User', 'Pengaturan', `User baru ${newUser.name} (${newUser.role})`);
    showToast('success', 'Pengguna Ditambahkan', newUser.name);
  };

  const addUsers = (usersList: Omit<User, 'id'>[]): number => {
    if (!usersList || usersList.length === 0) return 0;
    
    // Check existing emails/usernames to prevent duplicates or update existing
    let addedCount = 0;
    const timestamp = Date.now();
    const newItems: User[] = [];
    
    setUsers(prev => {
      const existingEmails = new Set(prev.map(u => u.email.toLowerCase().trim()));

      usersList.forEach((userData, index) => {
        const cleanEmail = userData.email.toLowerCase().trim();
        if (cleanEmail && !existingEmails.has(cleanEmail)) {
          existingEmails.add(cleanEmail);
          newItems.push({
            ...userData,
            id: `usr-imp-${timestamp}-${index}`
          });
          addedCount++;
        }
      });

      return [...prev, ...newItems];
    });

    if (newItems.length > 0) {
      upsertToTable('users', newItems.map(transformUserToDB)).catch(console.warn);
    }

    addAuditLog('Import User CSV', 'Pengaturan', `Import massal ${usersList.length} baris CSV (Berhasil: ${addedCount} user baru)`);
    return addedCount;
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...data };
        upsertToTable('users', transformUserToDB(updated)).catch(console.warn);
        return updated;
      }
      return u;
    }));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
    addAuditLog('Update User', 'Pengaturan', `Memperbarui data user ID ${id}`);
    showToast('success', 'Pengguna Diperbarui', 'Perubahan tersimpan');
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    
    // Delete from Supabase cloud table
    deleteFromTable('users', 'id', id).catch(err => {
      console.warn('Cloud delete user sync error:', err);
    });

    addAuditLog('Hapus User', 'Pengaturan', `Menghapus akun pengguna ${target.name} (${target.email})`);
    showToast('info', 'Pengguna Dihapus', `Akun ${target.name} telah dihapus dari sistem`);
  };

  const resetUserPassword = (userId: string, newPassword = 'password123'): string => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, password: newPassword };
        upsertToTable('users', transformUserToDB(updated)).catch(console.warn);
        return updated;
      }
      return u;
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
    }
    const target = users.find(u => u.id === userId);
    addAuditLog('Reset Password User', 'Pengaturan', `Reset kata sandi pengguna ${target?.name || userId}`);
    showToast('success', 'Kata Sandi Direset', `Kata sandi "${target?.name || userId}" berhasil diatur ke: ${newPassword}`);
    return newPassword;
  };

  const updateRolePermissions = (role: UserRole, permissions: Partial<RolePermissions>) => {
    setRoleConfigs(prev => prev.map(rc => {
      if (rc.role === role) {
        const updated = {
          ...rc,
          permissions: {
            ...rc.permissions,
            ...permissions
          }
        };
        upsertToTable('role_configs', transformRoleConfigToDB(updated)).catch(console.warn);
        return updated;
      }
      return rc;
    }));
    addAuditLog('Update Hak Akses Role', 'Pengaturan Hak Akses', `Memperbarui matriks permission untuk role: ${role}`);
    showToast('success', 'Hak Akses Disimpan', `Konfigurasi hak akses role ${role} berhasil diperbarui`);
  };

  const resetRolePermissions = () => {
    setRoleConfigs(INITIAL_ROLES);
    upsertToTable('role_configs', INITIAL_ROLES.map(transformRoleConfigToDB)).catch(console.warn);
    addAuditLog('Reset Hak Akses Role', 'Pengaturan Hak Akses', 'Mengembalikan hak akses seluruh role ke default');
    showToast('info', 'Hak Akses Direset', 'Seluruh matriks izin kembali ke default Sekolah Lazuardi');
  };

  const addUnit = (data: Omit<MasterUnit, 'id'>) => {
    const newUnit: MasterUnit = { ...data, id: `unit-${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    upsertToTable('master_units', transformUnitToDB(newUnit)).catch(console.warn);
    addAuditLog('Tambah Unit', 'Pengaturan Unit', `Menambahkan master unit ${data.name} (${data.code})`);
    showToast('success', 'Unit Ditambahkan', `${data.name} (${data.code})`);
  };

  const updateUnit = (id: string, data: Partial<MasterUnit>) => {
    const existing = units.find(u => u.id === id);
    setUnits(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...data };
        upsertToTable('master_units', transformUnitToDB(updated)).catch(console.warn);
        return updated;
      }
      return u;
    }));
    
    // If unit name or code changed, sync with departments
    if (existing && (data.name || data.code)) {
      const oldUnitName = existing.name;
      const newUnitName = data.name || existing.name;
      setDepartments(prev => prev.map(d => {
        if (d.unitId === id || d.unitName === oldUnitName) {
          const updatedD = { ...d, unitName: newUnitName };
          upsertToTable('master_departments', transformDeptToDB(updatedD)).catch(console.warn);
          return updatedD;
        }
        return d;
      }));
    }

    addAuditLog('Update Unit', 'Pengaturan Unit', `Memperbarui data master unit ID ${id}`);
    showToast('success', 'Unit Diperbarui', 'Perubahan data unit tersimpan');
  };

  const deleteUnit = (id: string) => {
    const target = units.find(u => u.id === id);
    if (!target) return;
    setUnits(prev => prev.filter(u => u.id !== id));
    deleteFromTable('master_units', 'id', id).catch(console.warn);
    addAuditLog('Hapus Unit', 'Pengaturan Unit', `Menghapus master unit ${target.name} (${target.code})`);
    showToast('info', 'Unit Dihapus', `Unit ${target.name} telah dihapus`);
  };

  const addDepartment = (data: Omit<MasterDepartment, 'id'>) => {
    const newDept: MasterDepartment = { ...data, id: `dept-${Date.now()}` };
    setDepartments(prev => [...prev, newDept]);
    upsertToTable('master_departments', transformDeptToDB(newDept)).catch(console.warn);
    addAuditLog('Tambah Departemen', 'Pengaturan Departemen', `Menambahkan departemen ${data.name} pada unit ${data.unitName}`);
    showToast('success', 'Departemen Ditambahkan', `${data.name} (${data.unitName})`);
  };

  const updateDepartment = (id: string, data: Partial<MasterDepartment>) => {
    setDepartments(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, ...data };
        upsertToTable('master_departments', transformDeptToDB(updated)).catch(console.warn);
        return updated;
      }
      return d;
    }));
    addAuditLog('Update Departemen', 'Pengaturan Departemen', `Memperbarui data departemen ID ${id}`);
    showToast('success', 'Departemen Diperbarui', 'Perubahan departemen tersimpan');
  };

  const deleteDepartment = (id: string) => {
    const target = departments.find(d => d.id === id);
    if (!target) return;
    setDepartments(prev => prev.filter(d => d.id !== id));
    deleteFromTable('master_departments', 'id', id).catch(console.warn);
    addAuditLog('Hapus Departemen', 'Pengaturan Departemen', `Menghapus departemen ${target.name} (${target.unitName})`);
    showToast('info', 'Departemen Dihapus', `Departemen ${target.name} telah dihapus`);
  };

  const addSupplier = (data: Omit<MasterSupplier, 'id'>) => {
    const newSup: MasterSupplier = { ...data, id: `sup-${Date.now()}` };
    setSuppliers(prev => [...prev, newSup]);
    upsertToTable('master_suppliers', transformSupplierToDB(newSup)).catch(console.warn);
    showToast('success', 'Supplier Ditambahkan', data.name);
  };

  const addLocation = (data: Omit<MasterLocation, 'id'>) => {
    const newLoc: MasterLocation = { ...data, id: `loc-${Date.now()}` };
    setLocations(prev => [...prev, newLoc]);
    upsertToTable('master_locations', transformLocationToDB(newLoc)).catch(console.warn);
    showToast('success', 'Lokasi Ditambahkan', data.name);
  };

  // Notification read
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('info', 'Semua Notifikasi Telah Dibaca', '');
  };

  // Reset demo
  const resetAllData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setRoleConfigs(INITIAL_ROLES);
    setCurrentUser(INITIAL_USERS[0]);
    setItems(INITIAL_ITEMS);
    setUniforms(INITIAL_UNIFORMS);
    setWaterLocations(INITIAL_WATER_LOCATIONS);
    setWaterInventory(INITIAL_WATER_INVENTORY);
    setWaterProviderLogs(INITIAL_WATER_PROVIDER_LOGS);
    setWaterOpnameRecords(INITIAL_WATER_OPNAME_RECORDS);
    setRequests(INITIAL_REQUESTS);
    setStockTransactions(INITIAL_STOCK_TRANSACTIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUnits(INITIAL_UNITS);
    setDepartments(INITIAL_DEPARTMENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setLocations(INITIAL_LOCATIONS);
    showToast('info', 'Data Direset', 'Semua data kembali ke konfigurasi awal Sekolah Lazuardi GCS');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      roleConfigs,
      items,
      uniforms,
      waterLocations,
      waterInventory,
      waterProviderLogs,
      waterOpnameRecords,
      requests,
      stockTransactions,
      auditLogs,
      notifications,
      units,
      departments,
      suppliers,
      locations,
      toasts,
      supabaseStatus,
      dbInfo,
      isSyncingToSupabase,
      syncAllToSupabase,
      refreshSupabaseConnection,
      login,
      loginWithGoogleEmail,
      logout,
      switchUser,
      switchUserRole,
      createRequest,
      updateRequestStatus,
      deleteRequest,
      addMasterItem,
      updateMasterItem,
      deleteMasterItem,
      addUniform,
      updateUniform,
      deleteUniform,
      processStockIn,
      processStockOut,
      processStockOpname,
      addWaterLocation,
      updateWaterLocation,
      deleteWaterLocation,
      updateWaterInventory,
      updateWaterTransaction,
      addWaterProviderDelivery,
      performWaterStockOpname,
      updateInitialWaterAssets,
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
      addSupplier,
      addLocation,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addAuditLog,
      showToast,
      removeToast,
      resetAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
