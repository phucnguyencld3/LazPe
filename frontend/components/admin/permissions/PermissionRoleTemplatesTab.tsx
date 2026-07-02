"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

interface PermissionRoleTemplatesTabProps {
  showHeader?: boolean;
}

export const PermissionRoleTemplatesTab: React.FC<PermissionRoleTemplatesTabProps> = ({
  showHeader = false,
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Custom confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<any>(null);

  // Expand/collapse resource groups state
  const [expandedResources, setExpandedResources] = useState<string[]>([]);

  // Search input state inside modal
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const [tplRes, permRes] = await Promise.all([
        fetch(`${API_BASE_URL}/RoleTemplate`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/Permission`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const tplData = await tplRes.json();
      const permData = await permRes.json();

      if (tplData.success) setTemplates(tplData.data);
      if (permData.success) {
        const filteredPerms = permData.data.filter((p: any) => p.resource?.toLowerCase() !== "address");
        setPermissions(filteredPerms);
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu gói quyền");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template: any = null) => {
    setEditingTemplate(template);
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setSelectedPermissions(template.permissions.map((p: any) => p.permissionId));
    } else {
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    }
    // Clear previous search terms
    setPermissionSearchTerm("");
    // Collapse all resources when modal opens
    setExpandedResources([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleTogglePermission = (id: number) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Tên gói quyền không được để trống");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const url = editingTemplate
        ? `${API_BASE_URL}/RoleTemplate/${editingTemplate.id}`
        : `${API_BASE_URL}/RoleTemplate`;
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, permissionIds: selectedPermissions })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingTemplate ? "Cập nhật thành công" : "Tạo gói quyền thành công");
        handleCloseModal();
        fetchData();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến máy chủ");
    }
  };

  const handleRequestDelete = (template: any) => {
    setDeletingTemplate(template);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/RoleTemplate/${deletingTemplate.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa gói quyền");
        setDeleteConfirmOpen(false);
        setDeletingTemplate(null);
        fetchData();
      } else {
        toast.error(data.message || "Lỗi khi xóa gói quyền");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleToggleExpandResource = (resource: string) => {
    setExpandedResources(prev =>
      prev.includes(resource) ? prev.filter(r => r !== resource) : [...prev, resource]
    );
  };

  const handleExpandAll = () => {
    setExpandedResources(Object.keys(groupedPermissions));
  };

  const handleCollapseAll = () => {
    setExpandedResources([]);
  };

  const handleToggleGroupSelect = (groupPermissions: any[], shouldSelect: boolean) => {
    const groupIds = groupPermissions.map((p) => p.id);
    setSelectedPermissions((prev) => {
      if (shouldSelect) {
        const newIds = new Set(prev);
        groupIds.forEach((id) => newIds.add(id));
        return Array.from(newIds);
      } else {
        return prev.filter((id) => !groupIds.includes(id));
      }
    });
  };

  // Filter permissions based on search term
  const filteredPermissions = permissions.filter(perm => {
    const term = permissionSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      perm.name.toLowerCase().includes(term) ||
      (perm.description && perm.description.toLowerCase().includes(term)) ||
      (perm.resource && perm.resource.toLowerCase().includes(term))
    );
  });

  // Group permissions for rendering
  const groupedPermissions = filteredPermissions.reduce((acc: any, curr: any) => {
    const resource = curr.resource || "Khác";
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(curr);
    return acc;
  }, {});

  // Auto expand resource groups that contain search results
  useEffect(() => {
    if (permissionSearchTerm.trim()) {
      const activeGroups = Object.keys(groupedPermissions);
      setExpandedResources(activeGroups);
    }
  }, [permissionSearchTerm]);

  const getResourceIcon = (resource: string) => {
    switch (resource.toUpperCase()) {
      case "ADDRESS": return "location_on";
      case "ADMIN": return "admin_panel_settings";
      case "PRODUCT": return "inventory_2";
      case "BRAND": return "verified";
      case "CATEGORY": return "category";
      case "COMBO": return "inventory";
      case "LOYALTY": return "loyalty";
      case "NOTIFICATION": return "notifications";
      case "ORDER": return "shopping_cart";
      case "REVIEW": return "gavel";
      case "USER": return "group";
      default: return "settings";
    }
  };

  return (
    <div className="w-full pb-10 animate-fadeIn">
      {showHeader ? (
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Quản lý Gói Quyền (Role Templates)</h1>
            <p className="text-slate-500 mt-1">
              Thiết lập các gói quyền mặc định (ví dụ: Staff, Manager) để gán nhanh cho nhân sự.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tạo Gói Quyền
          </button>
        </header>
      ) : (
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap border-b border-slate-100 pb-4">
          <div>
            <p className="font-medium text-slate-500 text-sm">
              Thiết lập các gói quyền mặc định (ví dụ: Staff, Manager) để gán nhanh cho nhân sự của hệ thống.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tạo Gói Quyền
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-sm">
                  <div>
                    <h3 className="font-headline-sm text-[16px] font-bold text-on-surface">{template.name}</h3>
                    <p className="text-xs text-on-surface-variant/70 mt-xs leading-relaxed">
                      {template.description || "Không có mô tả"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenModal(template)}
                      className="text-on-surface-variant/60 hover:text-primary p-1 rounded-full hover:bg-primary-container/20 transition-colors cursor-pointer"
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleRequestDelete(template)}
                      className="text-on-surface-variant/60 hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-lg p-md mt-md">
                  <div className="text-xs font-bold text-on-surface mb-sm">
                    Quyền hạn ({template.permissions.length}):
                  </div>
                  <div className="flex flex-wrap gap-xs">
                    {template.permissions.slice(0, 5).map((p: any) => (
                      <span
                        key={p.permissionId}
                        className="px-sm py-0.5 bg-primary-container/20 text-primary rounded text-[11px] font-medium"
                      >
                        {p.name}
                      </span>
                    ))}
                    {template.permissions.length > 5 && (
                      <span className="px-sm py-0.5 bg-surface-variant text-on-surface-variant rounded text-[11px] font-medium">
                        +{template.permissions.length - 5} quyền khác
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          {/* Modal Container - Stable height and scroll constraint */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl w-full max-w-5xl h-[80vh] max-h-[800px] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header - Increased text size & spacing slightly */}
            <div className="py-3.5 px-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-headline-sm text-base text-on-surface font-bold">
                {editingTemplate ? "Cập nhật Gói Quyền" : "Tạo Gói Quyền Mới"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-on-surface-variant hover:text-error rounded-full p-1 hover:bg-error-container/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Split Content - scroll-free parent container */}
            <div className="p-lg bg-surface-container-lowest overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg flex-1 min-h-0">
                
                {/* Left Side: General Info Form - Standard Readable Sizes */}
                <div className="lg:col-span-2 space-y-md pr-lg lg:border-r border-outline-variant/20 flex flex-col justify-start">
                  <h3 className="font-headline-sm text-sm font-bold text-primary pb-xs border-b border-outline-variant/10 mb-xs uppercase tracking-wider">
                    Thông tin gói quyền
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider mb-xs">Tên gói quyền</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface text-sm font-medium"
                      placeholder="VD: Staff, Manager..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider mb-xs">Mô tả chi tiết</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface text-sm font-medium resize-none"
                      placeholder="Mô tả vai trò của gói quyền này..."
                    />
                  </div>
                </div>

                {/* Right Side: Permission Accordion Selector (Scrollable) */}
                <div className="lg:col-span-3 flex flex-col min-h-0 h-full">
                  
                  {/* Permissions Config Header with unfold buttons - Standard Sizes */}
                  <div className="flex justify-between items-center mb-sm pb-xs border-b border-outline-variant/20 shrink-0">
                    <h3 className="font-headline-sm text-sm font-bold text-primary">
                      Cấu hình Quyền hạn
                    </h3>
                    <div className="flex gap-sm items-center">
                      <button
                        type="button"
                        onClick={handleExpandAll}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                        Mở rộng
                      </button>
                      <span className="text-outline-variant/30 text-xs">|</span>
                      <button
                        type="button"
                        onClick={handleCollapseAll}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">unfold_less</span>
                        Thu gọn
                      </button>
                    </div>
                  </div>

                  {/* Search Bar Input - Standard Text Size */}
                  <div className="relative flex items-center mb-sm shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant/50 absolute left-2.5 text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhanh quyền hạn..."
                      value={permissionSearchTerm}
                      onChange={(e) => setPermissionSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-7 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-on-surface"
                    />
                    {permissionSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setPermissionSearchTerm("")}
                        className="absolute right-2.5 text-on-surface-variant/50 hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">clear</span>
                      </button>
                    )}
                  </div>

                  {/* Scrollable list of accordion resources - Flex-1 min-h-0 scroll */}
                  <div 
                    className="space-y-sm overflow-y-auto pr-xs flex-1 min-h-0" 
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {Object.keys(groupedPermissions).map(resource => {
                      const resourcePermissions = groupedPermissions[resource];
                      const isExpanded = expandedResources.includes(resource);
                      
                      // Count selected permissions in this group
                      const groupSelectedCount = resourcePermissions.filter((p: any) =>
                        selectedPermissions.includes(p.id)
                      ).length;

                      return (
                        <div 
                          key={resource} 
                          className="border border-outline-variant/15 rounded-lg overflow-hidden bg-surface-container-low transition-all"
                        >
                          {/* Accordion Group Header - Highly Legible */}
                          <div
                            onClick={() => handleToggleExpandResource(resource)}
                            className="py-2.5 px-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-high transition-colors select-none"
                          >
                            <div className="flex items-center gap-sm">
                              <input
                                type="checkbox"
                                checked={groupSelectedCount === resourcePermissions.length && resourcePermissions.length > 0}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleToggleGroupSelect(resourcePermissions, e.target.checked)}
                                className="w-4 h-4 rounded border-outline-variant/50 text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                                title="Chọn tất cả quyền trong chức năng này"
                              />
                              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                                {getResourceIcon(resource)}
                              </span>
                              <span className="font-bold text-xs text-on-surface uppercase tracking-wider">
                                {resource}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                groupSelectedCount > 0 
                                  ? "bg-primary/10 text-primary border border-primary/20" 
                                  : "bg-surface-variant text-on-surface-variant/60"
                              }`}>
                                {groupSelectedCount}/{resourcePermissions.length} đã chọn
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-on-surface-variant/60 text-[20px] shrink-0">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </div>

                          {/* Accordion Group Content - Legible & Readable checkbox list */}
                          {isExpanded && (
                            <div className="px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/10 divide-y divide-outline-variant/5">
                              {resourcePermissions.map((perm: any) => (
                                <div key={perm.id} className="py-2 first:pt-1 last:pb-1">
                                  <label className="flex items-start gap-sm cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.includes(perm.id)}
                                      onChange={() => handleTogglePermission(perm.id)}
                                      className="mt-0.5 w-4 h-4 rounded border-outline-variant/50 text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                                        {perm.name}
                                      </div>
                                      {perm.description && (
                                        <div className="text-xs text-on-surface-variant/70 mt-0.5 leading-normal">
                                          {perm.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {Object.keys(groupedPermissions).length === 0 && (
                      <div className="text-center py-8 bg-surface-container-low rounded-lg text-on-surface-variant/70 font-medium text-xs">
                        Không tìm thấy quyền hạn nào khớp với từ khóa tìm kiếm.
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Modal Footer - Thinner padding and compact buttons */}
            <div className="py-3 px-6 border-t border-outline-variant/20 flex justify-end gap-sm bg-surface-container-low shrink-0">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-colors cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary/95 transition-colors shadow-sm cursor-pointer text-xs"
              >
                Lưu Gói Quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal - Legible Size */}
      {deleteConfirmOpen && deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="py-3 px-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
              <h2 className="text-sm text-rose-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Xác nhận xóa
              </h2>
              <button
                onClick={() => { setDeleteConfirmOpen(false); setDeletingTemplate(null); }}
                className="text-on-surface-variant hover:text-error rounded-full p-0.5 hover:bg-error-container/20 transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 bg-surface-container-lowest text-on-surface">
              <p className="text-sm font-semibold leading-relaxed">
                Bạn có chắc chắn muốn xóa gói quyền <strong className="text-primary">{deletingTemplate.name}</strong>?
              </p>
              <p className="text-xs text-on-surface-variant/70 mt-sm bg-rose-500/5 p-sm rounded border border-rose-500/10 leading-relaxed">
                Nhân sự đang dùng gói này sẽ bị thu hồi các quyền mặc định tương ứng.
              </p>
            </div>

            <div className="py-3 px-6 border-t border-outline-variant/20 flex justify-end gap-sm bg-surface-container-low">
              <button
                onClick={() => { setDeleteConfirmOpen(false); setDeletingTemplate(null); }}
                className="px-4 py-1.5 bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-1.5 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition-colors shadow-sm text-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
