"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  getResourceTitle,
  getResourceIcon,
  computeImpliedPermissionIds,
  getDependentPermissionIdsToRemove,
} from "@/lib/features/permissions/permissionApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export default function UserPermissionsPage() {
  const { id } = useParams();
  const router = useRouter();

  // States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [initialPermissionIds, setInitialPermissionIds] = useState<number[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  
  // Role Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templatePermissionIds, setTemplatePermissionIds] = useState<number[]>([]);

  const [activeTab, setActiveTab] = useState<"existing" | "all">("existing");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        setLoading(true);

        // 1. Fetch User details
        const userRes = await fetch(`${API_BASE_URL}/Users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        if (userData.success) {
          const u = userData.data;
          if (u.roles?.some((r: string) => r.toLowerCase() === "administrator" || r.toLowerCase() === "admin")) {
            toast.error("Không thể cấu hình quyền hạn cho tài khoản Quản trị viên.");
            router.push("/admin/users");
            return;
          }
          setUser(u);
        } else {
          toast.error(userData.message || "Lỗi tải thông tin người dùng");
        }

        // 2. Fetch User Specific Effective Permissions
        const userPermRes = await fetch(`${API_BASE_URL}/Permission/effective-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userPermData = await userPermRes.json();
        
        if (userPermData.success) {
          const data = userPermData.data;
          
          if (data.roleTemplate) {
            setSelectedTemplateId(data.roleTemplate.id);
          }
          
          const tIds = data.templatePermissions.map((p: any) => p.id);
          setTemplatePermissionIds(tIds);
          
          const effIds = data.effectivePermissions.map((p: any) => p.id);
          setInitialPermissionIds(effIds);
          setSelectedPermissionIds(effIds);
        }

        // 3. Fetch All System Permissions & Role Templates
        const [allPermRes, templatesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/Permission`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/RoleTemplate`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const allPermData = await allPermRes.json();
        const templatesData = await templatesRes.json();
        
        if (allPermData.success) setAllPermissions(allPermData.data);
        if (templatesData.success) setTemplates(templatesData.data);
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi kết nối đến máy chủ");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  // Computed dependencies
  const impliedPermissionIds = useMemo(() => {
    return computeImpliedPermissionIds(selectedPermissionIds, allPermissions);
  }, [selectedPermissionIds, allPermissions]);

  // Toggle single permission selection
  const handleTogglePermission = (permissionId: number) => {
    const isSelecting = !selectedPermissionIds.includes(permissionId);
    
    if (isSelecting) {
      // Just add explicitly. The implied logic will visually check the dependents.
      setSelectedPermissionIds((prev) => [...prev, permissionId]);
    } else {
      // If we uncheck, we also need to remove its dependent permissions from explicitly selected
      const toRemoveIds = getDependentPermissionIdsToRemove(permissionId, allPermissions);
      setSelectedPermissionIds((prev) => prev.filter((pid) => pid !== permissionId && !toRemoveIds.includes(pid)));
    }
  };

  // Handle Template Change
  const handleTemplateChange = (templateIdStr: string) => {
    const tid = templateIdStr ? parseInt(templateIdStr) : null;
    setSelectedTemplateId(tid);
    
    if (tid) {
      const selectedTpl = templates.find(t => t.id === tid);
      const newTplIds = selectedTpl ? selectedTpl.permissions.map((p: any) => p.permissionId) : [];
      setTemplatePermissionIds(newTplIds);
      // Automatically add template permissions to selected
      setSelectedPermissionIds(prev => Array.from(new Set([...prev, ...newTplIds])));
    } else {
      setTemplatePermissionIds([]);
    }
  };

  // Toggle entire group selection
  const handleToggleGroup = (groupPermissions: any[], shouldSelect: boolean) => {
    const groupIds = groupPermissions.map((p) => p.id);
    setSelectedPermissionIds((prev) => {
      if (shouldSelect) {
        const newIds = new Set(prev);
        groupIds.forEach((id) => newIds.add(id));
        return Array.from(newIds);
      } else {
        // Remove all groupIds
        return prev.filter((id) => !groupIds.includes(id));
      }
    });
  };

  // Toggle select all (filtered by tab and search term)
  const getFilteredPermissions = () => {
    return allPermissions.filter((perm) => {
      const matchesSearch =
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (perm.description && perm.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (activeTab === "existing") {
        return matchesSearch && (selectedPermissionIds.includes(perm.id) || impliedPermissionIds.includes(perm.id));
      }
      return matchesSearch;
    });
  };

  const handleToggleAll = (shouldSelect: boolean) => {
    const filteredPerms = getFilteredPermissions();
    const filteredIds = filteredPerms.map((p) => p.id);

    setSelectedPermissionIds((prev) => {
      if (shouldSelect) {
        const toAdd = filteredIds.filter((id) => !prev.includes(id));
        return [...prev, ...toAdd];
      } else {
        return prev.filter((id) => !filteredIds.includes(id));
      }
    });
  };

  // Save changes to backend via Sync API
  const handleSaveChange = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    // Combine explicit and implied permissions before saving
    const finalPermissionIds = Array.from(new Set([...selectedPermissionIds, ...impliedPermissionIds]));

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/Permission/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: id, 
          templateId: selectedTemplateId,
          effectivePermissionIds: finalPermissionIds 
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Cập nhật phân quyền người dùng thành công!");
        router.push(`/admin/users/${id}`);
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi lưu thay đổi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể lưu thay đổi do lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by resource for rendering
  const filteredPermissions = getFilteredPermissions();
  const groupedPermissions = filteredPermissions.reduce((acc: any, curr: any) => {
    const resource = curr.resource || "Khác";
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(curr);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-error font-bold text-lg">Không tìm thấy người dùng</p>
        <button
          onClick={() => router.push("/admin/users")}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Combined selection logic
  const allSelectedSet = new Set([...selectedPermissionIds, ...impliedPermissionIds]);
  const totalSelectedCount = allSelectedSet.size;

  const isAllSelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((p) => allSelectedSet.has(p.id));

  return (
    <main className="w-full pb-lg animate-fadeIn space-y-8">
      {/* Header Section: User Profile Card */}
      <header className="bg-white p-6 rounded-2xl border border-slate-100 soft-shadow flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                alt={user.fullName || user.userName}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shadow-inner"
                src={user.avatar}
              />
            ) : (
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shadow-inner">
                <span className="material-symbols-outlined text-slate-400 text-[40px]">person</span>
              </div>
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">
              {user.fullName || user.userName}
            </h1>
            <p className="text-slate-500 text-sm font-medium truncate">
              {user.email || "Chưa cập nhật email"}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="bg-indigo-50 text-indigo-600 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">person</span>
                ID: {user.id}
              </span>
              <span className="bg-cyan-50 text-cyan-600 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-cyan-100">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                {totalSelectedCount} QUYỀN ĐANG CHỌN
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/admin/users/${id}`)}
          className="flex items-center gap-2 px-6 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 active:scale-98 transition-all shrink-0 w-full md:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-lg">person</span>
          Xem chi tiết
        </button>
      </header>

      {/* Role Template Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 soft-shadow">
        <label className="block text-sm font-bold text-slate-700 mb-2">Gói quyền mặc định (Role Template)</label>
        <select 
          value={selectedTemplateId || ""} 
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
        >
          <option value="">-- Không sử dụng gói (Chỉ cấu hình quyền thủ công) --</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name} - {t.description}</option>
          ))}
        </select>
        {selectedTemplateId && (
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Nhân viên này sẽ thừa hưởng toàn bộ <strong className="text-indigo-600">{templatePermissionIds.length} quyền</strong> từ gói.
            Bạn có thể tích thêm (Override Add) hoặc bỏ tích (Override Deny) các quyền hạn bên dưới.
          </p>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-4">
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "existing"
              ? "bg-rose-500 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
          }`}
          onClick={() => {
            setActiveTab("existing");
            setSearchTerm("");
          }}
        >
          <span className="material-symbols-outlined text-lg">verified_user</span>
          Quyền hiện tại{" "}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] ml-1 ${
              activeTab === "existing" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {totalSelectedCount}
          </span>
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-rose-500 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
          }`}
          onClick={() => {
            setActiveTab("all");
            setSearchTerm("");
          }}
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Gán quyền mới
        </button>
      </div>

      {/* Permissions Container */}
      <div className="bg-white rounded-2xl border border-slate-100 soft-shadow overflow-hidden">
        {/* Container Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === "existing"
                ? `Quyền đang được gán của ${user.fullName || user.userName}`
                : "Danh sách toàn bộ quyền hệ thống"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === "existing"
                ? "Tất cả các quyền hạn tài khoản này đang sở hữu. Bạn có thể gỡ bỏ nhanh bằng phím xóa."
                : "Tìm kiếm và tích chọn các quyền hạn để gán thêm mới cho tài khoản người dùng."}
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider border border-emerald-100 shrink-0 self-start sm:self-center">
            {totalSelectedCount} QUYỀN CHỌN
          </span>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Filter Search Input */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-slate-400 absolute left-4 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm nhanh mã quyền hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:outline-none transition-all text-sm text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">clear</span>
              </button>
            )}
          </div>

          {/* Select All Row */}
          {filteredPermissions.length > 0 && (
            <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm bg-indigo-50/30 p-4 rounded-xl border border-indigo-50/50">
              <input
                className="w-5 h-5 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500 transition-all accent-indigo-600 cursor-pointer"
                id="select-all"
                type="checkbox"
                checked={isAllSelected}
                onChange={() => handleToggleAll(!isAllSelected)}
              />
              <label className="cursor-pointer select-none" htmlFor="select-all">
                Chọn tất cả {filteredPermissions.length} quyền đang hiển thị
              </label>
            </div>
          )}

          {filteredPermissions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-300 text-[48px] mb-2">search_off</span>
              <p className="text-slate-500 font-medium text-sm">
                Không tìm thấy quyền hạn nào khớp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-6">
              {/* Groups Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(groupedPermissions).map((resource) => {
                  const groupPerms = groupedPermissions[resource];
                  const groupSelectedCount = groupPerms.filter((p: any) =>
                    allSelectedSet.has(p.id)
                  ).length;
                  const isGroupAllSelected = groupSelectedCount === groupPerms.length;

                  return (
                    <div
                      key={resource}
                      className="bg-slate-50/30 hover:bg-slate-50/70 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between transition-all hover:shadow-md"
                    >
                      <div>
                        {/* Group Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 text-indigo-600">
                            <span className="material-symbols-outlined text-xl">
                              {getResourceIcon(resource)}
                            </span>
                            <span className="font-bold text-sm tracking-tight">
                              {getResourceTitle(resource)}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isGroupAllSelected}
                            onChange={() => handleToggleGroup(groupPerms, !isGroupAllSelected)}
                            className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        {/* Group Items */}
                        <div className="space-y-4">
                          {groupPerms.map((perm: any) => {
                            const isChecked = allSelectedSet.has(perm.id);
                            const isDisabled = impliedPermissionIds.includes(perm.id);
                            const isFromTemplate = templatePermissionIds.includes(perm.id);
                            
                            let overrideStatus = null;
                            if (isFromTemplate && !isChecked) overrideStatus = "deny";
                            if (!isFromTemplate && isChecked) overrideStatus = "add";

                            return (
                              <div
                                key={perm.id}
                                className={`flex items-start justify-between group gap-2 ${isDisabled ? 'opacity-70' : ''}`}
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && handleTogglePermission(perm.id)}
                                    className={`w-4 h-4 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed mt-0.5 ${
                                      overrideStatus === 'add' ? 'text-indigo-600 accent-indigo-600' : 
                                      isFromTemplate ? 'text-emerald-500 accent-emerald-500' : 
                                      'text-slate-600 accent-slate-600'
                                    }`}
                                    id={`perm-${perm.id}`}
                                  />
                                  <div className="shrink-0 w-9 h-9 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-[18px]">
                                      {getResourceIcon(resource)}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <label
                                      htmlFor={`perm-${perm.id}`}
                                      className="font-bold text-slate-700 text-sm flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 truncate"
                                      title={perm.name}
                                    >
                                      {perm.name}
                                      {overrideStatus === 'add' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Thêm</span>}
                                      {overrideStatus === 'deny' && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold line-through">Cấm</span>}
                                      {!overrideStatus && isFromTemplate && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Gói</span>}
                                    </label>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed" title={perm.description}>
                                      {perm.description || "Không có mô tả chi tiết"}
                                    </p>
                                  </div>
                                </div>

                                {isChecked && !isDisabled && (
                                  <button
                                    onClick={() => handleTogglePermission(perm.id)}
                                    className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all self-start shrink-0"
                                    title="Thu hồi nhanh"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <footer className="flex items-center justify-end gap-4 pb-12">
        <button
          onClick={() => router.push(`/admin/users/${id}`)}
          disabled={saving}
          className="px-8 py-3.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSaveChange}
          disabled={saving}
          className="px-10 py-3.5 bg-rose-500 text-white font-bold text-sm rounded-xl hover:bg-rose-600 active:scale-[0.98] soft-shadow hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Đang lưu thay đổi...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </footer>
    </main>
  );
}
