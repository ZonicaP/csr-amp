import { redirect } from "next/navigation";
import { requireVerifiedCsr } from "@/lib/csr/guard";

export default async function Home() {
  await requireVerifiedCsr();
  redirect("/profile");
}
