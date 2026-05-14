"use client";

import { useEffect, useState } from "react";
import { Activity, CreditCard, DollarSign, LoaderCircle, TrendingUp, UserCheck, Users } from "lucide-react";

import { CourseManager } from "@/components/admin/course-manager";

type SystemHealth = {
  users: { total: number; active: number; recent: number };
  subscriptions: { total: number; active: number };
  payments: { total: number; successful: number; failed: number };
  referrals: { total: number; completed: number; pending: number };
  revenue: { total: number; currency: string };
};

export function AdminDashboard({ adminKey }: { adminKey: string }) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await fetch("/api/admin/system-health", {
          headers: { "x-admin-upload-key": adminKey },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load admin metrics.");
        }

        setHealth(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load admin metrics.");
      } finally {
        setLoading(false);
      }
    }

    void loadHealth();
  }, [adminKey]);

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
    }).format(amount / 100);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Operations</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Manage users, courses, uploads, and the question bank with the upload admin key.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
      ) : health ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Total users",
              value: health.users.total.toLocaleString(),
              helper: `${health.users.active} active, ${health.users.recent} new`,
              icon: Users,
              color: "text-blue-600",
            },
            {
              label: "Subscriptions",
              value: health.subscriptions.active.toLocaleString(),
              helper: `of ${health.subscriptions.total} total`,
              icon: UserCheck,
              color: "text-green-600",
            },
            {
              label: "Revenue",
              value: formatCurrency(health.revenue.total, health.revenue.currency),
              helper: `${health.payments.successful} successful payments`,
              icon: DollarSign,
              color: "text-purple-600",
            },
            {
              label: "Referrals",
              value: health.referrals.completed.toLocaleString(),
              helper: `${health.referrals.pending} pending`,
              icon: TrendingUp,
              color: "text-orange-600",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <a href="/admin/upload" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#0969da]">
          <Activity className="h-6 w-6 text-[#0969da]" />
          <h2 className="mt-3 font-bold text-slate-950">Upload dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Review material processing and question coverage.</p>
        </a>
        <a href="/admin/upload/new" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#0969da]">
          <CreditCard className="h-6 w-6 text-[#0ca678]" />
          <h2 className="mt-3 font-bold text-slate-950">Add material</h2>
          <p className="mt-1 text-sm text-slate-600">Upload source files into the admin-controlled library.</p>
        </a>
        <a href="/admin/courses" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#0969da]">
          <UserCheck className="h-6 w-6 text-purple-600" />
          <h2 className="mt-3 font-bold text-slate-950">Course setup</h2>
          <p className="mt-1 text-sm text-slate-600">Create courses with semester placement.</p>
        </a>
      </div>

      <CourseManager adminKey={adminKey} />
    </div>
  );
}
