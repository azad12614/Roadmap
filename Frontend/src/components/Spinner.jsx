// components/Spinner.jsx
import "./Spinner.css";

export default function Spinner({ size = 40, color = "var(--primary-brand)" }) {
  return (
    <div className="spinner" style={{ width: size, height: size }}>
      <div className="spinner-inner" style={{ borderColor: color }}></div>
    </div>
  );
}
