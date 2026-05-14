"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { MaterialUploader } from "@/components/upload/material-uploader";
import { OverviewStats } from "@/components/upload/overview-stats";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

export default function AdminUploadOverviewPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => (
        <AdminLayout>
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Faculty operations</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Material upload and processing dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">Manage anatomy source files and processing inside the admin dashboard.</p>
            </div>
            <OverviewStats adminKey={adminKey} autoLoad={false} />
            <MaterialUploader adminKey={adminKey} />
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Recent materials</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Latest upload activity</h2>
                <p className="mt-2 text-sm text-slate-600">Recent processed materials are summarized in the dashboard overview.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Topic coverage</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Where the source library is strongest</h2>
                <p className="mt-2 text-sm text-slate-600">Coverage is available from the Topics page and upload overview metrics.</p>
              </div>
            </section>
          </div>
        </AdminLayout>
      )}
    </AdminAuthWrapper>
  );
}
