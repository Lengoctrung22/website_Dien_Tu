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
import { useTheme } from '@/lib/useTheme';

const COLORS_DARK = ['#00F0FF', '#818cf8', '#10b981', '#fbbf24'];
const COLORS_LIGHT = ['#0891b2', '#4f46e5', '#059669', '#d97706'];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const item = data.payload || {};
    const name = item.name || data.name || 'Sản phẩm';
    const quantity = item.quantity ?? data.value ?? 0;
    const color = item.color || data.payload?.fill || data.color || '#0891b2';
    const percent =
      item.percent !== undefined && item.percent !== null
        ? item.percent
        : data.percent !== undefined && data.percent !== null
        ? Math.round(data.percent * 100)
        : null;

    return (
      <div className="bg-white/95 dark:bg-surface-elevated/95 backdrop-blur-md hairline-border px-3.5 py-2 rounded-lg shadow-xl flex items-center gap-2.5 pointer-events-none z-50">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/20"
          style={{ backgroundColor: color }}
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{name}:</span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">{quantity} chiếc</span>
          {percent !== null && (
            <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-surface-elevated px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10 text-[11px] tabular-nums font-mono">
              {percent}%
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-surface-elevated/95 backdrop-blur-md hairline-border px-3.5 py-2 rounded-lg shadow-xl space-y-1 pointer-events-none z-50">
        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-signal-cyan shadow-sm" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Doanh thu:</span>
          <span className="text-xs font-bold text-slate-950 dark:text-white tabular-nums font-mono">
            {formatVND(Number(payload[0].value))}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-surface-elevated/95 backdrop-blur-md hairline-border px-3.5 py-2 rounded-lg shadow-xl space-y-1 pointer-events-none z-50">
        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-signal-cyan shadow-sm" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Doanh thu:</span>
          <span className="text-xs font-bold text-slate-950 dark:text-white tabular-nums font-mono">
            {formatVND(Number(payload[0].value))}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const chartColor = isDark ? '#00F0FF' : '#0891b2';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const axisColor = isDark ? '#475569' : '#64748b';
  const tickColor = isDark ? '#94a3b8' : '#334155';
  const pieColors = isDark ? COLORS_DARK : COLORS_LIGHT;

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
        const total = res.data.totalProductsSoldToday || 0;
        const categories = (res.data.categories || []).map((cat: any) => ({
          ...cat,
          percent: total > 0 ? Math.round((cat.quantity / total) * 100) : 0,
        }));
        setDailyCategoryData(categories);
        setDailyTotalSold(total);
      }
      setLoading(false);
    }
    loadDailyCategories();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Báo Cáo Doanh Thu & Thống Kê Tổng Quan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Theo dõi chi tiết hiệu suất kinh doanh, tăng trưởng doanh thu 4 quý và phân loại thiết bị bán ra.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 surface-bevel self-start sm:self-auto shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-slate-900 dark:text-signal-cyan" />
          <span>Dữ liệu thời gian thực</span>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="p-5 rounded-xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Tổng Doanh Thu</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums font-mono">
            {formatVND(summary?.totalRevenue || 0)}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-signal-emerald font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tích lũy từ tất cả đơn thành công</span>
          </p>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="p-5 rounded-xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Tổng Đơn Hàng</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums font-mono">
            {summary?.totalOrders || 0} <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">đơn</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Hôm nay: <span className="text-slate-950 dark:text-white font-bold tabular-nums font-mono">{summary?.todayStats?.ordersCount || 0} đơn mới</span>
          </p>
        </div>

        {/* KPI 3: Today Products Sold */}
        <div className="p-5 rounded-xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Bán Trong Ngày</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-signal-emerald border border-emerald-500/20 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums font-mono">
            {dailyTotalSold} <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">chiếc</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Doanh thu ngày: <span className="text-emerald-700 dark:text-signal-emerald font-bold tabular-nums font-mono">{formatVND(summary?.todayStats?.revenue || 0)}</span>
          </p>
        </div>

        {/* KPI 4: Low Stock Alert (< 5) */}
        <Link
          href="/admin/inventory?lowStock=true"
          className="p-5 rounded-xl bg-surface-card hairline-border surface-bevel shadow-sm space-y-2 hover:border-amber-500/50 transition-colors block group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Cảnh Báo Tồn Kho</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-signal-amber border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-signal-amber tabular-nums font-mono">
            {summary?.lowStockCount || 0} <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">sản phẩm</span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-signal-amber font-semibold flex items-center gap-1">
            <span>Tồn &lt; 5 chiếc. Xử lý nhập kho →</span>
          </p>
        </Link>
      </div>

      {/* Row 2: Periodic Revenue (Weekly / Monthly / Yearly) & Daily Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Periodic Revenue Chart (8 cols) */}
        <div className="lg:col-span-8 rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b hairline-border">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-900 dark:text-signal-cyan" />
                <span>Biểu Đồ Doanh Thu Định Kỳ</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Doanh số bán hàng thực tế qua các mốc thời gian</p>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface-subtle/50 dark:bg-surface-elevated hairline-border self-start sm:self-auto text-xs font-medium">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md transition-all font-mono ${
                    period === p
                      ? 'bg-white dark:bg-surface-card text-slate-950 dark:text-white font-bold border border-slate-300 dark:border-white/20 shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
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
                    <stop offset="5%" stopColor={chartColor} stopOpacity={isDark ? 0.35 : 0.25} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  stroke={axisColor}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  className="font-mono"
                />
                <YAxis
                  stroke={axisColor}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  className="font-mono tabular-nums"
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                />
                <Tooltip
                  content={<CustomAreaTooltip />}
                  wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 50 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Stats By Category (Donut / Pie) (4 cols) */}
        <div className="lg:col-span-4 rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b hairline-border">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-900 dark:text-signal-cyan" />
              <span>Sản Phẩm Bán Hôm Nay Theo Danh Mục</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Phân bổ 4 nhóm thiết bị chính trong ngày</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {dailyTotalSold === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Chưa có giao dịch phát sinh hôm nay</p>
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
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {dailyCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomPieTooltip />}
                    wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 50 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown table */}
          <div className="space-y-2 pt-2 border-t hairline-border text-xs">
            {dailyCategoryData.map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {cat.percent !== undefined && (
                    <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold tabular-nums">
                      ({cat.percent}%)
                    </span>
                  )}
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                    {cat.quantity} chiếc
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Quarterly Growth Comparison (Q1, Q2, Q3, Q4) */}
      <div className="rounded-xl hairline-border surface-bevel bg-surface-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b hairline-border">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-signal-emerald" />
              <span>Báo Cáo Doanh Thu Theo Quý & Tăng Trưởng (Q1 - Q4)</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Tổng hợp và so sánh mức tăng trưởng doanh thu 4 quý trong năm tài chính
            </p>
          </div>
        </div>

        {/* 4 Quarter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarterlyData.map((q, idx) => (
            <div
              key={q.quarter}
              className="p-4 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border surface-bevel space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black uppercase text-slate-950 dark:text-white">
                  {q.quarter}
                </span>
                <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold">{q.months}</span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono">
                {formatVND(q.revenue)}
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t hairline-border">
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] tabular-nums font-semibold">
                  {q.orders} đơn ({q.productsSold} gear)
                </span>
                {idx > 0 && (
                  <span
                    className={`font-mono text-xs font-bold tabular-nums flex items-center gap-0.5 ${
                      q.growthPercent >= 0 ? 'text-emerald-700 dark:text-signal-emerald' : 'text-rose-700 dark:text-signal-rose'
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="quarter"
                stroke={axisColor}
                tick={{ fill: tickColor, fontSize: 11 }}
                className="font-mono"
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: tickColor, fontSize: 11 }}
                className="font-mono tabular-nums"
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip
                content={<CustomBarTooltip />}
                wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 50 }}
              />
              <Bar dataKey="revenue" fill={chartColor} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
