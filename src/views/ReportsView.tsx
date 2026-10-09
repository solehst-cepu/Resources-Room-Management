import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Printer, 
  Calendar, 
  Building2, 
  Droplet, 
  FileSpreadsheet,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  FileText,
  FileType,
  Trash2,
  AlertTriangle,
  Car,
  Bus,
  Wallet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ServiceRequest } from '../types';
import { resolveCanonicalUnit, isSameUnit } from '../utils/unitUtils';

interface ReportsViewProps {
  initialServiceFilter?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialServiceFilter }) => {
  const { requests, units, currentUser, deleteRequest, vehicleFleet } = useApp();

  // Helper date generators
  const todayStr = new Date().toISOString().slice(0, 10);

  // Active View Tab
  const [activeReportTab, setActiveReportTab] = useState<'unit' | 'sewa_bus' | 'layanan' | 'transaksi'>('unit');

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>(initialServiceFilter || 'all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete transaction confirmation state
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canManageOrDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr';

  const handleOpenDeleteConfirm = (req: ServiceRequest) => {
    setRequestToDelete(req);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (!requestToDelete) return;
    deleteRequest(requestToDelete.id);
    setIsDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  // Date Range State (Default 'semua' so all unit & bus rental records are immediately visible)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('semua');

  // Apply Quick Date Presets
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'hari_ini') {
      const today = now.toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7_hari') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDate(past7.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'bulan_ini') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'bulan_lalu') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(firstDayLastMonth);
      setEndDate(lastDayLastMonth);
    } else if (preset === 'triwulan') {
      const past90 = new Date();
      past90.setDate(now.getDate() - 90);
      setStartDate(past90.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'tahun_ini') {
      const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      setStartDate(firstDayYear);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'semua') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter requests based on full criteria
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Date filter
      const reqDate = (r.requestDate || '').slice(0, 10);
      if (startDate && reqDate < startDate) return false;
      if (endDate && reqDate > endDate) return false;

      // Service filter
      if (serviceFilter !== 'all' && r.serviceType !== serviceFilter) return false;

      // Unit filter (Matches canonical unit accurately)
      if (unitFilter !== 'all' && !isSameUnit(r.unit, unitFilter, units)) return false;

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Search Query (Supports searching by unit code or full unit name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = r.requestNumber?.toLowerCase().includes(q);
        const matchUser = r.userName?.toLowerCase().includes(q);
        const canonical = resolveCanonicalUnit(r.unit, units);
        const matchUnit = r.unit?.toLowerCase().includes(q) ||
                          canonical.code.toLowerCase().includes(q) ||
                          canonical.name.toLowerCase().includes(q);
        const matchPurpose = r.purpose?.toLowerCase().includes(q);
        const matchRoom = r.waterDetail?.roomName?.toLowerCase().includes(q);
        if (!matchNum && !matchUser && !matchUnit && !matchPurpose && !matchRoom) {
          return false;
        }
      }

      return true;
    });
  }, [requests, startDate, endDate, serviceFilter, unitFilter, statusFilter, searchQuery, units]);

  // Helper to check if a vehicle request uses a rented bus/vehicle
  const isRentedVehicleRequest = (r: ServiceRequest): boolean => {
    if (r.serviceType !== 'kendaraan' || !r.vehicleDetail || r.status === 'Ditolak') return false;
    const vd = r.vehicleDetail;
    if (vd.ownershipType === 'Sewa / Vendor') return true;
    if ((vd.totalRentalCost || 0) > 0 || (vd.rentalPrice || 0) > 0) return true;
    if (vd.vehicleId) {
      const fleetItem = vehicleFleet.find(f => f.id === vd.vehicleId);
      if (fleetItem?.ownershipType === 'Sewa / Vendor') return true;
    }
    return false;
  };

  // Helper to calculate total rental cost of a vehicle request
  const getRequestRentalCost = (r: ServiceRequest): number => {
    if (r.serviceType !== 'kendaraan' || !r.vehicleDetail || r.status === 'Ditolak') return 0;
    const vd = r.vehicleDetail;
    const unitCount = Math.max(1, vd.vehicleCount || 1);
    if (typeof vd.totalRentalCost === 'number' && vd.totalRentalCost > 0) {
      return vd.totalRentalCost;
    }
    if (typeof vd.rentalPrice === 'number' && vd.rentalPrice > 0) {
      return vd.rentalPrice * unitCount;
    }
    if (vd.vehicleId) {
      const fleetItem = vehicleFleet.find(f => f.id === vd.vehicleId);
      if (fleetItem && fleetItem.ownershipType === 'Sewa / Vendor' && (fleetItem.rentalPrice || 0) > 0) {
        return (fleetItem.rentalPrice || 0) * unitCount;
      }
    }
    return 0;
  };

  // Helper to calculate paid amount (Lunas / DP Sewa) of a rented vehicle request
  const getRequestPaidAmount = (r: ServiceRequest): number => {
    const totalCost = getRequestRentalCost(r);
    if (totalCost <= 0 || !r.vehicleDetail) return 0;
    const vd = r.vehicleDetail;
    if (vd.rentalPaymentStatus === 'Lunas' || vd.rentalChecklist?.lunas) {
      return totalCost;
    }
    if (vd.rentalPaymentStatus === 'DP Sewa' || vd.rentalChecklist?.dpSewa) {
      return vd.rentalChecklist?.dpAmount && vd.rentalChecklist.dpAmount > 0
        ? Math.min(totalCost, vd.rentalChecklist.dpAmount)
        : Math.round(totalCost * 0.3);
    }
    return 0;
  };

  // Helper for Volume Description
  const getRequestVolumeText = (r: ServiceRequest): string => {
    if (r.serviceType === 'fotocopy' && r.photocopyDetail) {
      return `${r.photocopyDetail.totalSheets} Lembar (${r.photocopyDetail.colorType}, ${r.photocopyDetail.paperSize})`;
    } else if (r.serviceType === 'laminating' && r.laminatingDetail) {
      return `${r.laminatingDetail.quantity} Lembar (${r.laminatingDetail.paperSize})`;
    } else if (r.serviceType === 'air_galon' && r.waterDetail) {
      return `${r.waterDetail.gallonCount} Galon Isi (Retur: ${r.waterDetail.emptyGallonsReturned ?? 0} Kosong)`;
    } else if (r.serviceType === 'kendaraan' && r.vehicleDetail) {
      const cost = getRequestRentalCost(r);
      const unitQty = r.vehicleDetail.vehicleCount || 1;
      const rentalSuffix = cost > 0
        ? ` • Sewa ${unitQty} Unit: Rp ${cost.toLocaleString('id-ID')} (${r.vehicleDetail.rentalPaymentStatus || 'Keep Order'})`
        : ' • Armada Milik Sekolah (Rp 0)';
      return `${r.vehicleDetail.vehicleCategory}: ${r.vehicleDetail.vehicleName} (${r.vehicleDetail.plateNumber}) • ${r.vehicleDetail.passengerCount} Penumpang${rentalSuffix}`;
    } else if (r.items && r.items.length > 0) {
      const totalQty = r.items.reduce((s, it) => s + (it.quantityApproved ?? it.quantityRequested), 0);
      return `${totalQty} Pcs Barang`;
    }
    return '-';
  };

  // Aggregations
  const totalCompleted = filteredRequests.filter(r => r.status === 'Selesai').length;
  const totalInProgress = filteredRequests.filter(r => r.status === 'Sedang Diproses' || r.status === 'Sedang Disiapkan' || r.status === 'Disetujui' || r.status === 'Siap Diambil').length;
  const totalSubmitted = filteredRequests.filter(r => r.status === 'Diajukan' || r.status === 'Menunggu Approval').length;

  const totalFotocopySheets = filteredRequests
    .filter(r => r.serviceType === 'fotocopy' && r.photocopyDetail)
    .reduce((acc, r) => acc + (r.photocopyDetail?.totalSheets || 0), 0);

  const totalLaminatingSheets = filteredRequests
    .filter(r => r.serviceType === 'laminating' && r.laminatingDetail)
    .reduce((acc, r) => acc + (r.laminatingDetail?.quantity || 0), 0);

  const totalWaterGallons = filteredRequests
    .filter(r => r.serviceType === 'air_galon' && r.waterDetail)
    .reduce((acc, r) => acc + (r.waterDetail?.gallonCount || 0), 0);

  const totalEmptyGallonsReturned = filteredRequests
    .filter(r => r.serviceType === 'air_galon' && r.waterDetail)
    .reduce((acc, r) => acc + (r.waterDetail?.emptyGallonsReturned || 0), 0);

  const totalVehicleOrders = filteredRequests.filter(r => r.serviceType === 'kendaraan' && r.status !== 'Ditolak').length;

  const rentedVehicleRequests = useMemo(
    () => filteredRequests.filter(r => isRentedVehicleRequest(r)),
    [filteredRequests, vehicleFleet]
  );

  const totalBusRentalCost = useMemo(
    () =>
      rentedVehicleRequests
        .filter(r => r.vehicleDetail?.vehicleCategory === 'Kendaraan Bus')
        .reduce((sum, r) => sum + getRequestRentalCost(r), 0),
    [rentedVehicleRequests]
  );

  const totalOpsRentalCost = useMemo(
    () =>
      rentedVehicleRequests
        .filter(r => r.vehicleDetail?.vehicleCategory !== 'Kendaraan Bus')
        .reduce((sum, r) => sum + getRequestRentalCost(r), 0),
    [rentedVehicleRequests]
  );

  const totalAllRentalCost = totalBusRentalCost + totalOpsRentalCost;

  const totalRentalPaidAmount = useMemo(
    () => rentedVehicleRequests.reduce((sum, r) => sum + getRequestPaidAmount(r), 0),
    [rentedVehicleRequests]
  );

  const totalRentalRemainingAmount = Math.max(0, totalAllRentalCost - totalRentalPaidAmount);

  const totalRentedBusUnits = useMemo(
    () =>
      rentedVehicleRequests
        .filter(r => r.vehicleDetail?.vehicleCategory === 'Kendaraan Bus')
        .reduce((sum, r) => sum + Math.max(1, r.vehicleDetail?.vehicleCount || 1), 0),
    [rentedVehicleRequests]
  );

  const totalRentedOpsUnits = useMemo(
    () =>
      rentedVehicleRequests
        .filter(r => r.vehicleDetail?.vehicleCategory !== 'Kendaraan Bus')
        .reduce((sum, r) => sum + Math.max(1, r.vehicleDetail?.vehicleCount || 1), 0),
    [rentedVehicleRequests]
  );

  // Unit Breakdown Matrix (Standardized & Merged by Canonical Unit - SD and SD Lazuardi merge into 1 row)
  const unitBreakdown = useMemo(() => {
    const map: Record<string, {
      code: string;
      unitName: string;
      ticketCount: number;
      fotocopySheets: number;
      laminatingSheets: number;
      waterGallons: number;
      emptyGallons: number;
      vehicleOrders: number;
      rentedBusOrders: number;
      rentedBusUnits: number;
      rentedOpsOrders: number;
      rentedOpsUnits: number;
      busRentalCost: number;
      opsRentalCost: number;
      totalRentalCost: number;
      rentalPaidAmount: number;
      rentalRemainingAmount: number;
    }> = {};

    // Initialize with all existing units from context
    units.forEach(u => {
      const codeKey = u.code.toUpperCase().trim();
      map[codeKey] = {
        code: codeKey,
        unitName: u.name,
        ticketCount: 0,
        fotocopySheets: 0,
        laminatingSheets: 0,
        waterGallons: 0,
        emptyGallons: 0,
        vehicleOrders: 0,
        rentedBusOrders: 0,
        rentedBusUnits: 0,
        rentedOpsOrders: 0,
        rentedOpsUnits: 0,
        busRentalCost: 0,
        opsRentalCost: 0,
        totalRentalCost: 0,
        rentalPaidAmount: 0,
        rentalRemainingAmount: 0,
      };
    });

    // Populate data - strictly mapped to canonical unit so "SD" and "SD Lazuardi" merge into the same row
    filteredRequests.forEach(r => {
      const canonical = resolveCanonicalUnit(r.unit, units);
      const uKey = canonical.code.toUpperCase().trim();
      if (!map[uKey]) {
        map[uKey] = {
          code: uKey,
          unitName: canonical.name,
          ticketCount: 0,
          fotocopySheets: 0,
          laminatingSheets: 0,
          waterGallons: 0,
          emptyGallons: 0,
          vehicleOrders: 0,
          rentedBusOrders: 0,
          rentedBusUnits: 0,
          rentedOpsOrders: 0,
          rentedOpsUnits: 0,
          busRentalCost: 0,
          opsRentalCost: 0,
          totalRentalCost: 0,
          rentalPaidAmount: 0,
          rentalRemainingAmount: 0,
        };
      }

      map[uKey].ticketCount += 1;

      if (r.serviceType === 'fotocopy' && r.photocopyDetail) {
        map[uKey].fotocopySheets += (r.photocopyDetail.totalSheets || 0);
      } else if (r.serviceType === 'laminating' && r.laminatingDetail) {
        map[uKey].laminatingSheets += (r.laminatingDetail.quantity || 0);
      } else if (r.serviceType === 'air_galon' && r.waterDetail) {
        map[uKey].waterGallons += (r.waterDetail.gallonCount || 0);
        map[uKey].emptyGallons += (r.waterDetail.emptyGallonsReturned || 0);
      } else if (r.serviceType === 'kendaraan' && r.vehicleDetail && r.status !== 'Ditolak') {
        map[uKey].vehicleOrders += 1;
        if (isRentedVehicleRequest(r)) {
          const cost = getRequestRentalCost(r);
          const paid = getRequestPaidAmount(r);
          const unitQty = Math.max(1, r.vehicleDetail.vehicleCount || 1);
          if (r.vehicleDetail.vehicleCategory === 'Kendaraan Bus') {
            map[uKey].rentedBusOrders += 1;
            map[uKey].rentedBusUnits += unitQty;
            map[uKey].busRentalCost += cost;
          } else {
            map[uKey].rentedOpsOrders += 1;
            map[uKey].rentedOpsUnits += unitQty;
            map[uKey].opsRentalCost += cost;
          }
          map[uKey].totalRentalCost += cost;
          map[uKey].rentalPaidAmount += paid;
          map[uKey].rentalRemainingAmount += Math.max(0, cost - paid);
        }
      }
    });

    return Object.values(map)
      .filter(item => {
        if (unitFilter === 'all') return item.ticketCount > 0;
        return isSameUnit(item.code, unitFilter, units);
      })
      .sort((a, b) => b.ticketCount - a.ticketCount);
  }, [filteredRequests, units, unitFilter, vehicleFleet]);

  // Top user unit by tickets
  const topUnitObj = unitBreakdown[0];
  const topUnit = topUnitObj ? `${topUnitObj.code} (${topUnitObj.unitName})` : '-';

  // Export CSV
  const exportToCSV = () => {
    const periodLabel = startDate && endDate ? `${startDate}_sd_${endDate}` : 'Semua_Periode';
    
    // Header Section
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'LAPORAN REKAPITULASI LAYANAN & BIAYA SEWA KENDARAAN/BUS RESOURCES ROOM - LAZUARDI GCS\n';
    csvContent += `Periode Tanggal: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}\n`;
    csvContent += `Filter Layanan: ${serviceFilter === 'all' ? 'Semua Layanan' : serviceFilter.toUpperCase()}\n`;
    csvContent += `Filter Unit: ${unitFilter === 'all' ? 'Semua Unit' : unitFilter}\n`;
    csvContent += `Tanggal Unduh: ${new Date().toLocaleString('id-ID')}\n\n`;

    // 1. Rekap Per Unit Table (Termasuk Biaya Sewa Bus & Kendaraan yang Disewa)
    csvContent += '=== 1. REKAPITULASI JUMLAH PENGGUNAAN & BIAYA SEWA KENDARAAN PER UNIT SEKOLAH ===\n';
    csvContent += 'Kode Unit,Nama Unit Sekolah,Jumlah Permintaan (Tiket),Foto Copy (Lembar),Laminating (Lembar),Air Galon Isi (Galon),Galon Kosong Retur (Galon),Order Kendaraan,Unit Bus Sewa,Biaya Sewa Bus (Rp),Unit Kendaraan Sewa Lainnya,Biaya Sewa Kendaraan Lainnya (Rp),Total Biaya Sewa Bus & Kendaraan (Rp),Sudah Dibayar DP/Lunas (Rp),Sisa Tagihan Sewa (Rp),Persentase Permintaan (%)\n';
    
    const totalTickets = filteredRequests.length;

    unitBreakdown.forEach(u => {
      const pct = totalTickets > 0 ? Math.round((u.ticketCount / totalTickets) * 100) : 0;
      csvContent += `"${u.code}","${u.unitName}",${u.ticketCount},${u.fotocopySheets},${u.laminatingSheets},${u.waterGallons},${u.emptyGallons},${u.vehicleOrders},${u.rentedBusUnits},${u.busRentalCost},${u.rentedOpsUnits},${u.opsRentalCost},${u.totalRentalCost},${u.rentalPaidAmount},${u.rentalRemainingAmount},${pct}%\n`;
    });

    csvContent += `TOTAL KESELURUHAN,-,${totalTickets},${totalFotocopySheets},${totalLaminatingSheets},${totalWaterGallons},${totalEmptyGallonsReturned},${totalVehicleOrders},${totalRentedBusUnits},${totalBusRentalCost},${totalRentedOpsUnits},${totalOpsRentalCost},${totalAllRentalCost},${totalRentalPaidAmount},${totalRentalRemainingAmount},100%\n\n`;

    // 2. Rekapitulasi Khusus Biaya Sewa Bus & Kendaraan
    csvContent += '=== 2. RINCIAN BIAYA SEWA KENDARAAN BUS & KENDARAAN YANG DISEWA ===\n';
    csvContent += 'Tanggal,Nomor Tiket,Unit Sekolah,Pemohon,Kategori,Nama Armada / Kendaraan Sewa,Vendor / PO Penyedia,Jumlah Unit,Harga Sewa per Unit (Rp),Total Biaya Sewa (Rp),Status Pembayaran Sewa,Sudah Dibayar (Rp),Sisa Tagihan (Rp),Tujuan Perjalanan\n';

    rentedVehicleRequests.forEach(r => {
      const date = (r.requestDate || '').slice(0, 10);
      const canonical = resolveCanonicalUnit(r.unit, units);
      const vd = r.vehicleDetail!;
      const unitQty = Math.max(1, vd.vehicleCount || 1);
      const totalCost = getRequestRentalCost(r);
      const unitPrice = vd.rentalPrice || Math.round(totalCost / unitQty);
      const paid = getRequestPaidAmount(r);
      const rem = Math.max(0, totalCost - paid);
      const payStatus = vd.rentalPaymentStatus || (vd.rentalChecklist?.lunas ? 'Lunas' : vd.rentalChecklist?.dpSewa ? 'DP Sewa' : 'Keep Order');

      csvContent += `"${date}","${r.requestNumber}","${canonical.code} - ${canonical.name}","${r.userName}","${vd.vehicleCategory}","${(vd.vehicleName || '').replace(/"/g, '""')}","${(vd.vendorName || 'Vendor Sewa').replace(/"/g, '""')}",${unitQty},${unitPrice},${totalCost},"${payStatus}",${paid},${rem},"${(vd.destination || r.purpose || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += `TOTAL BIAYA SEWA,-,-,-,-,-,-,${totalRentedBusUnits + totalRentedOpsUnits},-,${totalAllRentalCost},-,${totalRentalPaidAmount},${totalRentalRemainingAmount},-\n\n`;

    // 3. Rincian Transaksi
    csvContent += '=== 3. RINCIAN LOG TRANSAKSI PERMINTAAN ===\n';
    csvContent += 'Tanggal,Nomor Tiket,Kode Unit,Nama Unit Sekolah,Nama Pemohon,Layanan,Keperluan / Ruangan,Jumlah & Rincian Volume,Biaya Sewa Kendaraan/Bus (Rp),Status,Penerima / Petugas\n';

    filteredRequests.forEach(r => {
      const date = (r.requestDate || '').slice(0, 10);
      const canonical = resolveCanonicalUnit(r.unit, units);
      const svc = r.serviceType === 'fotocopy' ? 'Foto Copy' : r.serviceType === 'laminating' ? 'Laminating' : r.serviceType === 'air_galon' ? 'Air Galon' : r.serviceType === 'kendaraan' ? (r.vehicleDetail?.vehicleCategory || 'Kendaraan') : r.serviceType;
      const vol = getRequestVolumeText(r).replace(/"/g, '""');
      const rentalCost = getRequestRentalCost(r);
      const receiver = r.pickedUpBy || r.userName || '-';
      const purpose = (r.purpose || r.waterDetail?.roomName || '-').replace(/"/g, '""');

      csvContent += `"${date}","${r.requestNumber}","${canonical.code}","${canonical.name}","${r.userName}","${svc}","${purpose}","${vol}",${rentalCost},"${r.status}","${receiver}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Rekapitulasi_Resources_Room_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportToPDF = () => {
    const periodLabel = startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Riwayat Waktu';
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const printDateStr = new Date().toLocaleString('id-ID');

    // Header Background
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LAZUARDI GLOBAL COMPASSIONATE SCHOOL', 14, 10);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text('LAPORAN REKAPITULASI LAYANAN RESOURCES ROOM & BIAYA SEWA KENDARAAN BUS / OPERASIONAL PER UNIT SEKOLAH', 14, 17);

    // Metadata Bar
    doc.setFontSize(8);
    doc.text(`Dicetak: ${printDateStr} | Oleh: ${currentUser?.name || 'Administrator'} (${currentUser?.role || 'Admin RR'})`, pageWidth - 14, 10, { align: 'right' });
    doc.text(`Periode: ${periodLabel} | Filter: ${serviceFilter.toUpperCase()}`, pageWidth - 14, 17, { align: 'right' });

    let currentY = 30;

    // KPI Summary Section
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN REKAPITULASI LAYANAN & PENGELUARAN SEWA KENDARAAN / BUS:', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`• Total Permintaan: ${filteredRequests.length} Tiket (${totalCompleted} Selesai, ${totalInProgress} Proses, ${totalSubmitted} Diajukan)`, 18, currentY + 12);
    doc.text(`• Foto Copy: ${totalFotocopySheets.toLocaleString('id-ID')} Lbr | Laminating: ${totalLaminatingSheets.toLocaleString('id-ID')} Lbr`, 125, currentY + 12);
    doc.text(`• Air Galon: ${totalWaterGallons} Isi (${totalEmptyGallonsReturned} Retur) | Order Kendaraan: ${totalVehicleOrders}`, 205, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(
      `• Total Biaya Sewa Bus & Kendaraan: Rp ${totalAllRentalCost.toLocaleString('id-ID')} (Sewa Bus: Rp ${totalBusRentalCost.toLocaleString('id-ID')} | Sewa Kendaraan Lain: Rp ${totalOpsRentalCost.toLocaleString('id-ID')} | Dibayar: Rp ${totalRentalPaidAmount.toLocaleString('id-ID')} | Sisa: Rp ${totalRentalRemainingAmount.toLocaleString('id-ID')})`,
      18,
      currentY + 18
    );

    currentY += 28;

    // SECTION 1: TABEL REKAPITULASI PER UNIT SEKOLAH (DENGAN BIAYA SEWA BUS & KENDARAAN)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('1. REKAPITULASI PEMAKAIAN LAYANAN & BIAYA SEWA KENDARAAN / BUS PER UNIT SEKOLAH', 14, currentY);

    const totalTickets = filteredRequests.length;

    const unitTableRows = unitBreakdown.map((u) => {
      const pct = totalTickets > 0 ? `${Math.round((u.ticketCount / totalTickets) * 100)}%` : '0%';
      return [
        `${u.code} - ${u.unitName}`,
        `${u.ticketCount} Tiket`,
        u.fotocopySheets > 0 ? `${u.fotocopySheets.toLocaleString('id-ID')} Lbr` : '-',
        u.laminatingSheets > 0 ? `${u.laminatingSheets.toLocaleString('id-ID')} Lbr` : '-',
        u.waterGallons > 0 || u.emptyGallons > 0 ? `${u.waterGallons} Isi / ${u.emptyGallons} Retur` : '-',
        u.vehicleOrders > 0 ? `${u.vehicleOrders} Order (${u.rentedBusUnits + u.rentedOpsUnits} Sewa)` : '-',
        u.busRentalCost > 0 ? `Rp ${u.busRentalCost.toLocaleString('id-ID')}` : 'Rp 0',
        u.opsRentalCost > 0 ? `Rp ${u.opsRentalCost.toLocaleString('id-ID')}` : 'Rp 0',
        u.totalRentalCost > 0 ? `Rp ${u.totalRentalCost.toLocaleString('id-ID')}` : 'Rp 0',
        pct
      ];
    });

    // Add total row
    unitTableRows.push([
      'TOTAL KESELURUHAN',
      `${totalTickets} Tiket`,
      `${totalFotocopySheets.toLocaleString('id-ID')} Lbr`,
      `${totalLaminatingSheets.toLocaleString('id-ID')} Lbr`,
      `${totalWaterGallons} Isi / ${totalEmptyGallonsReturned} Retur`,
      `${totalVehicleOrders} Order (${totalRentedBusUnits + totalRentedOpsUnits} Sewa)`,
      `Rp ${totalBusRentalCost.toLocaleString('id-ID')}`,
      `Rp ${totalOpsRentalCost.toLocaleString('id-ID')}`,
      `Rp ${totalAllRentalCost.toLocaleString('id-ID')}`,
      '100%'
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [[
        'Unit Sekolah', 
        'Jml Tiket', 
        'Foto Copy', 
        'Laminating', 
        'Air Galon', 
        'Order Kendaraan',
        'Biaya Sewa Bus',
        'Biaya Sewa Kendaraan',
        'Total Biaya Sewa',
        'Porsi (%)'
      ]],
      body: unitTableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 44 },
        1: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 24 },
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center', cellWidth: 28 },
        5: { halign: 'center', cellWidth: 28 },
        6: { halign: 'right', cellWidth: 30 },
        7: { halign: 'right', cellWidth: 30 },
        8: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
        9: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      didParseCell: function(data) {
        if (data.row.index === unitTableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [226, 232, 240];
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    });

    let nextY = ((doc as any).lastAutoTable?.finalY || currentY + 50) + 8;

    // SECTION 2: RINCIAN KHUSUS BIAYA SEWA BUS & KENDARAAN DISEWA
    if (rentedVehicleRequests.length > 0) {
      if (nextY > 155) {
        doc.addPage();
        nextY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`2. REKAPITULASI RINCIAN BIAYA SEWA KENDARAAN BUS & KENDARAAN DISEWA (${rentedVehicleRequests.length} ORDER SEWA)`, 14, nextY);

      const rentalRows = rentedVehicleRequests.map((r, idx) => {
        const date = (r.requestDate || '').slice(0, 10);
        const canonical = resolveCanonicalUnit(r.unit, units);
        const vd = r.vehicleDetail!;
        const unitQty = Math.max(1, vd.vehicleCount || 1);
        const totalCost = getRequestRentalCost(r);
        const unitPrice = vd.rentalPrice || Math.round(totalCost / unitQty);
        const paid = getRequestPaidAmount(r);
        const rem = Math.max(0, totalCost - paid);
        const payStatus = vd.rentalPaymentStatus || (vd.rentalChecklist?.lunas ? 'Lunas' : vd.rentalChecklist?.dpSewa ? 'DP Sewa' : 'Keep Order');

        return [
          (idx + 1).toString(),
          date,
          r.requestNumber,
          `${canonical.code} - ${canonical.name}`,
          vd.vehicleCategory,
          `${vd.vehicleName} (${vd.vendorName || 'Vendor'})`,
          `${unitQty} Unit x Rp ${unitPrice.toLocaleString('id-ID')}`,
          `Rp ${totalCost.toLocaleString('id-ID')}`,
          payStatus,
          `Rp ${paid.toLocaleString('id-ID')}`,
          `Rp ${rem.toLocaleString('id-ID')}`
        ];
      });

      rentalRows.push([
        '',
        'TOTAL',
        `${rentedVehicleRequests.length} Order`,
        '-',
        `Bus: ${totalRentedBusUnits} | Ops: ${totalRentedOpsUnits}`,
        'Total Pengeluaran Sewa Bus & Kendaraan',
        `${totalRentedBusUnits + totalRentedOpsUnits} Unit Disewa`,
        `Rp ${totalAllRentalCost.toLocaleString('id-ID')}`,
        '-',
        `Rp ${totalRentalPaidAmount.toLocaleString('id-ID')}`,
        `Rp ${totalRentalRemainingAmount.toLocaleString('id-ID')}`
      ]);

      autoTable(doc, {
        startY: nextY + 3,
        head: [[
          'No',
          'Tanggal',
          'No. Tiket',
          'Unit Sekolah',
          'Kategori',
          'Armada & Vendor Sewa',
          'Jml x Tarif Sewa',
          'Total Biaya Sewa',
          'Status Bayar',
          'Sudah Dibayar',
          'Sisa Tagihan'
        ]],
        body: rentalRows,
        theme: 'grid',
        headStyles: {
          fillColor: [180, 83, 9], // Amber-700
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'center', cellWidth: 18 },
          2: { fontStyle: 'bold', cellWidth: 24 },
          3: { fontStyle: 'bold', cellWidth: 28 },
          4: { halign: 'center', cellWidth: 26 },
          5: { cellWidth: 48 },
          6: { halign: 'right', cellWidth: 32 },
          7: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
          8: { halign: 'center', cellWidth: 18 },
          9: { halign: 'right', cellWidth: 23 },
          10: { halign: 'right', cellWidth: 23 }
        },
        styles: {
          fontSize: 7,
          cellPadding: 2
        },
        didParseCell: function(data) {
          if (data.row.index === rentalRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [120, 53, 15];
          }
        }
      });

      nextY = ((doc as any).lastAutoTable?.finalY || nextY + 40) + 10;
    }

    // If space remaining is low, start new page for transaction list
    if (nextY > 150) {
      doc.addPage();
      nextY = 20;
    }

    // SECTION 3: DAFTAR TRANSAKSI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`3. RINCIAN LOG TRANSAKSI PERMINTAAN TERFILTER (${filteredRequests.length} DATA)`, 14, nextY);

    const transactionRows = filteredRequests.map((r, idx) => {
      const date = (r.requestDate || '').slice(0, 10);
      const canonical = resolveCanonicalUnit(r.unit, units);
      const svc = r.serviceType === 'fotocopy' ? 'Foto Copy' : r.serviceType === 'laminating' ? 'Laminating' : r.serviceType === 'air_galon' ? 'Air Galon' : r.serviceType;
      const vol = getRequestVolumeText(r);
      const receiver = r.pickedUpBy || r.userName || '-';
      const purpose = r.purpose || r.waterDetail?.roomName || '-';

      return [
        (idx + 1).toString(),
        date,
        r.requestNumber,
        `${canonical.code} - ${canonical.name}`,
        r.userName,
        svc,
        `${purpose} (${vol})`,
        r.status,
        receiver
      ];
    });

    autoTable(doc, {
      startY: nextY + 3,
      head: [[
        'No', 
        'Tanggal', 
        'No. Tiket', 
        'Unit', 
        'Pemohon', 
        'Layanan', 
        'Keperluan & Jumlah Volume', 
        'Status',
        'Penerima / Staf'
      ]],
      body: transactionRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // Slate-600
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { fontStyle: 'bold', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        4: { cellWidth: 36 },
        5: { halign: 'center', cellWidth: 26 },
        6: { cellWidth: 80 },
        7: { halign: 'center', cellWidth: 24 },
        8: { cellWidth: 22 }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      }
    });

    const finalY2 = (doc as any).lastAutoTable?.finalY || nextY + 40;
    
    // Check if we need a new page for signatures
    if (finalY2 > 160) {
      doc.addPage();
      currentY = 25;
    } else {
      currentY = finalY2 + 12;
    }

    // Tanda Tangan / Signature Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');

    const sigDate = `Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(sigDate, pageWidth - 70, currentY);

    doc.text('Petugas Resources Room,', 25, currentY + 6);
    doc.text('Mengetahui / Menyetujui,', pageWidth - 70, currentY + 6);
    doc.text('Kepala Operasional Sekolah,', pageWidth - 70, currentY + 11);

    doc.setFont('helvetica', 'bold');
    doc.text(`( ${currentUser?.name || 'Administrator RR'} )`, 25, currentY + 30);
    doc.text('( .................................................. )', pageWidth - 70, currentY + 30);

    const safeFilePeriod = startDate && endDate ? `${startDate}_sd_${endDate}` : 'Semua_Periode';
    doc.save(`Laporan_Rekapitulasi_Resources_Room_${safeFilePeriod}.pdf`);
  };

  // Clear date filters
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setDatePreset('semua');
    setServiceFilter('all');
    setUnitFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">Laporan Rekapitulasi</h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200">
                Volume Layanan &amp; Biaya Sewa Bus/Kendaraan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi kuantitas pemakaian Foto Copy, Laminating, Air Galon, serta Biaya Sewa Kendaraan Bus &amp; Kendaraan yang Disewa per Unit Sekolah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Cetak format cetak resmi laporan"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export Excel / CSV Lengkap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={exportToPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export Berkas Laporan Resmi ke PDF"
          >
            <FileType className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER PANEL DENGAN RANGE TANGGAL */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Row 1: Date Range Presets & Inputs */}
        <div className="space-y-3 pb-3.5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Range Tanggal Laporan:</span>
              <span className="text-[11px] text-slate-400">
                {startDate && endDate 
                  ? `(${new Date(startDate).toLocaleDateString('id-ID')} s/d ${new Date(endDate).toLocaleDateString('id-ID')})`
                  : '(Semua Riwayat Waktu)'}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: 'hari_ini', label: 'Hari Ini' },
                { id: '7_hari', label: '7 Hari Terakhir' },
                { id: 'bulan_ini', label: 'Bulan Ini' },
                { id: 'bulan_lalu', label: 'Bulan Lalu' },
                { id: 'triwulan', label: '3 Bulan (Triwulan)' },
                { id: 'tahun_ini', label: 'Tahun Ini' },
                { id: 'semua', label: 'Semua Waktu' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyDatePreset(p.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    datePreset === p.id 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Custom Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Tanggal Mulai (Dari)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Tanggal Akhir (Sampai)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter Jenis Layanan
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-blue-600"
              >
                <option value="all">Semua Layanan (FC, Laminating, Air, Kendaraan)</option>
                <option value="fotocopy">Layanan Foto Copy</option>
                <option value="laminating">Pelayanan Laminating</option>
                <option value="air_galon">Penyediaan Air Galon</option>
                <option value="kendaraan">Kendaraan Operasional &amp; Bus</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter Unit Sekolah
              </label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-blue-600"
              >
                <option value="all">Semua Unit Sekolah</option>
                {units.map(u => (
                  <option key={u.id} value={u.code}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari no. tiket, nama pemohon, ruangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-blue-600 font-medium"
            >
              <option value="all">Semua Status Transaksi</option>
              <option value="Selesai">Hanya Selesai</option>
              <option value="Sedang Diproses">Sedang Diproses</option>
              <option value="Diajukan">Diajukan</option>
            </select>

            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Reset seluruh filter ke default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5 SUMMARY STAT CARDS (QUANTITY, VOLUME & BIAYA SEWA BUS/KENDARAAN) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Tiket */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Permintaan</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{filteredRequests.length}</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalCompleted} Selesai Diserahkan</span>
          </div>
        </div>

        {/* Foto Copy */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Foto Copy</span>
            <Printer className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-blue-900 mt-1">
            {totalFotocopySheets.toLocaleString('id-ID')}
            <span className="text-xs font-bold text-slate-400 ml-1">Lembar</span>
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {filteredRequests.filter(r => r.serviceType === 'fotocopy').length} Permintaan Penggandaan
          </span>
        </div>

        {/* Laminating */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Laminating</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-2xl font-black text-teal-900 mt-1">
            {totalLaminatingSheets.toLocaleString('id-ID')}
            <span className="text-xs font-bold text-slate-400 ml-1">Lembar</span>
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {filteredRequests.filter(r => r.serviceType === 'laminating').length} Permintaan Pelapisan
          </span>
        </div>

        {/* Air Galon */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Air Galon</span>
            <Droplet className="w-4 h-4 text-cyan-600" />
          </div>
          <h3 className="text-2xl font-black text-cyan-900 mt-1">
            {totalWaterGallons}
            <span className="text-xs font-bold text-slate-400 ml-1">Galon Isi</span>
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalEmptyGallonsReturned} Galon Kosong Dikembalikan
          </span>
        </div>

        {/* Biaya Sewa Bus & Kendaraan */}
        <div
          onClick={() => setActiveReportTab('sewa_bus')}
          className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Biaya Sewa Bus &amp; Kendaraan</span>
            <Bus className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-xl font-black text-amber-950 mt-1 font-mono">
            Rp {totalAllRentalCost.toLocaleString('id-ID')}
          </h3>
          <span className="text-[10px] text-amber-800 font-semibold mt-1 block">
            Bus: Rp {totalBusRentalCost.toLocaleString('id-ID')} • Ops: Rp {totalOpsRentalCost.toLocaleString('id-ID')}
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TABS REKAPITULASI */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Navigation Tab Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveReportTab('unit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeReportTab === 'unit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Rekapitulasi per Unit Sekolah</span>
            </button>

            <button
              onClick={() => setActiveReportTab('sewa_bus')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeReportTab === 'sewa_bus'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Rekap Biaya Sewa Bus &amp; Kendaraan ({rentedVehicleRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveReportTab('layanan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeReportTab === 'layanan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Komposisi Jumlah per Layanan</span>
            </button>

            <button
              onClick={() => setActiveReportTab('transaksi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeReportTab === 'transaksi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daftar Transaksi ({filteredRequests.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Menampilkan <strong>{filteredRequests.length}</strong> data terfilter
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: REKAPITULASI PER UNIT SEKOLAH (DENGAN BIAYA SEWA BUS & KENDARAAN) */}
        {/* ========================================================================= */}
        {activeReportTab === 'unit' && (
          <div className="space-y-6">
            <div>
              <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">
                    Matriks Jumlah Pemakaian Layanan &amp; Biaya Sewa Kendaraan Bus / Operasional Tiap Unit Sekolah
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Mencakup volume pemakaian layanan Resources Room serta rincian biaya sewa khusus Kendaraan Bus dan Kendaraan yang disewa per Unit Sekolah
                  </span>
                </div>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">
                  Periode: {startDate || 'Awal'} s/d {endDate || 'Sekarang'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Unit Sekolah</th>
                      <th className="p-3.5 text-center">Jml Tiket</th>
                      <th className="p-3.5 text-center">Foto Copy</th>
                      <th className="p-3.5 text-center">Laminating</th>
                      <th className="p-3.5 text-center">Air Galon (Isi / Retur)</th>
                      <th className="p-3.5 text-center">Order Kendaraan</th>
                      <th className="p-3.5 text-right bg-amber-50/60 text-amber-900">Biaya Sewa Bus</th>
                      <th className="p-3.5 text-right bg-indigo-50/60 text-indigo-900">Biaya Sewa Kendaraan</th>
                      <th className="p-3.5 text-right bg-emerald-50/70 text-emerald-950 font-bold">Total Biaya Sewa (Bus &amp; Kendaraan)</th>
                      <th className="p-3.5 text-center">Porsi (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unitBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          Tidak ada aktivitas layanan yang sesuai dengan filter tanggal atau kriteria yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      unitBreakdown.map((u) => {
                        const ticketPct = filteredRequests.length > 0 ? Math.round((u.ticketCount / filteredRequests.length) * 100) : 0;
                        const totalRentedUnits = u.rentedBusUnits + u.rentedOpsUnits;
                        return (
                          <tr key={u.code} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                                  {u.code}
                                </span>
                                <span className="font-semibold text-slate-900 text-xs">{u.unitName}</span>
                              </div>
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {u.ticketCount} Tiket
                            </td>
                            <td className="p-3.5 text-center font-mono whitespace-nowrap">
                              {u.fotocopySheets > 0 ? (
                                <span className="font-semibold text-blue-700">{u.fotocopySheets.toLocaleString('id-ID')} lbr</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center font-mono whitespace-nowrap">
                              {u.laminatingSheets > 0 ? (
                                <span className="font-semibold text-teal-700">{u.laminatingSheets.toLocaleString('id-ID')} lbr</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center font-mono whitespace-nowrap">
                              {u.waterGallons > 0 || u.emptyGallons > 0 ? (
                                <div>
                                  <span className="font-semibold text-cyan-700">{u.waterGallons} isi</span>
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="font-semibold text-amber-700">{u.emptyGallons} retur</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {u.vehicleOrders > 0 ? (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 block">{u.vehicleOrders} Order</span>
                                  {totalRentedUnits > 0 ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                      {totalRentedUnits} Unit Disewa
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 block">Milik Sekolah</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono bg-amber-50/25 whitespace-nowrap">
                              {u.busRentalCost > 0 ? (
                                <div>
                                  <span className="font-bold text-amber-900 block">
                                    Rp {u.busRentalCost.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[10px] text-amber-700 font-sans font-semibold">
                                    {u.rentedBusOrders} Order ({u.rentedBusUnits} Unit Bus)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">Rp 0</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono bg-indigo-50/25 whitespace-nowrap">
                              {u.opsRentalCost > 0 ? (
                                <div>
                                  <span className="font-bold text-indigo-900 block">
                                    Rp {u.opsRentalCost.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[10px] text-indigo-700 font-sans font-semibold">
                                    {u.rentedOpsOrders} Order ({u.rentedOpsUnits} Unit Mobil)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">Rp 0</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono bg-emerald-50/30 whitespace-nowrap">
                              {u.totalRentalCost > 0 ? (
                                <div>
                                  <span className="font-black text-emerald-900 text-xs block">
                                    Rp {u.totalRentalCost.toLocaleString('id-ID')}
                                  </span>
                                  {u.rentalRemainingAmount > 0 ? (
                                    <span className="text-[10px] text-amber-700 font-sans font-semibold block">
                                      Dibayar DP: Rp {u.rentalPaidAmount.toLocaleString('id-ID')} • Sisa: Rp {u.rentalRemainingAmount.toLocaleString('id-ID')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-700 font-sans font-bold block">
                                      ✓ Lunas (Rp {u.rentalPaidAmount.toLocaleString('id-ID')})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-semibold">Rp 0</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full" 
                                    style={{ width: `${Math.min(100, ticketPct)}%` }} 
                                  />
                                </div>
                                <span className="font-bold text-[11px] text-slate-700">{ticketPct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="p-3.5 uppercase tracking-wider">TOTAL KESELURUHAN</td>
                      <td className="p-3.5 text-center font-mono">{filteredRequests.length} Tiket</td>
                      <td className="p-3.5 text-center font-mono text-blue-800">{totalFotocopySheets.toLocaleString('id-ID')} lbr</td>
                      <td className="p-3.5 text-center font-mono text-teal-800">{totalLaminatingSheets.toLocaleString('id-ID')} lbr</td>
                      <td className="p-3.5 text-center font-mono text-cyan-800">{totalWaterGallons} isi / {totalEmptyGallonsReturned} retur</td>
                      <td className="p-3.5 text-center font-mono text-slate-800">
                        {totalVehicleOrders} Order ({totalRentedBusUnits + totalRentedOpsUnits} Sewa)
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-900 bg-amber-100/60">
                        Rp {totalBusRentalCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-indigo-900 bg-indigo-100/60">
                        Rp {totalOpsRentalCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-950 bg-emerald-100/80 text-xs">
                        Rp {totalAllRentalCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center font-mono">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* SUB-SECTION DI DALAM TAB UNIT: REKAPITULASI KHUSUS BIAYA SEWA BUS & KENDARAAN PER UNIT SEKOLAH */}
            <div className="p-4 sm:p-5 bg-amber-50/40 border-t border-amber-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-600 text-white rounded-lg shadow-2xs">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Rekapitulasi Biaya Sewa Khusus Kendaraan Bus &amp; Kendaraan yang Disewa per Unit Sekolah
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Ringkasan pengeluaran anggaran sewa armada bus pariwisata dan kendaraan operasional rental berdasarkan unit sekolah pemohon
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReportTab('sewa_bus')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Lihat Rincian Tiket Sewa Bus →
                </button>
              </div>

              {/* 4 Summary Cards Biaya Sewa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Biaya Sewa Kendaraan Bus
                  </span>
                  <p className="text-lg font-black text-amber-950 font-mono mt-1">
                    Rp {totalBusRentalCost.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {totalRentedBusUnits} Unit Bus Disewa ({rentedVehicleRequests.filter(r => r.vehicleDetail?.vehicleCategory === 'Kendaraan Bus').length} Order)
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                    Biaya Sewa Kendaraan Operasional
                  </span>
                  <p className="text-lg font-black text-indigo-950 font-mono mt-1">
                    Rp {totalOpsRentalCost.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {totalRentedOpsUnits} Unit Kendaraan Disewa ({rentedVehicleRequests.filter(r => r.vehicleDetail?.vehicleCategory !== 'Kendaraan Bus').length} Order)
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Total Biaya Sewa (Bus &amp; Kendaraan)
                  </span>
                  <p className="text-lg font-black text-emerald-950 font-mono mt-1">
                    Rp {totalAllRentalCost.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                    Sudah Dibayar (DP/Lunas): Rp {totalRentalPaidAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    Sisa Tagihan Sewa Belum Lunas
                  </span>
                  <p className="text-lg font-black text-rose-900 font-mono mt-1">
                    Rp {totalRentalRemainingAmount.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {rentedVehicleRequests.filter(r => r.vehicleDetail?.rentalPaymentStatus === 'Lunas' || r.vehicleDetail?.rentalChecklist?.lunas).length} Order Lunas • {rentedVehicleRequests.filter(r => r.vehicleDetail?.rentalPaymentStatus !== 'Lunas' && !r.vehicleDetail?.rentalChecklist?.lunas).length} Order DP/Keep
                  </span>
                </div>
              </div>

              {/* Tabel Rekap Biaya Sewa per Unit Sekolah */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Tabel Rekapitulasi Pengeluaran Biaya Sewa Bus &amp; Kendaraan per Unit Sekolah
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Akumulasi Biaya Sewa Berdasarkan Unit Sekolah
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Unit Sekolah</th>
                        <th className="p-3 text-center">Unit Bus Disewa</th>
                        <th className="p-3 text-right">Biaya Sewa Bus</th>
                        <th className="p-3 text-center">Unit Kendaraan Sewa</th>
                        <th className="p-3 text-right">Biaya Sewa Kendaraan</th>
                        <th className="p-3 text-right font-bold text-slate-900">Total Biaya Sewa Unit</th>
                        <th className="p-3 text-right text-emerald-800">Sudah Dibayar (DP / Lunas)</th>
                        <th className="p-3 text-right text-rose-800">Sisa Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unitBreakdown.map((u) => (
                        <tr key={`rent-${u.code}`} className="hover:bg-slate-50/80">
                          <td className="p-3 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs mr-2">
                              {u.code}
                            </span>
                            {u.unitName}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {u.rentedBusUnits > 0 ? `${u.rentedBusUnits} Unit (${u.rentedBusOrders} Order)` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-amber-900">
                            Rp {u.busRentalCost.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {u.rentedOpsUnits > 0 ? `${u.rentedOpsUnits} Unit (${u.rentedOpsOrders} Order)` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-indigo-900">
                            Rp {u.opsRentalCost.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50">
                            Rp {u.totalRentalCost.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                            Rp {u.rentalPaidAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-rose-700">
                            Rp {u.rentalRemainingAmount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-50/90 font-black text-slate-900 border-t border-amber-200">
                      <tr>
                        <td className="p-3 uppercase">TOTAL BIAYA SEWA SELURUH UNIT</td>
                        <td className="p-3 text-center font-mono">{totalRentedBusUnits} Unit Bus</td>
                        <td className="p-3 text-right font-mono text-amber-900">Rp {totalBusRentalCost.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-center font-mono">{totalRentedOpsUnits} Unit Mobil</td>
                        <td className="p-3 text-right font-mono text-indigo-900">Rp {totalOpsRentalCost.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-mono text-emerald-950 bg-amber-100/80">Rp {totalAllRentalCost.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-mono text-emerald-800">Rp {totalRentalPaidAmount.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-mono text-rose-800">Rp {totalRentalRemainingAmount.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REKAP BIAYA SEWA BUS & KENDARAAN (RINCIAN PER ORDER & VENDOR) */}
        {/* ========================================================================= */}
        {activeReportTab === 'sewa_bus' && (
          <div className="p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Laporan Rincian Biaya Sewa Kendaraan Bus &amp; Kendaraan yang Disewa
                </h3>
                <p className="text-xs text-slate-500">
                  Rekapitulasi biaya yang dikeluarkan untuk sewa bus pariwisata &amp; kendaraan operasional sewa beserta status Keep Order, DP Sewa, dan Lunas
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-black border border-amber-300 self-start sm:self-auto">
                Total Sewa: Rp {totalAllRentalCost.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">No. Tiket</th>
                    <th className="p-3">Unit Sekolah</th>
                    <th className="p-3">Pemohon &amp; Tujuan</th>
                    <th className="p-3">Kategori &amp; Armada Sewa</th>
                    <th className="p-3 text-center">Jml Unit</th>
                    <th className="p-3 text-right">Harga Sewa / Unit</th>
                    <th className="p-3 text-right font-bold">Total Biaya Sewa</th>
                    <th className="p-3 text-center">Ceklist &amp; Status Bayar</th>
                    <th className="p-3 text-right">Sudah Dibayar</th>
                    <th className="p-3 text-right">Sisa Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rentedVehicleRequests.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        Belum ada data penyewaan kendaraan bus atau kendaraan operasional pada filter periode ini.
                      </td>
                    </tr>
                  ) : (
                    rentedVehicleRequests.map((r) => {
                      const canonical = resolveCanonicalUnit(r.unit, units);
                      const vd = r.vehicleDetail!;
                      const unitQty = Math.max(1, vd.vehicleCount || 1);
                      const totalCost = getRequestRentalCost(r);
                      const unitPrice = vd.rentalPrice || Math.round(totalCost / unitQty);
                      const paid = getRequestPaidAmount(r);
                      const rem = Math.max(0, totalCost - paid);
                      const rc = vd.rentalChecklist;
                      const payStatus = vd.rentalPaymentStatus || (rc?.lunas ? 'Lunas' : rc?.dpSewa ? 'DP Sewa' : rc?.keepOrder ? 'Keep Order' : 'Belum Keep Order');

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 whitespace-nowrap font-mono text-slate-500">
                            {new Date(r.requestDate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-900">
                            {r.requestNumber}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] mr-1.5">
                              {canonical.code}
                            </span>
                            <span className="font-semibold text-slate-800">{canonical.name}</span>
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="font-bold text-slate-900">{r.userName}</div>
                            <div className="text-[11px] text-slate-500 truncate">{vd.destination || r.purpose}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                vd.vehicleCategory === 'Kendaraan Bus'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-indigo-100 text-indigo-900'
                              }`}>
                                {vd.vehicleCategory}
                              </span>
                              <span className="font-bold text-slate-900">{vd.vehicleName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Vendor: <strong>{vd.vendorName || 'Vendor Rekanan'}</strong> • Plat: <span className="font-mono">{vd.plateNumber}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {unitQty} Unit
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 whitespace-nowrap">
                            Rp {unitPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 bg-amber-50/40 whitespace-nowrap">
                            Rp {totalCost.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              payStatus === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : payStatus === 'DP Sewa'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {payStatus}
                            </span>
                            <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-slate-500">
                              <span className={rc?.keepOrder ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                {rc?.keepOrder ? '✓ Keep' : '○ Keep'}
                              </span>
                              <span>•</span>
                              <span className={rc?.dpSewa ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                {rc?.dpSewa ? '✓ DP' : '○ DP'}
                              </span>
                              <span>•</span>
                              <span className={rc?.lunas ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                {rc?.lunas ? '✓ Lunas' : '○ Lunas'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            Rp {paid.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                            Rp {rem.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="p-3 uppercase">
                      TOTAL REKAPITULASI BIAYA SEWA BUS &amp; KENDARAAN ({rentedVehicleRequests.length} ORDER)
                    </td>
                    <td className="p-3 text-center font-mono">
                      {totalRentedBusUnits + totalRentedOpsUnits} Unit
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">-</td>
                    <td className="p-3 text-right font-mono text-amber-950 bg-amber-100/70">
                      Rp {totalAllRentalCost.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center text-[11px] text-emerald-800">
                      Bus: Rp {totalBusRentalCost.toLocaleString('id-ID')} | Ops: Rp {totalOpsRentalCost.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-800">
                      Rp {totalRentalPaidAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-800">
                      Rp {totalRentalRemainingAmount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KOMPOSISI PER LAYANAN */}
        {/* ========================================================================= */}
        {activeReportTab === 'layanan' && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card Layanan 1: Fotocopy */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-blue-950">Layanan Foto Copy</h4>
                      <span className="text-[10px] text-blue-700">Penggandaan Dokumen</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-900">
                    {filteredRequests.filter(r => r.serviceType === 'fotocopy').length} Permintaan
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-blue-200/60 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Lembar Dicetak:</span>
                    <strong className="font-mono text-blue-900">{totalFotocopySheets.toLocaleString('id-ID')} Lembar</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status Selesai:</span>
                    <strong className="font-mono text-emerald-700">
                      {filteredRequests.filter(r => r.serviceType === 'fotocopy' && r.status === 'Selesai').length} Dokumen
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card Layanan 2: Laminating */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-600 text-white rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-teal-950">Pelayanan Laminating</h4>
                      <span className="text-[10px] text-teal-700">Pelapisan Dokumen &amp; Kartu</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-teal-900">
                    {filteredRequests.filter(r => r.serviceType === 'laminating').length} Permintaan
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-teal-200/60 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Lembar Laminating:</span>
                    <strong className="font-mono text-teal-900">{totalLaminatingSheets.toLocaleString('id-ID')} Lembar</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status Selesai:</span>
                    <strong className="font-mono text-emerald-700">
                      {filteredRequests.filter(r => r.serviceType === 'laminating' && r.status === 'Selesai').length} Dokumen
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card Layanan 3: Air Galon */}
              <div className="p-4 bg-cyan-50/50 rounded-2xl border border-cyan-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-600 text-white rounded-lg">
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-cyan-950">Penyediaan Air Galon</h4>
                      <span className="text-[10px] text-cyan-700">Distribusi Galon Unit &amp; Ruangan</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-cyan-900">
                    {filteredRequests.filter(r => r.serviceType === 'air_galon').length} Transaksi
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-cyan-200/60 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Galon Isi Diambil:</span>
                    <strong className="font-mono text-cyan-900">{totalWaterGallons} Galon</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Galon Kosong Dikembalikan:</span>
                    <strong className="font-mono text-amber-800">{totalEmptyGallonsReturned} Galon</strong>
                  </div>
                </div>
              </div>

              {/* Card Layanan 4: Kendaraan Operasional & Bus */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-indigo-950">Kendaraan &amp; Bus</h4>
                      <span className="text-[10px] text-indigo-700">Milik Sekolah &amp; Armada Sewa</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-900">
                    {filteredRequests.filter(r => r.serviceType === 'kendaraan').length} Order
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-indigo-200/60 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Mobil Operasional:</span>
                    <strong className="font-mono text-indigo-900">
                      {filteredRequests.filter(r => r.serviceType === 'kendaraan' && r.vehicleDetail?.vehicleCategory === 'Kendaraan Operasional').length} Perjalanan
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bus Sekolah &amp; Sewa:</span>
                    <strong className="font-mono text-amber-800">
                      {filteredRequests.filter(r => r.serviceType === 'kendaraan' && r.vehicleDetail?.vehicleCategory === 'Kendaraan Bus').length} Perjalanan
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-indigo-200/60">
                    <span className="font-semibold">Total Biaya Sewa:</span>
                    <strong className="font-mono text-emerald-800">
                      Rp {totalAllRentalCost.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Status Breakdown Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800">Status Penyelesaian Permintaan Layanan:</h4>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 gap-0.5">
                <div 
                  className="bg-emerald-500" 
                  style={{ width: `${(totalCompleted / (filteredRequests.length || 1)) * 100}%` }} 
                  title={`Selesai: ${totalCompleted}`} 
                />
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${(totalInProgress / (filteredRequests.length || 1)) * 100}%` }} 
                  title={`Diproses: ${totalInProgress}`} 
                />
                <div 
                  className="bg-amber-500" 
                  style={{ width: `${(totalSubmitted / (filteredRequests.length || 1)) * 100}%` }} 
                  title={`Diajukan: ${totalSubmitted}`} 
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Selesai: <strong>{totalCompleted}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Sedang Diproses: <strong>{totalInProgress}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Diajukan: <strong>{totalSubmitted}</strong></span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DAFTAR DETAIL TRANSAKSI */}
        {/* ========================================================================= */}
        {activeReportTab === 'transaksi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">No. Transaksi</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Pemohon</th>
                  <th className="p-3.5">Jenis Layanan</th>
                  <th className="p-3.5">Keperluan &amp; Jumlah Volume</th>
                  <th className="p-3.5 text-right">Biaya Sewa (Bus/Kendaraan)</th>
                  <th className="p-3.5 text-center">Status</th>
                  {canManageOrDelete && <th className="p-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={canManageOrDelete ? 9 : 8} className="p-8 text-center text-slate-400">
                      Tidak ada data transaksi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const volText = getRequestVolumeText(r);
                    const rentalCost = getRequestRentalCost(r);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono">
                          {new Date(r.requestDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                          {r.requestNumber}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {(() => {
                            const canonical = resolveCanonicalUnit(r.unit, units);
                            return (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                  {canonical.code}
                                </span>
                                <span className="font-semibold text-slate-800 text-xs">
                                  {canonical.name}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3.5 text-slate-900 font-medium">
                          {r.userName}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.serviceType === 'fotocopy' 
                              ? 'bg-blue-100 text-blue-800' 
                              : r.serviceType === 'laminating' 
                              ? 'bg-teal-100 text-teal-800' 
                              : r.serviceType === 'air_galon' 
                              ? 'bg-cyan-100 text-cyan-800' 
                              : r.serviceType === 'kendaraan'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {r.serviceType === 'fotocopy' ? 'Foto Copy' : r.serviceType === 'laminating' ? 'Laminating' : r.serviceType === 'air_galon' ? 'Air Galon' : r.serviceType === 'kendaraan' ? (r.vehicleDetail?.vehicleCategory || 'Kendaraan') : r.serviceType}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <div className="font-semibold text-slate-800 truncate">{r.purpose || r.waterDetail?.roomName}</div>
                          <div className="text-[11px] text-blue-700 font-medium">{volText}</div>
                        </td>
                        <td className="p-3.5 text-right font-mono whitespace-nowrap">
                          {rentalCost > 0 ? (
                            <div>
                              <span className="font-bold text-amber-900 block">
                                Rp {rentalCost.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] font-sans font-semibold text-emerald-700">
                                {r.vehicleDetail?.rentalPaymentStatus || 'Sewa Vendor'}
                              </span>
                            </div>
                          ) : r.serviceType === 'kendaraan' ? (
                            <span className="text-[11px] text-slate-400 font-sans">Rp 0 (Milik Sekolah)</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <StatusBadge status={r.status} />
                        </td>
                        {canManageOrDelete && (
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteConfirm(r)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Hapus Transaksi (Admin & Super Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* DELETE CONFIRMATION MODAL (ADMIN & SUPER ADMIN) */}
      {requestToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
          }}
          title="Konfirmasi Hapus Transaksi"
          subtitle="Tindakan ini akan menghapus data transaksi dari sistem dan rekap laporan"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Warning Alert Banner */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
              <div className="p-2 bg-rose-100 rounded-lg shrink-0 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <strong className="block text-sm font-bold text-rose-950">
                  Apakah Anda yakin ingin menghapus transaksi ini?
                </strong>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Transaksi dengan status <strong>"{requestToDelete.status}"</strong> ini akan dihapus dari histori rekapitulasi, pencatatan log audit, serta database.
                </p>
              </div>
            </div>

            {/* Transaction Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Transaksi / Tiket</span>
                  <strong className="text-sm font-mono text-slate-900">{requestToDelete.requestNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <StatusBadge status={requestToDelete.status} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Layanan:</span>
                  <strong className="text-slate-900 capitalize">{requestToDelete.serviceType.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal:</span>
                  <span className="font-semibold text-slate-800">{new Date(requestToDelete.requestDate).toLocaleDateString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pemohon:</span>
                  <strong className="text-slate-900">{requestToDelete.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit:</span>
                  <span className="font-semibold text-slate-800">{requestToDelete.unit}</span>
                </div>
              </div>

              {requestToDelete.purpose && (
                <div className="pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500 block">Keperluan:</span>
                  <span className="italic text-slate-700">"{requestToDelete.purpose}"</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
