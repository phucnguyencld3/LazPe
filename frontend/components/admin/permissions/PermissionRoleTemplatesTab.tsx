"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";
import Modal from "@/components/admin/ui/Modal";
import Badge from "@/components/admin/ui/Badge";

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
      if (permData.success) setPermissions(permData.data);
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
    setPermissionSearchTerm("");
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
    <div className="w-full pb-10 animate-fadeIn font-outfit">
      {showHeader ? (
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90">
              Quản lý Gói Quyền (Role Templates)
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Thiết lập các gói quyền mặc định (ví dụ: Staff, Manager) để gán nhanh cho nhân sự.
            </p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            variant="primary"
            className="rounded-full shadow-theme-xs font-bold text-xs"
            startIcon={<span className="material-symbols-outlined text-sm">add</span>}
          >
            Tạo Gói Quyền
          </Button>
        </header>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-450 dark:text-gray-500">
              Thiết lập các gói quyền mặc định (ví dụ: Staff, Manager) để gán nhanh cho nhân sự của hệ thống.
            </p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            variant="primary"
            className="rounded-full font-bold text-xs shrink-0"
            startIcon={<span className="material-symbols-outlined text-sm">add</span>}
          >
            Tạo Gói Quyền
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-950 rounded-[2rem] p-6 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs flex flex-col justify-between hover:shadow-theme-md hover:border-brand-500/25 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white/90">{template.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                      {template.description || "Không có mô tả"}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="icon"
                      onClick={() => handleOpenModal(template)}
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </Button>
                    <Button
                      variant="icon"
                      onClick={() => handleRequestDelete(template)}
                      title="Xóa"
                      className="hover:text-error-500 dark:hover:text-error-400"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Quyền hạn ({template.permissions.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {template.permissions.slice(0, 5).map((p: any) => (
                      <Badge
                        key={p.permissionId}
                        color="primary"
                        variant="light"
                        size="sm"
                      >
                        {p.name}
                      </Badge>
                    ))}
                    {template.permissions.length > 5 && (
                      <Badge color="light" variant="light" size="sm">
                        +{template.permissions.length - 5} quyền khác
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        className="max-w-5xl h-[85vh] max-h-[850px] flex flex-col overflow-hidden p-0 font-outfit"
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="py-4 px-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.01] shrink-0">
          <h2 className="text-base font-bold text-gray-800 dark:text-white/90">
            {editingTemplate ? "Cập nhật Gói Quyền" : "Tạo Gói Quyền Mới"}
          </h2>
          <Button
            variant="icon"
            onClick={handleCloseModal}
            className="hover:text-error-500 dark:hover:text-error-400"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </Button>
        </div>

        {/* Split Content */}
        <div className="p-6 overflow-hidden flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
            
            {/* Left Side: General Info Form */}
            <div className="lg:col-span-2 space-y-5 lg:border-r border-gray-100 dark:border-gray-800 lg:pr-6 flex flex-col justify-start">
              <h3 className="text-sm font-bold text-brand-500 pb-2 border-b border-gray-100 dark:border-gray-800 mb-2 uppercase tracking-wider">
                Thông tin gói quyền
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-405 dark:text-gray-500 uppercase tracking-wider mb-2">Tên gói quyền</label>
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Staff, Manager..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-405 dark:text-gray-500 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                <TextArea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  className="resize-none"
                  placeholder="Mô tả vai trò của gói quyền này..."
                />
              </div>
            </div>

            {/* Right Side: Permission Accordion Selector */}
            <div className="lg:col-span-3 flex flex-col min-h-0 h-full">
              
              {/* Permissions Config Header with unfold buttons */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <h3 className="text-sm font-bold text-brand-500">
                  Cấu hình Quyền hạn
                </h3>
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="text-xs text-brand-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                    Mở rộng
                  </button>
                  <span className="text-gray-300 dark:text-gray-700 text-xs">|</span>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="text-xs text-brand-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">unfold_less</span>
                    Thu gọn
                  </button>
                </div>
              </div>

              {/* Search Bar Input */}
              <div className="relative flex items-center mb-3 shrink-0">
                <span className="material-symbols-outlined text-gray-400 absolute left-3 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh quyền hạn..."
                  value={permissionSearchTerm}
                  onChange={(e) => setPermissionSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
                />
                {permissionSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setPermissionSearchTerm("")}
                    className="absolute right-3 text-gray-400 hover:text-brand-500 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">clear</span>
                  </button>
                )}
              </div>

              {/* Scrollable list of accordion resources */}
              <div 
                className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar" 
              >
                {Object.keys(groupedPermissions).map(resource => {
                  const resourcePermissions = groupedPermissions[resource];
                  const isExpanded = expandedResources.includes(resource);
                  const groupSelectedCount = resourcePermissions.filter((p: any) =>
                    selectedPermissions.includes(p.id)
                  ).length;

                  return (
                    <div 
                      key={resource} 
                      className="border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-white/[0.01] transition-all"
                    >
                      {/* Accordion Group Header */}
                      <div
                        onClick={() => handleToggleExpandResource(resource)}
                        className="py-2.5 px-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={groupSelectedCount === resourcePermissions.length && resourcePermissions.length > 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleToggleGroupSelect(resourcePermissions, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500 cursor-pointer shrink-0"
                          />
                          <span className="material-symbols-outlined text-brand-500 text-[20px] shrink-0">
                            {getResourceIcon(resource)}
                          </span>
                          <span className="font-bold text-xs text-gray-800 dark:text-white/80 uppercase tracking-wider">
                            {resource}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            groupSelectedCount > 0 
                              ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" 
                              : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                          }`}>
                            {groupSelectedCount}/{resourcePermissions.length} đã chọn
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 text-[20px] shrink-0">
                          {isExpanded ? "expand_less" : "expand_more"}
                        </span>
                      </div>

                      {/* Accordion Group Content */}
                      {isExpanded && (
                        <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-850">
                          {resourcePermissions.map((perm: any) => (
                            <div key={perm.id} className="py-2 first:pt-1 last:pb-1">
                              <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(perm.id)}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500 cursor-pointer shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-gray-700 dark:text-gray-300 group-hover:text-brand-500 transition-colors">
                                    {perm.name}
                                  </div>
                                  {perm.description && (
                                    <div className="text-xs text-gray-450 dark:text-gray-500 mt-0.5 leading-normal">
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
                  <div className="text-center py-8 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 dark:text-gray-500 font-medium text-xs">
                    Không tìm thấy quyền hạn nào khớp với từ khóa tìm kiếm.
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="py-3 px-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.01] shrink-0">
          <Button
            onClick={handleCloseModal}
            variant="secondary"
            className="rounded-full text-xs font-bold py-2"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="rounded-full text-xs font-bold py-2"
          >
            Lưu Gói Quyền
          </Button>
        </div>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeletingTemplate(null); }}
        className="max-w-md font-outfit"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-error-50 dark:bg-error-500/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error-500">warning</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Xác nhận xóa
          </h3>
        </div>

        <div className="space-y-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa gói quyền <strong className="text-brand-500">{deletingTemplate?.name}</strong>?
          </p>
          <p className="text-xs text-error-500 bg-error-50/50 dark:bg-error-500/5 p-3 rounded-xl border border-error-100 dark:border-error-500/10 leading-relaxed">
            Nhân sự đang dùng gói này sẽ bị thu hồi các quyền mặc định tương ứng.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-850">
            <Button
              onClick={() => { setDeleteConfirmOpen(false); setDeletingTemplate(null); }}
              variant="secondary"
              className="rounded-full text-xs font-bold py-2"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="danger"
              className="rounded-full text-xs font-bold py-2"
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
