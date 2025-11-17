export default function Card({ title, value, subtitle, icon, trend }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      border: "1px solid #e9d8b5",
      transition: "all 0.3s ease",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px"
      }}>
        <h3 style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#7a3b06",
          margin: 0
        }}>
          {title}
        </h3>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #f7dca1, #f2c786)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7a3b06"
        }}>
          {icon}
        </div>
      </div>
      
      <div style={{
        fontSize: "28px",
        fontWeight: "700",
        color: "#333",
        marginBottom: "8px"
      }}>
        {value}
      </div>
      
      <div style={{
        fontSize: "14px",
        color: trend === "up" ? "#28a745" : trend === "down" ? "#dc3545" : "#6d4611",
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }}>
        {subtitle}
      </div>
    </div>
  );
}