import { useState, useEffect } from "react";

const URGENCY_OPTIONS = ["immediate", "sprint", "slow-burn", "recurring", "weekly"];

const urgencyStyles = {
  immediate: { label: "NOW", bg: "#FF3333" },
  sprint:    { label: "SPRINT", bg: "#FF6B35" },
  "slow-burn": { label: "ONGOING", bg: "#444" },
  recurring: { label: "WEEKLY", bg: "#555" },
  weekly:    { label: "WEEKLY", bg: "#555" },
};

const defaultTracks = [
  {
    id: "raes-mefighter",
    label: "RAES & MeFighter",
    tag: "AI BUILDS",
    color: "#E8FF47",
    urgency: "slow-burn",
    focus: "Conversational AI cognition, picking up language cues, model limitations",
    nextAction: "Read one paper or build one small experiment on conversation state this week",
    writePrompt: "What's one thing I learned about conversational AI this week and how does it apply to RAES?",
    context: "Deep, compounds over time. Pair reading with small builds. Output = decisions made inside the product.",
  },
  {
    id: "dots",
    label: "DOTS Move",
    tag: "PERFORMANCE",
    color: "#FF6B35",
    urgency: "sprint",
    focus: "CSR vs SSR vs ISR, Core Web Vitals (FCP, LCP), industry benchmarks",
    nextAction: "Write a 1-page trade-off doc for DOTS: what rendering strategy fits the app's actual usage pattern?",
    writePrompt: "What did my benchmarking reveal, and what's the single biggest performance lever I haven't pulled yet?",
    context: "Bounded and learnable fast. A decision doc for your own app doubles as interview material.",
  },
  {
    id: "interviews",
    label: "Interviews & Opportunities",
    tag: "CAREER",
    color: "#00C2FF",
    urgency: "immediate",
    focus: "Button (DevOps) · Ryan Coyne options platform (tbd depth)",
    nextAction: "Button prep today. For Ryan: one conversation to assess seriousness before going deep on options.",
    writePrompt: "What's my narrative for why I'm the right person for this role, in two sentences?",
    context: "Two very different asks. Don't conflate them. Button is now. Ryan depends on deal seriousness.",
  },
  {
    id: "networking",
    label: "Networking",
    tag: "PIPELINE",
    color: "#B47FFF",
    urgency: "recurring",
    focus: "Finding people doing interesting things · Following up without friction",
    nextAction: "After every new contact: name + context + one follow-up action into Apple Notes within 24hrs",
    writePrompt: "Who did I meet this week, what are they building, and what's the one thing I can offer them?",
    context: "Fix the intake first. One note, fast capture, weekly triage. No CMS.",
  },
  {
    id: "writing",
    label: "Writing",
    tag: "LEVERAGE",
    color: "#FF3CAC",
    urgency: "weekly",
    focus: '"What I\'m building" posts · Answer the what-do-you-do question publicly',
    nextAction: "Write one short post this week. Anchor it in a moment from one of your builds.",
    writePrompt: "What's one thing I'm building right now that surprised me, and why does it matter?",
    context: "This is your force multiplier. One post = interview prep + networking + thinking clarified.",
  },
];

// ── Gist API ────────────────────────────────────────────────────────────────
const GIST_ID       = process.env.REACT_APP_GIST_ID;
const GITHUB_TOKEN  = process.env.REACT_APP_GITHUB_TOKEN;
const GIST_FILENAME = "dashboard-tracks.json";

const gistUrl = () =>
  process.env.NODE_ENV === "production"
    ? `https://api.github.com/gists/${GIST_ID}`
    : `/gists/${GIST_ID}`;
  
async function fetchFromGist() {
  const res = await fetch(gistUrl(), {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
  const data = await res.json();
  const content = data.files[GIST_FILENAME]?.content;
  if (!content) throw new Error("Gist file not found");
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTracks;
}

async function saveToGist(tracks) {
 const res = await fetch(gistUrl(), {
    method: "PATCH",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(tracks, null, 2) },
      },
    }),
  });
  if (!res.ok) throw new Error(`Gist save failed: ${res.status}`);
}

