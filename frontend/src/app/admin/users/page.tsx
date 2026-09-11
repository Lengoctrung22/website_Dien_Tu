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
  DollarSign,
  ShoppingCart,
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500 dark:text-cyan-400" />
            <span>Quản Lý Người Dùng & Phân Quyền RBAC</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tổng chi tiêu khách hàng (LTV), tạo nhân viên và gán quyền chi tiết (Super Admin, Warehouse, Order, Sales).
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo Nhân Viên & Phân Quyền</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên, email, điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Tất cả vai trò</option>
              <option value="customer">Khách hàng (Customer)</option>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách người dùng...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Họ và Tên</th>
                  <th className="pb-3 px-3">Email & SĐT</th>
                  <th className="pb-3 px-3">Vai Trò & Quyền</th>
                  <th className="pb-3 px-3">Đơn Đã Mua</th>
                  <th className="pb-3 px-3">Tổng Chi Tiêu (LTV)</th>
                  <th className="pb-3 px-3">Trạng Thái</th>
                  <th className="pb-3 px-3 text-right">Khóa/Mở</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                      <span className="text-[10px] text-slate-400">Tạo: {formatDate(u.createdAt)}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 dark:text-slate-300 block">{u.email}</span>
                      <span className="text-[10px] text-slate-400">{u.phone || 'Chưa cập nhật'}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : u.role === 'staff'
                            ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30'
                            : 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.permissions?.length > 0 && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          Quyền: {u.permissions.join(', ')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {u.ordersCount !== undefined ? `${u.ordersCount} đơn` : '-'}
                    </td>

                    <td className="py-3 px-3 font-black text-indigo-600 dark:text-cyan-400">
                      {u.totalSpent ? formatVND(u.totalSpent) : '-'}
                    </td>

                    <td className="py-3 px-3">
                      {u.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Đã Khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            u.isActive
                              ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Tạo Tài Khoản Nhân Viên (RBAC)</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vị trí & Nhóm quyền mẫu (RBAC Preset)
                </label>
                <select
                  value={newStaff.preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="Order Processor">Xử Lý Đơn Hàng (Order Processor)</option>
                  <option value="Warehouse Manager">Quản Lý Kho Hàng (Warehouse Manager)</option>
                  <option value="Sales Support">Tư Vấn & Sản Phẩm (Sales Support)</option>
                  <option value="Super Admin">Quản Trị Viên Toàn Quyền (Super Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên nhân viên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Văn Kho"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email nhân viên
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@techgear.vn"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912..."
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <span className="text-slate-400 block font-bold uppercase">Quyền hạn gán:</span>
                <p className="font-mono text-indigo-600 dark:text-cyan-400 font-bold">
                  {newStaff.permissions.join(', ')}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md"
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
