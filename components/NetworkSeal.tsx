// The signature visual for the landing page: a medallion in the spirit of a
// university seal, but built from four connected nodes — Alumni, Student,
// Faculty, Admin — the same four roles the platform actually connects.
// Every line in the graphic corresponds to a real relationship in the app:
// mentorship (alumni↔student), advising (faculty↔student), verification
// (admin↔alumni), and oversight (admin↔faculty).

export default function NetworkSeal({ className = "" }: { className?: string }) {
  const nodes = [
    { key: "A", label: "Alumni", x: 200, y: 60 },
    { key: "S", label: "Student", x: 340, y: 200 },
    { key: "F", label: "Faculty", x: 60, y: 200 },
    { key: "Ad", label: "Admin", x: 200, y: 340 },
  ];

  const edges: [string, string][] = [
    ["A", "S"],
    ["F", "S"],
    ["A", "Ad"],
    ["F", "Ad"],
    ["A", "F"],
    ["S", "Ad"],
  ];

  const byKey = Object.fromEntries(nodes.map((n) => [n.key, n]));

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="200" cy="200" r="188" stroke="#B08D4F" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="160" stroke="#B08D4F" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 6" />

      {edges.map(([from, to], i) => {
        const a = byKey[from];
        const b = byKey[to];
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#12141C"
            strokeOpacity="0.18"
            strokeWidth="1.25"
          />
        );
      })}

      {nodes.map((n) => (
        <g key={n.key}>
          <circle cx={n.x} cy={n.y} r="30" fill="#F7F4EC" stroke="#12141C" strokeOpacity="0.5" strokeWidth="1.25" />
          <text
            x={n.x}
            y={n.y + 5}
            textAnchor="middle"
            fontSize="15"
            fontFamily="var(--font-fraunces)"
            fill="#12141C"
          >
            {n.key}
          </text>
        </g>
      ))}

      <text
        x="200"
        y="200"
        textAnchor="middle"
        fontSize="10"
        letterSpacing="3"
        fontFamily="var(--font-mono)"
        fill="#8A6B37"
      >
        EST. NETWORK
      </text>
    </svg>
  );
}
