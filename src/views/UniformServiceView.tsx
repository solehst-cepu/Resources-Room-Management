import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UniformItem, ServiceRequest } from '../types';
import { 
  Shirt, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Printer, 
  Eye, 
  AlertTriangle,
  Edit2,
  Trash2,
  PackageCheck,
  Building
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface UniformServiceViewProps {
  onOpenReceipt: (req: ServiceRequest) => void;
}

export const UniformServiceView: React.FC<UniformServiceViewProps> = ({ onOpenReceipt }) => {
  const { 
    currentUser, 
    uniforms, 
    requests, 
    units, 
    createRequest, 
    updateRequestStatus, 
    addUniform, 
    updateUniform, 
    deleteUniform 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'katalog' | 'permintaan' | 'master'>('permintaan');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');

  // Request Form Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    uniformId: uniforms[0]?.id || '',
    size: 'L',
    quantity: 1,
    urgency: 'Biasa' as 'Biasa' | 'Penting' | 'Mendesak',
    purpose: 'Penggantian seragam tahunan',
    notes: ''
  });

  // Master Uniform Add/Edit Modal
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<UniformItem | null>(null);
  const [masterForm, setMasterForm] = useState({
    code: '',
    name: '',
    category: 'Seragam Guru',
    size: 'L' as any,
    color: 'Tosca Khas Lazuardi',
    targetUnit: 'Guru',
    stock: 10,
    minStock: 4,
    location: 'RR-SRG-G1',
    price: 185000
  });

  // Action / Approval Modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const uniformRequests = requests.filter(r => r.serviceType === 'seragam');

  // Filtered Uniforms
  const filteredUniforms = uniforms.filter(u => {
    const matchQuery = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || u.category === selectedCategory;
    const matchSize = selectedSize === 'all' || u.size === selectedSize;
    return matchQuery && matchCat && matchSize;
  });

  // Handle Create Request
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUni = uniforms.find(u => u.id === requestForm.uniformId);
    if (!selectedUni) return;

    createRequest({
      serviceType: 'seragam',
      userId: currentUser?.id || 'usr-3',
      userName: currentUser?.name || 'Guru / Staff Lazuardi',
      userEmail: currentUser?.email || 'staff@lazuardi.sch.id',
      unit: currentUser?.unit || 'SMP',
      department: currentUser?.department || 'Guru',
      urgency: requestForm.urgency,
      purpose: requestForm.purpose,
      notes: requestForm.notes,
      items: [
        {
          itemId: selectedUni.id,
          itemCode: selectedUni.code,
          itemName: selectedUni.name,
          category: selectedUni.category,
          unitMeasure: 'Pcs',
          quantityRequested: Number(requestForm.quantity),
          size: requestForm.size,
          stockAvailable: selectedUni.stock
        }
      ]
    });

    setIsRequestModalOpen(false);
    setRequestForm({
      uniformId: uniforms[0]?.id || '',
      size: 'L',
      quantity: 1,
      urgency: 'Biasa',
      purpose: 'Penggantian seragam tahunan',
      notes: ''
    });
  };

  // Handle Master Save
  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUniform) {
      updateUniform(editingUniform.id, {
        code: masterForm.code,
        name: masterForm.name,
        category: masterForm.category,
        size: masterForm.size,
        color: masterForm.color,
        targetUnit: masterForm.targetUnit,
        stock: Number(masterForm.stock),
        minStock: Number(masterForm.minStock),
        location: masterForm.location,
        price: Number(masterForm.price)
      });
    } else {
      addUniform({
        code: masterForm.code || `SRG-${Date.now().toString().slice(-4)}`,
        name: masterForm.name,
        category: masterForm.category,
        size: masterForm.size,
        color: masterForm.color,
        targetUnit: masterForm.targetUnit,
        stock: Number(masterForm.stock),
        minStock: Number(masterForm.minStock),
        location: masterForm.location,
        price: Number(masterForm.price)
      });
    }
    setIsMasterModalOpen(false);
    setEditingUniform(null);
  };

  const openEditMaster = (uni: UniformItem) => {
    setEditingUniform(uni);
    setMasterForm({
      code: uni.code,
      name: uni.name,
      category: uni.category,
      size: uni.size,
      color: uni.color,
      targetUnit: uni.targetUnit,
      stock: uni.stock,
      minStock: uni.minStock,
      location: uni.location,
      price: uni.price
    });
    setIsMasterModalOpen(true);
  };

  const categories = [
    'Seragam Guru',
    'Seragam Karyawan',
    'Seragam Security',
    'Seragam Driver',
    'Seragam Cleaning Service',
    'Seragam Olahraga',
    'Seragam Event',
    'Atribut Seragam'
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Modul Pelayanan Seragam</h2>
            <p className="text-xs text-slate-500">
              Pengelolaan seragam guru, karyawan, security, CS, olahraga, dan atribut Sekolah Lazuardi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Seragam</span>
          </button>
          
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
            <button
              onClick={() => {
                setEditingUniform(null);
                setMasterForm({
                  code: `SRG-${Math.floor(Math.random() * 9000 + 1000)}`,
                  name: '',
                  category: 'Seragam Guru',
                  size: 'L',
                  color: 'Tosca Khas Lazuardi',
                  targetUnit: 'Guru',
                  stock: 10,
                  minStock: 4,
                  location: 'RR-SRG-G1',
                  price: 185000
                });
                setIsMasterModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              + Master Seragam
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('permintaan')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'permintaan'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daftar Permintaan Seragam ({uniformRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('katalog')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'katalog'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Katalog &amp; Stok Seragam ({uniforms.length})
        </button>

        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'master'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Data Master &amp; Harga
          </button>
        )}
      </div>

      {/* TAB 1: DAFTAR PERMINTAAN */}
      {activeTab === 'permintaan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Antrean Permintaan Seragam
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan {uniformRequests.length} permohonan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">No. Tiket</th>
                  <th className="p-3.5">Pemohon</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Seragam &amp; Ukuran</th>
                  <th className="p-3.5">Jumlah</th>
                  <th className="p-3.5">Keperluan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uniformRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Belum ada permintaan seragam yang diajukan
                    </td>
                  </tr>
                ) : (
                  uniformRequests.map((req) => {
                    const uniItem = req.items[0];
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-900">{req.requestNumber}</td>
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{req.userName}</strong>
                          <span className="text-[10px] text-slate-400">{new Date(req.requestDate).toLocaleDateString('id-ID')}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">{req.unit}</td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">{uniItem?.itemName}</span>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-teal-50 text-teal-800 text-[10px] font-bold rounded border border-teal-200">
                            Size: {uniItem?.size || 'L'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">{uniItem?.quantityRequested || 1} Pcs</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{req.purpose}</td>
                        <td className="p-3.5">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onOpenReceipt(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                            title="Cetak Surat / Bukti"
                          >
                            Slip
                          </button>
                          
                          {/* Workflow buttons */}
                          {(currentUser?.role === 'super_admin' || currentUser?.role === 'manager' || currentUser?.role === 'admin_rr') && (
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsActionModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors cursor-pointer"
                            >
                              Kelola Status
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
      )}

      {/* TAB 2: KATALOG & STOK SERAGAM */}
      {(activeTab === 'katalog' || activeTab === 'master') && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode seragam, nama motif..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
              >
                <option value="all">Semua Ukuran</option>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'All Size'].map(s => (
                  <option key={s} value={s}>Size {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of Uniform Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUniforms.map((uni) => {
              const isLow = uni.stock <= uni.minStock;
              return (
                <div 
                  key={uni.id} 
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-teal-400 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {uni.code}
                      </span>
                      <StatusBadge status={uni.status} />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2.5">{uni.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{uni.category} • {uni.color}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Ukuran:</span>
                        <strong className="text-slate-800 text-sm font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded">
                          {uni.size}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Stok Tersedia:</span>
                        <strong className={`text-sm font-bold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                          {uni.stock} Pcs
                        </strong>
                        <span className="text-[10px] text-slate-400 block">Min: {uni.minStock}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Lokasi: {uni.location}</span>
                      <span className="font-semibold text-teal-800">Rp {uni.price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setRequestForm(prev => ({ ...prev, uniformId: uni.id, size: uni.size }));
                        setIsRequestModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Ajukan Ini
                    </button>

                    {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_rr') && (
                      <button
                        onClick={() => openEditMaster(uni)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Data Master"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* MODAL: Form Permintaan Seragam */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Formulir Pengajuan Seragam Sekolah"
        subtitle="Sekolah Lazuardi GCS - Resources Room"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Pemohon:</span>
            <strong className="text-slate-900 text-sm">{currentUser?.name}</strong>
            <span className="text-slate-500 block text-[11px]">{currentUser?.unit} - {currentUser?.department}</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Jenis Seragam *</label>
            <select
              value={requestForm.uniformId}
              onChange={(e) => setRequestForm({ ...requestForm, uniformId: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              required
            >
              {uniforms.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} (Size: {u.size}, Stok: {u.stock} Pcs) - {u.category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ukuran *</label>
              <select
                value={requestForm.size}
                onChange={(e) => setRequestForm({ ...requestForm, size: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              >
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'All Size'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah (Pcs) *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tingkat Urgensi *</label>
            <select
              value={requestForm.urgency}
              onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value as any })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
            >
              <option value="Biasa">Biasa (Rutin)</option>
              <option value="Penting">Penting (Ada Jadwal Mengajar / Event)</option>
              <option value="Mendesak">Mendesak (Seragam Rusak / Tamu Luar)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alasan Permintaan *</label>
            <input
              type="text"
              placeholder="Contoh: Penggantian seragam tahunan / Guru baru"
              value={requestForm.purpose}
              onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Catatan ukuran khusus atau preferensi lengan panjang..."
              value={requestForm.notes}
              onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Kirim Pengajuan Seragam
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Master Uniform Add/Edit */}
      <Modal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        title={editingUniform ? 'Edit Master Seragam' : 'Tambah Master Seragam Baru'}
        subtitle="Katalog Inventori Seragam Lazuardi"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMaster} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode Seragam *</label>
              <input
                type="text"
                value={masterForm.code}
                onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
              <select
                value={masterForm.category}
                onChange={(e) => setMasterForm({ ...masterForm, category: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Seragam *</label>
            <input
              type="text"
              placeholder="Contoh: Batik Resmi Lazuardi Lengan Panjang"
              value={masterForm.name}
              onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ukuran *</label>
              <select
                value={masterForm.size}
                onChange={(e) => setMasterForm({ ...masterForm, size: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              >
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'All Size'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stok Awal *</label>
              <input
                type="number"
                value={masterForm.stock}
                onChange={(e) => setMasterForm({ ...masterForm, stock: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Min. Stok *</label>
              <input
                type="number"
                value={masterForm.minStock}
                onChange={(e) => setMasterForm({ ...masterForm, minStock: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Warna / Motif</label>
              <input
                type="text"
                value={masterForm.color}
                onChange={(e) => setMasterForm({ ...masterForm, color: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lokasi Lemari</label>
              <input
                type="text"
                value={masterForm.location}
                onChange={(e) => setMasterForm({ ...masterForm, location: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Estimasi Harga (Rp)</label>
            <input
              type="number"
              value={masterForm.price}
              onChange={(e) => setMasterForm({ ...masterForm, price: Number(e.target.value) })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 outline-teal-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {editingUniform && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Hapus seragam ini dari master?')) {
                    deleteUniform(editingUniform.id);
                    setIsMasterModalOpen(false);
                  }
                }}
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Hapus
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Simpan Master
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: Approval & Status Transition Workflow */}
      {selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Proses Permintaan: ${selectedRequest.requestNumber}`}
          subtitle={`Pemohon: ${selectedRequest.userName} (${selectedRequest.unit})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Saat Ini:</span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <span className="text-slate-500">Item Diminta:</span>
                <strong className="text-slate-900 block">
                  {selectedRequest.items[0]?.itemName} (Size: {selectedRequest.items[0]?.size}) × {selectedRequest.items[0]?.quantityRequested} Pcs
                </strong>
              </div>
            </div>

            {/* Workflow Action Buttons based on status */}
            <div className="space-y-2 pt-2">
              <p className="font-bold text-slate-800">Pilih Aksi Selanjutnya:</p>

              {(selectedRequest.status === 'Menunggu Approval' || selectedRequest.status === 'Diajukan') && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'Disetujui');
                      setIsActionModalOpen(false);
                    }}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Setujui (Approval)
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
                  Mulai Siapkan Seragam di Lemari RR
                </button>
              )}

              {selectedRequest.status === 'Sedang Disiapkan' && (
                <button
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'Siap Diambil', { adminNotes: 'Seragam telah dipacking dan siap di meja RR' });
                    setIsActionModalOpen(false);
                  }}
                  className="w-full p-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Tandai &quot;Siap Diambil&quot; (Kirim Notifikasi ke Pemohon)
                </button>
              )}

              {selectedRequest.status === 'Siap Diambil' && (
                <button
                  onClick={() => {
                    const picker = window.prompt('Nama pengambil seragam:', selectedRequest.userName);
                    if (picker) {
                      updateRequestStatus(selectedRequest.id, 'Selesai', { pickedUpBy: picker });
                      setIsActionModalOpen(false);
                    }
                  }}
                  className="w-full p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  Serahkan Seragam (Selesai &amp; Kurangi Stok)
                </button>
              )}

              {selectedRequest.status === 'Selesai' && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-center font-bold">
                  ✅ Permintaan telah selesai dan stok telah otomatis berkurang.
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
