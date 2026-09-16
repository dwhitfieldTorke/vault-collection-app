"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CATEGORIES, CATEGORY_LABELS } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  comic: "📖",
  trading_card: "🃏",
  video_game: "🎮",
  lego: "🧱",
};

export default function VaultSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get("category");

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-lg">The Vault</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-amber-500/15 text-amber-400"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span>🏠</span>
          Dashboard
        </Link>

        <Link
          href="/items"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/items"
              ? "bg-amber-500/15 text-amber-400"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span>📦</span>
          All items
        </Link>

        <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Categories
        </div>

        {CATEGORIES.map((c) => {
          const href = `/items?category=${c}`;
          const active = pathname === "/items" && activeCategory === c;
          return (
            <Link
              key={c}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{CATEGORY_ICONS[c]}</span>
              {CATEGORY_LABELS[c]}
            </Link>
          );
        })}

        <div className="pt-4">
          <Link
            href="/items/new"
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold rounded-lg px-3 py-2.5 text-sm transition-colors"
          >
            + Add item
          </Link>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <span>↩</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
