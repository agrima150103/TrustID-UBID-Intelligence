export default function EvidenceBadge({ children, tone = "neutral" }) {
  return <span className={`evidence-badge ${tone}`}>{children}</span>;
}
