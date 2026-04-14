import { api } from "@/lib/api";

export async function getBranches() {
  return api("/branches", { method: "GET" });
}
