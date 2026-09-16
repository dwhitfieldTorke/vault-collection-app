"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  if (!user) return null;

  const initial = user.email ? user.email[0].toUpperCase() : "?";
  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div>
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← Shelf
      </Link>

      <div className="flex flex-col items-center text-center mt-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-accent-tint text-ink font-display font-semibold text-2xl flex items-center justify-center mb-3">
          {initial}
        </div>
        <p className="text-ink font-medium">{user.email}</p>
        {memberSince && <p className="text-ink-faint text-xs mt-0.5">Member since {memberSince}</p>}
      </div>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full px-4 py-2.5 transition-colors disabled:opacity-50"
      >
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
