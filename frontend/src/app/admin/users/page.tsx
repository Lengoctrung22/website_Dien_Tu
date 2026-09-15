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
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatVND, formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    preset: 'Order Processor',
    permissions: ['orders'],
  });

  const loadUsers = async () => {
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
    setTimeout(() => loadUsers(), 0);
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
    let perms: string[] = [];
    let role = 'staff';

    switch (presetName) {
      case 'Super Admin':
        role = 'admin';
        perms = ['all'];
        break;
      case 'Warehouse Manager':
        role = 'staff';
        perms = ['inventory'];
        break;
      case 'Order Processor':
        role = 'staff';
        perms = ['orders'];
        break;
      case 'Sales Support':
        role = 'staff';
        perms = ['orders', 'products'];
        break;
    }

    setNewStaff({
      ...newStaff,
      preset: presetName,
      role,
      permissions: perms,
    });
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
        setFeedback(`Đã tạo tài khoản nhân viên "${newStaff.fullName}" thành công!`);
        setModalOpen(false);
        setTimeout(() => loadUsers(), 0);
      } else {
        alert(res.message || 'Lỗi khi tạo tài khoản');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    }

    setModalLoading(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-700 dark:text-signal-cyan" />
            <span>Quản Lý Người Dùng & Phân Quyền RBAC</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Theo dõi tổng chi tiêu khách hàng (LTV), tạo nhân viên và gán quyền chi tiết (Super Admin, Warehouse, Order, Sales).
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-surface-elevated text-cyan-700 dark:text-signal-cyan hairline-border border-cyan-500/30 dark:border-signal-cyan/30 hover:bg-cyan-500/10 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo Nhân Viên & Phân Quyền</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 hairline-border border-emerald-500/20 text-emerald-700 dark:text-signal-emerald text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên, email, điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadUsers}
              className="px-3.5 py-2 rounded-lg bg-surface-elevated text-cyan-700 dark:text-signal-cyan hairline-border border-cyan-500/30 dark:border-signal-cyan/30 hover:bg-cyan-500/10 text-xs font-mono font-bold transition-colors"
            >
              Lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-bold">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan"
            >
              <option value="">Tất cả vai trò</option>
              <option value="customer">Khách hàng (Customer)</option>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Đang tải danh sách người dùng...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b hairline-border text-slate-700 dark:text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-2.5 px-3">Họ và Tên</th>
                  <th className="pb-2.5 px-3">Email & SĐT</th>
                  <th className="pb-2.5 px-3">Vai Trò & Quyền</th>
                  <th className="pb-2.5 px-3">Đơn Đã Mua</th>
                  <th className="pb-2.5 px-3">Tổng Chi Tiêu (LTV)</th>
                  <th className="pb-2.5 px-3">Trạng Thái</th>
                  <th className="pb-2.5 px-3 text-right">Khóa/Mở</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-subtle/30 dark:hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{u.fullName}</p>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tabular-nums font-medium">Tạo: {formatDate(u.createdAt)}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-800 dark:text-slate-200 block text-xs font-medium">{u.email}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tabular-nums font-medium">{u.phone || 'Chưa cập nhật'}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-signal-rose hairline-border border-rose-500/25'
                            : u.role === 'staff'
                            ? 'bg-cyan-500/10 text-cyan-700 dark:text-signal-cyan hairline-border border-cyan-500/25'
                            : 'bg-slate-100 dark:bg-surface-subtle text-slate-700 dark:text-slate-300 hairline-border font-semibold'
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.permissions?.length > 0 && (
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5 font-mono">
                          Quyền: {u.permissions.join(', ')}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 tabular-nums font-mono">
                      {u.ordersCount !== undefined ? `${u.ordersCount} đơn` : '-'}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-cyan-700 dark:text-signal-cyan font-mono tabular-nums">
                      {u.totalSpent ? formatVND(u.totalSpent) : '-'}
                    </td>

                    <td className="py-2.5 px-3">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald hairline-border border-emerald-500/20">
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-signal-rose hairline-border border-rose-500/20">
                          Đã Khóa
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-card hairline-border surface-bevel p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700 dark:text-signal-cyan" />
                <span>Tạo Tài Khoản Nhân Viên (RBAC)</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-surface-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Vị trí & Phân quyền chức vụ (RBAC Preset)
                </label>
                <select
                  value={newStaff.preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan"
                >
                  <option value="Order Processor">Xử Lý Đơn Hàng (Order Processor)</option>
                  <option value="Warehouse Manager">Quản Lý Kho Hàng (Warehouse Manager)</option>
                  <option value="Sales Support">Tư Vấn & Sản Phẩm (Sales Support)</option>
                  <option value="Super Admin">Quản Trị Viên Toàn Quyền (Super Admin)</option>
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
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan"
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
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan font-mono"
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
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan"
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
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600 dark:focus:border-signal-cyan font-mono tabular-nums"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border text-[11px] space-y-1">
                <span className="text-slate-700 dark:text-slate-300 block font-mono uppercase text-[10px] font-bold">Quyền hạn gán:</span>
                <p className="font-mono text-cyan-700 dark:text-signal-cyan font-bold">
                  {newStaff.permissions.join(', ')}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-lg hairline-border bg-surface-subtle/30 dark:bg-surface-elevated font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-signal-cyan hairline-border border-cyan-500/30 dark:border-signal-cyan/30 hover:bg-cyan-500/20 font-bold transition-all disabled:opacity-50"
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
