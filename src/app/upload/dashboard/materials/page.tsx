import { UploadLayout } from "@/components/upload/upload-layout";
import { MaterialsManager } from "@/components/upload/materials-manager";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function ManageMaterialsPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <UploadLayout>
          <MaterialsManager adminKey={adminKey} />
        </UploadLayout>
      )}
    </AdminAuthWrapper>
  );
}
