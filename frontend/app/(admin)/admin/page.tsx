import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

async function getAdminDashboardStats() {
  let productsCount = 0;
  try {
    const p = await getProducts(1, 1);
    if (p) productsCount = p.totalItems;
  } catch (e) { }

  let totalUsers = 11;
  let activeUsers = 11;
  let newUsers = 1;

  try {
    const res = await fetch(`${API_BASE_URL}/Users/statistics`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        totalUsers = data.totalUsers;
        activeUsers = data.activeUsers;
        newUsers = data.newUsersThisMonth;
      }
    }
  } catch (e) { }

  let totalOrders = 0;
  let completedOrders = 0;
  let pendingOrders = 0;
  let canceledOrders = 0;
  let totalRevenue = 0;

  let recentOrders: any[] = [];

  try {
    const res = await fetch(`${API_BASE_URL}/Invoice/metrics`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      totalOrders = data.totalOrders ?? 0;
      pendingOrders = data.pending ?? 0;
      completedOrders = data.completed ?? 0;
      canceledOrders = data.cancelled ?? 0;
      totalRevenue = data.totalRevenue ?? data.todayRevenue ?? 0;
    }
  } catch (e) { }

  try {
    const res = await fetch(`${API_BASE_URL}/Invoice/search?page=1&pageSize=5&sortBy=CreatedAt&desc=true`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.items) recentOrders = data.items;
      else if (data.Items) recentOrders = data.Items;
    }
  } catch (e) { }

  return {
    revenue: totalRevenue,
    totalOrders,
    completedOrders,
    pendingOrders,
    canceledOrders,
    totalUsers,
    activeUsers,
    newUsers,
    productsCount,
    recentOrders
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <section
        className="relative rounded-[8px] overflow-hidden mb-8 shadow-sm min-h-[320px] flex items-center bg-cover bg-center border border-slate-100"
        style={{ backgroundImage: `url('/Dashboard-page-img/Dashboard-page-banner.png')` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent"></div>

        <div className="relative px-10 z-10 text-white max-w-2xl p-8 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg flex items-center gap-2">
            Chào mừng quay lại! <span className="material-symbols-outlined md:text-[40px] text-amber-400">waving_hand</span>
          </h1>
          <p className="opacity-90 mb-8 drop-shadow-lg text-lg">
            Tổng quan hoạt động kinh doanh LazPe. Hôm nay có <span className="font-bold text-amber-400">{stats.pendingOrders}</span> đơn hàng đang chờ xử lý.
          </p>
          <Link href="/admin/orders">
            <button className="bg-white text-primary px-8 py-3 rounded-[8px] font-bold shadow-md hover:scale-105 transition-transform active:scale-95 self-start">
              Xử lý đơn hàng
            </button>
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Doanh thu */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Doanh thu</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[8px] flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span> 12%
            </span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-extrabold text-slate-800">{stats.revenue.toLocaleString()}₫</h2>
            <p className="text-[11px] text-slate-400 font-bold mb-1">
              <span className="text-emerald-500">{stats.completedOrders}</span> hoàn tất
            </p>
          </div>
        </div>

        {/* Tổng đơn hàng */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng đơn hàng</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-extrabold text-slate-800">{stats.totalOrders}</h2>
            <p className="text-[11px] text-slate-400 font-bold mb-1">
              <span className="text-amber-500">{stats.pendingOrders}</span> chờ xử lý
            </p>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Khách hàng</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-extrabold text-slate-800">{stats.totalUsers}</h2>
            <p className="text-[11px] text-slate-400 font-bold mb-1">
              <span className="text-blue-500">+{stats.newUsers}</span> tháng này
            </p>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">inventory</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sản phẩm</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-extrabold text-slate-800">{stats.productsCount.toLocaleString()}</h2>
            <p className="text-[11px] text-slate-400 font-bold mb-1">
              Đang kinh doanh
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <section className="lg:col-span-2 bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Đơn hàng gần đây</h3>
              <p className="text-slate-400 font-semibold text-sm">5 đơn mới nhất</p>
            </div>
            <Link href="/admin/orders">
              <button className="text-primary hover:bg-primary/5 px-4 py-2 rounded-[8px] font-bold text-sm transition-colors border border-primary/20">
                Xem tất cả
              </button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">MÃ ĐƠN</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">KHÁCH HÀNG</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">TỔNG TIỀN</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">TRẠNG THÁI</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">THỜI GIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <tr key={order.invoiceID} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 font-bold text-primary text-sm">#{order.invoiceCode || order.invoiceID}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                            {(order.userFullName || order.userName || 'K')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{order.userFullName || order.userName || 'Khách hàng'}</p>
                            <p className="text-[11px] text-slate-400 font-semibold">{order.itemCount || 0} sản phẩm</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold text-slate-800 text-sm">{(order.totalPrice || 0).toLocaleString()}₫</td>
                      <td className="px-6 py-5 font-bold text-sm">
                        {order.statusCode === 0 && <span className="text-amber-600">Chờ xử lý</span>}
                        {order.statusCode === 1 && <span className="text-blue-600">Đã xác nhận</span>}
                        {order.statusCode === 2 && <span className="text-purple-600">Đang giao</span>}
                        {order.statusCode === 3 && <span className="text-emerald-600">Hoàn tất</span>}
                        {order.statusCode === 4 && <span className="text-rose-600">Chờ duyệt hủy</span>}
                        {order.statusCode === 5 && <span className="text-slate-500">Đã hủy</span>}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-semibold">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-5 text-center text-sm text-slate-500">Không có đơn hàng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions & User Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <section className="bg-white rounded-[8px] shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Hành động nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/products/new" className="bg-primary/5 hover:bg-primary/10 text-primary p-4 rounded-[8px] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border border-primary/10 hover:border-primary/20 hover:shadow-sm group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                  <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform duration-300">add_circle</span>
                </div>
                <span className="text-[12px] font-bold text-center leading-tight">Thêm sản phẩm</span>
              </Link>
              <Link href="/admin/orders" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-4 rounded-[8px] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-100 hover:border-emerald-200 hover:shadow-sm group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-500">
                  <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform duration-300">check_circle</span>
                </div>
                <span className="text-[12px] font-bold text-center leading-tight">Xử lý đơn hàng</span>
              </Link>
              <Link href="/admin/users" className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-4 rounded-[8px] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border border-blue-100 hover:border-blue-200 hover:shadow-sm group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-500">
                  <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform duration-300">person_search</span>
                </div>
                <span className="text-[12px] font-bold text-center leading-tight">Khách hàng</span>
              </Link>
              <Link href="/admin/statistics" className="bg-purple-50 hover:bg-purple-100 text-purple-600 p-4 rounded-[8px] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border border-purple-100 hover:border-purple-200 hover:shadow-sm group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-500">
                  <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform duration-300">bar_chart</span>
                </div>
                <span className="text-[12px] font-bold text-center leading-tight">Báo cáo thống kê</span>
              </Link>
            </div>
          </section>

          {/* User Stats */}
          <section className="bg-white rounded-[8px] shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary">group</span>
              <h3 className="font-bold text-slate-800 text-lg">Thống kê người dùng</h3>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-[8px] text-indigo-500">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Tổng người dùng</p>
                    <p className="text-[11px] font-semibold text-slate-400">Tất cả tài khoản</p>
                  </div>
                </div>
                <span className="font-extrabold text-slate-800">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 rounded-[8px] text-emerald-500">
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Đang hoạt động</p>
                    <p className="text-[11px] font-semibold text-slate-400">Tài khoản active</p>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-600">{stats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-[8px] text-blue-500">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Mới tháng này</p>
                    <p className="text-[11px] font-semibold text-slate-400">Đăng ký gần đây</p>
                  </div>
                </div>
                <span className="font-extrabold text-blue-600">{stats.newUsers}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}