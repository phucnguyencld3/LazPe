import React from 'react';
import SidebarMenuV2 from '@/components/client/layout/SidebarMenuV2';
import HomeBanner from '@/components/client/home/HomeBanner';
import UtilityCards from '@/components/client/home/UtilityCards';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-6 relative">
      {/* Left Sidebar */}
      <div className="hidden lg:block sticky top-28 h-fit z-40">
        <SidebarMenuV2 />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[calc(100vw-2rem)] lg:max-w-none flex flex-col gap-1 min-w-0">
        
        <HomeBanner />
        
        <UtilityCards />

        {/* Dynamic content (Product list, Utilities, etc.) */}
        {children}

      </div>
    </div>
  );
}
