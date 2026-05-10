"use client";

import { UploadLayout } from "@/components/upload/upload-layout";
import { OverviewStats } from "@/components/upload/overview-stats";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function UploadDashboardPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <UploadLayout>
          <OverviewStats adminKey={adminKey} />
        </UploadLayout>
      )}
    </AdminAuthWrapper>
  );
}
