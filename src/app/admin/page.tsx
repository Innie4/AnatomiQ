"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CreditCard,
  TrendingUp,
  UserCheck,
  DollarSign,
  Activity,
  Search,
  Ban,
  CheckCircle,
} from "lucide-react";

type User = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  isActive: boolean;
  emailVerified: boolean;
  referralCount: number;
  createdAt: string;
  Subscription: Array<{
    tier: string;
    status: string;
  }>;
};

type SystemHealth = {
  users: {
    total: number;
    active: number;
    recent: number;
  };
  subscriptions: {
    total: number;
    active: number;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
  };
  referrals: {
    total: number;
    completed: number;
    pending: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const [usersRes, healthRes] = await Promise.all([
        fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/system-health", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok || !healthRes.ok) {
        if (usersRes.status === 403 || healthRes.status === 403) {
          throw new Error("Access denied: Admin privileges required");
        }
        throw new Error("Failed to fetch admin data");
      }

      const usersData = await usersRes.json();
      const healthData = await healthRes.json();

      setUsers(usersData.users);
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      // Refresh data
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-lg max-w-md">
          <div className="text-center">
            <Ban className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#0969da] to-[#0ca678] font-semibold text-white hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Admin Dashboard</h1>
          <p className="text-lg text-slate-600">System overview and user management</p>
        </div>

        {/* System Health Metrics */}
        {health && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Total Users</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{health.users.total}</p>
              <p className="text-sm text-slate-600 mt-1">
                {health.users.active} active • {health.users.recent} new (30d)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-slate-900">Subscriptions</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{health.subscriptions.active}</p>
              <p className="text-sm text-slate-600 mt-1">
                of {health.subscriptions.total} total
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Revenue</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(health.revenue.total, health.revenue.currency)}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {health.payments.successful} payments
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <h3 className="font-semibold text-slate-900">Referrals</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{health.referrals.completed}</p>
              <p className="text-sm text-slate-600 mt-1">
                {health.referrals.pending} pending
              </p>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Subscription</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Referrals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-slate-900">{user.fullName}</div>
                        <div className="text-sm text-slate-600">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{user.department}</td>
                    <td className="px-4 py-3">
                      {user.Subscription.length > 0 ? (
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          {user.Subscription[0].tier}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          FREE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{user.referralCount}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <Ban className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
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
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              No users found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
