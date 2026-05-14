"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle, LoaderCircle, Search } from "lucide-react";

type User = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  isActive: boolean;
  emailVerified: boolean;
  referralCount: number;
  createdAt: string;
  Subscription: Array<{ tier: string; status: string }>;
};

export function AdminUsers({ adminKey }: { adminKey: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const params = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : "";
      const response = await fetch(`/api/admin/users${params}`, {
        headers: { "x-admin-upload-key": adminKey },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to fetch users.");
      }

      setUsers(payload.users || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-upload-key": adminKey,
      },
      body: JSON.stringify({ isActive: !currentStatus }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Failed to update user status.");
      return;
    }

    await loadUsers();
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadUsers();
    }, 200);

    return () => window.clearTimeout(handle);
  }, [adminKey, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Users</h1>
          <p className="mt-2 text-sm text-slate-600">Search and manage student account access.</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4"
            placeholder="Search users"
          />
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Subscription</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Referrals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-950">{user.fullName}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{user.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{user.Subscription[0]?.tier ?? "FREE"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{user.referralCount}</td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                          <Ban className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void toggleUserStatus(user.id, user.isActive)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          user.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length ? <div className="p-8 text-center text-sm text-slate-600">No users found.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
