import { env } from "@/lib/env";

export function assertAdminKey(adminKey: string | null) {
  if (!env.adminUploadKey || adminKey !== env.adminUploadKey) {
    throw new Error("Invalid admin upload key.");
  }
}
