import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { WaterLocation, ServiceRequest, WaterProviderLog } from '../types';
import { 
  Droplet, 
  Plus, 
  MapPin, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Check, 
  X, 
  Clock, 
  Building,
  Edit2,
  Truck,
  ClipboardCheck,
  Send,
  Mail,
  UserCheck,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  FileText,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { UserSearchSelect } from '../components/common/UserSearchSelect';

interface WaterServiceViewProps {
  onOpenReceipt: (req: ServiceRequest) => void;
}

export const WaterServiceView: React.FC<WaterServiceViewProps> = ({ onOpenReceipt }) => {
  const { 
    currentUser, 
    users,
    units,
    waterLocations, 
    waterInventory, 
    waterProviderLogs,
    waterOpnameRecords,
    requests, 
    createRequest, 
    updateRequestStatus, 
    updateWaterTransaction,
    addWaterLocation, 
    updateWaterLocation, 
    updateWaterInventory,
    addWaterProviderDelivery,
    performWaterStockOpname,
    updateInitialWaterAssets
  } = useApp();

  const [activeTab, setActiveTab] = useState<'lokasi' | 'permintaan' | 'provider' | 'opname'>('lokasi');
  
  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [isEditAssetsModalOpen, setIsEditAssetsModalOpen] = useState(false);

  // Edit / Koreksi Transaksi Modal
  const [isEditWaterModalOpen, setIsEditWaterModalOpen] = useState(false);
  const [selectedWaterReq, setSelectedWaterReq] = useState<ServiceRequest | null>(null);
  const [editWaterForm, setEditWaterForm] = useState({
    gallonCount: 1,
    emptyGallonsReturned: 1,
    pickedUpBy: '',
    notes: ''
  });

  // Filters
  const [unitFilter, setUnitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Live timestamp clock for request modal
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request Form State
  const [requestForm, setRequestForm] = useState({
    userId: currentUser?.id || users[0]?.id || '',
    unit: currentUser?.unit || 'SMP',
    locationId: waterLocations[0]?.id || '',
    customRoomName: '',
    pickedUpBy: currentUser?.name || '',
    requestType: 'Penggantian Galon Kosong' as 'Penggantian Galon Kosong' | 'Tambahan Galon' | 'Galon Baru',
    gallonCount: 1,
    emptyGallonsReturned: 1,
    notes: ''
  });

  // Keep requestForm user & unit synced
  const handleUserChange = (selectedUserId: string) => {
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      setRequestForm(prev => {
        const userLoc = waterLocations.find(l => l.unit === selectedUser.unit);
        return {
          ...prev,
          userId: selectedUser.id,
          unit: selectedUser.unit,
          pickedUpBy: prev.pickedUpBy || selectedUser.name,
          locationId: userLoc ? userLoc.id : prev.locationId
        };
      });
    }
  };

  // Provider Restock Delivery Form State
  const [providerForm, setProviderForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    deliveryNumber: `SJ-AQ-${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2,'0')}/${Math.floor(100 + Math.random()*900)}`,
    supplierName: 'PT Tirta Investama (Aqua Danone)',
    driverName: 'Pak Wahyu (Armada 04)',
    filledReceived: 40,
    emptyReturned: 40,
    receivedBy: currentUser?.name || 'Siti Rahmawati',
    notes: 'Kondisi galon bersih dan segel tutup utuh'
  });

  // Stock Opname Form State
  const [opnameForm, setOpnameForm] = useState({
    auditorName: currentUser?.name ? `${currentUser.name} & Tim Logistik` : 'Siti Rahmawati & Tim Logistik',
    initialTotalAssets: waterInventory.initialTotalAssets || 68,
    physicalFilled: waterInventory.filledGallons,
    physicalEmpty: waterInventory.emptyGallons,
    physicalInRooms: waterInventory.inDistribution,
    physicalDamaged: waterInventory.damagedGallons,
    physicalLost: waterInventory.lostGallons,
    notes: 'Stock opname audit fisik galon di Resources Room & ruangan kampus'
  });

  // Initial Assets Form State
  const [initialAssetsInput, setInitialAssetsInput] = useState<number>(waterInventory.initialTotalAssets || 68);

  // New Location Form State
  const [locForm, setLocForm] = useState({
    unit: 'SMP',
    roomName: '',
    floor: 'Lantai 2',
    dispenserCount: 1,
    activeGallons: 1,
    emptyGallons: 0
  });

  // Action Modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionPickedUpBy, setActionPickedUpBy] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  const handleOpenActionModal = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setActionPickedUpBy(req.pickedUpBy || req.userName || '');
    setIsRejecting(false);
    setRejectionReasonText('');
    setIsActionModalOpen(true);
  };

  // Filtered requests
  const waterRequests = requests.filter(r => {
    if (r.serviceType !== 'air_galon') return false;
    const matchUnit = unitFilter === 'all' || r.unit === unitFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSearch = r.requestNumber.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        r.userName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                        (r.waterDetail?.roomName && r.waterDetail.roomName.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchUnit && matchStatus && matchSearch;
  });

  // Find recipient head of unit for current form
  const currentUnitObj = units.find(
    u => u.code.toLowerCase() === requestForm.unit.toLowerCase() || 
         u.name.toLowerCase().includes(requestForm.unit.toLowerCase())
  );
  const currentHeadName = currentUnitObj?.headName || `Kepala Unit ${requestForm.unit}`;
  const currentHeadEmail = currentUnitObj?.email || `${requestForm.unit.toLowerCase()}@lazuardi.sch.id`;

  // Submit Request Handler
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = waterLocations.find(l => l.id === requestForm.locationId);
    const room = requestForm.customRoomName ? requestForm.customRoomName : (loc ? loc.roomName : `Ruangan Unit ${requestForm.unit}`);
    const selectedUser = users.find(u => u.id === requestForm.userId) || currentUser;

    createRequest({
      serviceType: 'air_galon',
      userId: selectedUser?.id || currentUser?.id || 'usr-6',
      userName: selectedUser?.name || currentUser?.name || 'Staff Lazuardi',
      userEmail: selectedUser?.email || currentUser?.email || 'staff@lazuardi.sch.id',
      unit: requestForm.unit,
      department: selectedUser?.department || 'Akademik & Operasional',
      urgency: 'Biasa',
      purpose: `${requestForm.requestType}: ${room}`,
      notes: requestForm.notes,
      pickedUpBy: requestForm.pickedUpBy || selectedUser?.name || currentUser?.name || 'Staff',
      items: [],
      waterDetail: {
        pickupTimestamp: new Date().toISOString(),
        locationId: loc?.id,
        roomName: room,
        requestType: requestForm.requestType,
        gallonCount: Number(requestForm.gallonCount),
        emptyGallonsReturned: Number(requestForm.emptyGallonsReturned),
        notes: requestForm.notes
      }
    });

    setIsRequestModalOpen(false);
  };

  // Open Edit / Koreksi Data Galon
  const handleOpenEditWaterModal = (req: ServiceRequest) => {
    setSelectedWaterReq(req);
    setEditWaterForm({
      gallonCount: req.waterDetail?.gallonCount || 1,
      emptyGallonsReturned: req.waterDetail?.emptyGallonsReturned ?? 0,
      pickedUpBy: req.pickedUpBy || req.userName || '',
      notes: req.waterDetail?.notes || req.notes || ''
    });
    setIsEditWaterModalOpen(true);
  };

  // Save Edit / Koreksi Data Galon
  const handleEditWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaterReq) return;

    updateWaterTransaction(selectedWaterReq.id, {
      gallonCount: Number(editWaterForm.gallonCount),
      emptyGallonsReturned: Number(editWaterForm.emptyGallonsReturned),
      pickedUpBy: editWaterForm.pickedUpBy.trim(),
      notes: editWaterForm.notes.trim()
    });

    setIsEditWaterModalOpen(false);
  };

  // Submit Provider Delivery Handler
  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addWaterProviderDelivery({
      date: new Date(providerForm.date).toISOString(),
      deliveryNumber: providerForm.deliveryNumber,
      supplierName: providerForm.supplierName,
      driverName: providerForm.driverName,
      filledReceived: Number(providerForm.filledReceived),
      emptyReturned: Number(providerForm.emptyReturned),
      receivedBy: providerForm.receivedBy,
      notes: providerForm.notes
    });

    setIsProviderModalOpen(false);
    setProviderForm({
      date: new Date().toISOString().slice(0, 16),
      deliveryNumber: `SJ-AQ-${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2,'0')}/${Math.floor(100 + Math.random()*900)}`,
      supplierName: 'PT Tirta Investama (Aqua Danone)',
      driverName: 'Pak Wahyu (Armada 04)',
      filledReceived: 40,
      emptyReturned: 40,
      receivedBy: currentUser?.name || 'Siti Rahmawati',
      notes: 'Kondisi galon bersih dan segel tutup utuh'
    });
  };

  // Submit Stock Opname Handler
  const handleOpnameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performWaterStockOpname({
      auditorName: opnameForm.auditorName,
      initialTotalAssets: Number(opnameForm.initialTotalAssets),
      physicalFilled: Number(opnameForm.physicalFilled),
      physicalEmpty: Number(opnameForm.physicalEmpty),
      physicalInRooms: Number(opnameForm.physicalInRooms),
      physicalDamaged: Number(opnameForm.physicalDamaged),
      physicalLost: Number(opnameForm.physicalLost),
      notes: opnameForm.notes
    });

    setIsOpnameModalOpen(false);
  };

  // Save Initial Assets Handler
  const handleSaveInitialAssets = (e: React.FormEvent) => {
    e.preventDefault();
    updateInitialWaterAssets(Number(initialAssetsInput));
    setIsEditAssetsModalOpen(false);
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    addWaterLocation({
      unit: locForm.unit,
      roomName: locForm.roomName,
      floor: locForm.floor,
      dispenserCount: Number(locForm.dispenserCount),
      activeGallons: Number(locForm.activeGallons),
      emptyGallons: Number(locForm.emptyGallons),
      lastRefillDate: new Date().toISOString().slice(0, 10)
    });
    setIsAddLocationModalOpen(false);
    setLocForm({
      unit: 'SMP',
      roomName: '',
      floor: 'Lantai 2',
      dispenserCount: 1,
      activeGallons: 1,
      emptyGallons: 0
    });
  };

  // Calculated Opname stats
  const totalPhysicalAudit = Number(opnameForm.physicalFilled) + Number(opnameForm.physicalEmpty) + Number(opnameForm.physicalInRooms) + Number(opnameForm.physicalDamaged) + Number(opnameForm.physicalLost);
  const totalSystemAudit = waterInventory.filledGallons + waterInventory.emptyGallons + waterInventory.inDistribution + waterInventory.damagedGallons + waterInventory.lostGallons;
  const auditVariance = totalPhysicalAudit - totalSystemAudit;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-600 text-white rounded-xl shadow-xs">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Modul Penyediaan Air Minum Galon &amp; Inventori</h2>
            <p className="text-xs text-slate-500">
              Distribusi galon Aqua 19L, pencatatan stock opname, restock provider &amp; pengiriman tembusan email kepala unit
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              // Set initial requester
              if (currentUser) {
                handleUserChange(currentUser.id);
              }
              setIsRequestModalOpen(true);
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Permintaan Galon</span>
          </button>

          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
            <>
              <button
                onClick={() => setIsProviderModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Penerimaan Provider</span>
              </button>

              <button
                onClick={() => {
                  setOpnameForm({
                    auditorName: currentUser?.name ? `${currentUser.name} & Tim Logistik` : 'Siti Rahmawati & Tim Logistik',
                    initialTotalAssets: waterInventory.initialTotalAssets || 68,
                    physicalFilled: waterInventory.filledGallons,
                    physicalEmpty: waterInventory.emptyGallons,
                    physicalInRooms: waterInventory.inDistribution,
                    physicalDamaged: waterInventory.damagedGallons,
                    physicalLost: waterInventory.lostGallons,
                    notes: 'Stock opname fisik galon berkala'
                  });
                  setIsOpnameModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Stock Opname Galon</span>
              </button>

              <button
                onClick={() => setIsAddLocationModalOpen(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                + Titik Dispenser
              </button>
            </>
          )}
        </div>
      </div>

      {/* Galon Inventory Status 6-Box Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Aset Awal Dimiliki */}
        <div className="bg-white p-3.5 rounded-xl border border-cyan-200 shadow-xs text-center relative group">
          <div className="flex items-center justify-center gap-1">
            <span className="text-[10px] font-bold text-cyan-800 uppercase block">Galon Awal Dimiliki</span>
            {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
              <button 
                onClick={() => {
                  setInitialAssetsInput(waterInventory.initialTotalAssets || 68);
                  setIsEditAssetsModalOpen(true);
                }}
                title="Edit Jumlah Modal Awal Galon"
                className="text-slate-400 hover:text-cyan-600 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <strong className="text-xl font-extrabold text-cyan-900 mt-0.5 block">
            {waterInventory.initialTotalAssets || 68}
          </strong>
          <span className="text-[10px] text-cyan-600 font-semibold">Modal Aset Sekolah</span>
        </div>

        {/* Galon Terisi di Gudang RR */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Galon Isi (RR)</span>
          <strong className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{waterInventory.filledGallons}</strong>
          <span className="text-[10px] text-emerald-600 font-semibold">Siap Distribusi</span>
        </div>

        {/* Galon Kosong di Gudang RR */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Galon Kosong (RR)</span>
          <strong className="text-xl font-extrabold text-amber-700 mt-0.5 block">{waterInventory.emptyGallons}</strong>
          <span className="text-[10px] text-amber-600">Siap Retur Provider</span>
        </div>

        {/* Galon Beredar di Ruangan Unit */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Aktif di Ruangan</span>
          <strong className="text-xl font-extrabold text-blue-700 mt-0.5 block">{waterInventory.inDistribution}</strong>
          <span className="text-[10px] text-slate-400">Unit TK/SD/SMP/SMA</span>
        </div>

        {/* Galon Rusak / Pecah */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Galon Rusak</span>
          <strong className="text-xl font-extrabold text-rose-700 mt-0.5 block">{waterInventory.damagedGallons}</strong>
          <span className="text-[10px] text-rose-600">Afkir / Retur Rusak</span>
        </div>

        {/* Galon Hilang */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Galon Hilang</span>
          <strong className="text-xl font-extrabold text-slate-500 mt-0.5 block">{waterInventory.lostGallons}</strong>
          <span className="text-[10px] text-emerald-600">Terpantau Sistem</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('lokasi')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'lokasi' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Titik Dispenser &amp; Ruangan ({waterLocations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('permintaan')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'permintaan' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daftar Permintaan Galon ({waterRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('provider')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'provider' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Penerimaan Provider &amp; Retur ({waterProviderLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('opname')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'opname' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Stock Opname &amp; Audit Aset ({waterOpnameRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: TITIK DISPENSER & RUANGAN */}
      {activeTab === 'lokasi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {waterLocations.map((loc) => (
              <div 
                key={loc.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200">
                      Unit: {loc.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{loc.floor}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2.5">{loc.roomName}</h4>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Dispenser:</span>
                      <strong className="text-slate-800 text-sm font-bold">{loc.dispenserCount} Unit</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Galon Terpasang:</span>
                      <strong className="text-cyan-800 text-sm font-bold">{loc.activeGallons} Galon</strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500">
                    Refill terakhir: <strong className="text-slate-700">{loc.lastRefillDate ? new Date(loc.lastRefillDate).toLocaleDateString('id-ID') : '-'}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const userInUnit = users.find(u => u.unit === loc.unit) || currentUser;
                      setRequestForm(prev => ({ 
                        ...prev, 
                        locationId: loc.id,
                        unit: loc.unit,
                        userId: userInUnit?.id || prev.userId,
                        gallonCount: 1,
                        emptyGallonsReturned: 1
                      }));
                      setIsRequestModalOpen(true);
                    }}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Minta Refill Galon Ini</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR PERMINTAAN GALON */}
      {activeTab === 'permintaan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no tiket / nama / ruangan..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-cyan-600"
                />
              </div>

              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">Semua Unit</option>
                {['TK', 'SD', 'SMP', 'SMA', 'General Affairs', 'Security', 'IT', 'Finance'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Menunggu Approval">Menunggu Approval</option>
                <option value="Siap Diambil">Siap Diambil</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {waterRequests.length} permohonan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">No. Tiket</th>
                  <th className="p-3">Waktu Pengajuan</th>
                  <th className="p-3">Pemohon &amp; Unit</th>
                  <th className="p-3">Ruangan / Lokasi</th>
                  <th className="p-3">Jenis Permintaan</th>
                  <th className="p-3 text-center">Galon Isi</th>
                  <th className="p-3 text-center">Kosong Kembali</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waterRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Belum ada permohonan air galon sesuai filter
                    </td>
                  </tr>
                ) : (
                  waterRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-900">{req.requestNumber}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {req.waterDetail?.pickupTimestamp 
                          ? new Date(req.waterDetail.pickupTimestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                          : new Date(req.requestDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3">
                        <strong className="text-slate-900 block">{req.userName}</strong>
                        <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                          {req.unit}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{req.waterDetail?.roomName}</span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{req.waterDetail?.requestType}</td>
                      <td className="p-3 text-center font-bold text-cyan-800 bg-cyan-50/50">
                        {req.waterDetail?.gallonCount || 1} Galon
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/50">
                        {req.waterDetail?.emptyGallonsReturned ?? 0} Galon
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{req.status === 'Selesai' ? 'Langsung Diambil' : req.status}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onOpenReceipt(req)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                          title="Lihat & Cetak Slip Tanda Terima"
                        >
                          Slip
                        </button>

                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr' || currentUser?.id === req.userId) && (
                          <button
                            onClick={() => handleOpenEditWaterModal(req)}
                            className="px-2.5 py-1 text-xs font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Koreksi Jumlah Galon Isi / Kosong"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Koreksi</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PENERIMAAN PROVIDER GALON */}
      {activeTab === 'provider' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Pengiriman &amp; Pertukaran Galon dari Distributor</h3>
              <p className="text-xs text-slate-500">
                Pencatatan faktur/surat jalan saat galon isi datang dari agen Aqua dan berapa galon kosong yang dibawa/ditukar.
              </p>
            </div>

            <button
              onClick={() => setIsProviderModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kedatangan Provider Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Waktu &amp; Tanggal</th>
                  <th className="p-3.5">No. Surat Jalan / Faktur</th>
                  <th className="p-3.5">Nama Distributor / Provider</th>
                  <th className="p-3.5">Driver / Pengantar</th>
                  <th className="p-3.5 text-center bg-emerald-50 text-emerald-900">Galon Isi Datang (+)</th>
                  <th className="p-3.5 text-center bg-amber-50 text-amber-900">Galon Kosong Dibawa (-)</th>
                  <th className="p-3.5">Penerima (RR)</th>
                  <th className="p-3.5">Keterangan / Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waterProviderLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Belum ada riwayat kedatangan provider galon
                    </td>
                  </tr>
                ) : (
                  waterProviderLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(log.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-900">{log.deliveryNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{log.supplierName}</td>
                      <td className="p-3.5 text-slate-600">{log.driverName || '-'}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/40">
                        +{log.filledReceived} Galon
                      </td>
                      <td className="p-3.5 text-center font-bold text-amber-700 bg-amber-50/40">
                        -{log.emptyReturned} Galon
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{log.receivedBy}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">{log.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK OPNAME & AUDIT ASET */}
      {activeTab === 'opname' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock Opname &amp; Audit Fisik Galon Sekolah Lazuardi</h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan fisik berkala saldo galon di Resources Room, ruang-ruang kelas/unit, galon rusak, dan sinkronisasi saldo aset.
              </p>
            </div>

            <button
              onClick={() => {
                setOpnameForm({
                  auditorName: currentUser?.name ? `${currentUser.name} & Tim Logistik` : 'Siti Rahmawati & Tim Logistik',
                  initialTotalAssets: waterInventory.initialTotalAssets || 68,
                  physicalFilled: waterInventory.filledGallons,
                  physicalEmpty: waterInventory.emptyGallons,
                  physicalInRooms: waterInventory.inDistribution,
                  physicalDamaged: waterInventory.damagedGallons,
                  physicalLost: waterInventory.lostGallons,
                  notes: 'Stock opname audit fisik galon berkala'
                });
                setIsOpnameModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Input Stock Opname Galon Baru</span>
            </button>
          </div>

          {/* Current Inventory Balances Table */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rekonsiliasi Saldo Aset Galon Saat Ini
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Modal Aset Awal:</span>
                <strong className="text-base text-slate-900 font-extrabold block">
                  {waterInventory.initialTotalAssets || 68} Galon
                </strong>
                <span className="text-[10px] text-slate-400">Modal Kepemilikan Sekolah</span>
              </div>

              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <span className="text-cyan-800 block text-[11px]">Fisik Terhitung di Sistem:</span>
                <strong className="text-base text-cyan-900 font-extrabold block">
                  {waterInventory.filledGallons + waterInventory.emptyGallons + waterInventory.inDistribution + waterInventory.damagedGallons + waterInventory.lostGallons} Galon
                </strong>
                <span className="text-[10px] text-cyan-700">RR + Ruangan + Rusak</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Opname Terakhir:</span>
                <strong className="text-sm text-slate-800 font-bold block">
                  {waterInventory.lastOpnameDate ? new Date(waterInventory.lastOpnameDate).toLocaleDateString('id-ID') : '-'}
                </strong>
                <span className="text-[10px] text-slate-400">Oleh: {waterInventory.lastOpnameBy || 'Admin RR'}</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-emerald-800 block text-[11px]">Status Keseimbangan:</span>
                <strong className="text-sm text-emerald-900 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Seimbang / Klop</span>
                </strong>
                <span className="text-[10px] text-emerald-700">Tidak ada selisih</span>
              </div>
            </div>
          </div>

          {/* Opname Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Log Audit &amp; Ledger Stock Opname Galon
              </h4>
              <span className="text-xs text-slate-400">{waterOpnameRecords.length} audit tersimpan</span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">No. Opname</th>
                  <th className="p-3">Tanggal Audit</th>
                  <th className="p-3">Auditor / Tim</th>
                  <th className="p-3 text-center">Fisik Isi (RR)</th>
                  <th className="p-3 text-center">Fisik Kosong (RR)</th>
                  <th className="p-3 text-center">Di Ruangan</th>
                  <th className="p-3 text-center">Rusak / Hilang</th>
                  <th className="p-3 text-center font-bold">Total Fisik</th>
                  <th className="p-3 text-center">Selisih</th>
                  <th className="p-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waterOpnameRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Belum ada catatan audit opname galon
                    </td>
                  </tr>
                ) : (
                  waterOpnameRecords.map((opn) => (
                    <tr key={opn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{opn.opnameNumber}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(opn.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{opn.auditorName}</td>
                      <td className="p-3 text-center font-semibold text-emerald-800">{opn.physicalFilled}</td>
                      <td className="p-3 text-center font-semibold text-amber-800">{opn.physicalEmpty}</td>
                      <td className="p-3 text-center font-semibold text-blue-800">{opn.physicalInRooms}</td>
                      <td className="p-3 text-center font-semibold text-rose-800">{opn.physicalDamaged + opn.physicalLost}</td>
                      <td className="p-3 text-center font-extrabold text-cyan-900 bg-cyan-50/50">
                        {opn.totalPhysical} Galon
                      </td>
                      <td className="p-3 text-center font-bold">
                        {opn.variance === 0 ? (
                          <span className="text-emerald-700">0 (Sesuai)</span>
                        ) : opn.variance > 0 ? (
                          <span className="text-blue-700">+{opn.variance} (Lebih)</span>
                        ) : (
                          <span className="text-rose-700">{opn.variance} (Kurang)</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{opn.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULIR PERMINTAAN AIR GALON DENGAN EMAIL TEMBUSAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Formulir Permintaan Air Minum Galon"
        subtitle="Sekolah Lazuardi GCS - Notifikasi & Tembusan Email Otomatis"
        maxWidth="lg"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
          
          {/* 1. Live Timestamp & Info Banner */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-3.5 rounded-xl border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-cyan-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                  Waktu Pengambilan / Pengajuan (Otomatis Timestamp)
                </span>
                <strong className="text-xs text-slate-900 font-mono font-bold">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentTime.toLocaleTimeString('id-ID')} WIB
                </strong>
              </div>
            </div>

            <span className="text-[10px] bg-cyan-700 text-white font-bold px-2.5 py-1 rounded-md shadow-xs">
              Aqua Galon 19 Liter
            </span>
          </div>

          {/* 2. Requester Name & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <UserSearchSelect
                users={users}
                selectedUserId={requestForm.userId}
                onSelectUser={(u) => handleUserChange(u.id)}
                label="Nama Pemohon (List Master Data User)"
                themeColor="cyan"
                helperText="Cari nama karyawan, unit, atau departemen di daftar user"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Unit *
              </label>
              <select
                value={requestForm.unit}
                onChange={(e) => {
                  const newUnit = e.target.value;
                  const unitLoc = waterLocations.find(l => l.unit === newUnit);
                  setRequestForm(prev => ({
                    ...prev,
                    unit: newUnit,
                    locationId: unitLoc ? unitLoc.id : prev.locationId
                  }));
                }}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600 font-medium text-xs"
                required
              >
                {['TK', 'SD', 'SMP', 'SMA', 'General Affairs', 'Security', 'IT', 'Finance', 'HR', 'Resources', 'Management'].map(u => (
                  <option key={u} value={u}>Unit {u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Room Location & Request Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lokasi Ruangan / Titik Dispenser *
              </label>
              <select
                value={requestForm.locationId}
                onChange={(e) => setRequestForm({ ...requestForm, locationId: e.target.value, customRoomName: '' })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600 font-medium"
                required
              >
                {waterLocations
                  .filter(l => l.unit === requestForm.unit || true)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.roomName} ({l.unit} - {l.floor})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Permintaan Air Galon *
              </label>
              <select
                value={requestForm.requestType}
                onChange={(e) => {
                  const rType = e.target.value as any;
                  setRequestForm(prev => ({
                    ...prev,
                    requestType: rType,
                    // If regular refill, return count defaults to same as requested
                    emptyGallonsReturned: rType === 'Penggantian Galon Kosong' ? prev.gallonCount : (rType === 'Galon Baru' ? 0 : prev.emptyGallonsReturned)
                  }));
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600 font-medium"
              >
                <option value="Penggantian Galon Kosong">Penggantian Galon Kosong (Refill Rutin)</option>
                <option value="Tambahan Galon">Tambahan Galon (Event / Rapat / Ujian)</option>
                <option value="Galon Baru">Galon Baru (Penambahan Dispenser Baru)</option>
              </select>
            </div>
          </div>

          {/* 4. Gallon Count & Empty Gallon Return */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-cyan-900 mb-1">
                Jumlah Galon Isi yang Diminta *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={requestForm.gallonCount}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    setRequestForm(prev => ({
                      ...prev,
                      gallonCount: count,
                      emptyGallonsReturned: prev.requestType === 'Penggantian Galon Kosong' ? count : prev.emptyGallonsReturned
                    }));
                  }}
                  className="w-full p-2.5 bg-white border border-cyan-300 rounded-lg text-slate-900 font-bold outline-cyan-600"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">Galon Isi</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Stok galon isi siap di RR: <strong className="text-emerald-700">{waterInventory.filledGallons} unit</strong>
              </span>
            </div>

            <div>
              <label className="block font-bold text-amber-900 mb-1">
                Jumlah Galon Kosong yang Dikembalikan *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={requestForm.emptyGallonsReturned}
                  onChange={(e) => setRequestForm({ ...requestForm, emptyGallonsReturned: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-amber-600"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">Galon Kosong</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Galon kosong diserahkan saat penukaran
              </span>
            </div>
          </div>

          {/* 5. Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan / Posisi Penempatan Galon (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Galon kosong diletakkan di samping dispenser depan ruang tata usaha..."
              value={requestForm.notes}
              onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-cyan-600"
            />
          </div>

          {/* 6. Email CC Box to Head of Unit and Unit Admin */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <Mail className="w-4 h-4" />
              <span>Tembusan Email Otomatis (Setelah Formulir Dikirimkan):</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Kepala Unit {requestForm.unit}:</span>
                <strong className="text-cyan-200 block">{currentHeadName}</strong>
                <span className="text-slate-400 font-mono text-[10px]">{currentHeadEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Admin Unit {requestForm.unit}:</span>
                <strong className="text-cyan-200 block">Admin Tata Usaha {requestForm.unit}</strong>
                <span className="text-slate-400 font-mono text-[10px]">admin.{requestForm.unit.toLowerCase()}@lazuardi.sch.id</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              🔔 <strong>Tanpa Perlu Approval:</strong> Permintaan air galon langsung masuk antrean operasional Resources Room. Sistem secara otomatis mengirimkan notifikasi dan rekap ke email Kepala Unit &amp; Admin Unit sebagai transparansi penggunaan unit.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Permintaan Galon</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: PENERIMAAN PROVIDER GALON (ISI DATANG & KOSONG DIBAWA) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        title="Catat Penerimaan Galon dari Provider (Distributor)"
        subtitle="Pencatatan Masuk Galon Isi & Pengembalian Galon Kosong"
        maxWidth="md"
      >
        <form onSubmit={handleProviderSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal &amp; Jam Datang *</label>
              <input
                type="datetime-local"
                value={providerForm.date}
                onChange={(e) => setProviderForm({ ...providerForm, date: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. Surat Jalan / Faktur *</label>
              <input
                type="text"
                value={providerForm.deliveryNumber}
                onChange={(e) => setProviderForm({ ...providerForm, deliveryNumber: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Distributor / Provider *</label>
              <input
                type="text"
                value={providerForm.supplierName}
                onChange={(e) => setProviderForm({ ...providerForm, supplierName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Driver / Pengantar</label>
              <input
                type="text"
                value={providerForm.driverName}
                onChange={(e) => setProviderForm({ ...providerForm, driverName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                placeholder="Contoh: Pak Wahyu (Armada 04)"
              />
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-emerald-800 mb-1">
                Jumlah Galon Isi Datang (+) *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={providerForm.filledReceived}
                onChange={(e) => setProviderForm({ ...providerForm, filledReceived: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-emerald-900 font-bold"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Menambah stok galon isi di RR</span>
            </div>

            <div>
              <label className="block font-bold text-amber-800 mb-1">
                Galon Kosong Dibawa Provider (-) *
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={providerForm.emptyReturned}
                onChange={(e) => setProviderForm({ ...providerForm, emptyReturned: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Mengurangi galon kosong di RR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Petugas RR Penerima *</label>
              <input
                type="text"
                value={providerForm.receivedBy}
                onChange={(e) => setProviderForm({ ...providerForm, receivedBy: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Keterangan / Kondisi Segel</label>
              <input
                type="text"
                value={providerForm.notes}
                onChange={(e) => setProviderForm({ ...providerForm, notes: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                placeholder="Segel utuh dan bersih..."
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsProviderModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Penerimaan Provider</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK OPNAME GALON */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOpnameModalOpen}
        onClose={() => setIsOpnameModalOpen(false)}
        title="Stock Opname & Audit Fisik Galon"
        subtitle="Penyesuaian Fisik Galon Aqua 19L di Seluruh Kampus Lazuardi"
        maxWidth="lg"
      >
        <form onSubmit={handleOpnameSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Auditor / Tim Audit *</label>
              <input
                type="text"
                value={opnameForm.auditorName}
                onChange={(e) => setOpnameForm({ ...opnameForm, auditorName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Modal Total Aset Galon Awal *</label>
              <input
                type="number"
                min="1"
                value={opnameForm.initialTotalAssets}
                onChange={(e) => setOpnameForm({ ...opnameForm, initialTotalAssets: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-cyan-900 font-bold"
                required
              />
            </div>
          </div>

          {/* Physical count inputs */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase text-[11px]">
              Hasil Hitungan Fisik Galon (Physical Count):
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-emerald-800 mb-1">
                  1. Galon Isi di RR (Gudang)
                </label>
                <input
                  type="number"
                  min="0"
                  value={opnameForm.physicalFilled}
                  onChange={(e) => setOpnameForm({ ...opnameForm, physicalFilled: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-emerald-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-amber-800 mb-1">
                  2. Galon Kosong di RR (Gudang)
                </label>
                <input
                  type="number"
                  min="0"
                  value={opnameForm.physicalEmpty}
                  onChange={(e) => setOpnameForm({ ...opnameForm, physicalEmpty: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-blue-800 mb-1">
                  3. Terpasang di Ruangan Unit
                </label>
                <input
                  type="number"
                  min="0"
                  value={opnameForm.physicalInRooms}
                  onChange={(e) => setOpnameForm({ ...opnameForm, physicalInRooms: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-blue-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-rose-800 mb-1">
                  4. Galon Rusak / Pecah
                </label>
                <input
                  type="number"
                  min="0"
                  value={opnameForm.physicalDamaged}
                  onChange={(e) => setOpnameForm({ ...opnameForm, physicalDamaged: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-rose-300 rounded-lg text-rose-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5. Galon Hilang / Selisih
                </label>
                <input
                  type="number"
                  min="0"
                  value={opnameForm.physicalLost}
                  onChange={(e) => setOpnameForm({ ...opnameForm, physicalLost: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div className="bg-cyan-50 p-2.5 rounded-lg border border-cyan-200 text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-cyan-800 uppercase">Total Fisik Terhitung</span>
                <strong className="text-lg font-extrabold text-cyan-950 block">{totalPhysicalAudit} Galon</strong>
              </div>
            </div>
          </div>

          {/* Variance Preview */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Perbandingan Rekonsiliasi:</span>
              <span>Total Fisik: <strong>{totalPhysicalAudit}</strong> vs Saldo Sistem: <strong>{totalSystemAudit}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Selisih (Variance):</span>
              <strong className={`text-sm ${auditVariance === 0 ? 'text-emerald-400' : (auditVariance > 0 ? 'text-cyan-400' : 'text-rose-400')}`}>
                {auditVariance === 0 ? '0 (Klop Sempurna)' : (auditVariance > 0 ? `+${auditVariance} (Lebih Fisik)` : `${auditVariance} (Kurang Fisik)`)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan &amp; Rekomendasi Audit</label>
            <textarea
              rows={2}
              value={opnameForm.notes}
              onChange={(e) => setOpnameForm({ ...opnameForm, notes: e.target.value })}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              placeholder="Catatan kondisi galon dan posisi penempatan..."
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpnameModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Sinkronkan Stock Opname</span>
            </button>
          </div>

        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT MODAL ASSET AWAL GALON */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditAssetsModalOpen}
        onClose={() => setIsEditAssetsModalOpen(false)}
        title="Ubah Modal Total Aset Galon Awal"
        subtitle="Penyesuaian Total Kepemilikan Galon Sekolah Lazuardi"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveInitialAssets} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Jumlah Galon Awal Dimiliki *</label>
            <input
              type="number"
              min="1"
              max="500"
              value={initialAssetsInput}
              onChange={(e) => setInitialAssetsInput(Number(e.target.value))}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-cyan-900 font-extrabold text-base"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Jumlah total galon fisik yang dibeli atau menjadi aset resmi yayasan.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditAssetsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: ADD LOCATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        title="Tambah Titik Dispenser Baru"
        subtitle="Registrasi Ruangan di Kampus Lazuardi"
        maxWidth="md"
      >
        <form onSubmit={handleAddLocation} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Sekolah *</label>
              <select
                value={locForm.unit}
                onChange={(e) => setLocForm({ ...locForm, unit: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                {['TK', 'SD', 'SMP', 'SMA', 'General Affairs', 'Finance', 'HR', 'IT', 'Security', 'Resources', 'Management'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lantai / Gedung *</label>
              <input
                type="text"
                value={locForm.floor}
                onChange={(e) => setLocForm({ ...locForm, floor: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Ruangan *</label>
            <input
              type="text"
              placeholder="Contoh: Lab Bahasa &amp; Komputer SMP"
              value={locForm.roomName}
              onChange={(e) => setLocForm({ ...locForm, roomName: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Dispenser</label>
              <input
                type="number"
                min="1"
                value={locForm.dispenserCount}
                onChange={(e) => setLocForm({ ...locForm, dispenserCount: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Galon Aktif Saat Ini</label>
              <input
                type="number"
                min="0"
                value={locForm.activeGallons}
                onChange={(e) => setLocForm({ ...locForm, activeGallons: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddLocationModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Simpan Titik Dispenser
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: ACTION PROCESS DISTRIBUTION */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Proses Galon: ${selectedRequest.requestNumber}`}
          subtitle={`Lokasi: ${selectedRequest.waterDetail?.roomName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200 text-slate-800 space-y-1">
              <p>Ruangan: <strong>{selectedRequest.waterDetail?.roomName}</strong> ({selectedRequest.unit})</p>
              <p>Pemohon: <strong>{selectedRequest.userName}</strong></p>
              <p>Galon Isi Diminta: <strong className="text-cyan-900 font-bold">{selectedRequest.waterDetail?.gallonCount || 1} Galon</strong></p>
              <p>Galon Kosong Dikembalikan: <strong className="text-amber-900 font-bold">{selectedRequest.waterDetail?.emptyGallonsReturned ?? 0} Galon</strong></p>
              <p>Jenis: <span>{selectedRequest.waterDetail?.requestType}</span></p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-700">Perbarui Alur Status Pengerjaan (Operator RR):</label>

              {/* Receiver name input for completion */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Penerima / Petugas Distribusi:
                </label>
                <input
                  type="text"
                  value={actionPickedUpBy}
                  onChange={(e) => setActionPickedUpBy(e.target.value)}
                  placeholder="Nama penerima di ruangan..."
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  *Nama ini akan dicatat dalam histori serah terima saat status diubah ke Selesai.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Disetujui', { adminNotes: 'Permintaan galon disetujui operator RR' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Disetujui' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Check className="w-3.5 h-3.5 text-blue-500" />
                    <span>1. Setujui</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Disetujui operator RR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Sedang Disiapkan', { adminNotes: 'Galon sedang disiapkan / dalam proses antar oleh petugas' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Sedang Disiapkan' ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>2. Sedang Diantar</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Proses angkut/antar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Siap Diambil', { adminNotes: 'Galon telah disiapkan di loket Resources Room' });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Siap Diambil' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-500" />
                    <span>3. Siap Diambil</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Tersedia di loket RR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const recipient = actionPickedUpBy.trim() || selectedRequest.userName || 'Petugas Ruangan';
                    updateRequestStatus(selectedRequest.id, 'Selesai', { pickedUpBy: recipient });
                    setIsActionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-colors ${
                    selectedRequest.status === 'Selesai' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Selesai</span>
                  </div>
                  <span className="text-[10px] opacity-80 block">Galon terpasang di ruangan</span>
                </button>
              </div>

              {/* Reject toggle and inline form */}
              {selectedRequest.status !== 'Selesai' && selectedRequest.status !== 'Ditolak' && (
                <div className="pt-1">
                  {!isRejecting ? (
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="w-full p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak / Batalkan Permintaan</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                      <label className="block text-[11px] font-bold text-rose-800">
                        Masukkan Alasan Penolakan / Pembatalan:
                      </label>
                      <input
                        type="text"
                        value={rejectionReasonText}
                        onChange={(e) => setRejectionReasonText(e.target.value)}
                        placeholder="Contoh: Stok galon habis / lokasi belum terpasang dispenser..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-rose-300 rounded-md focus:outline-hidden font-medium"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateRequestStatus(selectedRequest.id, 'Ditolak', {
                              rejectionReason: rejectionReasonText.trim() || 'Dibatalkan oleh operator RR'
                            });
                            setIsActionModalOpen(false);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md cursor-pointer"
                        >
                          Konfirmasi Tolak
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: KOREKSI DATA SERAH TERIMA GALON (INSTANT RE-SYNC) */}
      {/* ========================================================================= */}
      {selectedWaterReq && (
        <Modal
          isOpen={isEditWaterModalOpen}
          onClose={() => setIsEditWaterModalOpen(false)}
          title={`Koreksi Data Serah Terima: ${selectedWaterReq.requestNumber}`}
          subtitle={`Lokasi: ${selectedWaterReq.waterDetail?.roomName} (${selectedWaterReq.unit})`}
          maxWidth="md"
        >
          <form onSubmit={handleEditWaterSubmit} className="space-y-4 text-xs">
            <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-900">Pemohon: {selectedWaterReq.userName}</span>
                <span className="text-[10px] text-cyan-700 font-mono">
                  {selectedWaterReq.waterDetail?.pickupTimestamp ? new Date(selectedWaterReq.waterDetail.pickupTimestamp).toLocaleString('id-ID') : '-'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Gunakan formulir ini jika terjadi salah hitung jumlah galon isi yang dibawa atau galon kosong yang dikembalikan. Sistem akan otomatis merevisi saldo stok secara real-time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-cyan-900 mb-1">
                  Galon Isi Diambil *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={editWaterForm.gallonCount}
                  onChange={(e) => setEditWaterForm({ ...editWaterForm, gallonCount: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-cyan-300 rounded-lg text-slate-900 font-bold outline-cyan-600"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sebelumnya: {selectedWaterReq.waterDetail?.gallonCount || 1} Galon
                </span>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Galon Kosong Diserahkan *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={editWaterForm.emptyGallonsReturned}
                  onChange={(e) => setEditWaterForm({ ...editWaterForm, emptyGallonsReturned: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-amber-600"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sebelumnya: {selectedWaterReq.waterDetail?.emptyGallonsReturned ?? 0} Galon
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Petugas / Yang Mengambil *</label>
              <input
                type="text"
                value={editWaterForm.pickedUpBy}
                onChange={(e) => setEditWaterForm({ ...editWaterForm, pickedUpBy: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan Koreksi (Opsional)</label>
              <input
                type="text"
                value={editWaterForm.notes}
                onChange={(e) => setEditWaterForm({ ...editWaterForm, notes: e.target.value })}
                placeholder="Contoh: Revisi hitungan galon kosong yang tertinggal di lorong..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditWaterModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan &amp; Sinkronkan Stok</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
