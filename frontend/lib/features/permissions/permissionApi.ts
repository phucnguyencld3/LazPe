export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const fetchPermissions = async (token: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/Permission`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch permissions");
  return data.data;
};

export const fetchUserPermissions = async (token: string, userId: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/Permission/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch user permissions");
  return data.data;
};

export const getResourceTitle = (resource: string) => {
  switch (resource.toLowerCase()) {
    case "user": return "Quản lý Người dùng (User)";
    case "product": return "Quản lý Sản phẩm (Product)";
    case "category": return "Quản lý Danh mục (Category)";
    case "order": return "Quản lý Đơn hàng (Order)";
    case "permission": return "Quản lý Phân quyền (Permission)";
    case "admin": return "Quyền Quản trị viên (Admin)";
    case "bundle": return "Quản lý Gói sản phẩm (Bundle)";
    case "supplier": return "Quản lý Nhà cung cấp (Supplier)";
    case "report": return "Xem Báo cáo (Report)";
    case "analytics": return "Phân tích số liệu (Analytics)";
    case "system": return "Cấu hình Hệ thống (System)";
    case "review": return "Quản lý Đánh giá (Review)";
    case "address": return "Quản lý Địa chỉ (Address)";
    default: return `Nhóm ${resource}`;
  }
};

export const getResourceIcon = (resource: string) => {
  switch (resource.toLowerCase()) {
    case "user": return "group";
    case "product": return "inventory_2";
    case "category": return "category";
    case "order": return "shopping_cart";
    case "permission": return "key";
    case "admin": return "security";
    case "bundle": return "inbox";
    case "supplier": return "local_shipping";
    case "report": return "analytics";
    case "analytics": return "bar_chart";
    case "system": return "settings";
    case "review": return "star";
    case "address": return "location_on";
    default: return "extension";
  }
};

// Calculate all implied permission IDs based on currently selected IDs
export const computeImpliedPermissionIds = (selectedIds: number[], allPermissions: any[]) => {
  const implied = new Set<number>();
  const adminAccessPerm = allPermissions.find(p => p.resource.toLowerCase() === "admin" && p.action.toLowerCase() === "access");

  selectedIds.forEach(id => {
    const perm = allPermissions.find(p => p.id === id);
    if (!perm) return;

    // Any valid permission implies Admin.Access, except Admin.Access itself
    if (adminAccessPerm && id !== adminAccessPerm.id) {
      implied.add(adminAccessPerm.id);
    }

    const groupPerms = allPermissions.filter(p => p.resource === perm.resource);
    const implyAction = (act: string) => {
      const target = groupPerms.find(p => p.action.toLowerCase() === act.toLowerCase());
      if (target && target.id !== id) implied.add(target.id);
    };

    const action = perm.action.toLowerCase();
    // Hierarchy: Delete > Update > Create > Read
    if (action === "delete") {
      implyAction("update"); implyAction("create"); implyAction("read");
    } else if (action === "update") {
      implyAction("create"); implyAction("read");
    } else if (action === "create") {
      implyAction("read");
    }
  });

  return Array.from(implied);
};

// When unselecting a permission, calculate which dependent permissions should also be removed
export const getDependentPermissionIdsToRemove = (permissionId: number, allPermissions: any[]) => {
  const implies = new Set<number>();
  const permToUnselect = allPermissions.find((p) => p.id === permissionId);
  if (!permToUnselect) return [];

  const resource = permToUnselect.resource;
  const action = permToUnselect.action.toLowerCase();
  const groupPerms = allPermissions.filter((p) => p.resource === resource);

  const addAction = (act: string) => {
    const target = groupPerms.find((p) => p.action.toLowerCase() === act.toLowerCase());
    if (target) implies.add(target.id);
  };

  // If we unselect Read, we must remove Create, Update, Delete
  if (action === "read") {
    addAction("create"); addAction("update"); addAction("delete");
  } else if (action === "create") {
    addAction("update"); addAction("delete");
  } else if (action === "update") {
    addAction("delete");
  } else if (action === "access" && resource.toLowerCase() === "admin") {
    // If we unselect Admin.Access, theoretically we must remove ALL other permissions since they require Admin.Access
    allPermissions.forEach(p => {
      if (p.id !== permissionId) implies.add(p.id);
    });
  }

  return Array.from(implies);
};
