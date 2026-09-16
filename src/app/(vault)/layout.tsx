import { AuthProvider } from "@/components/AuthProvider";
import BottomTabBar from "@/components/BottomTabBar";

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-canvas pb-24">
        <div className="max-w-md mx-auto px-4 pt-6">{children}</div>
      </div>
      <BottomTabBar />
    </AuthProvider>
  );
}
