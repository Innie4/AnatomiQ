"use client";

import { UploadLayout } from "@/components/upload/upload-layout";
import { MaterialQuestionManager } from "@/components/upload/material-question-manager";
import { AdminAuthWrapper } from "@/components/upload/admin-auth-wrapper";
import { useState, useEffect } from "react";

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
    void loadMaterials();
  }, [adminKey]);

  async function loadMaterials(search = "") {
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
    } catch (error) {
      console.error("Failed to load materials:", error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshOverview() {
    // This is a no-op for questions page, but required by MaterialQuestionManager
  }

  return (
    <UploadLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Questions</h2>
          <p className="mt-1 text-sm text-slate-600">
            View and edit questions linked to materials
          </p>
        </div>
        <MaterialQuestionManager
          adminKey={adminKey}
          materials={materials}
          onRefreshMaterials={loadMaterials}
          onRefreshOverview={refreshOverview}
          overviewLoading={loading}
        />
      </div>
    </UploadLayout>
  );
}

export default function ManageQuestionsPage() {
  return (
    <AdminAuthWrapper>
      {(adminKey) => <QuestionsPageContent adminKey={adminKey} />}
    </AdminAuthWrapper>
  );
}
