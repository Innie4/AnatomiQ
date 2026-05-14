"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { CourseManager } from "@/components/admin/course-manager";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function AdminCoursesPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <AdminLayout>
          <CourseManager adminKey={adminKey} />
        </AdminLayout>
      )}
    </AdminAuthWrapper>
  );
}
