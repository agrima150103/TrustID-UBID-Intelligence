export default function StatCard({ label, value, helper, tone = "blue" }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <p>{label}</p>
      <h2>{value}</h2>
      {helper && <span>{helper}</span>}
    </div>
  );
}
