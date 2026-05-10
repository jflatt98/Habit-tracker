import { useState, useEffect } from "react";

const DEFAULT_HABITS = [
  { id: "workouts", name: "Workouts", goal: 265, color: "#E8624A", icon: "🏋️" },
  { id: "mobility", name: "Mobility / Flexibility", goal: 200, color: "#4A9E8E", icon: "🧘" },
  { id: "mindfulness", name: "Mindfulness", goal: 200, color: "#7B68EE", icon: "🧠" },
  { id: "flossing", name: "Flossing", goal: 265, color: "#F0A500", icon: "🦷" },
  { id: "reading", name: "Reading", goal: 150, color: "#5BA85A", icon: "📚" },
];

const DEFAULT_WORKOUT_TYPES = [
  "Skiing", "Hiking", "Long Walk", "Cassidy on Canal", "EBC Functional",
  "EBC Hyrox", "EBC Yoga", "Run - Treadmill", "Run - Outdoor",
  "Peloton", "Cycling", "Pickleball",
];

function buildSeedLogs() {
  const seed = [
    { habitId: "workouts", subtype: "Skiing", count: 4 },
    { habitId: "workouts", subtype: "Hiking", count: 6 },
    { habitId: "workouts", subtype: "Long Walk", count: 1 },
    { habitId: "workouts", subtype: "Cassidy on Canal", count: 12 },
    { habitId: "workouts", subtype: "EBC Functional", count: 18 },
    { habitId: "workouts", subtype: "EBC Hyrox", count: 3 },
    { habitId: "workouts", subtype: "EBC Yoga", count: 8 },
    { habitId: "workouts", subtype: "Run - Treadmill", count: 2 },
    { habitId: "workouts", subtype: "Run - Outdoor", count: 11 },
    { habitId: "workouts", subtype: "Peloton", count: 1 },
    { habitId: "workouts", subtype: "Cycling", count: 1 },
    { habitId: "workouts", subtype: "Pickleball", count: 7 },
    { habitId: "mobility", subtype: "", count: 42 },
    { habitId: "mindfulness", subtype: "", count: 42 },
    { habitId: "flossing", subtype: "", count: 68 },
    { habitId: "reading", subtype: "", count: 8 },
  ];
  const logs = [];
  let id = 1;
  seed.forEach(({ habitId, subtype, count }) => {
    for (let i = 0; i < count; i++) {
      logs.push({ id: id++, habitId, date: "2026-01-01", subtype, note: "", createdAt: "2026-01-01T00:00:00Z", seeded: true });
    }
  });
  return logs;
}

const STORAGE_KEY = "habit_tracker_v3";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.workoutTypes) parsed.workoutTypes = DEFAULT_WORKOUT_TYPES;
      return parsed;
    }
  } catch {}
  return { habits: DEFAULT_HABITS, logs: buildSeedLogs(), workoutTypes: DEFAULT_WORKOUT_TYPES };
}

function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

function today() { return new Date().toISOString().split("T")[0]; }

function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function countByHabit(logs, habitId) {
  return logs.filter(l => l.habitId === habitId).length;
}

function countByHabitToday(logs, habitId) {
  return logs.filter(l => l.habitId === habitId && l.date === today()).length;
}

function getDaysIntoYear() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
}

function getOnPace(goal) {
  return Math.round(goal * (getDaysIntoYear() / 365));
}

const labelStyle = {
  display: "block", fontSize: 10, letterSpacing: 1.5, color: "#555",
  textTransform: "uppercase", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
  background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#F0EDE8",
  fontFamily: "inherit", boxSizing: "border-box", outline: "none",
};

