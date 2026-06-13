const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/app/(admin)/layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
content = content.replace('const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);',
`const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem("sidebarPinned");
    if (savedPin !== null) {
      setIsSidebarPinned(savedPin === "true");
    }
  }, []);

  const handleTogglePin = () => {
    const newVal = !isSidebarPinned;
    setIsSidebarPinned(newVal);
    localStorage.setItem("sidebarPinned", String(newVal));
  };

  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;
  const sidebarWidth = isSidebarExpanded ? "w-72" : "w-[84px]";
  const marginLeft = isSidebarPinned ? "lg:ml-72" : "lg:ml-[84px]";`);

// 2. Update header and main ml-72 to ${marginLeft}
content = content.replace(/className="hidden lg:flex sticky top-0 z-40 items-center justify-between w-full h-16 px-margin-desktop bg-surface-container-lowest shadow-sm shadow-primary\/10"/, 'className="hidden lg:flex sticky top-0 z-40 items-center justify-between w-full h-16 px-margin-desktop bg-surface-container-lowest shadow-sm shadow-primary/10 transition-all duration-300"');
content = content.replace(/className="flex items-center gap-sm ml-72 flex-1 max-w-2xl pr-8"/, 'className={`flex items-center gap-sm flex-1 max-w-2xl pr-8 transition-all duration-300 ${marginLeft}`}');
content = content.replace(/className={`flex-1 lg:ml-72 flex flex-col \${pathname === "\/admin\/chats" \? "h-\[calc\(133.33vh-5rem\)\] p-4 pb-2" : "p-4 md:p-margin-desktop min-h-0 w-full overflow-hidden"}`}/, 'className={`flex-1 flex flex-col transition-all duration-300 ${marginLeft} ${pathname === "/admin/chats" ? "h-[calc(133.33vh-5rem)] p-4 pb-2" : "p-4 md:p-margin-desktop min-h-0 w-full overflow-hidden"}`}');

// 3. Update aside
content = content.replace(/<aside className={`fixed left-0 top-0 h-full w-72 py-md gap-sm bg-surface-container-low flex flex-col z-50 shadow-xl shadow-primary\/5 transition-transform duration-300 overflow-y-auto sidebar-scroll \${isMobileMenuOpen \? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} style={{ scrollbarWidth: "thin" }}>/,
`<aside 
          onMouseEnter={() => !isSidebarPinned && setIsSidebarHovered(true)}
          onMouseLeave={() => !isSidebarPinned && setIsSidebarHovered(false)}
          className={\`fixed left-0 top-0 h-full py-md gap-sm bg-surface-container-low flex flex-col z-50 shadow-xl shadow-primary/5 transition-all duration-300 overflow-y-auto overflow-x-hidden sidebar-scroll \${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 \${sidebarWidth}\`} 
          style={{ scrollbarWidth: "thin" }}
        >`);

// 4. Update Sidebar Header (Logo and Pin Button)
content = content.replace(/<div className="flex items-center gap-sm mb-xs">\s*<span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings<\/span>\s*<h2 className="text-2xl font-bold text-slate-900 tracking-tight">\s*Laz<span className="text-rose-500">Pe<\/span> <span className="text-sm font-semibold text-slate-500">Admin<\/span>\s*<\/h2>\s*<\/div>\s*<p className="font-label-sm text-label-sm text-on-surface-variant">Hệ thống quản lý LazPe<\/p>\s*<\/div>/,
`<div className={\`flex items-center \${isSidebarExpanded ? 'justify-between' : 'justify-center'} mb-xs\`}>
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
                {isSidebarExpanded && (
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap animate-in fade-in zoom-in-95 duration-300">
                    Laz<span className="text-rose-500">Pe</span> <span className="text-sm font-semibold text-slate-500">Admin</span>
                  </h2>
                )}
              </div>
              {isSidebarExpanded && (
                <button 
                  onClick={handleTogglePin} 
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                  title={isSidebarPinned ? "Bỏ ghim Sidebar" : "Ghim Sidebar"}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSidebarPinned ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                </button>
              )}
            </div>
            {isSidebarExpanded && <p className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap animate-in fade-in duration-300">Hệ thống quản lý LazPe</p>}
          </div>`);

// 5. Update Nav Category Titles
content = content.replace(/<span className="font-label-sm text-\[12px\] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">(.*?)<\/span>/g, 
`{isSidebarExpanded ? (
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">$1</span>
            ) : (
              <div className="flex justify-center mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
              </div>
            )}`);

// 6. Update all Nav Links
const linkRegex = /<Link\s+href="([^"]+)"\s+className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 \${isActive\([^)]+\)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"}`}\s*>\s*<span className="material-symbols-outlined"[^>]*>([^<]+)<\/span>\s*<span className="text-\[14.5px\] font-semibold">([^<]+)<\/span>\s*<\/Link>/g;

content = content.replace(linkRegex, (match, href, icon, title) => {
  return `<Link
                href="${href}"
                className={\`flex items-center py-3.5 mx-3 rounded-xl transition-all duration-200 \${isActive("${href}") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} \${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}\`}
                title={!isSidebarExpanded ? "${title}" : undefined}
              >
                <span className="material-symbols-outlined text-[22px] flex-shrink-0">${icon}</span>
                {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">${title}</span>}
              </Link>`;
});

