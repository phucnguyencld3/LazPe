import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/api";
import { Card, StatsCard } from "@/components/admin/ui/Card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/admin/ui/Table";
import Button from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";

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
    <div className="w-full space-y-8 font-outfit">
      {/* Welcome Banner */}
      <section 
        className="relative rounded-[2rem] overflow-hidden shadow-theme-xs min-h-[260px] flex items-center bg-cover bg-center border border-gray-100 dark:border-white/[0.05]"
        style={{ backgroundImage: `url('/Dashboard-page-img/Dashboard-page-banner.png')` }}
      >
        {/* Gradient Overlay to improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent"></div>
        
        <div className="relative px-8 lg:px-12 z-10 text-white max-w-2xl py-8 h-full flex flex-col justify-center">
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 drop-shadow-md flex items-center gap-2">
            Chào mừng quay lại! <span className="material-symbols-outlined text-3xl lg:text-[40px] text-brand-400">waving_hand</span>
          </h1>
          <p className="opacity-90 mb-5 drop-shadow-md text-sm lg:text-base leading-relaxed">
            Tổng quan hoạt động kinh doanh LazPe. Hôm nay có <span className="font-bold text-brand-300">{stats.pendingOrders}</span> đơn hàng đang chờ xử lý.
          </p>
          <Link href="/admin/orders">
            <Button variant="primary" className="self-start px-6 py-2.5 rounded-full text-xs font-bold bg-white text-brand-600 hover:bg-gray-100 active:scale-95 shadow-theme-sm border border-transparent">
              Xử lý đơn hàng
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh thu */}
        <StatsCard
          title="Doanh thu"
          value={`${stats.revenue.toLocaleString()}₫`}
          icon={<span className="material-symbols-outlined text-[#10b981] text-2xl font-bold">trending_up</span>}
          iconBgColor="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          trend="+12% tháng này"
          trendType="up"
        />

        {/* Tổng đơn hàng */}
        <StatsCard
          title="Tổng đơn hàng"
          value={stats.totalOrders}
          icon={<span className="material-symbols-outlined text-[#f59e0b] text-2xl font-bold">shopping_cart</span>}
          iconBgColor="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          trend={`${stats.pendingOrders} chờ xử lý`}
          trendType="neutral"
        />

        {/* Khách hàng */}
        <StatsCard
          title="Khách hàng"
          value={stats.totalUsers}
          icon={<span className="material-symbols-outlined text-[#3b82f6] text-2xl font-bold">group</span>}
          iconBgColor="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
          trend={`+${stats.newUsers} tháng này`}
          trendType="up"
        />

        {/* Sản phẩm */}
        <StatsCard
          title="Sản phẩm"
          value={stats.productsCount}
          icon={<span className="material-symbols-outlined text-[#8b5cf6] text-2xl font-bold">inventory</span>}
          iconBgColor="bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
          trend="Đang kinh doanh"
          trendType="neutral"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <section className="lg:col-span-2">
          <Card 
            title="Đơn hàng gần đây" 
            headerAction={
              <Link href="/admin/orders">
                <Button variant="outline" size="sm" className="rounded-xl font-bold">
                  Xem tất cả
                </Button>
              </Link>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="font-bold">MÃ ĐƠN</TableCell>
                  <TableCell isHeader className="font-bold">KHÁCH HÀNG</TableCell>
                  <TableCell isHeader className="font-bold">TỔNG TIỀN</TableCell>
                  <TableCell isHeader className="font-bold">TRẠNG THÁI</TableCell>
                  <TableCell isHeader className="font-bold">THỜI GIAN</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold text-brand-600 dark:text-brand-400">#129</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">N</div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white/90 truncate">Nguyễn Bảo Anh</p>
                        <p className="text-[10px] text-gray-400">1 sản phẩm</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-gray-800 dark:text-white/90 text-sm">225,000₫</TableCell>
                  <TableCell>
                    <Badge color="light" size="sm">ĐÃ HỦY</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">22/04/2024</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-brand-600 dark:text-brand-400">#117</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">H</div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white/90 truncate">Hoàng Phúc</p>
                        <p className="text-[10px] text-gray-400">1 sản phẩm</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-gray-800 dark:text-white/90 text-sm">128,570₫</TableCell>
                  <TableCell>
                    <Badge color="warning" size="sm">CHỜ XÁC NHẬN</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">22/04/2024</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-brand-600 dark:text-brand-400">#116</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">M</div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white/90 truncate">Minh Tuấn</p>
                        <p className="text-[10px] text-gray-400">3 sản phẩm</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-gray-800 dark:text-white/90 text-sm">138,570₫</TableCell>
                  <TableCell>
                    <Badge color="success" size="sm">HOÀN TẤT</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">18/04/2024</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Quick Actions & Charts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card title="Hành động nhanh">
            <div className="space-y-3">
              <Link href="/admin/products/new">
                <Button variant="primary" className="w-full justify-center py-2.5 rounded-xl font-bold bg-[#818cf8] hover:bg-[#6366f1]">
                  <span className="material-symbols-outlined text-sm">add_circle</span> Thêm sản phẩm mới
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="primary" className="w-full justify-center py-2.5 rounded-xl font-bold bg-success-500 hover:bg-success-600">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Xử lý đơn hàng
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="primary" className="w-full justify-center py-2.5 rounded-xl font-bold bg-blue-500 hover:bg-blue-600">
                  <span className="material-symbols-outlined text-sm">person_search</span> Quản lý khách hàng
                </Button>
              </Link>
              <Link href="/admin/statistics">
                <Button variant="primary" className="w-full justify-center py-2.5 rounded-xl font-bold bg-purple-500 hover:bg-purple-600">
                  <span className="material-symbols-outlined text-sm">bar_chart</span> Xem báo cáo thống kê
                </Button>
              </Link>
            </div>
          </Card>

          {/* User Stats */}
          <Card title="Thống kê người dùng">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-500 dark:text-indigo-400">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Tổng người dùng</p>
                    <p className="text-[10px] text-gray-400">Tất cả tài khoản</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-white/90">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-500 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Đang hoạt động</p>
                    <p className="text-[10px] text-gray-400">Tài khoản active</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500 dark:text-blue-400">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Mới tháng này</p>
                    <p className="text-[10px] text-gray-400">Đăng ký gần đây</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.newUsers}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}