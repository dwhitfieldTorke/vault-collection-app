import { Suspense } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import VaultSidebar from "@/components/VaultSidebar";

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-950">
        <Suspense fallback={<div className="w-60 shrink-0 bg-gray-900 border-r border-gray-800" />}>
          <VaultSidebar />
        </Suspense>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </AuthProvider>
  );
}