// ── Editable field ──────────────────────────────────────────────────────────
function EditableField({ value, onChange, multiline, style }) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        style={{
          background: "transparent",
          border: "1px dashed #333",
          borderRadius: "2px",
          color: "inherit",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          width: "100%",
          resize: "vertical",
          padding: "6px 8px",
          outline: "none",
          ...style,
        }}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
      style={{
        background: "transparent",
        border: "1px dashed #333",
        borderRadius: "2px",
        color: "inherit",
        fontFamily: "inherit",
        fontSize: "inherit",
        width: "100%",
        padding: "4px 8px",
        outline: "none",
        ...style,
      }}
    />
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tracks, setTracks]         = useState(defaultTracks);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // null | "saving" | "saved" | "error"
  const [syncError, setSyncError]   = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [copied, setCopied]         = useState(null);

  // Load from Gist on mount
  useEffect(() => {
    if (!GIST_ID || !GITHUB_TOKEN) {
      setLoadError("Missing REACT_APP_GIST_ID or REACT_APP_GITHUB_TOKEN — check your .env file.");
      setLoading(false);
      return;
    }
    fetchFromGist()
      .then(data => { setTracks(data); setLoading(false); })
      .catch(err => {
        console.error("Gist load error:", err);
        setLoadError(`Could not load from Gist (${err.message}). Showing defaults — changes will not be saved until this is resolved.`);
        setLoading(false);
      });
  }, []);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const updateTrack = (id, field, value) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const copyPrompt = (id, prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleSave = async () => {
    setSyncStatus("saving");
    setSyncError(null);
    try {
      await saveToGist(tracks);
      setSyncStatus("saved");
      setEditMode(false);
      setTimeout(() => setSyncStatus(null), 2000);
    } catch (err) {
      console.error("Gist save error:", err);
      setSyncStatus("error");
      setSyncError(`Save failed: ${err.message}`);
      setTimeout(() => { setSyncStatus(null); }, 5000);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all tracks to defaults? This cannot be undone.")) {
      setTracks(defaultTracks);
      saveToGist(defaultTracks).catch(err => {
        console.error("Gist reset error:", err);
        setSyncError(`Reset save failed: ${err.message}`);
      });
      setEditMode(false);
    }
  };

  const saveBtnLabel = () => {
    if (syncStatus === "saving") return "Saving…";
    if (syncStatus === "saved")  return "✓ Saved";
    if (syncStatus === "error")  return "⚠ Failed";
    return "Save Changes";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", color: "#444", letterSpacing: "0.12em", fontSize: "11px", textTransform: "uppercase" }}>
        Loading from Gist…
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#e8e8e8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .header {
          border-bottom: 1px solid #222;
          padding: 28px 40px 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .header-left h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 5vw, 60px);
          letter-spacing: 0.04em;
          line-height: 1;
          color: #fff;
        }
        .header-sub {
          font-size: 11px;
          color: #555;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 6px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .date-block { font-size: 11px; color: #444; letter-spacing: 0.1em; }

        .btn {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 7px 14px;
          border-radius: 2px;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.15s;
        }
        .btn-edit { background: transparent; border-color: #333; color: #666; }
        .btn-edit:hover { border-color: #888; color: #ccc; background: #161616; }
        .btn-save { background: #1a3a1a; border-color: #2a6a2a; color: #55cc77; }
        .btn-save:hover { background: #1f4a1f; }
        .btn-save.error { background: #3a1a1a; border-color: #6a2a2a; color: #cc5555; }
        .btn-reset { background: transparent; border-color: #2a1a1a; color: #663333; font-size: 9px; }
        .btn-reset:hover { border-color: #553333; color: #cc5555; }

        .tracks { padding: 28px 40px; display: flex; flex-direction: column; gap: 2px; }

        .track-row {
          border: 1px solid #1a1a1a;
          background: #0e0e0e;
          transition: border-color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .track-row:hover { border-color: #2a2a2a; background: #111; }
        .track-row.open  { border-color: #2a2a2a; background: #111; }
        .track-row.editing { border-color: #2a2a1a; background: #111; cursor: default; }

        .track-header {
          display: grid;
          grid-template-columns: 80px 1fr auto auto;
          align-items: center;
          gap: 20px;
          padding: 16px 24px;
        }
        .track-tag { font-size: 9px; letter-spacing: 0.16em; font-weight: 500; text-transform: uppercase; }
        .track-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(18px, 3vw, 26px);
          letter-spacing: 0.06em;
          color: #fff;
        }
        .track-next {
          font-size: 11px;
          color: #FFFFF0;
          max-width: 300px;
          line-height: 1.5;
          text-align: right;
          display: none;
        }
        @media (min-width: 700px) { .track-next { display: block; } }

        .urgency-badge {
          font-size: 9px;
          letter-spacing: 0.14em;
          padding: 4px 8px;
          border-radius: 2px;
          font-weight: 500;
          white-space: nowrap;
          color: #fff;
        }
        .urgency-select {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          padding: 4px 8px;
          border-radius: 2px;
          color: #fff;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          outline: none;
        }
        .chevron {
          font-size: 14px;
          color: #444;
          transition: transform 0.2s;
          width: 16px;
          text-align: center;
        }
        .chevron.open { transform: rotate(180deg); color: #888; }

        .track-body {
          border-top: 1px solid #1a1a1a;
          padding: 22px 24px 26px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) { .track-body { grid-template-columns: 1fr; } }

        .body-section label {
          display: block;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #FFFFF0;
          margin-bottom: 8px;
        }
        .body-section p { font-size: 12px; line-height: 1.7; color: #FFFFF0; }

        .next-action-box {
          background: #161616;
          border-left: 3px solid;
          padding: 12px 14px;
          font-size: 12px;
          line-height: 1.7;
          color: #FFFFF0;
        }
        .write-prompt-box {
          background: #161616;
          padding: 12px 14px;
          font-size: 12px;
          line-height: 1.7;
          color: #FFFFF0;
          font-style: italic;
          cursor: pointer;
          border: 1px solid #1e1e1e;
          transition: border-color 0.15s;
        }
        .write-prompt-box:hover { border-color: #333; }
        .copy-hint {
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #555;
          margin-top: 8px;
          text-transform: uppercase;
          font-style: normal;
          transition: color 0.15s;
        }
        .write-prompt-box:hover .copy-hint { color: #888; }
        .copy-hint.copied { color: #55cc77 !important; }

        .edit-hint {
          font-size: 9px;
          color: #3a3a2a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-align: center;
          padding: 8px;
          border-top: 1px solid #1a1a1a;
        }

        .footer {
          border-top: 1px solid #1a1a1a;
          padding: 18px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #333;
          letter-spacing: 0.1em;
          flex-wrap: wrap;
          gap: 8px;
        }
        .principle { max-width: 480px; text-align: right; line-height: 1.6; }

        @media (max-width: 600px) {
          .header, .tracks, .footer { padding-left: 20px; padding-right: 20px; }
          .track-header { grid-template-columns: 60px 1fr auto; gap: 12px; }
        }
      `}</style>

      {/* ERROR BANNERS */}
      {loadError && (
        <div style={{ background: "#2a1a1a", borderBottom: "1px solid #553333", padding: "10px 40px", fontSize: "11px", color: "#ff8888", letterSpacing: "0.08em", lineHeight: "1.6" }}>
          ⚠ {loadError}
        </div>
      )}
      {syncError && (
        <div style={{ background: "#2a1a1a", borderBottom: "1px solid #553333", padding: "10px 40px", fontSize: "11px", color: "#ff8888", letterSpacing: "0.08em", lineHeight: "1.6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠ {syncError}</span>
          <span style={{ cursor: "pointer", color: "#ff5555" }} onClick={() => setSyncError(null)}>✕</span>
        </div>
      )}

      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <h1>WHAT I'M BUILDING</h1>
          <div className="header-sub">Aquil Harrison · {tracks.length} Active Tracks</div>
        </div>
        <div className="header-right">
          <div className="date-block">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </div>
          {editMode ? (
            <>
              <button className="btn btn-reset" onClick={handleReset}>Reset</button>
              <button
                className={`btn btn-save${syncStatus === "error" ? " error" : ""}`}
                onClick={handleSave}
                disabled={syncStatus === "saving"}
              >
                {saveBtnLabel()}
              </button>
            </>
          ) : (
            <button className="btn btn-edit" onClick={() => { setEditMode(true); setExpanded(tracks[0]?.id); }}>
              Edit Dashboard
            </button>
          )}
        </div>
      </div>

      {/* TRACKS */}
      <div className="tracks">
        {tracks.map((track) => {
          const isOpen = expanded === track.id;
          const urg = urgencyStyles[track.urgency] || urgencyStyles["slow-burn"];
          return (
            <div
              key={track.id}
              className={`track-row ${isOpen ? "open" : ""} ${editMode ? "editing" : ""}`}
              onClick={() => toggle(track.id)}
            >
              <div className="track-header">
                <div className="track-tag" style={{ color: track.color }}>
                  {editMode && isOpen ? (
                    <EditableField
                      value={track.tag}
                      onChange={v => updateTrack(track.id, "tag", v)}
                      style={{ color: track.color, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                    />
                  ) : track.tag}
                </div>

                <div className="track-name">
                  {editMode && isOpen ? (
                    <EditableField
                      value={track.label}
                      onChange={v => updateTrack(track.id, "label", v)}
                      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(18px,3vw,26px)", letterSpacing: "0.06em", color: "#fff" }}
                    />
                  ) : track.label}
                </div>

                {!editMode && (
                  <div className="track-next">{track.nextAction}</div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {editMode && isOpen ? (
                    <select
                      className="urgency-select"
                      value={track.urgency}
                      style={{ background: urg.bg }}
                      onChange={e => updateTrack(track.id, "urgency", e.target.value)}
                      onClick={e => e.stopPropagation()}
                    >
                      {URGENCY_OPTIONS.map(o => (
                        <option key={o} value={o} style={{ background: "#222" }}>
                          {urgencyStyles[o]?.label || o.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="urgency-badge" style={{ background: urg.bg }}>{urg.label}</div>
                  )}
                  <div className={`chevron ${isOpen ? "open" : ""}`}>▾</div>
                </div>
              </div>

              {isOpen && (
                <div className="track-body" onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="body-section">
                      <label>Focus</label>
                      {editMode ? (
                        <EditableField multiline value={track.focus} onChange={v => updateTrack(track.id, "focus", v)} style={{ color: "#FFFFF0", fontSize: "12px", lineHeight: "1.7", minHeight: "60px" }} />
                      ) : <p>{track.focus}</p>}
                    </div>
                    <div className="body-section">
                      <label>Context</label>
                      {editMode ? (
                        <EditableField multiline value={track.context} onChange={v => updateTrack(track.id, "context", v)} style={{ color: "#FFFFF0", fontSize: "12px", lineHeight: "1.7", minHeight: "60px" }} />
                      ) : <p>{track.context}</p>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="body-section">
                      <label>Next Action</label>
                      {editMode ? (
                        <div className="next-action-box" style={{ borderLeftColor: track.color }}>
                          <EditableField multiline value={track.nextAction} onChange={v => updateTrack(track.id, "nextAction", v)} style={{ color: "#FFFFF0", fontSize: "12px", lineHeight: "1.7", minHeight: "60px" }} />
                        </div>
                      ) : (
                        <div className="next-action-box" style={{ borderLeftColor: track.color }}>
                          {track.nextAction}
                        </div>
                      )}
                    </div>

                    <div className="body-section">
                      <label>Writing Prompt</label>
                      {editMode ? (
                        <div className="write-prompt-box">
                          <EditableField multiline value={track.writePrompt} onChange={v => updateTrack(track.id, "writePrompt", v)} style={{ color: "#FFFFF0", fontSize: "12px", lineHeight: "1.7", fontStyle: "italic", minHeight: "60px" }} />
                        </div>
                      ) : (
                        <div className="write-prompt-box" onClick={() => copyPrompt(track.id, track.writePrompt)}>
                          "{track.writePrompt}"
                          <div className={`copy-hint ${copied === track.id ? "copied" : ""}`}>
                            {copied === track.id ? "✓ copied" : "tap to copy"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {editMode && !isOpen && (
                <div className="edit-hint">click to expand and edit</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="footer">
        <div>ONE NEXT ACTION PER TRACK · WRITE WEEKLY</div>
        <div className="principle">
          The answer to "what do you want to do?" is "let me show you what I'm building."
        </div>
      </div>
    </div>
  );
}