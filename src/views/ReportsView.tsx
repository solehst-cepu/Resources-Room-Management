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
  FileType
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from '../components/common/Badge';
import { ServiceRequest } from '../types';

interface ReportsViewProps {
  initialServiceFilter?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialServiceFilter }) => {
  const { requests, units, currentUser } = useApp();

  // Helper date generators
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // First day of current month
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // Active View Tab
  const [activeReportTab, setActiveReportTab] = useState<'unit' | 'layanan' | 'transaksi'>('unit');

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>(initialServiceFilter || 'all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date Range State
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [datePreset, setDatePreset] = useState<string>('bulan_ini');

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

      // Unit filter
      if (unitFilter !== 'all' && r.unit.toLowerCase() !== unitFilter.toLowerCase()) return false;

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = r.requestNumber?.toLowerCase().includes(q);
        const matchUser = r.userName?.toLowerCase().includes(q);
        const matchUnit = r.unit?.toLowerCase().includes(q);
        const matchPurpose = r.purpose?.toLowerCase().includes(q);
        const matchRoom = r.waterDetail?.roomName?.toLowerCase().includes(q);
        if (!matchNum && !matchUser && !matchUnit && !matchPurpose && !matchRoom) {
          return false;
        }
      }

      return true;
    });
  }, [requests, startDate, endDate, serviceFilter, unitFilter, statusFilter, searchQuery]);

  // Helper for Volume Description
  const getRequestVolumeText = (r: ServiceRequest): string => {
    if (r.serviceType === 'fotocopy' && r.photocopyDetail) {
      return `${r.photocopyDetail.totalSheets} Lembar (${r.photocopyDetail.colorType}, ${r.photocopyDetail.paperSize})`;
    } else if (r.serviceType === 'laminating' && r.laminatingDetail) {
      return `${r.laminatingDetail.quantity} Lembar (${r.laminatingDetail.paperSize})`;
    } else if (r.serviceType === 'air_galon' && r.waterDetail) {
      return `${r.waterDetail.gallonCount} Galon Isi (Retur: ${r.waterDetail.emptyGallonsReturned ?? 0} Kosong)`;
    } else if (r.items && r.items.length > 0) {
      const totalQty = r.items.reduce((s, it) => s + (it.quantityApproved ?? it.quantityRequested), 0);
      return `${totalQty} Pcs Barang`;
    }
    return '-';
  };

  // Aggregations
  const totalCompleted = filteredRequests.filter(r => r.status === 'Selesai').length;
  const totalInProgress = filteredRequests.filter(r => r.status === 'Sedang Diproses').length;
  const totalSubmitted = filteredRequests.filter(r => r.status === 'Diajukan').length;

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

  // Unit Breakdown Matrix
  const unitBreakdown = useMemo(() => {
    const map: Record<string, {
      unitName: string;
      ticketCount: number;
      fotocopySheets: number;
      laminatingSheets: number;
      waterGallons: number;
      emptyGallons: number;
    }> = {};

    // Initialize with all existing units from context
    units.forEach(u => {
      map[u.code] = {
        unitName: u.name,
        ticketCount: 0,
        fotocopySheets: 0,
        laminatingSheets: 0,
        waterGallons: 0,
        emptyGallons: 0,
      };
    });

    // Populate data
    filteredRequests.forEach(r => {
      const uKey = r.unit || 'General';
      if (!map[uKey]) {
        map[uKey] = {
          unitName: uKey,
          ticketCount: 0,
          fotocopySheets: 0,
          laminatingSheets: 0,
          waterGallons: 0,
          emptyGallons: 0,
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
      }
    });

    return Object.entries(map)
      .map(([code, val]) => ({ code, ...val }))
      .filter(item => unitFilter === 'all' ? item.ticketCount > 0 : item.code.toLowerCase() === unitFilter.toLowerCase())
      .sort((a, b) => b.ticketCount - a.ticketCount);
  }, [filteredRequests, units, unitFilter]);

  // Top user unit by tickets
  const topUnit = unitBreakdown[0]?.code || '-';

  // Export CSV
  const exportToCSV = () => {
    const periodLabel = startDate && endDate ? `${startDate}_sd_${endDate}` : 'Semua_Periode';
    
    // Header Section
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'LAPORAN REKAPITULASI JUMLAH LAYANAN RESOURCES ROOM - LAZUARDI GCS\n';
    csvContent += `Periode Tanggal: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}\n`;
    csvContent += `Filter Layanan: ${serviceFilter === 'all' ? 'Semua Layanan' : serviceFilter.toUpperCase()}\n`;
    csvContent += `Filter Unit: ${unitFilter === 'all' ? 'Semua Unit' : unitFilter}\n`;
    csvContent += `Tanggal Unduh: ${new Date().toLocaleString('id-ID')}\n\n`;

    // 1. Rekap Per Unit Table
    csvContent += '=== REKAPITULASI JUMLAH PENGGUNAAN PER UNIT SEKOLAH ===\n';
    csvContent += 'Unit Sekolah,Jumlah Permintaan (Tiket),Foto Copy (Lembar),Laminating (Lembar),Air Galon Isi (Galon),Galon Kosong Retur (Galon),Persentase Permintaan (%)\n';
    
    const totalTickets = filteredRequests.length;

    unitBreakdown.forEach(u => {
      const pct = totalTickets > 0 ? Math.round((u.ticketCount / totalTickets) * 100) : 0;
      csvContent += `"${u.code} - ${u.unitName}",${u.ticketCount},${u.fotocopySheets},${u.laminatingSheets},${u.waterGallons},${u.emptyGallons},${pct}%\n`;
    });

    csvContent += `TOTAL KESELURUHAN,${totalTickets},${totalFotocopySheets},${totalLaminatingSheets},${totalWaterGallons},${totalEmptyGallonsReturned},100%\n\n`;

    // 2. Rincian Transaksi
    csvContent += '=== RINCIAN LOG TRANSAKSI PERMINTAAN ===\n';
    csvContent += 'Tanggal,Nomor Tiket,Unit,Nama Pemohon,Layanan,Keperluan / Ruangan,Jumlah & Rincian Volume,Status,Penerima / Petugas\n';

    filteredRequests.forEach(r => {
      const date = (r.requestDate || '').slice(0, 10);
      const svc = r.serviceType === 'fotocopy' ? 'Foto Copy' : r.serviceType === 'laminating' ? 'Laminating' : r.serviceType === 'air_galon' ? 'Air Galon' : r.serviceType;
      const vol = getRequestVolumeText(r).replace(/"/g, '""');
      const receiver = r.pickedUpBy || r.userName || '-';
      const purpose = (r.purpose || r.waterDetail?.roomName || '-').replace(/"/g, '""');

      csvContent += `"${date}","${r.requestNumber}","${r.unit}","${r.userName}","${svc}","${purpose}","${vol}","${r.status}","${receiver}"\n`;
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

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('LAPORAN REKAPITULASI JUMLAH LAYANAN RESOURCES ROOM (FOTO COPY, LAMINATING, AIR GALON)', 14, 17);

    // Metadata Bar
    doc.setFontSize(8);
    doc.text(`Dicetak: ${printDateStr} | Oleh: ${currentUser?.name || 'Administrator'} (${currentUser?.role || 'Admin RR'})`, pageWidth - 14, 10, { align: 'right' });
    doc.text(`Periode: ${periodLabel} | Filter: ${serviceFilter.toUpperCase()}`, pageWidth - 14, 17, { align: 'right' });

    let currentY = 32;

    // KPI Summary Section
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(14, currentY, pageWidth - 28, 18, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, pageWidth - 28, 18, 2, 2, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN REKAPITULASI JUMLAH LAYANAN:', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`• Total Permintaan: ${filteredRequests.length} Tiket (${totalCompleted} Selesai, ${totalInProgress} Proses, ${totalSubmitted} Diajukan)`, 18, currentY + 12);
    doc.text(`• Foto Copy: ${totalFotocopySheets.toLocaleString('id-ID')} Lembar | Laminating: ${totalLaminatingSheets.toLocaleString('id-ID')} Lembar`, 115, currentY + 12);
    doc.text(`• Air Galon: ${totalWaterGallons} Galon Isi (${totalEmptyGallonsReturned} Galon Kosong Retur)`, 205, currentY + 12);

    currentY += 24;

    // SECTION 1: TABEL REKAPITULASI PER UNIT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('1. REKAPITULASI JUMLAH PEMAKAIAN PER UNIT SEKOLAH', 14, currentY);

    const totalTickets = filteredRequests.length;

    const unitTableRows = unitBreakdown.map((u) => {
      const pct = totalTickets > 0 ? `${Math.round((u.ticketCount / totalTickets) * 100)}%` : '0%';
      return [
        `${u.code} - ${u.unitName}`,
        `${u.ticketCount} Tiket`,
        u.fotocopySheets > 0 ? `${u.fotocopySheets.toLocaleString('id-ID')} Lembar` : '-',
        u.laminatingSheets > 0 ? `${u.laminatingSheets.toLocaleString('id-ID')} Lembar` : '-',
        u.waterGallons > 0 ? `${u.waterGallons} Galon` : '-',
        u.emptyGallons > 0 ? `${u.emptyGallons} Retur` : '-',
        pct
      ];
    });

    // Add total row
    unitTableRows.push([
      'TOTAL KESELURUHAN',
      `${totalTickets} Tiket`,
      `${totalFotocopySheets.toLocaleString('id-ID')} Lembar`,
      `${totalLaminatingSheets.toLocaleString('id-ID')} Lembar`,
      `${totalWaterGallons} Galon`,
      `${totalEmptyGallonsReturned} Retur`,
      '100%'
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [[
        'Unit Sekolah', 
        'Jumlah Tiket', 
        'Foto Copy (Lbr)', 
        'Laminating (Lbr)', 
        'Air Galon Isi', 
        'Galon Retur', 
        'Persentase Permintaan (%)'
      ]],
      body: unitTableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 38 },
        3: { halign: 'center', cellWidth: 38 },
        4: { halign: 'center', cellWidth: 32 },
        5: { halign: 'center', cellWidth: 30 },
        6: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5
      },
      didParseCell: function(data) {
        if (data.row.index === unitTableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [226, 232, 240];
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    });

    const finalY1 = (doc as any).lastAutoTable?.finalY || currentY + 50;
    let nextY = finalY1 + 10;

    // If space remaining is low, start new page for transaction list
    if (nextY > 150) {
      doc.addPage();
      nextY = 20;
    }

    // SECTION 2: DAFTAR TRANSAKSI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`2. RINCIAN LOG TRANSAKSI PERMINTAAN TERFILTER (${filteredRequests.length} DATA)`, 14, nextY);

    const transactionRows = filteredRequests.map((r, idx) => {
      const date = (r.requestDate || '').slice(0, 10);
      const svc = r.serviceType === 'fotocopy' ? 'Foto Copy' : r.serviceType === 'laminating' ? 'Laminating' : r.serviceType === 'air_galon' ? 'Air Galon' : r.serviceType;
      const vol = getRequestVolumeText(r);
      const receiver = r.pickedUpBy || r.userName || '-';
      const purpose = r.purpose || r.waterDetail?.roomName || '-';

      return [
        (idx + 1).toString(),
        date,
        r.requestNumber,
        r.unit,
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Laporan Rekapitulasi</h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200">
                Fokus Jumlah &amp; Volume
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi kuantitas pemakaian Foto Copy, Laminating, dan Distribusi Air Galon per Unit Sekolah
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
                <option value="all">Semua Layanan (FC, Laminating, Air)</option>
                <option value="fotocopy">Layanan Foto Copy</option>
                <option value="laminating">Pelayanan Laminating</option>
                <option value="air_galon">Penyediaan Air Galon</option>
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
      {/* 4 SUMMARY STAT CARDS (FOCUSED ON QUANTITY & VOLUME ONLY) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
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

      </div>

      {/* ========================================================================= */}
      {/* TABS REKAPITULASI */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Navigation Tab Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
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
        {/* TAB 1: REKAPITULASI PER UNIT SEKOLAH */}
        {/* ========================================================================= */}
        {activeReportTab === 'unit' && (
          <div>
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Matriks Jumlah Pemakaian Layanan Tiap Unit Sekolah
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Periode: {startDate || 'Awal'} s/d {endDate || 'Sekarang'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Unit Sekolah</th>
                    <th className="p-3.5 text-center">Jumlah Permintaan</th>
                    <th className="p-3.5 text-center">Foto Copy (Lbr)</th>
                    <th className="p-3.5 text-center">Laminating (Lbr)</th>
                    <th className="p-3.5 text-center">Air Galon Isi</th>
                    <th className="p-3.5 text-center">Galon Kosong Retur</th>
                    <th className="p-3.5 text-center">Persentase (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada aktivitas layanan yang sesuai dengan filter tanggal atau kriteria yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    unitBreakdown.map((u) => {
                      const ticketPct = filteredRequests.length > 0 ? Math.round((u.ticketCount / filteredRequests.length) * 100) : 0;
                      return (
                        <tr key={u.code} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{u.code}</div>
                            <span className="text-[10px] text-slate-400 font-normal">{u.unitName}</span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            {u.ticketCount} Tiket
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            {u.fotocopySheets > 0 ? (
                              <span className="font-semibold text-blue-700">{u.fotocopySheets.toLocaleString('id-ID')} lbr</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            {u.laminatingSheets > 0 ? (
                              <span className="font-semibold text-teal-700">{u.laminatingSheets.toLocaleString('id-ID')} lbr</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            {u.waterGallons > 0 ? (
                              <span className="font-semibold text-cyan-700">{u.waterGallons} galon</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            {u.emptyGallons > 0 ? (
                              <span className="font-semibold text-amber-700">{u.emptyGallons} retur</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
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
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                  <tr>
                    <td className="p-3.5 uppercase tracking-wider">TOTAL KESELURUHAN</td>
                    <td className="p-3.5 text-center font-mono">{filteredRequests.length} Tiket</td>
                    <td className="p-3.5 text-center font-mono text-blue-800">{totalFotocopySheets.toLocaleString('id-ID')} lbr</td>
                    <td className="p-3.5 text-center font-mono text-teal-800">{totalLaminatingSheets.toLocaleString('id-ID')} lbr</td>
                    <td className="p-3.5 text-center font-mono text-cyan-800">{totalWaterGallons} galon</td>
                    <td className="p-3.5 text-center font-mono text-amber-800">{totalEmptyGallonsReturned} retur</td>
                    <td className="p-3.5 text-center font-mono">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KOMPOSISI PER LAYANAN */}
        {/* ========================================================================= */}
        {activeReportTab === 'layanan' && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
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
        {/* TAB 3: DAFTAR DETAIL TRANSAKSI */}
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
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada data transaksi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const volText = getRequestVolumeText(r);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono">
                          {new Date(r.requestDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                          {r.requestNumber}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          {r.unit}
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
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {r.serviceType === 'fotocopy' ? 'Foto Copy' : r.serviceType === 'laminating' ? 'Laminating' : r.serviceType === 'air_galon' ? 'Air Galon' : r.serviceType}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <div className="font-semibold text-slate-800 truncate">{r.purpose || r.waterDetail?.roomName}</div>
                          <div className="text-[11px] text-blue-700 font-medium">{volText}</div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
