import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MasterItem, StockTransaction, ItemCategory } from '../types';
import { 
  Boxes, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ClipboardCheck, 
  FileText, 
  AlertTriangle, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle,
  PackagePlus,
  PackageMinus,
  Layers,
  History,
  TrendingDown,
  Warehouse
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface InventoryViewProps {
  initialSubtab?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ initialSubtab = 'barang' }) => {
  const { 
    currentUser, 
    items, 
    uniforms, 
    stockTransactions, 
    suppliers, 
    locations, 
    addMasterItem, 
    updateMasterItem, 
    deleteMasterItem, 
    processStockIn, 
    processStockOut, 
    processStockOpname 
  } = useApp();

  const [activeSubtab, setActiveSubtab] = useState<'barang' | 'stock_in' | 'stock_out' | 'opname' | 'stock_card' | 'low_stock'>(
    (initialSubtab as any) || 'barang'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockCardItem, setSelectedStockCardItem] = useState<string>('all');

  // Master Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    category: 'ATK' as ItemCategory,
    unitMeasure: 'Pcs',
    stock: 20,
    minStock: 5,
    location: 'RR-RAK-B2',
    price: 25000,
    supplier: 'PT Gramedia Asri Media',
    description: ''
  });

  // Stock In Form Modal
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInForm, setStockInForm] = useState({
    itemId: items[0]?.id || '',
    quantity: 10,
    sourceReason: 'Pengadaan' as any,
    referenceNo: '',
    notes: 'Pengadaan barang operasional sekolah'
  });

  // Stock Out Form Modal
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [stockOutForm, setStockOutForm] = useState({
    itemId: items[0]?.id || '',
    quantity: 5,
    sourceReason: 'Distribusi Unit' as any,
    referenceNo: '',
    notes: 'Distribusi langsung ke unit'
  });

  // Stock Opname Form Modal
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [opnameForm, setOpnameForm] = useState({
    itemId: items[0]?.id || '',
    physicalCount: 0,
    notes: 'Hasil stock opname berkala'
  });

  // Filtered Master Items
  const filteredItems = items.filter(i => {
    const matchQ = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchC = selectedCategory === 'all' || i.category === selectedCategory;
    return matchQ && matchC;
  });

  // Low stock list
  const lowStockItems = items.filter(i => i.stock <= i.minStock);
  const lowStockUniforms = uniforms.filter(u => u.stock <= u.minStock);

  // Filtered transactions for Stock Card
  const filteredTransactions = stockTransactions.filter(trx => {
    if (selectedStockCardItem === 'all') return true;
    return trx.itemId === selectedStockCardItem;
  });

  // Handle Save Master Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMasterItem(editingItem.id, {
        code: itemForm.code,
        name: itemForm.name,
        category: itemForm.category,
        unitMeasure: itemForm.unitMeasure,
        stock: Number(itemForm.stock),
        minStock: Number(itemForm.minStock),
        location: itemForm.location,
        price: Number(itemForm.price),
        supplier: itemForm.supplier,
        description: itemForm.description
      });
    } else {
      addMasterItem({
        code: itemForm.code || `ATK-${Date.now().toString().slice(-4)}`,
        name: itemForm.name,
        category: itemForm.category,
        unitMeasure: itemForm.unitMeasure,
        stock: Number(itemForm.stock),
        minStock: Number(itemForm.minStock),
        location: itemForm.location,
        price: Number(itemForm.price),
        supplier: itemForm.supplier,
        description: itemForm.description
      });
    }
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const openEditItem = (it: MasterItem) => {
    setEditingItem(it);
    setItemForm({
      code: it.code,
      name: it.name,
      category: it.category,
      unitMeasure: it.unitMeasure,
      stock: it.stock,
      minStock: it.minStock,
      location: it.location,
      price: it.price,
      supplier: it.supplier || '',
      description: it.description || ''
    });
    setIsItemModalOpen(true);
  };

  // Stock In Submit
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processStockIn(
      stockInForm.itemId,
      Number(stockInForm.quantity),
      stockInForm.sourceReason,
      stockInForm.notes,
      stockInForm.referenceNo
    );
    setIsStockInModalOpen(false);
  };

  // Stock Out Submit
  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processStockOut(
      stockOutForm.itemId,
      Number(stockOutForm.quantity),
      stockOutForm.sourceReason,
      stockOutForm.notes,
      stockOutForm.referenceNo
    );
    setIsStockOutModalOpen(false);
  };

  // Stock Opname Submit
  const handleOpnameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processStockOpname(
      opnameForm.itemId,
      Number(opnameForm.physicalCount),
      opnameForm.notes
    );
    setIsOpnameModalOpen(false);
  };

  const categories: ItemCategory[] = [
    'Seragam',
    'ATK',
    'Air Galon',
    'Kertas',
    'Tinta / Toner',
    'Barang Operasional Lainnya'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-700 text-white rounded-xl shadow-xs">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Modul Inventori &amp; Stock Management</h2>
            <p className="text-xs text-slate-500">
              Pengelolaan master barang, stok masuk (in), stok keluar (out), stock opname fisik &amp; kartu stok ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setStockInForm({ itemId: items[0]?.id || '', quantity: 10, sourceReason: 'Pengadaan', referenceNo: '', notes: '' });
              setIsStockInModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Stock In (+)</span>
          </button>

          <button
            onClick={() => {
              setStockOutForm({ itemId: items[0]?.id || '', quantity: 2, sourceReason: 'Distribusi Unit', referenceNo: '', notes: '' });
              setIsStockOutModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PackageMinus className="w-4 h-4" />
            <span>Stock Out (-)</span>
          </button>

          <button
            onClick={() => {
              const first = items[0];
              setOpnameForm({ itemId: first?.id || '', physicalCount: first?.stock || 0, notes: '' });
              setIsOpnameModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Stock Opname</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setItemForm({
                code: `ATK-${Date.now().toString().slice(-4)}`,
                name: '',
                category: 'ATK',
                unitMeasure: 'Pcs',
                stock: 20,
                minStock: 5,
                location: 'RR-RAK-B2',
                price: 25000,
                supplier: 'PT Gramedia Asri Media',
                description: ''
              });
              setIsItemModalOpen(true);
            }}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Master Barang</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubtab('barang')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeSubtab === 'barang' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Data Barang ({items.length})
        </button>

        <button
          onClick={() => setActiveSubtab('stock_in')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubtab === 'stock_in' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stock In (Penerimaan)</span>
        </button>

        <button
          onClick={() => setActiveSubtab('stock_out')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubtab === 'stock_out' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          <span>Stock Out (Pengeluaran)</span>
        </button>

        <button
          onClick={() => setActiveSubtab('opname')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubtab === 'opname' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Stock Opname Fisik</span>
        </button>

        <button
          onClick={() => setActiveSubtab('stock_card')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubtab === 'stock_card' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Kartu Stok (Ledger)</span>
        </button>

        <button
          onClick={() => setActiveSubtab('low_stock')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubtab === 'low_stock' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Stok Menipis ({lowStockItems.length + lowStockUniforms.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: DATA MASTER BARANG */}
      {activeSubtab === 'barang' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode barang, nama barang, rak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 bg-transparent border-none outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Kode</th>
                    <th className="p-3.5">Nama Barang &amp; Spesifikasi</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-center">Stok Fisik</th>
                    <th className="p-3.5 text-center">Batas Min</th>
                    <th className="p-3.5">Lokasi Rak</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5 text-right">Harga Satuan</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{item.code}</td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 block">{item.name}</strong>
                        <span className="text-[10px] text-slate-400">{item.description}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{item.category}</td>
                      <td className="p-3.5 text-center font-bold">
                        <span className={item.stock <= item.minStock ? 'text-amber-600 font-black' : 'text-slate-900'}>
                          {item.stock} {item.unitMeasure}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-400 font-mono">{item.minStock} {item.unitMeasure}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">{item.location}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">{item.supplier || '-'}</td>
                      <td className="p-3.5 text-right font-semibold text-emerald-800">
                        Rp {item.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditItem(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                          title="Edit Data Barang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus ${item.name} dari sistem?`)) {
                              deleteMasterItem(item.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2 & 3: STOCK IN / STOCK OUT LOG */}
      {(activeSubtab === 'stock_in' || activeSubtab === 'stock_out') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeSubtab === 'stock_in' ? 'Riwayat Transaksi Stock In (Penerimaan Barang)' : 'Riwayat Transaksi Stock Out (Pengeluaran Barang)'}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">No. Transaksi</th>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5">Nama Barang</th>
                  <th className="p-3.5">Alasan / Sumber</th>
                  <th className="p-3.5 text-center">Jumlah</th>
                  <th className="p-3.5 text-center">Stok Sebelum</th>
                  <th className="p-3.5 text-center">Stok Sesudah</th>
                  <th className="p-3.5">No. Referensi</th>
                  <th className="p-3.5">Petugas</th>
                  <th className="p-3.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockTransactions
                  .filter(trx => trx.type === (activeSubtab === 'stock_in' ? 'IN' : 'OUT'))
                  .map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{trx.transactionNumber}</td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(trx.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">{trx.itemName}</td>
                      <td className="p-3.5 text-slate-600">{trx.sourceReason}</td>
                      <td className="p-3.5 text-center font-bold">
                        <span className={trx.type === 'IN' ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                          {trx.type === 'IN' ? `+${trx.quantity}` : `-${trx.quantity}`} {trx.unitMeasure}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-500 font-mono">{trx.beforeStock}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900">{trx.afterStock}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{trx.referenceNo || '-'}</td>
                      <td className="p-3.5 text-slate-700">{trx.userName}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">{trx.notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: STOCK OPNAME FISIK */}
      {activeSubtab === 'opname' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-700" />
              <div>
                <h4 className="text-xs font-bold text-blue-900">Stock Opname &amp; Penyesuaian Fisik Berkala</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Lakukan pencocokan jumlah fisik di gudang dengan sistem. Selisih akan otomatis di-adjust.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const first = items[0];
                setOpnameForm({ itemId: first?.id || '', physicalCount: first?.stock || 0, notes: '' });
                setIsOpnameModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Input Opname Fisik
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Status Perhitungan Stok Sistem vs Fisik
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Kode</th>
                    <th className="p-3.5">Nama Barang</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Lokasi Rak</th>
                    <th className="p-3.5 text-center">Stok Terkini</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Aksi Opname</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{it.code}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{it.name}</td>
                      <td className="p-3.5 text-slate-600">{it.category}</td>
                      <td className="p-3.5 font-mono text-slate-600">{it.location}</td>
                      <td className="p-3.5 text-center font-bold text-slate-900 text-sm">
                        {it.stock} {it.unitMeasure}
                      </td>
                      <td className="p-3.5 text-center">
                        <StatusBadge status={it.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setOpnameForm({ itemId: it.id, physicalCount: it.stock, notes: 'Penyesuaian opname rutin' });
                            setIsOpnameModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                        >
                          Sesuaikan Fisik
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: KARTU STOK (STOCK CARD) */}
      {activeSubtab === 'stock_card' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Kartu Stok (Stock Ledger)
              </h3>
              <p className="text-xs text-slate-500">Mutasi barang masuk, keluar, dan saldo berjalan</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Pilih Barang:</label>
              <select
                value={selectedStockCardItem}
                onChange={(e) => setSelectedStockCardItem(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
              >
                <option value="all">Semua Mutasi Barang</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                {uniforms.map(u => <option key={u.id} value={u.id}>[Seragam] {u.name} - Size {u.size}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">No. Transaksi</th>
                    <th className="p-3.5">Nama Barang</th>
                    <th className="p-3.5">Jenis Transaksi</th>
                    <th className="p-3.5 text-center text-emerald-800">Masuk (IN)</th>
                    <th className="p-3.5 text-center text-rose-800">Keluar (OUT)</th>
                    <th className="p-3.5 text-center font-bold">Saldo Akhir</th>
                    <th className="p-3.5">Referensi</th>
                    <th className="p-3.5">Petugas</th>
                    <th className="p-3.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(trx.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{trx.transactionNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{trx.itemName}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : (trx.type === 'OUT' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800')
                        }`}>
                          {trx.type} - {trx.sourceReason}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">
                        {trx.type === 'IN' ? `+${trx.quantity}` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-bold text-rose-700">
                        {trx.type === 'OUT' ? `-${trx.quantity}` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-slate-900 bg-slate-50">
                        {trx.afterStock} {trx.unitMeasure}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{trx.referenceNo || '-'}</td>
                      <td className="p-3.5 text-slate-700">{trx.userName}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">{trx.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 6: LOW STOCK ALERT */}
      {activeSubtab === 'low_stock' && (
        <div className="space-y-4">
          <div className="bg-amber-500 text-slate-950 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-slate-950" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Peringatan: Stok Menipis di Bawah Batas Minimum!</h4>
                <p className="text-xs text-slate-900 mt-0.5">
                  Segera lakukan pengadaan (Stock In) atau hubungi supplier terkait sebelum stok habis total.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      {item.code}
                    </span>
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                      ⚠️ Sisa {item.stock} {item.unitMeasure}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.category} • Rak: {item.location}</p>

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Stok Saat Ini</span>
                      <strong className="text-rose-600 font-bold text-sm">{item.stock}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Batas Minimum</span>
                      <strong className="text-slate-800 font-bold text-sm">{item.minStock}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Supplier</span>
                      <strong className="text-slate-700 text-xs truncate max-w-[90px] block">{item.supplier || '-'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStockInForm({
                      itemId: item.id,
                      quantity: item.minStock * 2,
                      sourceReason: 'Pengadaan',
                      referenceNo: `PO-REORDER-${Date.now().toString().slice(-4)}`,
                      notes: `Re-order mendesak stok menipis ${item.name}`
                    });
                    setIsStockInModalOpen(true);
                  }}
                  className="mt-4 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Pengadaan / Stock In Cepat</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Master Item Form */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Master Barang' : 'Tambah Master Barang Baru'}
        subtitle="Sistem Inventori Resources Room"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode Barang *</label>
              <input
                type="text"
                value={itemForm.code}
                onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Barang *</label>
            <input
              type="text"
              placeholder="Contoh: Kertas HVS A4 80gr PaperOne"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Satuan (Unit)</label>
              <input
                type="text"
                placeholder="Rim / Pcs / Lusin / Box"
                value={itemForm.unitMeasure}
                onChange={(e) => setItemForm({ ...itemForm, unitMeasure: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stok Awal</label>
              <input
                type="number"
                value={itemForm.stock}
                onChange={(e) => setItemForm({ ...itemForm, stock: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Min. Stok (Alert)</label>
              <input
                type="number"
                value={itemForm.minStock}
                onChange={(e) => setItemForm({ ...itemForm, minStock: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lokasi Rak / Penyimpanan</label>
              <input
                type="text"
                placeholder="Contoh: RR-RAK-A1"
                value={itemForm.location}
                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Harga Satuan (Rp)</label>
              <input
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Supplier</label>
            <input
              type="text"
              placeholder="PT Gramedia Asri Media"
              value={itemForm.supplier}
              onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
            >
              Simpan Master Barang
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Stock In Form */}
      <Modal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        title="Input Pemasukan Barang (Stock In)"
        subtitle="Catat penambahan stok dari Pembelian / Pengadaan / Retur"
        maxWidth="md"
      >
        <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Barang *</label>
            <select
              value={stockInForm.itemId}
              onChange={(e) => setStockInForm({ ...stockInForm, itemId: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              required
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stok saat ini: {i.stock} {i.unitMeasure})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Masuk *</label>
              <input
                type="number"
                min="1"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sumber Penerimaan *</label>
              <select
                value={stockInForm.sourceReason}
                onChange={(e) => setStockInForm({ ...stockInForm, sourceReason: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="Pembelian">Pembelian Rutin</option>
                <option value="Pengadaan">Pengadaan Semester</option>
                <option value="Retur">Retur / Pengembalian</option>
                <option value="Transfer">Transfer Gudang</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. Referensi / No. Invoice PO</label>
            <input
              type="text"
              placeholder="Contoh: PO-2026-08-012"
              value={stockInForm.referenceNo}
              onChange={(e) => setStockInForm({ ...stockInForm, referenceNo: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan penerimaan barang..."
              value={stockInForm.notes}
              onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStockInModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
            >
              Simpan Stock In
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Stock Out Form */}
      <Modal
        isOpen={isStockOutModalOpen}
        onClose={() => setIsStockOutModalOpen(false)}
        title="Input Pengeluaran Barang Manual (Stock Out)"
        subtitle="Catat pengeluaran karena distribusi, barang rusak, atau penyesuaian"
        maxWidth="md"
      >
        <form onSubmit={handleStockOutSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Barang *</label>
            <select
              value={stockOutForm.itemId}
              onChange={(e) => setStockOutForm({ ...stockOutForm, itemId: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              required
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stok tersedia: {i.stock} {i.unitMeasure})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Keluar *</label>
              <input
                type="number"
                min="1"
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alasan Keluar *</label>
              <select
                value={stockOutForm.sourceReason}
                onChange={(e) => setStockOutForm({ ...stockOutForm, sourceReason: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="Distribusi Unit">Distribusi Unit Sekolah</option>
                <option value="Barang Rusak">Barang Rusak / Kadaluarsa</option>
                <option value="Kehilangan">Kehilangan / Selisih</option>
                <option value="Penyesuaian Stok">Penyesuaian Stok</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. Referensi / Surat Pengeluaran</label>
            <input
              type="text"
              placeholder="Contoh: OUT-2026-08-005"
              value={stockOutForm.referenceNo}
              onChange={(e) => setStockOutForm({ ...stockOutForm, referenceNo: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan</label>
            <textarea
              rows={2}
              placeholder="Catatan pengeluaran barang..."
              value={stockOutForm.notes}
              onChange={(e) => setStockOutForm({ ...stockOutForm, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStockOutModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer"
            >
              Simpan Stock Out
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Stock Opname */}
      <Modal
        isOpen={isOpnameModalOpen}
        onClose={() => setIsOpnameModalOpen(false)}
        title="Formulir Stock Opname Fisik"
        subtitle="Koreksi stok sistem berdasarkan hitungan fisik gudang RR"
        maxWidth="md"
      >
        <form onSubmit={handleOpnameSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Barang yang Dihitung *</label>
            <select
              value={opnameForm.itemId}
              onChange={(e) => {
                const target = items.find(i => i.id === e.target.value);
                setOpnameForm({
                  ...opnameForm,
                  itemId: e.target.value,
                  physicalCount: target?.stock || 0
                });
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
              required
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} — Stok Sistem Saat Ini: {i.stock} {i.unitMeasure}
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const currentSelected = items.find(i => i.id === opnameForm.itemId);
            const sysStock = currentSelected?.stock || 0;
            const diff = opnameForm.physicalCount - sysStock;

            return (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stok Tercatat Sistem:</span>
                  <strong className="text-slate-800 font-mono text-sm">{sysStock} {currentSelected?.unitMeasure}</strong>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jumlah Fisik Sebenarnya *</label>
                  <input
                    type="number"
                    min="0"
                    value={opnameForm.physicalCount}
                    onChange={(e) => setOpnameForm({ ...opnameForm, physicalCount: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-blue-400 rounded text-slate-900 font-black text-sm"
                    required
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Selisih Penyesuaian:</span>
                  <span className={`font-mono font-black text-sm ${diff === 0 ? 'text-slate-500' : (diff > 0 ? 'text-emerald-700' : 'text-rose-700')}`}>
                    {diff > 0 ? `+${diff}` : diff} {currentSelected?.unitMeasure}
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan / Alasan Selisih *</label>
            <textarea
              rows={2}
              placeholder="Contoh: Barang fisik rusak terkena air di rak B2 / penyesuaian hitung manual..."
              value={opnameForm.notes}
              onChange={(e) => setOpnameForm({ ...opnameForm, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
              required
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Terapkan Penyesuaian Opname
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
