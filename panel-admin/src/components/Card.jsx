export default function Card({ title, value, subtitle }) {
  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(145deg, #f7dca1, #f2c786)",
        borderRadius: "12px",
        padding: "20px",
        minWidth: "200px",
        flex: "1",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        transition: "transform 0.25s, box-shadow 0.25s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
      }}
    >
      <h3 style={{ color: "#7a3b06", marginBottom: "10px" }}>{title}</h3>
      <p className="value" style={{ fontSize: "22px", fontWeight: "bold", color: "#6b4505", marginBottom: "8px" }}>
        {value}
      </p>
      <small style={{ color: "#6d4611", opacity: 0.8 }}>{subtitle}</small>
    </div>
  );
}
