import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceRequest, VehicleCategory, VehicleFleetItem, VehicleOrderDetail, VehicleOwnershipType, RentalPaymentStatus, VehicleRentalChecklist } from '../types';
import {
  Car,
  Bus,
  Plus,
  Edit2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  Search,
  User as UserIcon,
  Building2,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  Trash2,
  Compass,
  Navigation,
  Fuel,
  FileText,
  Mail,
  Wrench
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { resolveCanonicalUnit, isSameUnit } from '../utils/unitUtils';
import { UserSearchSelect } from '../components/common/UserSearchSelect';
import { TrackOrderModal } from '../components/common/TrackOrderModal';
import { EmailReportModal } from '../components/common/EmailReportModal';

interface VehicleServiceViewProps {
  onOpenReceipt: (req: ServiceRequest) => void;
  initialCategory?: 'all' | 'operasional' | 'bus';
}

const FLEET_STORAGE_KEY = 'lazuardi_rr_vehicle_fleet';

export const VehicleServiceView: React.FC<VehicleServiceViewProps> = ({
  onOpenReceipt,
  initialCategory = 'all'
}) => {
  const {
    currentUser,
    users,
    units,
    requests,
    vehicleFleet: fleet,
    addVehicleFleet,
    updateVehicleFleet,
    createRequest,
    updateRequestStatus,
    deleteRequest,
    showToast
  } = useApp();

  // Active sub-tab: 'all' | 'operasional' | 'bus' | 'fleet'
  const [activeTab, setActiveTab] = useState<'all' | 'operasional' | 'bus' | 'fleet'>(initialCategory);

  useEffect(() => {
    setActiveTab(initialCategory);
  }, [initialCategory]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  // Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add / Edit Fleet Modal State (for Admin/Super Admin)
  const [isAddFleetModalOpen, setIsAddFleetModalOpen] = useState(false);
  const [editingFleetItem, setEditingFleetItem] = useState<VehicleFleetItem | null>(null);
  const [newFleetForm, setNewFleetForm] = useState<{
    code: string;
    name: string;
    category: VehicleCategory;
    ownershipType: VehicleOwnershipType;
    vendorName: string;
    rentalPrice: number | '';
    rentalPeriod: string;
    plateNumber: string;
    capacity: number | '';
    driverName: string;
    driverPhone: string;
    transmission: 'Manual' | 'Automatic';
    fuelType: 'Bensin' | 'Solar / Diesel' | 'Hybrid';
    status: 'Tersedia' | 'Sedang Bertugas' | 'Perawatan';
    notes: string;
  }>({
    code: 'OPS-05',
    name: '',
    category: 'Kendaraan Operasional',
    ownershipType: 'Milik Sekolah',
    vendorName: 'Inventaris Yayasan Lazuardi',
    rentalPrice: 0,
    rentalPeriod: 'Inventaris Sekolah',
    plateNumber: '',
    capacity: 7,
    driverName: '',
    driverPhone: '',
    transmission: 'Automatic',
    fuelType: 'Bensin',
    status: 'Tersedia',
    notes: ''
  });

  // Delete confirmation state
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Live Order Tracking State
  const [trackingRequest, setTrackingRequest] = useState<ServiceRequest | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isOrderPickerOpen, setIsOrderPickerOpen] = useState(false);

  // Email Report Modal State
  const [emailModalRequest, setEmailModalRequest] = useState<ServiceRequest | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Action Modal (for Admin RR & Super Admin to Confirm Order & Assign Vehicle/Driver)
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionPickedUpBy, setActionPickedUpBy] = useState('');
  const [actionAdminNotes, setActionAdminNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Admin/Staff Confirmation Fields: Jenis Kendaraan & Driver
  const [assignFleetId, setAssignFleetId] = useState<string>('');
  const [assignVehicleName, setAssignVehicleName] = useState<string>('');
  const [assignPlateNumber, setAssignPlateNumber] = useState<string>('');
  const [assignOwnershipType, setAssignOwnershipType] = useState<VehicleOwnershipType>('Milik Sekolah');
  const [assignVendorName, setAssignVendorName] = useState<string>('Inventaris Yayasan Lazuardi');
  const [assignRentalPrice, setAssignRentalPrice] = useState<number | ''>(0);
  const [assignRentalPeriod, setAssignRentalPeriod] = useState<string>('Inventaris Sekolah');
  const [assignDriverOption, setAssignDriverOption] = useState<string>('Dengan Sopir (Driver Sekolah)');
  const [assignDriverName, setAssignDriverName] = useState<string>('');

  // Ceklist khusus Bus / Kendaraan Sewa pada proses "Siapkan Armada dan Driver"
  const [checkKeepOrder, setCheckKeepOrder] = useState<boolean>(false);
  const [checkDpSewa, setCheckDpSewa] = useState<boolean>(false);
  const [checkLunas, setCheckLunas] = useState<boolean>(false);
  const [checkArmadaPrepared, setCheckArmadaPrepared] = useState<boolean>(false);

  const canManageOrDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr';

  // Form State for New Vehicle Order (Requester only fills category, unit/passenger count, schedule & destination)
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || (users[0]?.id ?? ''));
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUser?.unit || 'SMP');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('Kendaraan Operasional');
  const [vehicleCount, setVehicleCount] = useState<number | ''>(1);
  const [passengerCount, setPassengerCount] = useState<number | ''>(4);
  const [tripPurposeType, setTripPurposeType] = useState<string>('Dinas Luar / Rapat Diknas');
  const [destination, setDestination] = useState<string>('');
  const [pickupPoint, setPickupPoint] = useState<string>('Lobby Utama Kampus Lazuardi GCS');
  const [departureTime, setDepartureTime] = useState<string>(
    new Date(Date.now() + 3600000 * 3).toISOString().slice(0, 16)
  );
  const [returnTime, setReturnTime] = useState<string>(
    new Date(Date.now() + 3600000 * 8).toISOString().slice(0, 16)
  );
  const [picPhone, setPicPhone] = useState<string>(currentUser?.phone || '0812-8900-1122');
  const [fuelTollNote, setFuelTollNote] = useState<string>('Termasuk E-Toll & BBM Operasional');
  const [notes, setNotes] = useState<string>('');
  const [urgency, setUrgency] = useState<'Biasa' | 'Penting' | 'Mendesak'>('Biasa');

  const activeUnitInfo = units.find(
    u => u.code.toLowerCase() === selectedUnit.toLowerCase() ||
         u.name.toLowerCase().includes(selectedUnit.toLowerCase())
  );

  const operationalPurposes = [
    'Dinas Luar / Rapat Diknas',
    'Pengadaan & Belanja Logistik',
    'Jemput Tamu / Narasumber',
    'Pengantaran Dokumen / Bank',
    'Kunjungan Kerja Antar-Kampus',
    'Operasional Yayasan / Manajemen'
  ];

  const busPurposes = [
    'Field Trip / Kunjungan Edukasi',
    'Lomba & Kompetisi Siswa',
    'Kegiatan Ekstrakurikuler / Pramuka',
    'Antar-Jemput Rombongan Siswa',
    'Karya Wisata / Study Tour',
    'Kegiatan Rombongan Guru & Karyawan'
  ];

  const handleCategorySwitchInForm = (cat: VehicleCategory) => {
    setVehicleCategory(cat);
    if (cat === 'Kendaraan Operasional') {
      setTripPurposeType('Dinas Luar / Rapat Diknas');
      setPassengerCount(4);
      setVehicleCount(1);
      setPickupPoint('Lobby Utama Kampus Lazuardi GCS');
      setFuelTollNote('Termasuk E-Toll & BBM Operasional');
    } else {
      setTripPurposeType('Field Trip / Kunjungan Edukasi');
      setPassengerCount(30);
      setVehicleCount(1);
      setPickupPoint('Area Parkir Utama Bus Kampus Lazuardi');
      setFuelTollNote('Termasuk E-Toll, BBM & Parkir Bus Pariwisata');
    }
  };

  const handleOpenOrderModal = (category: VehicleCategory) => {
    if (currentUser) {
      setSelectedUserId(currentUser.id);
      setSelectedUnit(currentUser.unit || 'SMP');
      setPicPhone(currentUser.phone || '0812-8900-1122');
    } else if (users.length > 0) {
      setSelectedUserId(users[0].id);
      setSelectedUnit(users[0].unit || 'SMP');
      setPicPhone(users[0].phone || '0812-8900-1122');
    }

    handleCategorySwitchInForm(category);
    setDestination('');
    setDepartureTime(new Date(Date.now() + 3600000 * 24).toISOString().slice(0, 16));
    setReturnTime(new Date(Date.now() + 3600000 * 30).toISOString().slice(0, 16));
    setNotes('');
    setUrgency('Biasa');
    setIsModalOpen(true);
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const found = users.find(u => u.id === userId);
    if (found) {
      if (found.unit) setSelectedUnit(found.unit);
      if (found.phone) setPicPhone(found.phone);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId) || currentUser;

    const finalVehicleCount = Math.max(1, Number(vehicleCount) || 1);
    const finalPassengerCount = Math.max(1, Number(passengerCount) || 1);
    const finalDest = destination.trim() || 'Tujuan Operasional Sekolah';

    const vehicleDetail: VehicleOrderDetail = {
      vehicleCategory,
      vehicleId: '',
      vehicleName: 'Menunggu Penentuan Admin',
      plateNumber: 'Belum Ditentukan',
      vehicleCount: finalVehicleCount,
      passengerCount: finalPassengerCount,
      tripPurposeType,
      destination: finalDest,
      pickupPoint: pickupPoint.trim() || 'Lobby Kampus Lazuardi',
      departureTime,
      returnTime,
      driverOption: 'Ditentukan Admin / Staff',
      driverName: 'Menunggu Konfirmasi Admin',
      picPhone: picPhone.trim() || undefined,
      fuelTollNote: fuelTollNote.trim() || undefined,
      notes: notes.trim() || undefined
    };

    createRequest({
      serviceType: 'kendaraan',
      userId: user?.id || 'usr-guest',
      userName: user?.name || 'Staf Lazuardi',
      userEmail: user?.email || 'staff@lazuardi.sch.id',
      unit: resolveCanonicalUnit(selectedUnit || user?.unit || 'SMP', units).code,
      department: user?.department || 'Operasional',
      urgency,
      purpose: `${vehicleCategory} - ${tripPurposeType} ke ${finalDest}`,
      notes: notes.trim() || undefined,
      items: [],
      vehicleDetail
    });

    setIsModalOpen(false);
  };

  const handleOpenAddFleetModal = (ownership: VehicleOwnershipType = 'Milik Sekolah', category: VehicleCategory = 'Kendaraan Operasional') => {
    setEditingFleetItem(null);
    const isRental = ownership === 'Sewa / Vendor';
    const prefix = isRental
      ? (category === 'Kendaraan Bus' ? 'SEWA-BUS' : 'SEWA-OPS')
      : (category === 'Kendaraan Bus' ? 'BUS' : 'OPS');
    const count = fleet.filter(f => f.code.startsWith(prefix)).length + 1;
    setNewFleetForm({
      code: `${prefix}-${String(count).padStart(2, '0')}`,
      name: '',
      category,
      ownershipType: ownership,
      vendorName: isRental ? 'PO Mitra Pariwisata Lazuardi' : 'Inventaris Yayasan Lazuardi',
      rentalPrice: isRental ? (category === 'Kendaraan Bus' ? 2500000 : 850000) : 0,
      rentalPeriod: isRental ? 'Per Hari (Full Day)' : 'Inventaris Sekolah',
      plateNumber: '',
      capacity: category === 'Kendaraan Bus' ? 35 : 7,
      driverName: '',
      driverPhone: '',
      transmission: category === 'Kendaraan Bus' ? 'Manual' : 'Automatic',
      fuelType: category === 'Kendaraan Bus' ? 'Solar / Diesel' : 'Bensin',
      status: 'Tersedia',
      notes: ''
    });
    setIsAddFleetModalOpen(true);
  };

  const handleOpenEditFleetModal = (item: VehicleFleetItem) => {
    setEditingFleetItem(item);
    setNewFleetForm({
      code: item.code,
      name: item.name,
      category: item.category,
      ownershipType: item.ownershipType || 'Milik Sekolah',
      vendorName: item.vendorName || (item.ownershipType === 'Sewa / Vendor' ? 'PO Mitra Pariwisata' : 'Inventaris Yayasan Lazuardi'),
      rentalPrice: item.rentalPrice ?? 0,
      rentalPeriod: item.rentalPeriod || (item.ownershipType === 'Sewa / Vendor' ? 'Per Hari (Full Day)' : 'Inventaris Sekolah'),
      plateNumber: item.plateNumber,
      capacity: item.capacity,
      driverName: item.driverName,
      driverPhone: item.driverPhone || '',
      transmission: item.transmission || 'Manual',
      fuelType: item.fuelType || 'Bensin',
      status: item.status,
      notes: item.notes || ''
    });
    setIsAddFleetModalOpen(true);
  };

  const handleAddFleetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFleetForm.name.trim() || !newFleetForm.plateNumber.trim()) return;
    const payload: Omit<VehicleFleetItem, 'id'> = {
      code: newFleetForm.code.trim().toUpperCase() || `ARM-${fleet.length + 1}`,
      name: newFleetForm.name.trim(),
      category: newFleetForm.category,
      ownershipType: newFleetForm.ownershipType,
      vendorName: newFleetForm.vendorName.trim() || (newFleetForm.ownershipType === 'Sewa / Vendor' ? 'Vendor Rekanan' : 'Inventaris Yayasan Lazuardi'),
      rentalPrice: Math.max(0, Number(newFleetForm.rentalPrice) || 0),
      rentalPeriod: newFleetForm.rentalPeriod || (newFleetForm.ownershipType === 'Sewa / Vendor' ? 'Per Hari (Full Day)' : 'Inventaris Sekolah'),
      plateNumber: newFleetForm.plateNumber.trim().toUpperCase(),
      capacity: Math.max(1, Number(newFleetForm.capacity) || 7),
      driverName: newFleetForm.driverName.trim() || 'Driver Operasional',
      driverPhone: newFleetForm.driverPhone.trim() || undefined,
      transmission: newFleetForm.transmission,
      fuelType: newFleetForm.fuelType,
      status: newFleetForm.status || 'Tersedia',
      notes: newFleetForm.notes.trim() || undefined
    };

    if (editingFleetItem) {
      updateVehicleFleet(editingFleetItem.id, payload);
    } else {
      addVehicleFleet(payload);
    }
    setIsAddFleetModalOpen(false);
    setEditingFleetItem(null);
  };

  const handleToggleFleetStatus = (id: string) => {
    const item = fleet.find(f => f.id === id);
    if (!item) return;
    const nextStatus: VehicleFleetItem['status'] =
      item.status === 'Tersedia' ? 'Sedang Bertugas'
      : item.status === 'Sedang Bertugas' ? 'Perawatan'
      : 'Tersedia';
    updateVehicleFleet(id, { status: nextStatus });
  };

  const vehicleRequests = requests.filter(r => r.serviceType === 'kendaraan');

  const filteredRequests = vehicleRequests.filter(req => {
    const vd = req.vehicleDetail;
    if (activeTab === 'operasional' && vd?.vehicleCategory !== 'Kendaraan Operasional') return false;
    if (activeTab === 'bus' && vd?.vehicleCategory !== 'Kendaraan Bus') return false;

    const q = searchTerm.toLowerCase();
    const matchSearch =
      req.requestNumber.toLowerCase().includes(q) ||
      req.userName.toLowerCase().includes(q) ||
      (req.purpose || '').toLowerCase().includes(q) ||
      (vd?.vehicleName || '').toLowerCase().includes(q) ||
      (vd?.plateNumber || '').toLowerCase().includes(q) ||
      (vd?.destination || '').toLowerCase().includes(q) ||
      (vd?.driverName || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchUnit = unitFilter === 'all' || isSameUnit(req.unit, unitFilter, units);

    return matchSearch && matchStatus && matchUnit;
  });

  // KPI Metrics
  const operationalOrders = vehicleRequests.filter(r => r.vehicleDetail?.vehicleCategory === 'Kendaraan Operasional');
  const busOrders = vehicleRequests.filter(r => r.vehicleDetail?.vehicleCategory === 'Kendaraan Bus');
  const totalBusPassengers = busOrders.reduce((sum, r) => sum + (r.vehicleDetail?.passengerCount || 0), 0);
  const availableFleetCount = fleet.filter(f => f.status === 'Tersedia').length;

  const myActiveVehicleOrders = vehicleRequests.filter(
    r => (r.userId === currentUser?.id || r.userEmail === currentUser?.email) && r.status !== 'Selesai' && r.status !== 'Ditolak'
  );

  const handleQuickTrackMyOrder = () => {
    if (myActiveVehicleOrders.length === 1) {
      setTrackingRequest(myActiveVehicleOrders[0]);
      setIsTrackingModalOpen(true);
    } else {
      setIsOrderPickerOpen(true);
    }
  };

  const handleOpenActionModal = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setActionPickedUpBy(req.pickedUpBy || req.userName || '');
    setActionAdminNotes(req.adminNotes || '');
    setIsRejecting(false);
    setRejectionReasonText('');

    const vd = req.vehicleDetail;
    const rc = vd?.rentalChecklist;
    setCheckKeepOrder(Boolean(rc?.keepOrder));
    setCheckDpSewa(Boolean(rc?.dpSewa));
    setCheckLunas(Boolean(rc?.lunas));
    setCheckArmadaPrepared(Boolean(rc?.armadaPrepared || req.status === 'Sedang Disiapkan' || req.status === 'Siap Diambil' || req.status === 'Selesai'));

    const isUnassigned =
      !vd?.vehicleName ||
      vd.vehicleName === 'Menunggu Penentuan Admin' ||
      vd.plateNumber === 'Belum Ditentukan';

    if (isUnassigned) {
      const catFleet = fleet.filter(f => f.category === (vd?.vehicleCategory || 'Kendaraan Operasional'));
      const defaultUnit = catFleet.find(f => f.status === 'Tersedia') || catFleet[0];
      if (defaultUnit) {
        setAssignFleetId(defaultUnit.id);
        setAssignVehicleName(defaultUnit.name);
        setAssignPlateNumber(defaultUnit.plateNumber);
        setAssignOwnershipType(defaultUnit.ownershipType || 'Milik Sekolah');
        setAssignVendorName(defaultUnit.vendorName || 'Inventaris Yayasan Lazuardi');
        setAssignRentalPrice(defaultUnit.rentalPrice ?? 0);
        setAssignRentalPeriod(defaultUnit.rentalPeriod || 'Inventaris Sekolah');
        setAssignDriverOption('Dengan Sopir (Driver Sekolah)');
        setAssignDriverName(defaultUnit.driverName);
      } else {
        setAssignFleetId('');
        setAssignVehicleName('');
        setAssignPlateNumber('');
        setAssignOwnershipType('Milik Sekolah');
        setAssignVendorName('Inventaris Yayasan Lazuardi');
        setAssignRentalPrice(0);
        setAssignRentalPeriod('Inventaris Sekolah');
        setAssignDriverOption('Dengan Sopir (Driver Sekolah)');
        setAssignDriverName('');
      }
    } else {
      setAssignFleetId(vd?.vehicleId || '');
      setAssignVehicleName(vd?.vehicleName || '');
      setAssignPlateNumber(vd?.plateNumber || '');
      setAssignOwnershipType(vd?.ownershipType || 'Milik Sekolah');
      setAssignVendorName(vd?.vendorName || 'Inventaris Yayasan Lazuardi');
      setAssignRentalPrice(vd?.rentalPrice ?? 0);
      setAssignRentalPeriod(vd?.rentalPeriod || 'Inventaris Sekolah');
      setAssignDriverOption(
        vd?.driverOption && vd.driverOption !== 'Ditentukan Admin / Staff'
          ? vd.driverOption
          : 'Dengan Sopir (Driver Sekolah)'
      );
      setAssignDriverName(
        vd?.driverName && vd.driverName !== 'Menunggu Konfirmasi Admin'
          ? vd.driverName
          : ''
      );
    }

    setIsActionModalOpen(true);
  };

  const handleAdminSelectFleetUnit = (fleetId: string) => {
    setAssignFleetId(fleetId);
    const found = fleet.find(f => f.id === fleetId);
    if (found) {
      setAssignVehicleName(found.name);
      setAssignPlateNumber(found.plateNumber);
      setAssignOwnershipType(found.ownershipType || 'Milik Sekolah');
      setAssignVendorName(found.vendorName || 'Inventaris Yayasan Lazuardi');
      setAssignRentalPrice(found.rentalPrice ?? 0);
      setAssignRentalPeriod(found.rentalPeriod || 'Inventaris Sekolah');
      setAssignDriverName(found.driverName);
    }
  };

  const buildAssignedVehicleDetail = (req: ServiceRequest, markArmadaPrepared?: boolean): VehicleOrderDetail | undefined => {
    if (!req.vehicleDetail) return undefined;
    const finalVehName = assignVehicleName.trim() || req.vehicleDetail.vehicleName || 'Armada Sekolah';
    const finalPlate = assignPlateNumber.trim() || req.vehicleDetail.plateNumber || '-';
    const finalDriver =
      assignDriverOption === 'Lepas Kunci (Mengemudi Sendiri)'
        ? (actionPickedUpBy.trim() || req.userName || 'Mengemudi Sendiri')
        : (assignDriverName.trim() || req.vehicleDetail.driverName || 'Driver Sekolah');
    const unitPrice = Math.max(0, Number(assignRentalPrice) || 0);
    const unitCount = Math.max(1, req.vehicleDetail.vehicleCount || 1);

    const existingChecklist = req.vehicleDetail.rentalChecklist;
    const nowIso = new Date().toISOString();
    const isPrepared = markArmadaPrepared ? true : (checkArmadaPrepared || Boolean(existingChecklist?.armadaPrepared));
    const rentalChecklist: VehicleRentalChecklist = {
      keepOrder: checkKeepOrder,
      keepOrderDate: checkKeepOrder ? (existingChecklist?.keepOrderDate || nowIso) : undefined,
      dpSewa: checkDpSewa,
      dpSewaDate: checkDpSewa ? (existingChecklist?.dpSewaDate || nowIso) : undefined,
      lunas: checkLunas,
      lunasDate: checkLunas ? (existingChecklist?.lunasDate || nowIso) : undefined,
      armadaPrepared: isPrepared,
      armadaPreparedDate: isPrepared ? (existingChecklist?.armadaPreparedDate || nowIso) : undefined
    };
    const rentalPaymentStatus: RentalPaymentStatus = checkLunas
      ? 'Lunas'
      : checkDpSewa
      ? 'DP Sewa'
      : checkKeepOrder
      ? 'Keep Order'
      : 'Belum Keep Order';

    return {
      ...req.vehicleDetail,
      vehicleId: assignFleetId || req.vehicleDetail.vehicleId,
      vehicleName: finalVehName,
      plateNumber: finalPlate,
      ownershipType: assignOwnershipType,
      vendorName: assignVendorName,
      rentalPrice: unitPrice,
      rentalPeriod: assignRentalPeriod,
      totalRentalCost: unitPrice * unitCount,
      rentalChecklist,
      rentalPaymentStatus,
      driverOption: assignDriverOption,
      driverName: finalDriver
    };
  };

  const handleOpenDeleteConfirm = (req: ServiceRequest) => {
    setRequestToDelete(req);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!requestToDelete) return;
    deleteRequest(requestToDelete.id);
    if (selectedRequest?.id === requestToDelete.id) {
      setIsActionModalOpen(false);
      setSelectedRequest(null);
    }
    setIsDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 text-white rounded-xl shadow-xs ${activeTab === 'bus' ? 'bg-amber-600' : 'bg-blue-700'}`}>
            {activeTab === 'bus' ? <Bus className="w-6 h-6" /> : <Car className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900">
                {activeTab === 'operasional'
                  ? 'Order Kendaraan Operasional Sekolah'
                  : activeTab === 'bus'
                  ? 'Order Kendaraan Bus Sekolah'
                  : 'Layanan Order Kendaraan Operasional & Bus'}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Transportasi &amp; Armada Lazuardi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemesanan mobil operasional dinas staf/guru serta armada bus sekolah untuk field trip, lomba &amp; kunjungan edukasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleQuickTrackMyOrder}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>Lacak Order</span>
            {myActiveVehicleOrders.length > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">
                {myActiveVehicleOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenOrderModal('Kendaraan Operasional')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>+ Order Mobil Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenOrderModal('Kendaraan Bus')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bus className="w-4 h-4" />
            <span>+ Order Bus Sekolah</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>TOTAL ORDER KENDARAAN</span>
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {vehicleRequests.length} <span className="text-xs font-normal text-slate-500">Perjalanan</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            {vehicleRequests.filter(r => r.status === 'Selesai' || r.status === 'Disetujui').length} Terjadwal / Selesai
          </span>
        </div>

        <div
          onClick={() => setActiveTab('operasional')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>KENDARAAN OPERASIONAL</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {operationalOrders.length} <span className="text-xs font-normal text-slate-500">Order Mobil</span>
          </p>
          <span className="text-[11px] text-slate-500 block mt-1">
            {fleet.filter(f => f.category === 'Kendaraan Operasional').length} Unit Mobil Dinas Aktif
          </span>
        </div>

        <div
          onClick={() => setActiveTab('bus')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>KENDARAAN BUS SEKOLAH</span>
            <Bus className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {busOrders.length} <span className="text-xs font-normal text-slate-500">Order Bus</span>
          </p>
          <span className="text-[11px] text-slate-500 block mt-1">
            Total {totalBusPassengers} Siswa/Pendamping Terdaftar
          </span>
        </div>

        <div
          onClick={() => setActiveTab('fleet')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-teal-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>KETERSEDIAAN ARMADA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {availableFleetCount}/{fleet.length} <span className="text-xs font-normal text-slate-500">Siap Jalan</span>
          </p>
          <span className="text-[11px] text-teal-700 font-semibold block mt-1">
            Lihat Katalog &amp; Nopol Armada →
          </span>
        </div>
      </div>

      {/* Category & Fleet Navigation Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Semua Order ({vehicleRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operasional')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'operasional'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Kendaraan Operasional ({operationalOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bus')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bus'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Kendaraan Bus ({busOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fleet'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Daftar Armada &amp; Bus ({fleet.length} Unit)</span>
          </button>
        </div>

        {activeTab === 'fleet' && canManageOrDelete && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddFleetModal('Milik Sekolah', 'Kendaraan Operasional')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Armada Milik Sekolah</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddFleetModal('Sewa / Vendor', 'Kendaraan Bus')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Armada Sewa &amp; Harga Sewa</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB CONTENT: FLEET CATALOG OR ORDER TABLE */}
      {activeTab === 'fleet' ? (
        <div className="space-y-6">
          {/* Section 1: Armada Milik Sekolah (Kendaraan Operasional & Bus Sekolah) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    1. Armada Milik Sekolah ({fleet.filter(f => (f.ownershipType || 'Milik Sekolah') === 'Milik Sekolah').length} Unit Inventaris)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kendaraan operasional dan bus milik Yayasan Lazuardi yang siap ditugaskan untuk kegiatan sekolah
                  </p>
                </div>
              </div>
              {canManageOrDelete && (
                <button
                  type="button"
                  onClick={() => handleOpenAddFleetModal('Milik Sekolah', 'Kendaraan Operasional')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer self-start sm:self-auto"
                >
                  + Tambah Armada Sekolah
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fleet.filter(f => (f.ownershipType || 'Milik Sekolah') === 'Milik Sekolah').map(item => (
                <div key={item.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-400 transition-all bg-slate-50/40">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{item.code} • {item.category === 'Kendaraan Bus' ? 'BUS' : 'OPS'}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        item.status === 'Tersedia'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'Sedang Bertugas'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{item.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                          {item.plateNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Milik Sekolah
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200/70">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Kapasitas:</span>
                        <strong className="text-slate-800">{item.capacity} Kursi</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Driver Utama:</span>
                        <strong className="text-slate-800">{item.driverName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tarif / Biaya:</span>
                        <strong className="text-emerald-700">
                          {item.rentalPrice && item.rentalPrice > 0
                            ? `Rp ${item.rentalPrice.toLocaleString('id-ID')}`
                            : 'Inventaris Sekolah (Rp 0)'}
                        </strong>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic">{item.notes}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenOrderModal(item.category)}
                      className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                    >
                      + Buat Order
                    </button>
                    {canManageOrDelete && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditFleetModal(item)}
                          title="Edit Data Armada Sekolah"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFleetStatus(item.id)}
                          title="Ubah Status Ketersediaan Armada"
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Armada Bus & Kendaraan Siap Disewa (Dengan Harga Sewa) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    2. Armada Bus &amp; Kendaraan Siap Disewa ({fleet.filter(f => f.ownershipType === 'Sewa / Vendor').length} Unit Siap Sewa)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar armada bus pariwisata &amp; kendaraan rekanan yang siap disewa lengkap dengan harga sewa setiap unitnya
                  </p>
                </div>
              </div>
              {canManageOrDelete && (
                <button
                  type="button"
                  onClick={() => handleOpenAddFleetModal('Sewa / Vendor', 'Kendaraan Bus')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer self-start sm:self-auto"
                >
                  + Tambah Armada Sewa &amp; Harga
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fleet.filter(f => f.ownershipType === 'Sewa / Vendor').map(item => (
                <div key={item.id} className="border border-amber-200 rounded-xl p-4 flex flex-col justify-between hover:border-amber-400 transition-all bg-amber-50/25">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-amber-900">{item.code}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        item.status === 'Tersedia'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'Sedang Bertugas'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{item.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                          {item.plateNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Siap Disewa
                        </span>
                      </div>
                    </div>

                    {/* Highlight Harga Sewa */}
                    <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Harga Sewa Setiap Bus / Kendaraan:
                      </span>
                      <span className="font-mono text-sm font-black text-emerald-700 block mt-0.5">
                        Rp {(item.rentalPrice || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {item.rentalPeriod || 'Per Hari (Full Day)'} • {item.vendorName || 'Vendor Rekanan'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200/70">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Kapasitas Kursi:</span>
                        <strong className="text-amber-900 font-bold">{item.capacity} Kursi (Seat)</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Driver:</span>
                        <strong className="text-slate-800">{item.driverName}</strong>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic">{item.notes}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenOrderModal(item.category)}
                      className="flex-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                    >
                      + Buat Order
                    </button>
                    {canManageOrDelete && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditFleetModal(item)}
                          title="Edit Armada & Harga Sewa"
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFleetStatus(item.id)}
                          title="Ubah Status Ketersediaan"
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no. tiket, pemohon, mobil/bus, nopol, tujuan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
              >
                <option value="all">Semua Unit Sekolah</option>
                {units.map(u => (
                  <option key={u.id} value={u.code}>{u.code} - {u.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium"
              >
                <option value="all">Semua Status Order</option>
                <option value="Diajukan">Diajukan (Baru)</option>
                <option value="Disetujui">Disetujui / Terjadwal</option>
                <option value="Sedang Disiapkan">Armada Disiapkan</option>
                <option value="Siap Diambil">Standby / Dalam Perjalanan</option>
                <option value="Selesai">Selesai Kembali</option>
                <option value="Ditolak">Ditolak / Batal</option>
              </select>
            </div>
          </div>

          {/* Vehicle Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Order Pemesanan Kendaraan &amp; Bus ({filteredRequests.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Klik <strong>Lacak</strong> untuk memantau kesiapan armada &amp; pengemudi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">No. Tiket</th>
                    <th className="p-3.5">Pemohon &amp; Unit</th>
                    <th className="p-3.5">Kategori &amp; Armada</th>
                    <th className="p-3.5">Tujuan &amp; Keperluan</th>
                    <th className="p-3.5">Jadwal Keberangkatan</th>
                    <th className="p-3.5 text-center">Penumpang</th>
                    <th className="p-3.5">Pengemudi</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Belum ada data pemesanan kendaraan yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const vd = req.vehicleDetail;
                      const isBus = vd?.vehicleCategory === 'Kendaraan Bus';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-blue-950 whitespace-nowrap">
                            {req.requestNumber}
                            <span className="block text-[10px] font-sans font-normal text-slate-400">
                              {new Date(req.requestDate).toLocaleDateString('id-ID')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{req.userName}</div>
                            {(() => {
                              const canonical = resolveCanonicalUnit(req.unit, units);
                              return (
                                <div className="text-[11px] text-slate-500">
                                  <span className="font-semibold text-blue-700">{canonical.code}</span> • {canonical.name}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              {isBus ? (
                                <Bus className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <Car className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                              <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isBus ? 'text-amber-700' : 'text-blue-700'}`}>
                                  {vd?.vehicleCategory || 'Kendaraan Operasional'}
                                </span>
                                {(!vd?.vehicleName || vd.vehicleName === 'Menunggu Penentuan Admin') ? (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                                    Menunggu Konfirmasi Admin ({vd?.vehicleCount || 1} Unit)
                                  </span>
                                ) : (
                                  <>
                                    <strong className="text-slate-900 block">{vd.vehicleName}</strong>
                                    <span className="font-mono text-[10px] text-slate-500 block">
                                      Nopol: {vd.plateNumber || '-'} ({vd?.vehicleCount || 1} Unit)
                                    </span>
                                    {vd.rentalPrice && vd.rentalPrice > 0 ? (
                                      <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                                        Sewa: Rp {vd.rentalPrice.toLocaleString('id-ID')}/unit
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <span className="font-bold text-slate-900 block truncate" title={vd?.destination || req.purpose}>
                              {vd?.destination || req.purpose}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {vd?.tripPurposeType || 'Perjalanan Dinas'} • Titik: {vd?.pickupPoint || 'Lobby'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {vd?.departureTime ? (
                              <div className="space-y-0.5 text-[11px]">
                                <div className="font-bold text-slate-800">
                                  Berangkat: {new Date(vd.departureTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                                {vd.returnTime && (
                                  <div className="text-slate-500">
                                    Kembali: {new Date(vd.returnTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {vd?.passengerCount || 1} Orang
                            </span>
                          </td>
                          <td className="p-3.5">
                            {(!vd?.driverName || vd.driverName === 'Menunggu Konfirmasi Admin') ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                                Menunggu Konfirmasi Admin
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold text-slate-800 block">
                                  {vd.driverName}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {vd?.driverOption || 'Dengan Sopir'}
                                </span>
                              </>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <StatusBadge status={req.status} />
                              <div>
                                <UrgencyBadge urgency={req.urgency} />
                              </div>
                              {(vd?.vehicleCategory === 'Kendaraan Bus' || vd?.ownershipType === 'Sewa / Vendor' || (vd?.rentalPrice && vd.rentalPrice > 0)) && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    vd?.rentalChecklist?.keepOrder
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}>
                                    {vd?.rentalChecklist?.keepOrder ? '✓ ' : ''}Keep Order
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    vd?.rentalChecklist?.dpSewa
                                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}>
                                    {vd?.rentalChecklist?.dpSewa ? '✓ ' : ''}DP Sewa
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    vd?.rentalChecklist?.lunas
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}>
                                    {vd?.rentalChecklist?.lunas ? '✓ ' : ''}Lunas
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setTrackingRequest(req);
                                setIsTrackingModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Lacak Status Kendaraan"
                            >
                              <Compass className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Lacak</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenReceipt(req)}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                            >
                              Surat Jalan / Slip
                            </button>

                            {req.status === 'Selesai' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEmailModalRequest(req);
                                  setIsEmailModalOpen(true);
                                }}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 border ${
                                  req.emailSentToHead
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-teal-700 hover:bg-teal-800 text-white border-teal-700'
                                }`}
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email</span>
                              </button>
                            )}

                            {canManageOrDelete && req.status !== 'Selesai' && req.status !== 'Ditolak' && (
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(req)}
                                className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
                                title="Konfirmasi Jenis Kendaraan, Driver & Status Order"
                              >
                                {(!vd?.vehicleName || vd.vehicleName === 'Menunggu Penentuan Admin') ? 'Konfirmasi Order' : 'Proses'}
                              </button>
                            )}

                            {canManageOrDelete && (
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteConfirm(req)}
                                className="px-2 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Hapus Order Kendaraan"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* MODAL FORM PEMESANAN KENDARAAN OPERASIONAL & BUS SEKOLAH */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Formulir Order ${vehicleCategory}`}
        subtitle="Pemesanan kendaraan dinas operasional & armada bus sekolah Lazuardi GCS"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
          {/* Switcher Kategori Kendaraan */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleCategorySwitchInForm('Kendaraan Operasional')}
              className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                vehicleCategory === 'Kendaraan Operasional'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Kendaraan Operasional (Mobil / MPV / Van)</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitchInForm('Kendaraan Bus')}
              className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                vehicleCategory === 'Kendaraan Bus'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Kendaraan Bus Sekolah (Medium / Big Bus)</span>
            </button>
          </div>

          {/* 1. Data Pemohon & Unit */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nama Pemohon / Penanggung Jawab <span className="text-rose-500">*</span></span>
                </label>
                <UserSearchSelect
                  users={users}
                  selectedUserId={selectedUserId}
                  onSelect={handleUserChange}
                  placeholder="Ketik atau pilih nama guru / staf pemohon..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unit Sekolah / Bagian <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-blue-600"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.code}>{u.name} ({u.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/90 rounded-lg border border-blue-200 flex items-start gap-2.5 text-[11px] text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-blue-900">
                  Koordinasi Otomatis Kepala Unit &amp; Bagian Transportasi (GA / RR)
                </span>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Permintaan kendaraan ini akan diteruskan ke Koordinator Armada serta mengirimkan pemberitahuan ke{' '}
                  <strong>Kepala Unit {activeUnitInfo?.name || selectedUnit} ({activeUnitInfo?.headName || 'Pimpinan Unit'})</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Kebutuhan Jumlah Kendaraan & Penumpang */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Unit {vehicleCategory} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={vehicleCount}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/^0+/, '');
                    setVehicleCount(cleaned === '' ? '' : parseInt(cleaned, 10));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Penumpang (Orang) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={passengerCount}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/^0+/, '');
                    setPassengerCount(cleaned === '' ? '' : parseInt(cleaned, 10));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-950">
              <Car className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900">
                  Penentuan Jenis Kendaraan &amp; Driver Diisi oleh Admin / Staff
                </span>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Pemohon cukup mengisi jumlah unit &amp; penumpang. <strong>Jenis/Tipe Kendaraan, Nomor Polisi, dan Nama Driver</strong> akan ditentukan serta diisi oleh <strong>Admin / Staff Koordinator</strong> saat mengkonfirmasi order yang masuk.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Tujuan, Keperluan & Jadwal Keberangkatan */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Keperluan Perjalanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tripPurposeType}
                onChange={(e) => setTripPurposeType(e.target.value)}
                placeholder="Pilih atau ketik keperluan perjalanan..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 mb-1.5"
              />
              <div className="flex flex-wrap gap-1.5">
                {(vehicleCategory === 'Kendaraan Operasional' ? operationalPurposes : busPurposes).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setTripPurposeType(p)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      tripPurposeType === p
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Lokasi Tujuan / Destinasi <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Contoh: Dinas Pendidikan Depok / Museum IPTEK TMII..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Titik Penjemputan / Keberangkatan
                </label>
                <input
                  type="text"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  placeholder="Lobby Utama Kampus Lazuardi GCS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Waktu Berangkat <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Estimasi Waktu Kembali <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. WhatsApp / HP PIC
                </label>
                <input
                  type="text"
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan BBM &amp; E-Toll
                </label>
                <select
                  value={fuelTollNote}
                  onChange={(e) => setFuelTollNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="Termasuk E-Toll & BBM Operasional">Termasuk E-Toll &amp; BBM Operasional</option>
                  <option value="Termasuk E-Toll, BBM & Parkir Bus Pariwisata">Termasuk E-Toll, BBM &amp; Parkir Bus</option>
                  <option value="BBM Sekolah (Tol & Parkir Mandiri Unit)">BBM Sekolah (Tol &amp; Parkir Unit)</option>
                  <option value="Reimburse Mandiri Panitia Kegiatan">Reimburse Mandiri Panitia Kegiatan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat Urgensi
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="Biasa">Biasa (Terjadwal)</option>
                  <option value="Penting">Penting (Prioritas)</option>
                  <option value="Mendesak">Mendesak (Segera)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Catatan Rute / Titik Singgah / Kebutuhan Tambahan
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Mohon bus standby pukul 06:30 WIB di parkir SD, membawa perlengkapan P3K..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 ${
                vehicleCategory === 'Kendaraan Bus'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ajukan Order {vehicleCategory}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL TAMBAH / EDIT ARMADA (ADMIN / SUPER ADMIN) */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddFleetModalOpen}
        onClose={() => {
          setIsAddFleetModalOpen(false);
          setEditingFleetItem(null);
        }}
        title={editingFleetItem ? `Edit Armada: ${editingFleetItem.name}` : 'Tambah Unit Armada Sekolah / Sewa'}
        subtitle="Kelola inventaris kendaraan milik sekolah maupun armada bus/kendaraan yang siap disewa beserta harga sewanya"
        maxWidth="md"
      >
        <form onSubmit={handleAddFleetSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kepemilikan Armada</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setNewFleetForm({
                  ...newFleetForm,
                  ownershipType: 'Milik Sekolah',
                  vendorName: 'Inventaris Yayasan Lazuardi',
                  rentalPrice: 0,
                  rentalPeriod: 'Inventaris Sekolah'
                })}
                className={`py-2 px-2.5 rounded-md font-bold text-xs cursor-pointer ${
                  newFleetForm.ownershipType === 'Milik Sekolah'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600'
                }`}
              >
                Armada Milik Sekolah
              </button>
              <button
                type="button"
                onClick={() => setNewFleetForm({
                  ...newFleetForm,
                  ownershipType: 'Sewa / Vendor',
                  vendorName: newFleetForm.vendorName === 'Inventaris Yayasan Lazuardi' ? 'PO Mitra Pariwisata Lazuardi' : newFleetForm.vendorName,
                  rentalPrice: Number(newFleetForm.rentalPrice) > 0 ? newFleetForm.rentalPrice : (newFleetForm.category === 'Kendaraan Bus' ? 2500000 : 850000),
                  rentalPeriod: 'Per Hari (Full Day)'
                })}
                className={`py-2 px-2.5 rounded-md font-bold text-xs cursor-pointer ${
                  newFleetForm.ownershipType === 'Sewa / Vendor'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600'
                }`}
              >
                Armada Siap Disewa
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Armada</label>
              <select
                value={newFleetForm.category}
                onChange={(e) => setNewFleetForm({ ...newFleetForm, category: e.target.value as VehicleCategory })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                <option value="Kendaraan Bus">Kendaraan Bus</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode Armada</label>
              <input
                type="text"
                required
                value={newFleetForm.code}
                onChange={(e) => setNewFleetForm({ ...newFleetForm, code: e.target.value.toUpperCase() })}
                placeholder="OPS-05 / SEWA-BUS-01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama / Tipe Kendaraan atau Bus</label>
            <input
              type="text"
              required
              value={newFleetForm.name}
              onChange={(e) => setNewFleetForm({ ...newFleetForm, name: e.target.value })}
              placeholder="Contoh: Big Bus Pariwisata 50 Seat / Kijang Innova Zenix"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Harga Sewa per Unit (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={newFleetForm.rentalPrice}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/^0+/, '');
                  setNewFleetForm({ ...newFleetForm, rentalPrice: cleaned === '' ? '' : parseInt(cleaned, 10) });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Satuan Sewa / Penyedia</label>
              <select
                value={newFleetForm.rentalPeriod}
                onChange={(e) => setNewFleetForm({ ...newFleetForm, rentalPeriod: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Per Hari (Full Day)">Per Hari (Full Day)</option>
                <option value="Per Hari (12 Jam)">Per Hari (12 Jam)</option>
                <option value="Per Trip / PP">Per Trip / PP</option>
                <option value="Inventaris Sekolah">Inventaris Sekolah</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Polisi (Plat)</label>
              <input
                type="text"
                required
                value={newFleetForm.plateNumber}
                onChange={(e) => setNewFleetForm({ ...newFleetForm, plateNumber: e.target.value })}
                placeholder="B 1234 LZR"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kapasitas Penumpang</label>
              <input
                type="number"
                placeholder="0"
                value={newFleetForm.capacity}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/^0+/, '');
                  setNewFleetForm({ ...newFleetForm, capacity: cleaned === '' ? '' : parseInt(cleaned, 10) });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Driver Utama</label>
              <input
                type="text"
                value={newFleetForm.driverName}
                onChange={(e) => setNewFleetForm({ ...newFleetForm, driverName: e.target.value })}
                placeholder="Pak ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. HP Driver</label>
              <input
                type="text"
                value={newFleetForm.driverPhone}
                onChange={(e) => setNewFleetForm({ ...newFleetForm, driverPhone: e.target.value })}
                placeholder="0812-..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsAddFleetModalOpen(false);
                setEditingFleetItem(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              {editingFleetItem ? 'Simpan Perubahan' : 'Simpan Armada'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL KONFIRMASI & PROSES ORDER KENDARAAN (ADMIN / STAFF KOORDINATOR) */}
      {/* ===================================================================== */}
      {selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Konfirmasi & Proses Order: ${selectedRequest.requestNumber}`}
          subtitle={`${selectedRequest.vehicleDetail?.vehicleCategory || 'Kendaraan'} • Pemohon: ${selectedRequest.userName} (${selectedRequest.unit})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Ringkasan Permintaan Pemohon */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950">
                  Permintaan: {selectedRequest.vehicleDetail?.vehicleCategory || 'Kendaraan Operasional'} ({selectedRequest.vehicleDetail?.vehicleCount || 1} Unit • {selectedRequest.vehicleDetail?.passengerCount || 1} Penumpang)
                </span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <p className="text-slate-700">
                Tujuan: <strong>{selectedRequest.vehicleDetail?.destination || selectedRequest.purpose}</strong> • Titik Jemput: <strong>{selectedRequest.vehicleDetail?.pickupPoint || 'Lobby'}</strong>
              </p>
              {selectedRequest.vehicleDetail?.departureTime && (
                <p className="text-slate-600">
                  Jadwal Keberangkatan: <strong>{new Date(selectedRequest.vehicleDetail.departureTime).toLocaleString('id-ID')}</strong>
                  {selectedRequest.vehicleDetail?.returnTime && (
                    <> s/d <strong>{new Date(selectedRequest.vehicleDetail.returnTime).toLocaleString('id-ID')}</strong></>
                  )}
                </p>
              )}
            </div>

            {/* MENU ADMIN / STAFF: PENENTUAN JENIS KENDARAAN & DRIVER */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-700" />
                  <h4 className="font-extrabold text-blue-950 text-xs uppercase tracking-wide">
                    Penentuan Jenis Kendaraan &amp; Driver (Diisi Admin / Staff)
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                  Menu Konfirmasi Admin
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih dari Katalog Armada Sekolah atau Armada Sewa (Otomatis Isi Kendaraan, Driver &amp; Harga Sewa)
                </label>
                <select
                  value={assignFleetId}
                  onChange={(e) => handleAdminSelectFleetUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white font-bold text-slate-900 outline-blue-600"
                >
                  <option value="">-- Pilih Unit Armada Sekolah / Bus Siap Sewa --</option>
                  {fleet
                    .filter(f => !selectedRequest.vehicleDetail?.vehicleCategory || f.category === selectedRequest.vehicleDetail.vehicleCategory)
                    .map(f => (
                      <option key={f.id} value={f.id}>
                        [{f.ownershipType === 'Sewa / Vendor' ? `SEWA - Rp ${(f.rentalPrice || 0).toLocaleString('id-ID')}` : 'MILIK SEKOLAH'}] {f.name} ({f.plateNumber}) — {f.capacity} Seat • Driver: {f.driverName} [{f.status}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Harga Sewa per Unit (Rp) <span className="text-slate-400 font-normal">(0 jika Milik Sekolah)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={assignRentalPrice}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/^0+/, '');
                      const parsed = cleaned === '' ? '' : parseInt(cleaned, 10);
                      setAssignRentalPrice(parsed);
                      if (Number(parsed) > 0 && assignOwnershipType === 'Milik Sekolah') {
                        setAssignOwnershipType('Sewa / Vendor');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Kepemilikan / Penyedia
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={assignOwnershipType}
                      onChange={(e) => {
                        const val = e.target.value as VehicleOwnershipType;
                        setAssignOwnershipType(val);
                        if (val === 'Milik Sekolah') {
                          setAssignRentalPrice(0);
                          setAssignVendorName('Inventaris Yayasan Lazuardi');
                        } else if (assignVendorName === 'Inventaris Yayasan Lazuardi') {
                          setAssignVendorName('PO Mitra Pariwisata Lazuardi');
                        }
                      }}
                      className="px-2 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                    >
                      <option value="Milik Sekolah">Milik Sekolah</option>
                      <option value="Sewa / Vendor">Sewa / Vendor</option>
                    </select>
                    <input
                      type="text"
                      value={assignVendorName}
                      onChange={(e) => setAssignVendorName(e.target.value)}
                      placeholder="Nama PO / Penyedia..."
                      className="px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis / Nama Kendaraan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assignVehicleName}
                    onChange={(e) => setAssignVehicleName(e.target.value)}
                    placeholder="Contoh: Toyota Kijang Innova Zenix / Bus Medium..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Polisi (Plat Kendaraan) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assignPlateNumber}
                    onChange={(e) => setAssignPlateNumber(e.target.value.toUpperCase())}
                    placeholder="Contoh: B 1428 LZR"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Layanan Pengemudi / Sopir <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignDriverOption}
                    onChange={(e) => setAssignDriverOption(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Dengan Sopir (Driver Sekolah)">Dengan Sopir (Driver Sekolah)</option>
                    <option value="Lepas Kunci (Mengemudi Sendiri)">Lepas Kunci (Mengemudi Sendiri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Driver / Pengemudi yang Ditugaskan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assignDriverName}
                    onChange={(e) => setAssignDriverName(e.target.value)}
                    placeholder="Ketik nama driver sekolah yang bertugas..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Penanggung Jawab / Pengguna Kendaraan:
                </label>
                <input
                  type="text"
                  value={actionPickedUpBy}
                  onChange={(e) => setActionPickedUpBy(e.target.value)}
                  placeholder="Nama guru/staf pengguna kendaraan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Koordinator Armada / KM Awal-Akhir:
                </label>
                <input
                  type="text"
                  value={actionAdminNotes}
                  onChange={(e) => setActionAdminNotes(e.target.value)}
                  placeholder="Contoh: Kunci & E-Toll diserahkan, Driver standby..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {isRejecting && (
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-2">
                <label className="block font-bold text-rose-900">
                  Alasan Penolakan / Pembatalan Jadwal <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="Contoh: Armada sedang digunakan kegiatan ujian / servis berkala..."
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'Ditolak', {
                        rejectionReason: rejectionReasonText.trim() || 'Jadwal armada berbenturan',
                        adminNotes: actionAdminNotes.trim() || undefined
                      });
                      setIsActionModalOpen(false);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Konfirmasi Tolak
                  </button>
                </div>
              </div>
            )}

            {!isRejecting && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* KHUSUS UNTUK KENDARAAN BUS ATAU KENDARAAN YANG DISEWA: CEKLIST "SIAPKAN ARMADA DAN DRIVER" */}
                {(selectedRequest.vehicleDetail?.vehicleCategory === 'Kendaraan Bus' ||
                  assignOwnershipType === 'Sewa / Vendor' ||
                  Number(assignRentalPrice) > 0) && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <span className="font-extrabold text-amber-950 text-xs block">
                            Ceklist "Siapkan Armada dan Driver" (Khusus Bus / Kendaraan Sewa)
                          </span>
                          <span className="text-[10px] text-amber-800 block">
                            Centang tahapan konfirmasi proses pemesanan &amp; pembayaran sewa armada:
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        checkLunas
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : checkDpSewa
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : checkKeepOrder
                          ? 'bg-amber-200/80 text-amber-950 border-amber-400'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}>
                        {checkLunas
                          ? '✓ LUNAS'
                          : checkDpSewa
                          ? '✓ DP SEWA'
                          : checkKeepOrder
                          ? '✓ KEEP ORDER'
                          : 'Belum Keep Order'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Ceklist 1: Keep Order */}
                      <button
                        type="button"
                        onClick={() => setCheckKeepOrder(!checkKeepOrder)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          checkKeepOrder
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white hover:bg-amber-100/50 text-slate-800 border-amber-200'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          checkKeepOrder
                            ? 'bg-white text-amber-700 border-white'
                            : 'bg-slate-50 border-slate-300 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block">Keep Order</span>
                          <span className={`text-[10px] block leading-tight mt-0.5 ${
                            checkKeepOrder ? 'text-amber-100' : 'text-slate-500'
                          }`}>
                            Booking &amp; kunci jadwal armada/bus
                          </span>
                        </div>
                      </button>

                      {/* Ceklist 2: DP Sewa */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !checkDpSewa;
                          setCheckDpSewa(next);
                          if (next && !checkKeepOrder) setCheckKeepOrder(true);
                        }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          checkDpSewa
                            ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                            : 'bg-white hover:bg-blue-50 text-slate-800 border-amber-200'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          checkDpSewa
                            ? 'bg-white text-blue-700 border-white'
                            : 'bg-slate-50 border-slate-300 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block">DP Sewa</span>
                          <span className={`text-[10px] block leading-tight mt-0.5 ${
                            checkDpSewa ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            Down Payment / uang muka sewa
                          </span>
                        </div>
                      </button>

                      {/* Ceklist 3: Lunas */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !checkLunas;
                          setCheckLunas(next);
                          if (next) {
                            if (!checkKeepOrder) setCheckKeepOrder(true);
                            if (!checkDpSewa) setCheckDpSewa(true);
                          }
                        }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          checkLunas
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 text-slate-800 border-amber-200'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          checkLunas
                            ? 'bg-white text-emerald-700 border-white'
                            : 'bg-slate-50 border-slate-300 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block">Lunas</span>
                          <span className={`text-[10px] block leading-tight mt-0.5 ${
                            checkLunas ? 'text-emerald-100' : 'text-slate-500'
                          }`}>
                            Pelunasan penuh sewa armada
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <span className="block font-bold text-slate-500 uppercase text-[10px]">
                  Konfirmasi Penugasan Kendaraan, Driver &amp; Status Keberangkatan:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedVd = buildAssignedVehicleDetail(selectedRequest, false);
                      const checklistSummary = [
                        checkKeepOrder ? 'Keep Order' : null,
                        checkDpSewa ? 'DP Sewa' : null,
                        checkLunas ? 'Lunas' : null
                      ].filter(Boolean).join(' • ');
                      updateRequestStatus(selectedRequest.id, 'Disetujui', {
                        vehicleDetail: updatedVd,
                        adminNotes:
                          actionAdminNotes.trim() ||
                          `Order dikonfirmasi: ${updatedVd?.vehicleName || 'Armada'} (${updatedVd?.plateNumber || '-'}) • Driver: ${updatedVd?.driverName || '-'}${checklistSummary ? ` [${checklistSummary}]` : ''}`
                      });
                      setIsActionModalOpen(false);
                    }}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer shadow-2xs"
                  >
                    1. Konfirmasi &amp; Setujui (Simpan Kendaraan &amp; Driver)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updatedVd = buildAssignedVehicleDetail(selectedRequest, true);
                      const checklistSummary = [
                        checkKeepOrder ? 'Keep Order' : null,
                        checkDpSewa ? 'DP Sewa' : null,
                        checkLunas ? 'Lunas' : null
                      ].filter(Boolean).join(' • ');
                      updateRequestStatus(selectedRequest.id, 'Sedang Disiapkan', {
                        vehicleDetail: updatedVd,
                        adminNotes:
                          actionAdminNotes.trim() ||
                          `Siapkan Armada & Driver${checklistSummary ? ` [${checklistSummary}]` : ''}: ${updatedVd?.vehicleName || ''} (${updatedVd?.plateNumber || '-'}) & Driver ${updatedVd?.driverName || ''}`
                      });
                      setIsActionModalOpen(false);
                    }}
                    className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold cursor-pointer"
                  >
                    <span className="block">2. Siapkan Armada &amp; Driver</span>
                    {(selectedRequest.vehicleDetail?.vehicleCategory === 'Kendaraan Bus' ||
                      assignOwnershipType === 'Sewa / Vendor' ||
                      Number(assignRentalPrice) > 0) && (
                      <span className="block text-[10px] font-semibold text-amber-700 mt-0.5">
                        {[
                          checkKeepOrder ? '✓ Keep Order' : null,
                          checkDpSewa ? '✓ DP Sewa' : null,
                          checkLunas ? '✓ Lunas' : null
                        ].filter(Boolean).join(' • ') || 'Simpan Ceklist Keep Order / DP Sewa / Lunas'}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updatedVd = buildAssignedVehicleDetail(selectedRequest, true);
                      updateRequestStatus(selectedRequest.id, 'Siap Diambil', {
                        vehicleDetail: updatedVd,
                        adminNotes:
                          actionAdminNotes.trim() ||
                          `Armada ${updatedVd?.vehicleName || ''} (${updatedVd?.plateNumber || '-'}) bersama Driver ${updatedVd?.driverName || ''} standby di titik jemput`
                      });
                      setIsActionModalOpen(false);
                    }}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    3. Armada Standby / Jalan
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updatedVd = buildAssignedVehicleDetail(selectedRequest, true);
                      updateRequestStatus(selectedRequest.id, 'Selesai', {
                        vehicleDetail: updatedVd,
                        pickedUpBy: actionPickedUpBy || selectedRequest.userName,
                        adminNotes:
                          actionAdminNotes.trim() ||
                          `Perjalanan selesai (${updatedVd?.vehicleName || ''} - Driver: ${updatedVd?.driverName || ''}), kembali ke kampus dalam kondisi baik`
                      });
                      setIsActionModalOpen(false);
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>4. Selesai Perjalanan</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer mt-2"
                >
                  <X className="w-4 h-4" />
                  <span>Tolak / Batalkan Jadwal Kendaraan</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ORDER PICKER MODAL FOR QUICK TRACKING */}
      <Modal
        isOpen={isOrderPickerOpen}
        onClose={() => setIsOrderPickerOpen(false)}
        title="Pilih Order Kendaraan untuk Dilacak"
        subtitle="Klik salah satu tiket pemesanan kendaraan untuk melihat tahapan kesiapan armada"
        maxWidth="lg"
      >
        <div className="space-y-2.5 text-xs max-h-96 overflow-y-auto">
          {vehicleRequests.length === 0 ? (
            <p className="text-center py-8 text-slate-400">Belum ada order kendaraan yang terdaftar.</p>
          ) : (
            vehicleRequests.map(req => (
              <div
                key={req.id}
                onClick={() => {
                  setTrackingRequest(req);
                  setIsOrderPickerOpen(false);
                  setIsTrackingModalOpen(true);
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-900">{req.requestNumber}</span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <p className="font-bold text-slate-800 mt-1">
                    {req.vehicleDetail?.vehicleCategory}: {req.vehicleDetail?.vehicleName} ({req.vehicleDetail?.plateNumber})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pemohon: {req.userName} ({req.unit}) • Tujuan: {req.vehicleDetail?.destination || req.purpose}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg">
                  Lacak →
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      {requestToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
          }}
          title="Konfirmasi Hapus Order Kendaraan"
          subtitle={`No. Tiket: ${requestToDelete.requestNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-950 text-sm">Hapus Data Pemesanan Kendaraan?</h4>
                <p className="text-rose-700 mt-1 leading-relaxed">
                  Data pemesanan <strong>{requestToDelete.requestNumber}</strong> ({requestToDelete.vehicleDetail?.vehicleName}) oleh{' '}
                  <strong>{requestToDelete.userName}</strong> akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* LIVE ORDER TRACKING MODAL */}
      <TrackOrderModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        request={trackingRequest}
        onOpenReceipt={onOpenReceipt}
      />

      {/* EMAIL REPORT MODAL */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        request={emailModalRequest}
      />
    </div>
  );
};
