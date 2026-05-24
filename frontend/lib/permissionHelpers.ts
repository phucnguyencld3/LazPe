export const getResourceTitle = (resource: string) => {
  switch (resource.toLowerCase()) {
    case "user": return "Người dùng (User)";
    case "product": return "Sản phẩm (Product)";
    case "category": return "Danh mục (Category)";
    case "order": return "Đơn hàng (Order)";
    case "permission": return "Phân quyền (Permission)";
    case "admin": return "Quyền Admin (Admin)";
    case "bundle": return "Gói sản phẩm (Bundle)";
    case "supplier": return "Nhà cung cấp (Supplier)";
    case "report": return "Báo cáo (Report)";
    case "analytics": return "Thống kê (Analytics)";
    case "system": return "Hệ thống (System)";
    case "review": return "Đánh giá (Review)";
    case "address": return "Địa chỉ (Address)";
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
    default: return "folder";
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

  if (action === "delete") {
    addAction("update"); addAction("create"); addAction("read");
  } else if (action === "update") {
    addAction("create"); addAction("read");
  } else if (action === "create") {
    addAction("read");
  }

  return Array.from(implies);
};
