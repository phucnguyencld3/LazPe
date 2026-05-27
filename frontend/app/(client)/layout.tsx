import Header from "@/app/components/Header";
import { WishlistProvider } from "@/context/WishlistContext";
import CustomerChatWidget from "@/components/client/CustomerChatWidget";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WishlistProvider>
      <div className="min-h-screen bg-white text-slate-900 client-scaled-layout">
        <Header />
        <main className="pt-20">{children}</main>
        <CustomerChatWidget />
      <footer className="border-t border-slate-200 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-center">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Về chúng tôi</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-slate-900">Công ty</a></li>
                <li><a href="#" className="hover:text-slate-900">Tin tức</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Liên hệ</a></li>
                <li><a href="#" className="hover:text-slate-900">FAQ</a></li>
                <li><a href="#" className="hover:text-slate-900">Chính sách</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Pháp lý</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Điều khoản</a></li>
                <li><a href="#" className="hover:text-slate-900">Quyền riêng tư</a></li>
                <li><a href="#" className="hover:text-slate-900">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Theo dõi</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Facebook</a></li>
                <li><a href="#" className="hover:text-slate-900">Instagram</a></li>
                <li><a href="#" className="hover:text-slate-900">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2026 LazPe. Tất cả quyền được bảo vệ.</p>
          </div>
        </div>
      </footer>
    </div>
    </WishlistProvider>
  );
}