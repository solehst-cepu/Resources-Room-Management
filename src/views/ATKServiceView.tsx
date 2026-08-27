import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MasterItem, ServiceRequest, RequestItemDetail } from '../types';
import { 
  PenTool, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  X, 
  Printer, 
  AlertTriangle, 
  Layers, 
  Package, 
  ShoppingCart,
  Send,
  Eye,
  Edit2
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface ATKServiceViewProps {
  onOpenReceipt: (req: ServiceRequest) => void;
}

export const ATKServiceView: React.FC<ATKServiceViewProps> = ({ onOpenReceipt }) => {
  const { 
    currentUser, 
    items, 
    requests, 
    createRequest, 
    updateRequestStatus, 
    addMasterItem, 
    updateMasterItem, 
    deleteMasterItem 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'permintaan' | 'katalog' | 'buat_baru'>('permintaan');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Multi-item Request State
  const [cartItems, setCartItems] = useState<{ item: MasterItem; quantity: number; notes?: string }[]>([]);
  const [requestMeta, setRequestMeta] = useState({
    urgency: 'Biasa' as 'Biasa' | 'Penting' | 'Mendesak',
    purpose: '',
    notes: ''
  });

  // Action / Approval Modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [approvedQtyMap, setApprovedQtyMap] = useState<Record<string, number>>({});
  const [adminNotes, setAdminNotes] = useState('');

  // ATK items only (Kertas, ATK, Tinta, Ops)
  const atkMasterItems = items.filter(i => i.category !== 'Air Galon');
  const atkRequests = requests.filter(r => r.serviceType === 'atk');

  const filteredItems = atkMasterItems.filter(item => {
    const matchQ = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchC = selectedCategory === 'all' || item.category === selectedCategory;
    return matchQ && matchC;
  });

  // Cart operations
  const addToCart = (item: MasterItem) => {
    setCartItems(prev => {
      const exists = prev.find(p => p.item.id === item.id);
      if (exists) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: Math.min(item.stock, p.quantity + 1) } : p);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: string, qty: number) => {
    setCartItems(prev => prev.map(p => p.item.id === itemId ? { ...p, quantity: Math.max(1, qty) } : p));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(p => p.item.id !== itemId));
  };

  const submitMultiItemRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Pilih minimal satu barang ATK');
      return;
    }
    if (!requestMeta.purpose.trim()) {
      alert('Mohon isi alasan / keperluan permintaan');
      return;
    }

    const requestDetails: RequestItemDetail[] = cartItems.map(c => ({
      itemId: c.item.id,
      itemCode: c.item.code,
      itemName: c.item.name,
      category: c.item.category,
      unitMeasure: c.item.unitMeasure,
      quantityRequested: c.quantity,
      stockAvailable: c.item.stock,
      notes: c.notes
    }));

    createRequest({
      serviceType: 'atk',
      userId: currentUser?.id || 'usr-3',
      userName: currentUser?.name || 'Guru / Staff Lazuardi',
      userEmail: currentUser?.email || 'staff@lazuardi.sch.id',
      unit: currentUser?.unit || 'SMP',
      department: currentUser?.department || 'Guru',
      urgency: requestMeta.urgency,
      purpose: requestMeta.purpose,
      notes: requestMeta.notes,
      items: requestDetails
    });

    setCartItems([]);
    setRequestMeta({ urgency: 'Biasa', purpose: '', notes: '' });
    setActiveTab('permintaan');
  };

  const openActionModal = (req: ServiceRequest) => {
    setSelectedRequest(req);
    const initialMap: Record<string, number> = {};
    req.items.forEach(it => {
      initialMap[it.itemId] = it.quantityApproved ?? it.quantityRequested;
    });
    setApprovedQtyMap(initialMap);
    setAdminNotes(req.adminNotes || '');
    setIsActionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-600 text-white rounded-xl shadow-xs">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Modul Pelayanan ATK &amp; Kertas</h2>
            <p className="text-xs text-slate-500">
              Pengajuan kebutuhan alat tulis kantor, spidol whiteboard, kertas HVS, binder, map, dan tinta printer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('buat_baru')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Form Pengajuan ATK</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('permintaan')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'permintaan' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daftar Permintaan ATK ({atkRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('buat_baru')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'buat_baru' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Buat Pengajuan Multi-Item {cartItems.length > 0 && `(${cartItems.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('katalog')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'katalog' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Katalog Stok ATK ({atkMasterItems.length})
        </button>
      </div>

      {/* TAB 1: DAFTAR PERMINTAAN ATK */}
      {activeTab === 'permintaan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Permintaan &amp; Distribusi ATK
            </h3>
            <span className="text-xs text-slate-500">Total {atkRequests.length} tiket</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">No. Tiket</th>
                  <th className="p-3.5">Pemohon</th>
                  <th className="p-3.5">Unit / Bagian</th>
                  <th className="p-3.5">Rincian Barang</th>
                  <th className="p-3.5">Keperluan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atkRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada permohonan ATK yang diajukan
                    </td>
                  </tr>
                ) : (
                  atkRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-sky-900">{req.requestNumber}</td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 block">{req.userName}</strong>
                        <span className="text-[10px] text-slate-400">{new Date(req.requestDate).toLocaleDateString('id-ID')}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{req.unit}</td>
                      <td className="p-3.5">
                        <div className="space-y-1 max-w-sm">
                          {req.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                              <span className="font-medium text-slate-800 truncate mr-2">{it.itemName}</span>
                              <span className="font-bold text-sky-800 shrink-0">
                                {it.quantityApproved ?? it.quantityRequested} {it.unitMeasure}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{req.purpose}</td>
                      <td className="p-3.5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onOpenReceipt(req)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          Slip
                        </button>
                        
                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'manager' || currentUser?.role === 'admin_rr') && (
                          <button
                            onClick={() => openActionModal(req)}
                            className="px-2.5 py-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors cursor-pointer"
                          >
                            Kelola Status
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

      {/* TAB 2: MULTI-ITEM REQUEST BUILDER */}
      {activeTab === 'buat_baru' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Item Catalog Selector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama barang ATK, kertas, spidol..."
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
                <option value="all">Semua Kategori ATK</option>
                <option value="Kertas">Kertas</option>
                <option value="ATK">Alat Tulis (ATK)</option>
                <option value="Tinta / Toner">Tinta &amp; Toner</option>
                <option value="Barang Operasional Lainnya">Operasional Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const inCart = cartItems.some(c => c.item.id === item.id);
                const isOutOfStock = item.stock <= 0;

                return (
                  <div 
                    key={item.id}
                    className={`bg-white p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      inCart ? 'border-sky-500 ring-1 ring-sky-500/20 bg-sky-50/20' : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {item.code}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-2">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.category} • Lokasi: {item.location}</p>

                      <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500">Stok:</span>
                        <strong className={`font-bold ${item.stock <= item.minStock ? 'text-amber-600' : 'text-slate-800'}`}>
                          {item.stock} {item.unitMeasure}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(item)}
                      className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : (inCart ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 cursor-pointer' : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer')
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? 'Tambah Jumlah' : 'Pilih Barang'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Shopping Cart & Submit Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <form onSubmit={submitMultiItemRequest} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Daftar Barang Diminta</h3>
                </div>
                <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  {cartItems.length} Item
                </span>
              </div>

              {/* Cart List */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada barang dipilih. Klik &quot;Pilih Barang&quot; di samping.
                  </div>
                ) : (
                  cartItems.map((cart) => (
                    <div key={cart.item.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <strong className="text-slate-900 block truncate">{cart.item.name}</strong>
                        <span className="text-[11px] text-slate-400">Stok: {cart.item.stock} {cart.item.unitMeasure}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max={cart.item.stock}
                          value={cart.quantity}
                          onChange={(e) => updateCartQty(cart.item.id, Number(e.target.value))}
                          className="w-14 p-1 text-center font-bold text-slate-800 border border-slate-300 rounded outline-sky-600"
                        />
                        <span className="text-[11px] text-slate-500 font-medium">{cart.item.unitMeasure}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(cart.item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Meta Inputs */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Urgensi</label>
                  <select
                    value={requestMeta.urgency}
                    onChange={(e) => setRequestMeta({ ...requestMeta, urgency: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="Biasa">Biasa (Stok Mingguan)</option>
                    <option value="Penting">Penting (Ujian / Kegiatan Sekolah)</option>
                    <option value="Mendesak">Mendesak (Habis saat Jam Pelajaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keperluan / Alasan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Modul latihan ujian SD kelas 6"
                    value={requestMeta.purpose}
                    onChange={(e) => setRequestMeta({ ...requestMeta, purpose: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan untuk Resources Room..."
                    value={requestMeta.notes}
                    onChange={(e) => setRequestMeta({ ...requestMeta, notes: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cartItems.length === 0}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
                  cartItems.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Kirim Permintaan ({cartItems.length} Item)</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: KATALOG LENGKAP STOK ATK */}
      {activeTab === 'katalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Data Master &amp; Stok Barang ATK
            </h3>
            <span className="text-xs text-slate-500">{atkMasterItems.length} jenis barang</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Kode</th>
                  <th className="p-3.5">Nama Barang</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5 text-center">Stok Saat Ini</th>
                  <th className="p-3.5 text-center">Min. Stok</th>
                  <th className="p-3.5">Lokasi Rak</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Harga Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atkMasterItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="p-3.5">
                      <strong className="text-slate-900 block">{item.name}</strong>
                      <span className="text-[10px] text-slate-400">{item.description}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">{item.category}</td>
                    <td className="p-3.5 text-center font-bold">
                      <span className={item.stock <= item.minStock ? 'text-amber-600' : 'text-slate-800'}>
                        {item.stock} {item.unitMeasure}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-slate-400">{item.minStock} {item.unitMeasure}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">{item.location}</td>
                    <td className="p-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-3.5 text-right font-semibold text-teal-800">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Process & Approval ATK */}
      {selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Proses Permintaan ATK: ${selectedRequest.requestNumber}`}
          subtitle={`Pemohon: ${selectedRequest.userName} (${selectedRequest.unit})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Status:</span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <span className="text-slate-500 block">Keperluan:</span>
                <span className="text-slate-800 font-semibold">{selectedRequest.purpose}</span>
              </div>
            </div>

            {/* Approval Table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Verifikasi Jumlah Barang yang Disetujui:</h4>
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2">Nama Barang</th>
                    <th className="p-2 text-center">Stok Gudang</th>
                    <th className="p-2 text-center">Diminta</th>
                    <th className="p-2 text-center">Disetujui</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRequest.items.map((it) => (
                    <tr key={it.itemId}>
                      <td className="p-2">
                        <strong className="block text-slate-900">{it.itemName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{it.itemCode}</span>
                      </td>
                      <td className="p-2 text-center text-slate-600 font-mono">
                        {it.stockAvailable ?? 10} {it.unitMeasure}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-800">
                        {it.quantityRequested} {it.unitMeasure}
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={it.quantityRequested}
                          value={approvedQtyMap[it.itemId] ?? it.quantityRequested}
                          onChange={(e) => setApprovedQtyMap({
                            ...approvedQtyMap,
                            [it.itemId]: Number(e.target.value)
                          })}
                          disabled={selectedRequest.status === 'Selesai'}
                          className="w-16 p-1 text-center font-bold text-teal-800 border border-slate-300 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {(selectedRequest.status === 'Menunggu Approval' || selectedRequest.status === 'Diajukan') && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'Disetujui', { quantityApprovedMap: approvedQtyMap });
                      setIsActionModalOpen(false);
                    }}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Setujui Permintaan
                  </button>

                  <button
                    onClick={() => {
                      const reason = window.prompt('Alasan penolakan:');
                      if (reason) {
                        updateRequestStatus(selectedRequest.id, 'Ditolak', { rejectionReason: reason });
                        setIsActionModalOpen(false);
                      }
                    }}
                    className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Tolak Permintaan
                  </button>
                </div>
              )}

              {selectedRequest.status === 'Disetujui' && (
                <button
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Sedang Disiapkan');
                    setIsActionModalOpen(false);
                  }}
                  className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Mulai Ambil &amp; Packing Barang ATK di Rak RR
                </button>
              )}

              {selectedRequest.status === 'Sedang Disiapkan' && (
                <button
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Siap Diambil');
                    setIsActionModalOpen(false);
                  }}
                  className="w-full p-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Tandai &quot;Siap Diambil&quot; di Resources Room
                </button>
              )}

              {selectedRequest.status === 'Siap Diambil' && (
                <button
                  onClick={() => {
                    const picker = window.prompt('Nama penerima barang:', selectedRequest.userName);
                    if (picker) {
                      updateRequestStatus(selectedRequest.id, 'Selesai', { pickedUpBy: picker });
                      setIsActionModalOpen(false);
                    }
                  }}
                  className="w-full p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Serahkan Barang (Selesai &amp; Kurangi Stok Otomatis)
                </button>
              )}

              {selectedRequest.status === 'Selesai' && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-center font-bold">
                  ✅ Permintaan telah selesai didistribusikan.
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

    </div>
  );
};
