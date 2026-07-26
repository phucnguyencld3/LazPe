import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageCircle, CreditCard, Truck, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import { BannerRenderer } from '@/components/shared/banner/BannerRenderer';

export function Footer() {
  const { banners } = useBanners('footer');

  return (
    <footer className="border-t border-surface-variant bg-surface-container-lowest mt-auto relative">
      {/* Banner Chân Trang (Footer) */}
      {banners && banners.length > 0 && (
        <div className="w-full bg-slate-50 border-b border-surface-variant">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            {banners.map(b => <BannerRenderer key={b.id || 'preview'} banner={b} />)}
          </div>
        </div>
      )}
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {/* Cột 1: Thông tin công ty */}
            <div className="space-y-2">
              <h3 className="font-bold text-base text-on-surface mb-1">Công Ty Cổ Phần LazPe</h3>
              <p className="font-semibold text-xs text-on-surface-variant">Thành viên Tập đoàn LazPe Group</p>

              <ul className="space-y-2 md:space-y-1 text-xs md:text-sm text-on-surface-variant">
                <li><strong>Email:</strong> lazpevn@gmail.com</li>
                <li><strong>Điện thoại:</strong> 0123 456 789</li>
                <li><strong>MSDN:</strong> 0123456789 do Sở KH&ĐT TP.HCM cấp</li>
                <li><strong>Trụ sở:</strong> 9999 Nguyễn Du, P.Sài Gòn, TP.HCM</li>
                <li><strong>VP:</strong> Tầng 9999 Phú Mỹ Hưng Tower, 08 Hoàng Văn Thái, P.Tân Mỹ, TP.HCM</li>
              </ul>

              <div className="pt-2">
                <p className="text-xs font-semibold mb-1">Mua hàng & CSKH: <span className="text-primary font-bold text-sm">1900 0019</span> (Miễn phí)</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary">
                  <span className="font-quicksand font-bold text-base tracking-tight">LazPe</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary text-white rounded-full">MẸ VÀ BÉ</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Hỗ trợ khách hàng */}
            <div>
              <h3 className="font-bold text-sm text-on-surface mb-2">Hỗ Trợ Khách Hàng</h3>
              <ul className="space-y-2 md:space-y-1 text-sm md:text-xs text-on-surface-variant">
                <li><Link href="/order-tracking" className="hover:text-primary transition-colors">Tra cứu hoá đơn</Link></li>
                <li><Link href="/terms#payment" className="hover:text-primary transition-colors">Chính sách giao hàng</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Tin Khuyến Mãi</Link></li>
                <li><Link href="profile?tab=loyalty" className="hover:text-primary transition-colors">Hạng thành viên</Link></li>
                <li><Link href="/terms#payment" className="hover:text-primary transition-colors">Qui định & hình thức thanh toán</Link></li>
                <li><Link href="/terms#returns" className="hover:text-primary transition-colors">Bảo hành & Bảo trì</Link></li>
                <li><Link href="/terms#returns" className="hover:text-primary transition-colors">Đổi trả & Hoàn tiền</Link></li>
                <li><Link href="/terms#dispute" className="hover:text-primary transition-colors">Giải quyết khiếu nại & Tranh chấp</Link></li>
              </ul>
            </div>

            {/* Cột 3: Về LazPe & Thanh toán */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-on-surface mb-2">Về LazPe</h3>
                <ul className="space-y-2 md:space-y-1 text-sm md:text-xs text-on-surface-variant">
                  <li><Link href="/about-us" className="hover:text-primary transition-colors">Giới thiệu về LazPe</Link></li>
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Điều khoản chung</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface mb-2">Thanh Toán</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="w-[3.5rem] h-7 bg-white border border-surface-variant rounded flex items-center justify-center shadow-sm">
                    <span className="font-extrabold text-[#1A1F71] italic text-xs tracking-tighter">VISA</span>
                  </div>
                  <div className="w-[3.5rem] h-7 bg-white border border-surface-variant rounded flex items-center justify-center shadow-sm">
                    <span className="font-extrabold text-[#00A650] italic text-[10px] tracking-tighter">napas</span>
                  </div>
                  <div className="w-[3.5rem] h-7 bg-white border border-surface-variant rounded flex items-center justify-center shadow-sm">
                    <span className="font-extrabold text-[10px] tracking-tighter">
                      <span className="text-[#EE2E24]">VN</span><span className="text-[#005BAA]">PAY</span>
                    </span>
                  </div>
                  <div className="px-2 h-7 bg-white border border-surface-variant rounded flex items-center justify-center gap-1 shadow-sm">
                    <CreditCard size={12} className="text-slate-600" />
                    <span className="font-semibold text-[10px] text-slate-700">ATM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 4: Kết nối với chúng tôi */}
            <div>
              <h3 className="font-bold text-sm text-on-surface mb-2">Kết Nối Với Chúng Tôi</h3>
              <div className="space-y-3 md:space-y-2">
                <a href="mailto:lazpevn@gmail.com" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/10">
                    <Mail size={16} />
                  </div>
                  <span className="font-medium text-xs">lazpevn@gmail.com</span>
                </a>

                <a href="tel:0123456789" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/10">
                    <Phone size={16} />
                  </div>
                  <span className="font-medium text-xs">0123 456 789</span>
                </a>

                <a href="#" className="flex items-center gap-2 text-on-surface-variant hover:text-blue-500 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-blue-50">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium text-xs">Facebook</span>
                </a>

                <a href="#" className="flex items-center gap-2 text-on-surface-variant hover:text-blue-400 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-blue-50">
                    <MessageCircle size={16} className="text-blue-500" />
                  </div>
                  <span className="font-medium text-xs">Zalo</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-surface-variant pt-4 flex flex-col md:flex-row justify-between items-center text-xs text-on-surface-variant">
            <p>&copy; {new Date().getFullYear()} LazPe. Tất cả quyền được bảo vệ.</p>
            <div className="mt-2 md:mt-0 space-x-4">
              <Link href="/terms" className="hover:text-primary">Điều khoản sử dụng</Link>
              <Link href="/privacy" className="hover:text-primary">Chính sách bảo mật</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
