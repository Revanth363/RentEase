import React from "react";

// Small replica calendar as clickable tiles. Shows current month only.
// Props:
// - selectedDate: string 'YYYY-MM-DD' or null
// - onSelect(dateString): called when a date is clicked
// - completedDates: array of date strings (any parseable format) to gray out
const CalendarTiles = ({ selectedDate, onSelect, completedDates = [] }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  // Normalize completed dates to YYYY-MM-DD
  const completedSet = new Set(
    (completedDates || []).map((d) => {
      try {
        return new Date(d).toISOString().split("T")[0];
      } catch (e) {
        console.error('Date parsing failed:', e);
        return d;
      }
    })
  );

  const tiles = [];
  // day of week for 1st (0 = Sun)
  const firstDay = startOfMonth.getDay();

  // Fill blanks before first day
  for (let i = 0; i < firstDay; i++) tiles.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    tiles.push(dt);
  }

  // Pad to full weeks (7 columns)
  while (tiles.length % 7 !== 0) tiles.push(null);

  const monthLabel = startOfMonth.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{ marginBottom: 8, fontWeight: "600" }}>{monthLabel}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div
            key={d}
            style={{ textAlign: "center", fontSize: 12, color: "#666" }}
          >
            {d}
          </div>
        ))}

        {tiles.map((dt, idx) => {
          if (!dt)
            return (
              <div
                key={idx}
                style={{ height: 40, borderRadius: 6, background: "#f6f6f6" }}
              />
            );

          const dateStr = dt.toISOString().split("T")[0];
          const isCompleted = completedSet.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={idx}
              onClick={() => onSelect && onSelect(dateStr)}
              disabled={!onSelect}
              style={{
                height: 40,
                borderRadius: 6,
                border: isSelected ? "2px solid #2b7cff" : "1px solid #e6e6e6",
                background: isCompleted ? "#e9ecef" : "#fff",
                color: isCompleted ? "#6c757d" : "#111",
                cursor: onSelect ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <span style={{ fontSize: 14 }}>{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarTiles;
