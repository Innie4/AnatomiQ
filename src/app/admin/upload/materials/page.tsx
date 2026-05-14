"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { MaterialsManager } from "@/components/upload/materials-manager";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function AdminMaterialsPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <AdminLayout>
          <MaterialsManager adminKey={adminKey} />
        </AdminLayout>
      )}
    </AdminAuthWrapper>
  );
}
