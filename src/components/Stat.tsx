export default function Stat({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive" ? "text-accent" : tone === "negative" ? "text-red-600" : "text-ink";
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">{label}</p>
      <p className={`text-lg font-display font-semibold ${toneClass}`}>{value}</p>
      {sublabel && <p className="text-xs text-ink-faint truncate mt-0.5">{sublabel}</p>}
    </div>
  );
}
