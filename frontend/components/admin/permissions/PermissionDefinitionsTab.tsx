import React from "react";
import { getResourceTitle, getResourceIcon } from "@/lib/features/permissions/permissionApi";

interface PermissionDefinitionsTabProps {
  groupedPermissions: any;
}

export const PermissionDefinitionsTab: React.FC<PermissionDefinitionsTabProps> = ({
  groupedPermissions,
}) => {
  return (
    <div className="space-y-md animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {Object.keys(groupedPermissions).map((resource) => (
          <div
            key={resource}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-md shadow-sm"
          >
            <h3 className="font-headline-md text-[18px] text-primary font-bold flex items-center gap-2 border-b border-outline-variant/30 pb-sm mb-sm">
              <span className="material-symbols-outlined">{getResourceIcon(resource)}</span>
              {getResourceTitle(resource)}
            </h3>
            <div className="space-y-sm max-h-[300px] overflow-y-auto pr-xs">
              {groupedPermissions[resource].map((perm: any) => (
                <div
                  key={perm.id}
                  className="p-sm bg-surface-container-low rounded-lg flex items-start justify-between hover:bg-secondary-container/10 transition-colors border border-outline-variant/10"
                >
                  <div className="flex flex-col gap-xs flex-1">
                    <span className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {perm.name}
                    </span>
                    <p className="text-xs text-on-surface-variant/80 font-body-md pl-sm">
                      {perm.description || "Không có mô tả"}
                    </p>
                  </div>
                  <span className="px-sm py-0.5 bg-surface-variant text-[10px] text-on-surface-variant rounded-full font-bold uppercase">
                    {perm.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
