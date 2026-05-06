type StatusBadgeProps = {
  label: string;
  tone?: "accent" | "muted";
};

export function StatusBadge({ label, tone = "muted" }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}
