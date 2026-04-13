import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full bg-[#09090b] overflow-hidden">
      <DashboardSidebar userEmail={user.email ?? null} />
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
