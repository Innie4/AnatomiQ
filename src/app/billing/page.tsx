"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paystackReference: string;
  paidAt: string | null;
  createdAt: string;
  subscription: {
    tier: string;
    billingPeriod: string;
  };
};

type Subscription = {
  id: string;
  tier: string;
  billingPeriod: string;
  status: string;
  startDate: string;
  endDate: string | null;
  amountPaid: number | null;
  currency: string;
  autoRenew: boolean;
};

export default function BillingPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchBillingHistory = async () => {
      try {
        const token = localStorage.getItem("academiq:auth-token");
        if (!token) {
          if (!cancelled) router.push("/signin");
          return;
        }

        const response = await fetch("/api/billing/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch billing history");
        }

        const data = await response.json();
        if (!cancelled) {
          setPayments(data.payments);
          setSubscriptions(data.subscriptions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An unknown error occurred");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBillingHistory();
    return () => { cancelled = true; };
  }, [router]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const downloadInvoice = (payment: Payment) => {
    const lines = [
      "AcademIQ Invoice",
      `Reference: ${payment.paystackReference}`,
      `Date: ${formatDate(payment.paidAt || payment.createdAt)}`,
      `Plan: ${payment.subscription.tier} - ${payment.subscription.billingPeriod}`,
      `Amount: ${formatCurrency(payment.amount, payment.currency)}`,
      `Status: ${payment.status}`,
    ];
    const body = lines
      .map((line, index) => `BT /F1 ${index === 0 ? 20 : 12} Tf 72 ${740 - index * 28} Td (${line.replace(/[()\\]/g, "")}) Tj ET`)
      .join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${body.length} >> stream\n${body}\nendstream`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
    pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `academiq-invoice-${payment.paystackReference}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "ACTIVE":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading billing history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <CreditCard className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Billing & Payments</h1>
          <p className="text-lg text-slate-600">
            View your payment history and subscription details
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-8">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Subscriptions Section */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Subscriptions</h2>
            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
                <p className="text-slate-600">No subscription history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{sub.tier}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-3">
                          {sub.billingPeriod} • {sub.autoRenew ? "Auto-renew enabled" : "Auto-renew disabled"}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Started: {formatDate(sub.startDate)}
                          </div>
                          {sub.endDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Ends: {formatDate(sub.endDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      {sub.amountPaid && (
                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold text-slate-900">
                            {formatCurrency(sub.amountPaid, sub.currency)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History Section */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
                <CreditCard className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No payment history</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Plan</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Reference</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {payment.subscription.tier} - {payment.subscription.billingPeriod}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                            {payment.paystackReference}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => downloadInvoice(payment)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Download className="h-4 w-4" />
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
