"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-between px-8 py-2">
        <TabLink href="/" label="Shelf" active={pathname === "/"}>
          <ShelfIcon />
        </TabLink>

        <Link
          href="/items/new"
          className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-dark-surface text-white shadow-lg shadow-black/10 hover:opacity-90 transition-opacity"
          aria-label="Add item"
        >
          <PlusIcon />
        </Link>

        <TabLink href="/value" label="Value" active={pathname === "/value"}>
          <ValueIcon />
        </TabLink>
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
        active ? "text-accent" : "text-ink-faint hover:text-ink-muted"
      }`}
    >
      {children}
      {label}
    </Link>
  );
}

function ShelfIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function ValueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
