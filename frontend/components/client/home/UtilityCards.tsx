'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Search, Package, Heart, Ticket, Sparkles, Tag, Gift } from 'lucide-react';

function UtilityIcon({ icon, color, label, badge, href }: any) {
  const content = (
    <>
      <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-white group-hover:border-slate-200 group-hover:-translate-y-1 transition-all`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: color })}
        {badge && (
          <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/3 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-bold text-center text-slate-600 leading-tight w-full break-words group-hover:text-primary transition-colors">
        {label}
      </span>
    </>
  );

  if (href) {
    if (href.startsWith('tel:')) {
      return (
        <a href={href} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[64px] w-[72px] lg:w-[88px] shrink-0 md:shrink hover:opacity-90">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[64px] w-[72px] lg:w-[88px] shrink-0 md:shrink hover:opacity-90">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group min-w-[64px] w-[72px] lg:w-[88px] shrink-0 md:shrink hover:opacity-90">
      {content}
    </div>
  );
}

export default function UtilityCards() {
  return (
    <div className="bg-white rounded-[10px] shadow-sm px-5 py-3 md:px-6 md:py-4 mb-2">
      <h3 className="font-bold text-xl mb-3 text-slate-800">Tiện Ích</h3>
      <div className="flex flex-nowrap overflow-x-auto lg:overflow-hidden pb-2 -mx-1 px-1 scrollbar-hide gap-4 sm:gap-6 lg:gap-2 xl:gap-4 lg:justify-between overscroll-x-contain touch-pan-x w-full">
        <UtilityIcon href="/rewards" icon={<Gift size={22} />} color="text-red-500" label="Nhận Thưởng" />
        <UtilityIcon href="/order-tracking" icon={<Search size={22} />} color="text-indigo-500" label="Tra Cứu Đơn" />
        <UtilityIcon href="/profile?tab=orders" icon={<Package size={22} />} color="text-cyan-500" label="Đơn Của Tôi" />
        <UtilityIcon href="/wishlist" icon={<Heart size={22} />} color="text-rose-500" label="SP Yêu Thích" />
        <UtilityIcon href="/vouchers" icon={<Ticket size={22} />} color="text-orange-500" label="Kho Voucher" />
        <UtilityIcon href="/profile?tab=loyalty" icon={<Sparkles size={22} />} color="text-amber-500" label="Thành Viên" />
        <UtilityIcon href="/products?sort=sale" icon={<Tag size={22} />} color="text-teal-500" label="Khuyến Mãi" />
      </div>
    </div>
  );
}
