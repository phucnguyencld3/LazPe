const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/app/(admin)/layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

const correctBlock = `  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col relative admin-scaled-layout">
      {/* Mobile Top Navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-full cursor-pointer text-slate-700"
          >
            menu
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Laz<span className="text-rose-500">Pe</span>
          </h1>
        </div>
        <Link href="/admin/profile" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
            {user?.avatar ? (
              <img alt="Avatar" className="w-full h-full object-cover" src={user.avatar} />
            ) : (
              <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
            )}
          </div>
        </Link>
      </div>

      {/* Top Navigation Shell (Desktop) */}
      <header className="hidden lg:flex sticky top-0 z-40 items-center justify-between w-full h-16 px-margin-desktop bg-surface-container-lowest shadow-sm shadow-primary/10 transition-all duration-300">
        <div className={\`flex items-center gap-4 flex-1 max-w-2xl pr-8 transition-all duration-300 \${marginLeft}\`}>
          <button 
            onClick={handleTogglePin} 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
            title={isSidebarPinned ? "Thu gọn Sidebar" : "Mở rộng Sidebar"}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isSidebarPinned ? "menu_open" : "menu"}
            </span>
          </button>
          
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh mã đơn hàng, sản phẩm, email khách hàng..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none text-slate-700 font-medium" 
            />
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className={\`material-symbols-outlined p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors duration-300 relative focus:outline-none \${unreadCount > 0 ? "animate-pulse" : ""}\`}
              title="Thông báo"`;

const startIndex = content.indexOf('  return (\n    <div className="bg-background');
const endIndexStr = `>\n              notifications\n              {unreadCount > 0 && (`;
const endIndex = content.indexOf(endIndexStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + correctBlock + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Restored header!");
} else {
  console.error("Could not find boundaries.");
  console.log("startIndex:", startIndex);
  console.log("endIndex:", endIndex);
}
