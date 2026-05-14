"use client";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function AdminPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <AdminLayout>
          <AdminDashboard adminKey={adminKey} />
        </AdminLayout>
      )}
    </AdminAuthWrapper>
  );
}
