const ROLES = [
  { value: "user", label: "User" },
  { value: "wellness_coach", label: "Wellness Coach" },
  { value: "admin", label: "Admin" },
];

function RoleSelector({ value, onChange }) {
  return (
    <div className="role-selector">
      {ROLES.map((r) => (
        <button
          type="button"
          key={r.value}
          className={`role-option ${value === r.value ? "active" : ""}`}
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default RoleSelector;