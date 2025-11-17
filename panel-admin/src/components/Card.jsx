export default function Card({ title, value, subtitle }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="value">{value}</p>
      <small>{subtitle}</small>
    </div>
  );
}
