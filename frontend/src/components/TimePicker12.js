const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function TimePicker12({ value, onChange }) {
  const parsed = value ? value.split(":").map(Number) : null;
  const hour24 = parsed ? parsed[0] : null;
  const minute = parsed ? parsed[1] : null;
  const period = hour24 !== null && hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 === null ? "" : hour24 % 12 || 12;

  const emit = (h12, min, per) => {
    let h = Number(h12) % 12;
    if (per === "PM") h += 12;
    onChange(`${String(h).padStart(2, "0")}:${String(Number(min)).padStart(2, "0")}`);
  };

  return (
    <div className="time-picker">
      <select className="form-input" value={hour12} onChange={(e) => emit(e.target.value, minute ?? 0, period)}>
        {hour12 === "" && <option value="" disabled>--</option>}
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="time-picker-colon">:</span>
      <select className="form-input" value={minute === null ? "" : minute} onChange={(e) => emit(hour12 || 6, e.target.value, period)}>
        {minute === null && <option value="" disabled>--</option>}
        {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
      </select>
      <div className="period-toggle">
        {["AM", "PM"].map((p) => (
          <button
            type="button"
            key={p}
            className={`period-btn ${period === p ? "active" : ""}`}
            onClick={() => emit(hour12 || 6, minute ?? 0, p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TimePicker12;