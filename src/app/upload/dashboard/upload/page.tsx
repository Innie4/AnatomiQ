"use client";

import { UploadLayout } from "@/components/upload/upload-layout";
import { MaterialUploader } from "@/components/upload/material-uploader";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function UploadMaterialPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <UploadLayout>
          <MaterialUploader adminKey={adminKey} />
        </UploadLayout>
      )}
    </AdminAuthWrapper>
  );
}
