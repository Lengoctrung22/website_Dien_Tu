'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { fetchApi } from '@/lib/api';
import { formatVND } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [periodicData, setPeriodicData] = useState<any[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<any[]>([]);
  const [dailyCategoryData, setDailyCategoryData] = useState<any[]>([]);
  const [dailyTotalSold, setDailyTotalSold] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load KPI Summary
  useEffect(() => {
    async function loadSummary() {
      const res = await fetchApi('/admin/summary');
      if (res.success && res.data) {
        setSummary(res.data);
      }
    }
    loadSummary();
  }, []);

  // Load Periodic Revenue (weekly / monthly / yearly)
  useEffect(() => {
    async function loadPeriodic() {
      const res = await fetchApi(`/admin/periodic-revenue?period=${period}`);
      if (res.success && res.data) {
        setPeriodicData(res.data);
      }
    }
    loadPeriodic();
  }, [period]);

  // Load Quarterly Revenue
  useEffect(() => {
    async function loadQuarterly() {
      const res = await fetchApi('/admin/quarterly-revenue');
      if (res.success && res.data) {
        setQuarterlyData(res.data.quarters || []);
      }
    }
    loadQuarterly();
  }, []);

  // Load Daily Category Stats
  useEffect(() => {
    async function loadDailyCategories() {
      setLoading(true);
      const res = await fetchApi('/admin/daily-categories');
      if (res.success && res.data) {
        setDailyCategoryData(res.data.categories || []);
        setDailyTotalSold(res.data.totalProductsSoldToday || 0);
      }
      setLoading(false);
    }
    loadDailyCategories();
  }, []);

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 pb-10">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Báo Cáo Doanh Thu & Thống Kê Tổng Quan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi chi tiết hiệu suất kinh doanh, tăng trưởng doanh thu 4 quý và phân loại thiết bị bán ra.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-slate-700 self-start sm:self-auto">
          <Sparkles className="w-4 h-4" />
          <span>Dữ liệu thời gian thực</span>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Revenue */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatVND(summary?.totalRevenue || 0)}
          </div>
          <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tích lũy từ tất cả đơn thành công</span>
          </p>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Đơn Hàng</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {summary?.totalOrders || 0} đơn
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">
            Hôm nay: <span className="text-cyan-500 font-bold">{summary?.todayStats?.ordersCount || 0} đơn mới</span>
          </p>
        </div>

        {/* KPI 3: Today Products Sold */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bán Trong Ngày</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {dailyTotalSold} chiếc
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">
            Doanh thu ngày: <span className="text-emerald-500 font-bold">{formatVND(summary?.todayStats?.revenue || 0)}</span>
          </p>
        </div>

        {/* KPI 4: Low Stock Alert (< 5) */}
        <Link
          href="/admin/inventory?lowStock=true"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2 hover:border-amber-500/50 transition-colors block group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cảnh Báo Tồn Kho</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500">
            {summary?.lowStockCount || 0} sản phẩm
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <span>Tồn &lt; 5 chiếc. Bấm để xử lý nhập kho →</span>
          </p>
        </Link>
      </div>

      {/* Row 2: Periodic Revenue (Weekly / Monthly / Yearly) & Daily Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Periodic Revenue Chart (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                <span>Biểu Đồ Doanh Thu Định Kỳ</span>
              </h2>
              <p className="text-xs text-slate-500">Doanh số bán hàng thực tế qua các mốc thời gian</p>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto text-xs font-bold">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    period === p
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'weekly' ? 'Theo Tuần' : p === 'monthly' ? 'Theo Tháng' : 'Theo Năm'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={periodicData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                />
                <Tooltip
                  formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Stats By Category (Donut / Pie) (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Sản Phẩm Bán Hôm Nay Theo Danh Mục</span>
            </h2>
            <p className="text-xs text-slate-500">Phân bổ 4 nhóm thiết bị chính trong ngày</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {dailyTotalSold === 0 ? (
              <p className="text-xs text-slate-400">Chưa có giao dịch phát sinh hôm nay</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dailyCategoryData}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {dailyCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} chiếc`, name]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown table */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {dailyCategoryData.map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{cat.name}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {cat.quantity} chiếc
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Quarterly Growth Comparison (Q1, Q2, Q3, Q4) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Báo Cáo Doanh Thu Theo Quý & Tăng Trưởng (Q1 - Q4)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tổng hợp và so sánh mức tăng trưởng doanh thu 4 quý trong năm tài chính
            </p>
          </div>
        </div>

        {/* 4 Quarter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarterlyData.map((q, idx) => (
            <div
              key={q.quarter}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-600 dark:text-cyan-400">
                  {q.quarter}
                </span>
                <span className="text-[10px] text-slate-400">{q.months}</span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {formatVND(q.revenue)}
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400">{q.orders} đơn ({q.productsSold} gear)</span>
                {idx > 0 && (
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      q.growthPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {q.growthPercent >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {q.growthPercent > 0 ? `+${q.growthPercent}%` : `${q.growthPercent}%`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quarter Comparison Bar Chart */}
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip
                formatter={(val: any) => [formatVND(Number(val)), 'Doanh thu']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="revenue" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