// For permissions icon
const specialLinkRegex = /<Link\s+href="([^"]+)"\s+className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 \${isActive\([^)]+\)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"}`}\s*>\s*<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>([^<]+)<\/span>\s*<span className="text-\[14.5px\] font-semibold">([^<]+)<\/span>\s*<\/Link>/g;

content = content.replace(specialLinkRegex, (match, href, icon, title) => {
  return `<Link
                href="${href}"
                className={\`flex items-center py-3.5 mx-3 rounded-xl transition-all duration-200 \${isActive("${href}") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} \${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}\`}
                title={!isSidebarExpanded ? "${title}" : undefined}
              >
                <span className="material-symbols-outlined text-[22px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>${icon}</span>
                {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">${title}</span>}
              </Link>`;
});


// 7. Bottom buttons (Help, Logout) and its container
content = content.replace(/<div className="mt-auto px-4 pb-md pt-md space-y-2">/, 
  `<div className={\`mt-auto pb-md pt-md space-y-2 \${isSidebarExpanded ? "px-4" : "px-0 flex flex-col items-center"}\`}>`
);

content = content.replace(/<button className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-label-md py-3 rounded-full hover:scale-105 active:scale-95 shadow-md transition-transform cursor-pointer">\s*<span className="material-symbols-outlined text-sm">help<\/span>\s*Trung tâm hỗ trợ\s*<\/button>/,
`<button 
              className={\`flex items-center justify-center gap-2 bg-secondary text-on-secondary font-label-md rounded-xl hover:bg-secondary/90 shadow-sm transition-all cursor-pointer \${isSidebarExpanded ? "w-full py-3 px-4" : "w-[44px] h-[44px] mx-auto px-0 rounded-full"}\`}
              title={!isSidebarExpanded ? "Trung tâm hỗ trợ" : undefined}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">help</span>
              {isSidebarExpanded && <span className="whitespace-nowrap animate-in fade-in duration-300">Trung tâm hỗ trợ</span>}
            </button>`);

content = content.replace(/<button \s*onClick={handleLogout}\s*className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-label-md py-3 rounded-full hover:scale-105 active:scale-95 shadow-md shadow-rose-500\/10 transition-all cursor-pointer"\s*>\s*<span className="material-symbols-outlined text-sm">logout<\/span>\s*Đăng xuất\s*<\/button>/,
`<button 
              onClick={handleLogout}
              className={\`flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-all cursor-pointer \${isSidebarExpanded ? "w-full py-3 px-4" : "w-[44px] h-[44px] mx-auto px-0 rounded-full mt-2"}\`}
              title={!isSidebarExpanded ? "Đăng xuất" : undefined}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {isSidebarExpanded && <span className="whitespace-nowrap animate-in fade-in duration-300">Đăng xuất</span>}
            </button>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Sidebar refactored successfully.');
