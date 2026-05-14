import { redirect } from "next/navigation";

export default function LegacyUploadMaterialPage() {
  redirect("/admin/upload/new");
}
