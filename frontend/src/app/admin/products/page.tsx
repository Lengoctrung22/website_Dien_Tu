'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Package,
  Plus,
  Flame,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHotOnly, setFilterHotOnly] = useState(false);

  // Edit / Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'keyboard',
    brand: '',
    price: 0,
    discountPrice: 0,
    stock: 10,
    image: '',
    description: '',
    isHot: false,
    hotOrder: 1,
    switchSpec: '',
    refreshRateSpec: '',
    connectionSpec: '',
  });

  const loadProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filterHotOnly) params.set('isHot', 'true');
    params.set('limit', '50');

    const res = await fetchApi(`/products?${params.toString()}`);
    if (res.success && res.data) {
      setProducts(res.data.products || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => loadProducts(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterHotOnly]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'keyboard',
      brand: '',
      price: 1000000,
      discountPrice: 0,
      stock: 10,
      image: '',
      description: '',
      isHot: false,
      hotOrder: 1,
      switchSpec: '',
      refreshRateSpec: '',
      connectionSpec: 'Không dây',
    });
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: p.price,
      discountPrice: p.discountPrice || 0,
      stock: p.stock,
      image: p.images?.[0] || '',
      description: p.description || '',
      isHot: Boolean(p.isHot),
      hotOrder: p.hotOrder || 1,
      switchSpec: p.specs?.switch || '',
      refreshRateSpec: p.specs?.refreshRate || '',
      connectionSpec: p.specs?.connection || '',
    });
    setModalOpen(true);
  };

  const handleToggleHot = async (product: any) => {
    const newHot = !product.isHot;
    try {
      const res = await fetchApi(`/products/${product._id}/hot`, {
        method: 'PATCH',
        body: JSON.stringify({ isHot: newHot, hotOrder: product.hotOrder || 1 }),
      });
      if (res.success) {
        setProducts(products.map((p) => (p._id === product._id ? { ...p, isHot: newHot } : p)));
        setFeedback(`Đã ${newHot ? 'ghim' : 'hủy ghim'} sản phẩm HOT: "${product.name}"`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      alert('Không thể cập nhật trạng thái HOT');
    }
  };

  const handleUpdateHotOrder = async (productId: string, hotOrder: number) => {
    try {
      await fetchApi(`/products/${productId}/hot`, {
        method: 'PATCH',
        body: JSON.stringify({ hotOrder }),
      });
      setProducts(products.map((p) => (p._id === productId ? { ...p, hotOrder } : p)));
    } catch {
      alert('Lỗi cập nhật thứ tự');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetchApi(`/products/${productId}`, { method: 'DELETE' });
      if (res.success) {
        setProducts(products.filter((p) => p._id !== productId));
        setFeedback('Đã xóa sản phẩm!');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      alert('Không thể xóa sản phẩm');
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    const payload = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      price: Number(formData.price),
      discountPrice: Number(formData.discountPrice) || 0,
      stock: Number(formData.stock),
      images: formData.image ? [formData.image] : [],
      description: formData.description,
      isHot: formData.isHot,
      hotOrder: Number(formData.hotOrder),
      specs: {
        switch: formData.switchSpec || undefined,
        refreshRate: formData.refreshRateSpec || undefined,
        connection: formData.connectionSpec || undefined,
      },
    };

    try {
      if (editingProduct) {
        const res = await fetchApi(`/products/${editingProduct._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setFeedback('Đã cập nhật sản phẩm thành công!');
          setModalOpen(false);
          setTimeout(() => loadProducts(), 0);
        }
      } else {
        const res = await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setFeedback('Đã thêm sản phẩm mới thành công!');
          setModalOpen(false);
          setTimeout(() => loadProducts(), 0);
        }
      }
    } catch {
      alert('Lỗi khi lưu sản phẩm');
    }
    setModalLoading(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-500 dark:text-cyan-400" />
            <span>Quản Lý Sản Phẩm & Ghim Sản Phẩm HOT</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghim các thiết bị bán chạy lên trang chủ, sắp xếp thứ tự hiển thị và quản lý thông tin sản phẩm.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sản Phẩm Mới</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc thương hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadProducts}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Lọc
            </button>
          </div>

          <button
            onClick={() => setFilterHotOnly(!filterHotOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              filterHotOnly
                ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{filterHotOnly ? 'Đang lọc: Chỉ sản phẩm HOT' : 'Xem danh sách ghim HOT'}</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách sản phẩm...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Ảnh</th>
                  <th className="pb-3 px-3">Tên & Hãng</th>
                  <th className="pb-3 px-3">Danh Mục</th>
                  <th className="pb-3 px-3">Giá Bán</th>
                  <th className="pb-3 px-3">Tồn Kho</th>
                  <th className="pb-3 px-3 text-center">Ghim HOT</th>
                  <th className="pb-3 px-3 text-center">Thứ Tự HOT</th>
                  <th className="pb-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=100&q=80'}
                          alt={p.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{p.brand}</span>
                    </td>
                    <td className="py-3 px-3 uppercase text-slate-500 font-semibold">{p.category}</td>
                    <td className="py-3 px-3">
                      <span className="font-black text-indigo-600 dark:text-cyan-400">
                        {formatVND(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold">{p.stock}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleHot(p)}
                        className={`p-2 rounded-xl border transition-all ${
                          p.isHot
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/40 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={p.isHot ? 'Bấm để hủy ghim HOT' : 'Bấm để ghim lên mục HOT trang chủ'}
                      >
                        <Flame className={`w-4 h-4 ${p.isHot ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.isHot ? (
                        <input
                          type="number"
                          value={p.hotOrder || 1}
                          onChange={(e) => handleUpdateHotOrder(p._id, Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded-lg text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-cyan-400 hover:bg-indigo-50 dark:hover:bg-slate-800"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bàn phím cơ ASUS ROG Azoth 75%..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Danh mục <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="monitor">Màn hình máy tính</option>
                    <option value="keyboard">Bàn phím cơ</option>
                    <option value="mouse">Chuột gaming</option>
                    <option value="headphone">Tai nghe</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thương hiệu (Brand) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ASUS, Logitech, Razer, Keychron..."
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Giá gốc (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Giá giảm (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tồn kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Hình ảnh chính
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Loại Switch
                  </label>
                  <input
                    type="text"
                    placeholder="Jupiter Brown, Linear..."
                    value={formData.switchSpec}
                    onChange={(e) => setFormData({ ...formData, switchSpec: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tần số quét
                  </label>
                  <input
                    type="text"
                    placeholder="240Hz, 165Hz..."
                    value={formData.refreshRateSpec}
                    onChange={(e) => setFormData({ ...formData, refreshRateSpec: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kiểu kết nối
                  </label>
                  <input
                    type="text"
                    placeholder="Không dây 2.4G, Type-C..."
                    value={formData.connectionSpec}
                    onChange={(e) => setFormData({ ...formData, connectionSpec: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none"
                />
              </div>

              {/* Hot switch */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={formData.isHot}
                    onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Ghim hiển thị tại mục &quot;Sản Phẩm HOT&quot;</span>
                </label>

                {formData.isHot && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-slate-400">Thứ tự:</span>
                    <input
                      type="number"
                      value={formData.hotOrder}
                      onChange={(e) => setFormData({ ...formData, hotOrder: Number(e.target.value) })}
                      className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-700 text-center font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md"
                >
                  {modalLoading ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
