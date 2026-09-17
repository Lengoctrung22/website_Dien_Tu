'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  Edit2,
  Boxes,
  ShoppingCart,
  Shield,
  UserCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import AccessDenied from '@/components/admin/AccessDenied';

const PRESETS = [
  {
    name: 'Super Admin',
    role: 'admin',
    permissions: ['all'],
    description: 'Toàn quyền quản trị hệ thống (all)',
    badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    name: 'Nhân viên Kho (Warehouse)',
    role: 'staff',
    permissions: ['inventory'],
    description: 'Quản lý kho, nhập hàng (inventory)',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    name: 'Nhân viên Đơn hàng (Orders)',
    role: 'staff',
    permissions: ['orders'],
    description: 'Xử lý tiến trình đơn hàng (orders)',
    badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
];

export default function AdminUsersPage() {
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Selected user for editing permissions
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'staff' | 'customer'>('staff');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    preset: 'Nhân viên Kho (Warehouse)',
    permissions: ['inventory'],
  });

  const loadUsers = async () => {
    if (!isAdmin()) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);

    const res = await fetchApi(`/admin/users?${params.toString()}`);
    if (res.success && res.data) {
      setUsers(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleToggleStatus = async (user: any) => {
    const newStatus = !user.isActive;
    try {
      const res = await fetchApi(`/admin/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.success) {
        setUsers(users.map((u) => (u._id === user._id ? { ...u, isActive: newStatus } : u)));
        setFeedback(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.fullName}`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(res.message || 'Không thể cập nhật trạng thái');
      }
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const handlePresetChange = (presetName: string) => {
    const found = PRESETS.find((p) => p.name === presetName);
    if (found) {
      setNewStaff({
        ...newStaff,
        preset: found.name,
        role: found.role,
        permissions: [...found.permissions],
      });
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const res = await fetchApi('/admin/users/staff', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newStaff.fullName,
          email: newStaff.email,
          password: newStaff.password,
          phone: newStaff.phone,
          role: newStaff.role,
          permissions: newStaff.permissions,
        }),
      });

      if (res.success) {
        setFeedback(`Đã tạo tài khoản "${newStaff.fullName}" thành công!`);
        setModalOpen(false);
        setNewStaff({
          fullName: '',
          email: '',
          password: '',
          phone: '',
          role: 'staff',
          preset: 'Nhân viên Kho (Warehouse)',
          permissions: ['inventory'],
        });
        loadUsers();
      } else {
        alert(res.message || 'Lỗi khi tạo tài khoản');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    }

    setModalLoading(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Open Edit User Modal
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditRole(user.role || 'staff');
    setEditPermissions(user.permissions ? [...user.permissions] : []);
    setEditModalOpen(true);
  };

  const applyEditPreset = (preset: typeof PRESETS[0]) => {
    setEditRole(preset.role as any);
    setEditPermissions([...preset.permissions]);
  };

  const togglePermission = (perm: string) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter((p) => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  const handleSaveUserRBAC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalLoading(true);

    try {
      const res = await fetchApi(`/admin/users/${editingUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: editRole,
          permissions: editPermissions,
        }),
      });

      if (res.success) {
        setUsers(
          users.map((u) =>
            u._id === editingUser._id
              ? { ...u, role: editRole, permissions: editPermissions }
              : u
          )
        );
        setFeedback(`Đã cập nhật vai trò & quyền hạn cho "${editingUser.fullName}"!`);
        setEditModalOpen(false);
        setEditingUser(null);
      } else {
        alert(res.message || 'Lỗi khi cập nhật quyền');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    } finally {
      setModalLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const getUserBadge = (user: any) => {
    if (user.role === 'admin' || user.permissions?.includes('all')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          <Shield className="w-3 h-3" />
          Super Admin (all)
        </span>
      );
    }

    if (user.role === 'staff') {
      if (user.permissions?.includes('inventory')) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Boxes className="w-3 h-3" />
            Nhân Viên Kho (inventory)
          </span>
        );
      }
      if (user.permissions?.includes('orders')) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
            <ShoppingCart className="w-3 h-3" />
            Nhân Viên Đơn Hàng (orders)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
          Nhân Viên ({user.permissions?.join(', ') || 'staff'})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-surface-subtle text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        Khách Hàng (customer)
      </span>
    );
  };

  if (!isAdmin()) {
    return <AccessDenied requiredPermission="admin_only" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-900 dark:text-white" />
            <span>Quản Lý Người Dùng & Phân Quyền RBAC</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Phân quyền chi tiết cho 3 chức vụ: <strong>Super Admin</strong>, <strong>Nhân viên Kho</strong> và <strong>Nhân viên Đơn hàng</strong>.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3 Core Roles Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRESETS.map((preset) => (
          <div
            key={preset.name}
            className="p-4 rounded-2xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${preset.badgeColor}`}>
                {preset.name}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Quyền: {preset.permissions.join(', ')}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {preset.description}
            </p>
          </div>
        ))}
      </div>

      {/* Users Table Card */}
      <div className="rounded-2xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo họ tên, email, điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadUsers}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-950 dark:text-white hairline-border border-slate-300 dark:border-white/10 hover:bg-slate-200 text-xs font-mono font-bold transition-colors shadow-sm"
            >
              Lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-bold">Lọc vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">Tất cả người dùng</option>
              <option value="admin">Super Admin</option>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="customer">Khách hàng (Customer)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
            Đang tải danh sách người dùng...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Họ và Tên</th>
                  <th className="pb-3 px-3">Email & SĐT</th>
                  <th className="pb-3 px-3">Vai Trò & Quyền Hạn</th>
                  <th className="pb-3 px-3">Đơn Hàng</th>
                  <th className="pb-3 px-3">Tổng Chi Tiêu (LTV)</th>
                  <th className="pb-3 px-3">Trạng Thái</th>
                  <th className="pb-3 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Tạo: {formatDate(u.createdAt)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-800 dark:text-slate-200 block text-xs font-medium">
                        {u.email}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {u.phone || 'Chưa cập nhật SĐT'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {getUserBadge(u)}
                      {u.permissions?.length > 0 && u.role !== 'admin' && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 font-mono">
                          Quyền chi tiết: [{u.permissions.join(', ')}]
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 tabular-nums font-mono">
                      {u.ordersCount !== undefined ? `${u.ordersCount} đơn` : '-'}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-950 dark:text-white font-mono tabular-nums">
                      {u.totalSpent ? formatVND(u.totalSpent) : '-'}
                    </td>

                    <td className="py-3 px-3">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/20">
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-signal-rose border border-rose-500/20">
                          Đã Khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Role & Permissions Button */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-surface-elevated text-slate-700 dark:text-slate-300 transition-all"
                          title="Chỉnh sửa vai trò & phân quyền"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Lock / Unlock account */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              u.isActive
                                ? 'text-rose-700 dark:text-signal-rose hover:bg-rose-500/10 border-rose-500/30'
                                : 'text-emerald-700 dark:text-signal-emerald hover:bg-emerald-500/10 border-emerald-500/30'
                            }`}
                            title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role & Permissions Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                <span>Chỉnh Sửa Vai Trò & Phân Quyền (RBAC)</span>
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-surface-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/50 space-y-1">
              <p className="font-bold text-xs text-slate-900 dark:text-white">{editingUser.fullName}</p>
              <p className="text-[11px] font-mono text-slate-500">{editingUser.email}</p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Gán nhanh theo chức vụ:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyEditPreset(p)}
                    className="p-2 rounded-lg text-[10px] font-mono font-bold border border-slate-300 dark:border-white/10 hover:bg-surface-subtle text-left transition-all"
                  >
                    <span className="block truncate">{p.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">[{p.permissions[0]}]</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveUserRBAC} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Vai trò chính (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border font-mono text-slate-900 dark:text-white"
                >
                  <option value="admin">Quản trị viên (Super Admin - admin)</option>
                  <option value="staff">Nhân viên hệ thống (Staff - staff)</option>
                  <option value="customer">Khách hàng thông thường (Customer)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Quyền hạn chi tiết (Permissions)
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { key: 'all', label: 'Toàn quyền (all)' },
                    { key: 'inventory', label: 'Kho hàng (inventory)' },
                    { key: 'orders', label: 'Đơn hàng (orders)' },
                    { key: 'products', label: 'Sản phẩm (products)' },
                    { key: 'reports', label: 'Báo cáo doanh thu (reports)' },
                  ].map((perm) => {
                    const checked = editPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                            : 'bg-surface-subtle/30 dark:bg-surface-elevated/40 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.key)}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="font-mono text-[11px] font-bold">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2 rounded-lg hairline-border bg-surface-subtle/30 dark:bg-surface-elevated font-medium text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'Đang lưu...' : 'Lưu Phân Quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white" />
                <span>Tạo Tài Khoản Nhân Viên Mới (RBAC)</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-surface-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Vị trí & Chức vụ phân quyền (Preset RBAC)
                </label>
                <select
                  value={newStaff.preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white font-mono"
                >
                  {PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} — {p.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Họ và tên nhân viên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Văn Kho"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Email nhân viên
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@techgear.vn"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912..."
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border text-[11px] space-y-1">
                <span className="text-slate-500 block font-mono uppercase text-[10px] font-bold">Quyền hạn gán:</span>
                <p className="font-mono text-slate-900 dark:text-white font-bold">
                  [{newStaff.permissions.join(', ')}]
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-lg hairline-border bg-surface-subtle/30 dark:bg-surface-elevated font-medium text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {modalLoading ? 'Đang tạo...' : 'Tạo Nhân Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
