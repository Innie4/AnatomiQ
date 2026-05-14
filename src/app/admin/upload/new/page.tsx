"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { MaterialUploader } from "@/components/upload/material-uploader";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function AdminUploadMaterialPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <AdminLayout>
          <MaterialUploader adminKey={adminKey} />
        </AdminLayout>
      )}
    </AdminAuthWrapper>
  );
}
