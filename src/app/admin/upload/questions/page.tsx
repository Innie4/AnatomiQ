"use client";

import { useEffect, useState } from "react";

import { AdminLayout } from "@/components/admin/admin-layout";
import { MaterialQuestionManager } from "@/components/upload/material-question-manager";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";

type MaterialOption = {
  id: string;
  title: string;
  status: string;
  topicName: string;
  subtopicName: string | null;
  linkedQuestionCount: number;
};

function QuestionsPageContent({ adminKey }: { adminKey: string }) {
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminKey) return;

    let cancelled = false;

    const loadMaterials = async (search = "") => {
      if (cancelled) return;
      try {
        const url = search
          ? `/api/admin-materials?q=${encodeURIComponent(search)}`
          : "/api/admin-materials";

        const response = await fetch(url, {
          headers: { "x-admin-upload-key": adminKey },
        });

        if (!cancelled && response.ok) {
          const data = await response.json();
          setMaterials(data.materials || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMaterials();
    return () => { cancelled = true; };
  }, [adminKey]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Upload</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Questions</h1>
          <p className="mt-2 text-sm text-slate-600">View and edit questions linked to uploaded materials.</p>
        </div>
        <MaterialQuestionManager
          adminKey={adminKey}
          materials={materials}
          onRefreshMaterials={async (search) => {
            setLoading(true);
            try {
              const url = search
                ? `/api/admin-materials?q=${encodeURIComponent(search)}`
                : "/api/admin-materials";
              const response = await fetch(url, {
                headers: { "x-admin-upload-key": adminKey },
              });
              if (response.ok) {
                const data = await response.json();
                setMaterials(data.materials || []);
              }
            } finally {
              setLoading(false);
            }
          }}
          onRefreshOverview={async () => {}}
          overviewLoading={loading}
        />
      </div>
    </AdminLayout>
  );
}

export default function AdminQuestionsPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => <QuestionsPageContent adminKey={adminKey} />}
    </AdminAuthWrapper>
  );
}
