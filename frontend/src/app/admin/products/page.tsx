'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  GripVertical,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { SingleImageUpload, GalleryUpload } from '@/components/admin/ImageUpload';
import { useAuthStore } from '@/store/authStore';
import AccessDenied from '@/components/admin/AccessDenied';

export default function AdminProductsPage() {
  const { hasPermission, isAdmin } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHotOnly, setFilterHotOnly] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Edit / Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const uploadingStateRef = useRef({ single: false, gallery: false });

  const handleUploadingChange = useCallback((type: 'single' | 'gallery', uploading: boolean) => {
    uploadingStateRef.current[type] = uploading;
    setIsUploadingImage(uploadingStateRef.current.single || uploadingStateRef.current.gallery);
  }, []);

  const handleSingleUploading = useCallback((uploading: boolean) => {
    handleUploadingChange('single', uploading);
  }, [handleUploadingChange]);

  const handleGalleryUploading = useCallback((uploading: boolean) => {
    handleUploadingChange('gallery', uploading);
  }, [handleUploadingChange]);

  const closeModal = useCallback(() => {
    uploadingStateRef.current = { single: false, gallery: false };
    setIsUploadingImage(false);
    setModalOpen(false);
  }, []);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'keyboard',
    brand: '',
    price: 0,
    discountPrice: 0,
    stock: 10,
    image: '',
    gallery: [] as string[],
    description: '',
    isHot: false,
    hotOrder: 1,
    switchSpec: '',
    refreshRateSpec: '',
    connectionSpec: '',
  });

  const loadProducts = async () => {
    if (!isAdmin() && !hasPermission('products')) return;
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
    uploadingStateRef.current = { single: false, gallery: false };
    setIsUploadingImage(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'keyboard',
      brand: '',
      price: 1000000,
      discountPrice: 0,
      stock: 10,
      image: '',
      gallery: [],
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
    uploadingStateRef.current = { single: false, gallery: false };
    setIsUploadingImage(false);
    setEditingProduct(p);
    const primaryImg = p.images?.[0] || '';
    const galleryImgs = Array.isArray(p.images) ? p.images.slice(1) : [];
    setFormData({
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: p.price,
      discountPrice: p.discountPrice || 0,
      stock: p.stock,
      image: primaryImg,
      gallery: galleryImgs,
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
      } else {
        alert(res.message || 'Không thể cập nhật trạng thái HOT');
      }
    } catch {
      alert('Không thể cập nhật trạng thái HOT');
    }
  };

  const handleUpdateHotOrder = async (productId: string, hotOrder: number) => {
    try {
      const res = await fetchApi(`/products/${productId}/hot`, {
        method: 'PATCH',
        body: JSON.stringify({ hotOrder }),
      });
      if (res.success) {
        setProducts(products.map((p) => (p._id === productId ? { ...p, hotOrder } : p)));
      } else {
        alert(res.message || 'Lỗi cập nhật thứ tự');
      }
    } catch {
      alert('Lỗi cập nhật thứ tự');
    }
  };

  const handleDropHotRow = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newProducts = [...products];
    const [removed] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(dropIndex, 0, removed);

    // Reassign hotOrder sequentially 1, 2, 3...
    const updatedProducts = newProducts.map((p, idx) => {
      if (p.isHot) {
        return { ...p, hotOrder: idx + 1 };
      }
      return p;
    });
    setProducts(updatedProducts);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      const hotItems = updatedProducts
        .filter((p) => p.isHot)
        .map((p) => ({ id: p._id, hotOrder: p.hotOrder }));

      if (hotItems.length > 0) {
        const res = await fetchApi('/products/hot/reorder', {
          method: 'PATCH',
          body: JSON.stringify({ items: hotItems }),
        });
        if (res.success) {
          setFeedback('Đã cập nhật thứ tự ghim HOT thành công!');
          setTimeout(() => setFeedback(null), 3000);
        } else {
          alert(res.message || 'Lỗi cập nhật thứ tự');
        }
      }
    } catch {
      alert('Lỗi cập nhật thứ tự HOT');
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

    const allImages = [formData.image, ...formData.gallery].filter(Boolean);

    const payload = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      price: Number(formData.price),
      discountPrice: Number(formData.discountPrice) || 0,
      stock: Number(formData.stock),
      images: allImages,
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
          closeModal();
          setTimeout(() => loadProducts(), 0);
        } else {
          alert(res.message || 'Lỗi khi lưu sản phẩm');
        }
      } else {
        const res = await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setFeedback('Đã thêm sản phẩm mới thành công!');
          closeModal();
          setTimeout(() => loadProducts(), 0);
        } else {
          alert(res.message || 'Lỗi khi lưu sản phẩm');
        }
      }
    } catch {
      alert('Lỗi khi lưu sản phẩm');
    }
    setModalLoading(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!isAdmin() && !hasPermission('products')) {
    return <AccessDenied requiredPermission="products" />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-slate-900 dark:text-black" />
            <span>Quản Lý Sản Phẩm & Ghim HOT</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Ghim các thiết bị bán chạy lên trang chủ, sắp xếp thứ tự hiển thị và quản lý thông tin sản phẩm.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white hairline-border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-surface-subtle font-mono font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sản Phẩm Mới</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 hairline-border border-emerald-500/20 text-emerald-700 dark:text-signal-emerald text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-signal-emerald" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc thương hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadProducts}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white hairline-border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-surface-subtle text-xs font-mono font-bold transition-colors shadow-sm"
            >
              Lọc
            </button>
          </div>

          <button
            onClick={() => setFilterHotOnly(!filterHotOnly)}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 hairline-border transition-all ${
              filterHotOnly
                ? 'bg-rose-500/15 text-rose-700 dark:text-signal-rose border border-rose-500/30 shadow-sm'
                : 'bg-surface-card hover:bg-surface-subtle/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-signal-rose" />
            <span>{filterHotOnly ? 'Đang lọc: Chỉ sản phẩm HOT' : 'Xem danh sách ghim HOT'}</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Đang tải danh sách sản phẩm...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-900 dark:text-slate-200 font-mono text-[11px] uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="pb-2.5 px-3">Ảnh</th>
                  <th className="pb-2.5 px-3">Tên & Hãng</th>
                  <th className="pb-2.5 px-3">Danh Mục</th>
                  <th className="pb-2.5 px-3">Giá Bán</th>
                  <th className="pb-2.5 px-3">Tồn Kho</th>
                  <th className="pb-2.5 px-3 text-center">Ghim HOT</th>
                  <th className="pb-2.5 px-3 text-center">Thứ Tự & Kéo Thả</th>
                  <th className="pb-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {products.map((p, idx) => (
                  <tr
                    key={p._id}
                    draggable={p.isHot}
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDrop={() => handleDropHotRow(idx)}
                    className={`transition-colors ${
                      dragOverIndex === idx
                        ? 'border-t-2 border-slate-900 bg-slate-100/60 dark:border-signal-cyan dark:bg-signal-cyan/10'
                        : 'hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="relative w-9 h-9 rounded-md overflow-hidden bg-surface-subtle/40 dark:bg-surface-elevated hairline-border flex-shrink-0">
                        <Image
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=100&q=80'}
                          alt={p.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                      <span className="text-[10px] text-slate-900 dark:text-slate-300 uppercase font-mono font-bold">{p.brand}</span>
                    </td>
                    <td className="py-2.5 px-3 uppercase text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold">{p.category}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-950 dark:text-white tabular-nums font-mono">
                        {formatVND(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium tabular-nums font-mono text-slate-800 dark:text-slate-200">{p.stock}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleHot(p)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          p.isHot
                            ? 'bg-rose-500/15 text-rose-700 dark:text-signal-rose border-rose-500/40 shadow-sm'
                            : 'bg-surface-subtle/40 dark:bg-surface-elevated text-slate-600 dark:text-slate-400 hairline-border hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                        title={p.isHot ? 'Bấm để hủy ghim HOT' : 'Bấm để ghim lên mục HOT trang chủ'}
                      >
                        <Flame className={`w-3.5 h-3.5 ${p.isHot ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {p.isHot ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className="cursor-grab active:cursor-grabbing text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-black p-0.5"
                            title="Kéo thả dòng để sắp xếp thứ tự hiển thị HOT"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            value={p.hotOrder || 1}
                            onChange={(e) => handleUpdateHotOrder(p._id, Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 rounded-lg text-center font-bold bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white font-mono text-xs tabular-nums"
                            title="Hoặc nhập trực tiếp số thứ tự"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-mono font-bold">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 rounded-lg text-rose-600 dark:text-signal-rose hover:bg-rose-500/10 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tên sản phẩm <span className="text-rose-600 dark:text-signal-rose">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bàn phím cơ ASUS ROG Azoth 75%..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Danh mục <span className="text-rose-600 dark:text-signal-rose">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  >
                    <option value="monitor">Màn hình máy tính</option>
                    <option value="keyboard">Bàn phím cơ</option>
                    <option value="mouse">Chuột gaming</option>
                    <option value="headphone">Tai nghe</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Thương hiệu (Brand) <span className="text-rose-600 dark:text-signal-rose">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ASUS, Logitech, Razer, Keychron..."
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Giá gốc (VNĐ) <span className="text-rose-600 dark:text-signal-rose">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Giá giảm (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Tồn kho <span className="text-rose-600 dark:text-signal-rose">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>
              </div>

              {/* Image Upload: Main image & Gallery */}
              <div className="space-y-4 pt-1 pb-1">
                <SingleImageUpload
                  label="Hình ảnh chính của sản phẩm"
                  value={formData.image}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                  onUploadingChange={handleSingleUploading}
                />

                <GalleryUpload
                  label="Bộ sưu tập ảnh phụ (Gallery)"
                  images={formData.gallery}
                  onChange={(urls) => setFormData((prev) => ({ ...prev, gallery: urls }))}
                  maxImages={8}
                  onUploadingChange={handleGalleryUploading}
                />
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Loại Switch
                  </label>
                  <input
                    type="text"
                    placeholder="Jupiter Brown, Linear..."
                    value={formData.switchSpec}
                    onChange={(e) => setFormData({ ...formData, switchSpec: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Tần số quét
                  </label>
                  <input
                    type="text"
                    placeholder="240Hz, 165Hz..."
                    value={formData.refreshRateSpec}
                    onChange={(e) => setFormData({ ...formData, refreshRateSpec: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Kiểu kết nối
                  </label>
                  <input
                    type="text"
                    placeholder="Không dây 2.4G, Type-C..."
                    value={formData.connectionSpec}
                    onChange={(e) => setFormData({ ...formData, connectionSpec: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan resize-none"
                />
              </div>

              {/* Hot switch */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.isHot}
                    onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                    className="rounded text-slate-950 focus:ring-slate-900 dark:text-black dark:focus:ring-signal-cyan"
                  />
                  <span>Ghim hiển thị tại mục &quot;Sản Phẩm HOT&quot;</span>
                </label>

                {formData.isHot && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] font-medium">Thứ tự:</span>
                    <input
                      type="number"
                      value={formData.hotOrder}
                      onChange={(e) => setFormData({ ...formData, hotOrder: Number(e.target.value) })}
                      className="w-16 px-2 py-1 rounded-lg bg-surface-card hairline-border text-center font-mono font-bold tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 rounded-lg hairline-border bg-surface-subtle/30 dark:bg-surface-elevated font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || isUploadingImage}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? 'Đang lưu...' : isUploadingImage ? 'Đang tải ảnh lên...' : 'Lưu Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