const countBtnStyle = {
  width: 40, height: 40, borderRadius: 8, background: "#1A1A1A",
  border: "1px solid #2A2A2A", color: "#F0EDE8", cursor: "pointer", fontFamily: "inherit",
};

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("dashboard");
  const [expandedWorkout, setExpandedWorkout] = useState(false);
  const [logForm, setLogForm] = useState({ habitId: "workouts", date: today(), subtype: "", note: "", count: 1 });
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [manageForm, setManageForm] = useState({ name: "", goal: "", icon: "✅", color: "#888888" });

  useEffect(() => { saveData(data); }, [data]);

  const { habits, logs } = data;
  const workoutTypes = data.workoutTypes || DEFAULT_WORKOUT_TYPES;
  const selectedHabit = habits.find(h => h.id === logForm.habitId);

  function getWorkoutBreakdown() {
    const counts = {};
    logs.filter(l => l.habitId === "workouts").forEach(l => {
      const k = l.subtype || "Unknown";
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function addCustomType() {
    const trimmed = customTypeInput.trim();
    if (!trimmed || workoutTypes.includes(trimmed)) return;
    setData(d => ({ ...d, workoutTypes: [...(d.workoutTypes || DEFAULT_WORKOUT_TYPES), trimmed] }));
    setLogForm(f => ({ ...f, subtype: trimmed }));
    setCustomTypeInput("");
    setShowCustomInput(false);
  }

  function addLog() {
    const entries = [];
    for (let i = 0; i < logForm.count; i++) {
      entries.push({
        id: Date.now() + i,
        habitId: logForm.habitId,
        date: logForm.date,
        subtype: logForm.subtype,
        note: logForm.note,
        createdAt: new Date().toISOString(),
      });
    }
    setData(d => ({ ...d, logs: [...d.logs, ...entries] }));
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 2000);
    setLogForm(f => ({ ...f, subtype: "", note: "", count: 1 }));
    setShowCustomInput(false);
  }

  function deleteLog(id) {
    setData(d => ({ ...d, logs: d.logs.filter(l => l.id !== id) }));
  }

  function addHabit() {
    if (!manageForm.name || !manageForm.goal) return;
    const newHabit = {
      id: manageForm.name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now(),
      name: manageForm.name, goal: parseInt(manageForm.goal),
      color: manageForm.color, icon: manageForm.icon,
    };
    setData(d => ({ ...d, habits: [...d.habits, newHabit] }));
    setManageForm({ name: "", goal: "", icon: "✅", color: "#888888" });
  }

  function removeHabit(id) {
    setData(d => ({ ...d, habits: d.habits.filter(h => h.id !== id), logs: d.logs.filter(l => l.habitId !== id) }));
  }

  const filteredLogs = (historyFilter === "all" ? [...logs] : logs.filter(l => l.habitId === historyFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", color: "#F0EDE8", fontFamily: "'Georgia', serif", maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>

      {/* Header */}
      <div style={{ padding: "28px 20px 12px", borderBottom: "1px solid #222" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Habit Tracker</h1>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", borderBottom: "1px solid #222" }}>
        {[["dashboard","Overview"],["log","Log"],["history","History"],["manage","Habits"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: "12px 0", fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
            background: "none", border: "none",
            borderBottom: view === v ? "2px solid #F0EDE8" : "2px solid transparent",
            color: view === v ? "#F0EDE8" : "#555", cursor: "pointer", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "20px 20px 0" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
              Day {getDaysIntoYear()} of 365
            </div>
            {habits.map(h => {
              const count = countByHabit(logs, h.id);
              const onPace = getOnPace(h.goal);
              const pct = Math.min(100, Math.round((count / h.goal) * 100));
              const ahead = count - onPace;
              const isWorkout = h.id === "workouts";
              const breakdown = isWorkout ? getWorkoutBreakdown() : [];

              return (
                <div key={h.id} style={{ background: "#161616", borderRadius: 12, padding: "16px 18px", marginBottom: 12, border: "1px solid #222" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{h.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{h.name}</span>
                      {isWorkout && (
                        <button onClick={() => setExpandedWorkout(e => !e)} style={{
                          fontSize: 11, padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                          background: "#222", border: "none", color: "#666", letterSpacing: 0.5, fontFamily: "inherit",
                        }}>
                          {expandedWorkout ? "▲ hide" : "▼ types"}
                        </button>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: h.color }}>{count}</span>
                      <span style={{ fontSize: 12, color: "#555" }}> / {h.goal}</span>
                    </div>
                  </div>

                  <div style={{ background: "#222", borderRadius: 4, height: 6, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: h.color, borderRadius: 4, transition: "width 0.4s" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555" }}>
                    <span>{pct}% complete</span>
                    <span style={{ color: ahead >= 0 ? "#5BA85A" : "#E8624A" }}>
                      {ahead >= 0 ? `+${ahead} ahead` : `${Math.abs(ahead)} behind`} of pace
                    </span>
                  </div>

                  {isWorkout && expandedWorkout && breakdown.length > 0 && (
                    <div style={{ marginTop: 14, borderTop: "1px solid #222", paddingTop: 12 }}>
                      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#444", textTransform: "uppercase", marginBottom: 10 }}>By Type</div>
                      {breakdown.map(([type, cnt]) => {
                        const typePct = Math.round((cnt / count) * 100);
                        return (
                          <div key={type} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                              <span style={{ color: "#ccc" }}>{type}</span>
                              <span style={{ color: h.color, fontWeight: 700 }}>{cnt}</span>
                            </div>
                            <div style={{ background: "#222", borderRadius: 3, height: 4, overflow: "hidden" }}>
                              <div style={{ width: `${typePct}%`, height: "100%", background: h.color, opacity: 0.6, borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: 24, marginBottom: 8, fontSize: 11, letterSpacing: 1, color: "#555", textTransform: "uppercase" }}>Today</div>
            {habits.map(h => {
              const n = countByHabitToday(logs, h.id);
              if (!n) return null;
              return (
                <div key={h.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 14 }}>
                  <span>{h.icon}</span>
                  <span style={{ color: h.color }}>{h.name}</span>
                  <span style={{ color: "#555" }}>×{n}</span>
                </div>
              );
            })}
            {habits.every(h => !countByHabitToday(logs, h.id)) && (
              <div style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>Nothing logged yet today.</div>
            )}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Habit</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {habits.map(h => (
                  <button key={h.id} onClick={() => setLogForm(f => ({ ...f, habitId: h.id, subtype: "" }))} style={{
                    padding: "8px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    background: logForm.habitId === h.id ? h.color : "#1A1A1A",
                    color: logForm.habitId === h.id ? "#000" : "#888",
                    border: `1px solid ${logForm.habitId === h.id ? h.color : "#333"}`,
                    fontWeight: logForm.habitId === h.id ? 700 : 400,
                  }}>{h.icon} {h.name}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={logForm.date}
                onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle} />
            </div>

            {logForm.habitId === "workouts" && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Workout Type</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
                  {workoutTypes.map(t => (
                    <button key={t} onClick={() => { setLogForm(f => ({ ...f, subtype: t })); setShowCustomInput(false); }} style={{
                      padding: "7px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      background: logForm.subtype === t ? "#E8624A" : "#1E1E1E",
                      color: logForm.subtype === t ? "#000" : "#999",
                      border: `1px solid ${logForm.subtype === t ? "#E8624A" : "#2A2A2A"}`,
                      fontWeight: logForm.subtype === t ? 700 : 400,
                    }}>{t}</button>
                  ))}
                  <button onClick={() => { setShowCustomInput(true); setLogForm(f => ({ ...f, subtype: "" })); setCustomTypeInput(""); }} style={{
                    padding: "7px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    background: showCustomInput ? "#333" : "#1E1E1E",
                    color: showCustomInput ? "#F0EDE8" : "#666",
                    border: `1px solid ${showCustomInput ? "#555" : "#2A2A2A"}`,
                    fontStyle: "italic",
                  }}>+ Other</button>
                </div>
                {showCustomInput && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      autoFocus
                      type="text"
                      value={customTypeInput}
                      placeholder="e.g. Boxing, Swimming..."
                      onChange={e => setCustomTypeInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomType()}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={addCustomType} style={{
                      padding: "0 16px", borderRadius: 8, background: "#E8624A", color: "#000",
                      border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
                    }}>Add</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Count (log multiple at once)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setLogForm(f => ({ ...f, count: Math.max(1, f.count - 1) }))} style={{ ...countBtnStyle, fontSize: 18 }}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, minWidth: 32, textAlign: "center" }}>{logForm.count}</span>
                <button onClick={() => setLogForm(f => ({ ...f, count: f.count + 1 }))} style={{ ...countBtnStyle, fontSize: 18 }}>+</button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Note (optional)</label>
              <input type="text" value={logForm.note} placeholder="e.g. 5km, 45 min..."
                onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))}
                style={inputStyle} />
            </div>

            <button onClick={addLog} style={{
              width: "100%", padding: "16px", borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: selectedHabit?.color || "#E8624A", color: "#000",
              border: "none", cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
            }}>
              {logSuccess ? "✓ Logged!" : `Log ${logForm.count > 1 ? logForm.count + "×" : ""} ${selectedHabit?.name || ""}`}
            </button>

            {selectedHabit && (
              <div style={{ marginTop: 20, background: "#161616", borderRadius: 10, padding: "14px 16px", border: "1px solid #222" }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{selectedHabit.name} progress</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: selectedHabit.color }}>
                  {countByHabit(logs, selectedHabit.id)}
                  <span style={{ fontSize: 14, color: "#555", fontWeight: 400 }}> / {selectedHabit.goal}</span>
                </div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Today: {countByHabitToday(logs, selectedHabit.id)}</div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={inputStyle}>
                <option value="all">All habits</option>
                {habits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
              </select>
            </div>

            {historyFilter === "workouts" && (() => {
              const breakdown = getWorkoutBreakdown();
              return breakdown.length > 0 ? (
                <div style={{ background: "#161616", borderRadius: 10, padding: "14px 16px", marginBottom: 16, border: "1px solid #222" }}>
                  <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Breakdown</div>
                  {breakdown.map(([type, cnt]) => (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: "#ccc" }}>{type}</span>
                      <span style={{ color: "#E8624A", fontWeight: 700 }}>{cnt}</span>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {filteredLogs.length === 0 && <div style={{ color: "#444", fontStyle: "italic", fontSize: 13 }}>No entries yet.</div>}
            {filteredLogs.map(l => {
              const h = habits.find(h => h.id === l.habitId);
              return (
                <div key={l.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 14px", background: "#161616", borderRadius: 8, marginBottom: 6, border: "1px solid #222",
                }}>
                  <div>
                    <span style={{ fontSize: 14, marginRight: 6 }}>{h?.icon}</span>
                    <span style={{ fontSize: 13, color: h?.color || "#ccc" }}>{h?.name}</span>
                    {l.subtype && <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>· {l.subtype}</span>}
                    {l.note && <span style={{ fontSize: 11, color: "#555", marginLeft: 6 }}>{l.note}</span>}
                    <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                      {parseLocalDate(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <button onClick={() => deleteLog(l.id)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* MANAGE */}
        {view === "manage" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              {habits.map(h => (
                <div key={h.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", background: "#161616", borderRadius: 8, marginBottom: 8, border: "1px solid #2A2A2A",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{h.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: h.color }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>Goal: {h.goal} · Done: {countByHabit(logs, h.id)}</div>
                    </div>
                  </div>
                  <button onClick={() => removeHabit(h.id)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #222", paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Add New Habit</div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Name</label>
                <input type="text" value={manageForm.name} placeholder="e.g. Swimming"
                  onChange={e => setManageForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Yearly Goal</label>
                <input type="number" value={manageForm.goal} placeholder="e.g. 100"
                  onChange={e => setManageForm(f => ({ ...f, goal: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Icon / Emoji</label>
                  <input type="text" value={manageForm.icon} maxLength={2}
                    onChange={e => setManageForm(f => ({ ...f, icon: e.target.value }))}
                    style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Color</label>
                  <input type="color" value={manageForm.color}
                    onChange={e => setManageForm(f => ({ ...f, color: e.target.value }))}
                    style={{ ...inputStyle, padding: 4, height: 42, cursor: "pointer" }} />
                </div>
              </div>
              <button onClick={addHabit} style={{
                width: "100%", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "#F0EDE8", color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit",
              }}>Add Habit</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: "#0F0F0F",
        borderTop: "1px solid #1E1E1E", padding: "10px 20px", display: "flex", justifyContent: "center",
      }}>
        <button onClick={() => setView("log")} style={{
          padding: "12px 40px", borderRadius: 30, background: "#E8624A", color: "#000",
          border: "none", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5,
        }}>+ Log Activity</button>
      </div>
    </div>
  );
}
