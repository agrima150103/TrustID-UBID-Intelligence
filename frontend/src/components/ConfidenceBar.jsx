export default function ConfidenceBar({ value }) {
  const percentage = Math.round((value || 0) * 100);

  let tone = "low";
  if (percentage >= 90) tone = "high";
  else if (percentage >= 60) tone = "medium";

  return (
    <div className="confidence-wrap">
      <div className="confidence-top">
        <span>{percentage}%</span>
        <small>{tone === "high" ? "Auto-link" : tone === "medium" ? "Review" : "Separate"}</small>
      </div>

      <div className="confidence-track">
        <div className={`confidence-fill ${tone}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
