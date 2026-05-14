import { redirect } from "next/navigation";

export default function LegacyMaterialsPage() {
  redirect("/admin/upload/materials");
}
