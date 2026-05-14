"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function AdminUsersPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <AdminLayout>
          <AdminUsers adminKey={adminKey} />
        </AdminLayout>
      )}
    </AdminAuthWrapper>
  );
}
