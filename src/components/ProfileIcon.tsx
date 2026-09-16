import Link from "next/link";

export default function ProfileIcon({ email }: { email: string | null }) {
  const initial = email ? email[0].toUpperCase() : "?";

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-tint text-ink font-display font-semibold text-sm hover:opacity-80 transition-opacity"
    >
      {initial}
    </Link>
  );
}
