import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

async function getAdminDashboardStats() {
  let productsCount = 0;
  try {
    const p = await getProducts(1, 1);
    if (p) productsCount = p.totalItems;
  } catch(e) {}

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
  } catch(e) {}

  let totalOrders = 47;
  let completedOrders = 9;
  let pendingOrders = 7;
  let canceledOrders = 23;
  let totalRevenue = 225000;

  try {
    const res = await fetch(`${API_BASE_URL}/Invoice/search?page=1&pageSize=5&sortBy=CreatedAt&desc=true`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.TotalCount !== undefined) totalOrders = data.TotalCount;
    }
  } catch(e) {}

  return {
    revenue: totalRevenue,
    totalOrders,
    completedOrders,
    pendingOrders,
    canceledOrders,
    totalUsers,
    activeUsers,
    newUsers,
    productsCount
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  
  return (
    <main className="px-margin-mobile md:px-margin-desktop py-lg max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <section 
        className="relative rounded-xl overflow-hidden mb-lg soft-shadow min-h-[220px] flex items-center bg-cover bg-center"
        style={{ backgroundImage: `url('/Dashboard-page-img/Dashboard-page-banner.png')` }}
      >
        {/* Gradient Overlay to improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        
        <div className="relative px-lg z-10 text-white max-w-2xl p-8 h-full flex flex-col justify-center">
          <h1 className="font-display-lg text-headline-lg-mobile md:text-headline-lg mb-sm drop-shadow-lg flex items-center gap-2">
            Chào mừng quay lại! <span className="material-symbols-outlined md:text-[40px]">waving_hand</span>
          </h1>
          <p className="font-body-md opacity-90 mb-md drop-shadow-lg text-lg">
            Tổng quan hoạt động kinh doanh LazPe. Hôm nay có <span className="font-bold">{stats.pendingOrders}</span> đơn hàng đang chờ xử lý.
          </p>
          <Link href="/admin/orders">
            <button className="bg-white text-primary px-lg py-sm rounded-full font-label-md soft-shadow hover:scale-105 transition-transform active:scale-95 self-start">
              Xử lý đơn hàng
            </button>
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        {/* Doanh thu */}
        <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow flex flex-col gap-sm group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div className="bg-[#e8f5e9] p-sm rounded-lg">
              <span className="material-symbols-outlined text-[#4caf50]" style={{ fontVariationSettings: "'FILL' 1" }}>
                trending_up
              </span>
            </div>
            <span className="text-xs font-bold text-[#4caf50] bg-[#e8f5e9] px-xs py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> 12%
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant font-label-sm">Doanh thu</p>
            <h2 className="font-display-lg text-headline-md text-on-surface">{stats.revenue.toLocaleString()}₫</h2>
          </div>
          <p className="text-xs text-[#4caf50] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> {stats.completedOrders} đơn hoàn tất
          </p>
        </div>

        {/* Tổng đơn hàng */}
        <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow flex flex-col gap-sm group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div className="bg-[#fff3e0] p-sm rounded-lg">
              <span className="material-symbols-outlined text-[#ff9800]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shopping_cart
              </span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant font-label-sm">Tổng đơn hàng</p>
            <h2 className="font-display-lg text-headline-md text-on-surface">{stats.totalOrders}</h2>
          </div>
          <p className="text-xs text-[#ff9800] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span> {stats.pendingOrders} chờ xử lý
          </p>
        </div>

        {/* Khách hàng */}
        <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow flex flex-col gap-sm group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div className="bg-[#e1f5fe] p-sm rounded-lg">
              <span className="material-symbols-outlined text-[#03a9f4]" style={{ fontVariationSettings: "'FILL' 1" }}>
                group
              </span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant font-label-sm">Khách hàng</p>
            <h2 className="font-display-lg text-headline-md text-on-surface">{stats.totalUsers}</h2>
          </div>
          <p className="text-xs text-[#03a9f4] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">person_add</span> +{stats.newUsers} tháng này
          </p>
        </div>

        {/* Sản phẩm */}
        <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow flex flex-col gap-sm group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div className="bg-[#f3e5f5] p-sm rounded-lg">
              <span className="material-symbols-outlined text-[#9c27b0]" style={{ fontVariationSettings: "'FILL' 1" }}>
                inventory
              </span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant font-label-sm">Sản phẩm</p>
            <h2 className="font-display-lg text-headline-md text-on-surface">{stats.productsCount.toLocaleString()}</h2>
          </div>
          <p className="text-xs text-[#9c27b0] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">storefront</span> Đang kinh doanh
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Recent Orders Table */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl soft-shadow p-md overflow-hidden">
          <div className="flex justify-between items-center mb-md px-xs">
            <div>
              <h3 className="font-headline-md text-on-surface">Đơn hàng gần đây</h3>
              <p className="text-on-surface-variant font-label-sm">5 đơn mới nhất</p>
            </div>
            <Link href="/admin/orders">
              <button className="text-primary hover:bg-primary-container px-md py-sm rounded-lg font-label-md transition-colors border border-primary-container">
                Xem tất cả
              </button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-container font-label-sm text-on-surface-variant">
                <tr>
                  <th className="px-md py-sm rounded-l-lg">MÃ ĐƠN</th>
                  <th className="px-md py-sm">KHÁCH HÀNG</th>
                  <th className="px-md py-sm">TỔNG TIỀN</th>
                  <th className="px-md py-sm">TRẠNG THÁI</th>
                  <th className="px-md py-sm rounded-r-lg">THỜI GIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-md font-label-md text-primary">#129</td>
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs">N</div>
                      <div>
                        <p className="font-label-md truncate">Nguyễn Bảo Anh</p>
                        <p className="text-[10px] text-on-surface-variant">1 sản phẩm</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md font-bold">225,000₫</td>
                  <td className="px-md py-md">
                    <span className="px-sm py-1 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant inline-block">ĐÃ HỦY</span>
                  </td>
                  <td className="px-md py-md text-xs text-on-surface-variant">22/04/2024</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-md font-label-md text-primary">#117</td>
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">H</div>
                      <div>
                        <p className="font-label-md truncate">Hoàng Phúc</p>
                        <p className="text-[10px] text-on-surface-variant">1 sản phẩm</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md font-bold">128,570₫</td>
                  <td className="px-md py-md">
                    <span className="px-sm py-1 rounded-full text-[10px] font-bold bg-[#fff3e0] text-[#e65100] inline-block">CHỜ XÁC NHẬN</span>
                  </td>
                  <td className="px-md py-md text-xs text-on-surface-variant">22/04/2024</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-md font-label-md text-primary">#116</td>
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-tertiary-container text-tertiary flex items-center justify-center font-bold text-xs">M</div>
                      <div>
                        <p className="font-label-md truncate">Minh Tuấn</p>
                        <p className="text-[10px] text-on-surface-variant">3 sản phẩm</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md font-bold">138,570₫</td>
                  <td className="px-md py-md">
                    <span className="px-sm py-1 rounded-full text-[10px] font-bold bg-[#e8f5e9] text-[#2e7d32] inline-block">HOÀN TẤT</span>
                  </td>
                  <td className="px-md py-md text-xs text-on-surface-variant">18/04/2024</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions & Charts */}
        <div className="space-y-lg">
          {/* Quick Actions */}
          <section className="bg-surface-container-lowest rounded-xl soft-shadow p-md">
            <h3 className="font-headline-md text-on-surface mb-md">Hành động nhanh</h3>
            <div className="space-y-sm">
              <Link href="/admin/products/new">
                <button className="w-full bg-[#818cf8] text-white py-sm rounded-lg font-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">add_circle</span> Thêm sản phẩm mới
                </button>
              </Link>
              <Link href="/admin/orders">
                <button className="mt-2 w-full bg-[#4caf50] text-white py-sm rounded-lg font-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">check_circle</span> Xử lý đơn hàng
                </button>
              </Link>
              <Link href="/admin/users">
                <button className="mt-2 w-full bg-[#03a9f4] text-white py-sm rounded-lg font-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">person_search</span> Quản lý khách hàng
                </button>
              </Link>
            </div>
          </section>

          {/* User Stats */}
          <section className="bg-surface-container-lowest rounded-xl soft-shadow p-md">
            <div className="flex items-center gap-2 mb-md">
              <span className="material-symbols-outlined text-secondary">group</span>
              <h3 className="font-headline-md text-on-surface">Thống kê người dùng</h3>
            </div>
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="p-xs bg-indigo-50 rounded text-indigo-500">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <div>
                    <p className="font-label-md">Tổng người dùng</p>
                    <p className="text-[10px] text-on-surface-variant">Tất cả tài khoản</p>
                  </div>
                </div>
                <span className="font-bold">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="p-xs bg-green-50 rounded text-green-500">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <div>
                    <p className="font-label-md">Đang hoạt động</p>
                    <p className="text-[10px] text-on-surface-variant">Tài khoản active</p>
                  </div>
                </div>
                <span className="font-bold text-green-600">{stats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="p-xs bg-blue-50 rounded text-blue-500">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </div>
                  <div>
                    <p className="font-label-md">Mới tháng này</p>
                    <p className="text-[10px] text-on-surface-variant">Đăng ký gần đây</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">{stats.newUsers}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-xl text-center text-on-surface-variant font-label-sm pb-lg border-t border-outline-variant pt-lg">
        <p>© 2024 Cổng quản trị LazPe. Bảo lưu mọi quyền.</p>
        <div className="mt-sm flex justify-center gap-md">
          <Link className="hover:text-primary transition-colors" href="#">Chính sách bảo mật</Link>
          <Link className="hover:text-primary transition-colors" href="#">Liên hệ hỗ trợ</Link>
          <Link className="hover:text-primary transition-colors" href="#">Hướng dẫn sử dụng</Link>
        </div>
      </footer>
    </main>
  );
}