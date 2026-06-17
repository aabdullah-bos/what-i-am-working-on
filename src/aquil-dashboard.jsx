import { useState, useEffect } from "react";
import {
  createDefaultDashboardDocument,
  getDueFollowUps,
  getOpenOpportunities,
  getReviewSummary,
  TRACK_URGENCY_OPTIONS,
  updateTrackField,
} from "./data/dashboard";
import {
  createFallbackDashboardDocument,
  getGistConfigError,
  loadDashboard,
  saveDashboard,
} from "./storage/gist-dashboard-storage";

const urgencyStyles = {
  immediate: { label: "NOW", bg: "#FF3333" },
  sprint:    { label: "SPRINT", bg: "#FF6B35" },
  "slow-burn": { label: "ONGOING", bg: "#444" },
  recurring: { label: "WEEKLY", bg: "#555" },
  weekly:    { label: "WEEKLY", bg: "#555" },
};

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

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dashboardDocument, setDashboardDocument] = useState(createDefaultDashboardDocument);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // null | "saving" | "saved" | "error"
  const [syncError, setSyncError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(null);
  const tracks = dashboardDocument.tracks;
  const todayIsoDate = getTodayIsoDate();
  const openOpportunities = getOpenOpportunities(dashboardDocument);
  const dueFollowUpIds = new Set(
    getDueFollowUps(dashboardDocument, todayIsoDate).map((opportunity) => opportunity.id)
  );
  const reviewSummary = getReviewSummary(dashboardDocument, todayIsoDate);

  // Load from Gist on mount
  useEffect(() => {
    const configError = getGistConfigError();

    if (configError) {
      setDashboardDocument(createFallbackDashboardDocument());
      setLoadError(configError);
      setLoading(false);
      return;
    }

    loadDashboard()
      .then((document) => {
        setDashboardDocument(document);
        setLoading(false);
      })
      .catch(err => {
        console.error("Gist load error:", err);
        setDashboardDocument(createFallbackDashboardDocument());
        setLoadError(`Could not load from Gist (${err.message}). Showing defaults — changes will not be saved until this is resolved.`);
        setLoading(false);
      });
  }, []);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const updateTrack = (id, field, value) => {
    setDashboardDocument((prev) => updateTrackField(prev, id, field, value));
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
      await saveDashboard(dashboardDocument);
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
      const defaultDocument = createDefaultDashboardDocument();

      setDashboardDocument(defaultDocument);
      saveDashboard(defaultDocument).catch(err => {
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
          grid-template-columns: 80px minmax(0, 1fr) 132px;
          align-items: center;
          gap: 20px;
          padding: 16px 24px;
        }
        .track-tag { font-size: 9px; letter-spacing: 0.16em; font-weight: 500; text-transform: uppercase; }
        .track-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          align-items: center;
          gap: 20px;
          min-width: 0;
          width: 100%;
        }
        .track-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(18px, 3vw, 26px);
          letter-spacing: 0.06em;
          color: #fff;
          min-width: 0;
        }
        .track-next {
          font-size: 11px;
          color: #FFFFF0;
          width: 100%;
          line-height: 1.5;
          text-align: left;
          justify-self: end;
        }
        .track-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 132px;
          justify-content: flex-end;
          justify-self: end;
        }

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

        .opportunities-section {
          padding: 0 40px 28px;
        }
        .opportunities-shell {
          border: 1px solid #1a1a1a;
          background: #0e0e0e;
        }
        .opportunities-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          padding: 18px 24px 16px;
          border-bottom: 1px solid #1a1a1a;
          flex-wrap: wrap;
        }
        .opportunities-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(20px, 3vw, 28px);
          letter-spacing: 0.06em;
          color: #fff;
        }
        .opportunities-subtitle {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .opportunity-list {
          display: flex;
          flex-direction: column;
        }
        .opportunity-row {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 1.4fr) auto;
          gap: 16px;
          align-items: start;
          padding: 16px 24px;
          border-top: 1px solid #141414;
        }
        .opportunity-row:first-child {
          border-top: none;
        }
        .opportunity-company {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 0.04em;
          color: #fff;
        }
        .opportunity-role {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .opportunity-stage-label,
        .opportunity-next-label {
          font-size: 9px;
          color: #666;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .opportunity-stage-value {
          font-size: 12px;
          color: #fff;
          line-height: 1.5;
        }
        .opportunity-next-value {
          font-size: 12px;
          color: #FFFFF0;
          line-height: 1.6;
        }
        .opportunity-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .opportunity-status-badge {
          font-size: 9px;
          color: #999;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid #2a2a2a;
          padding: 4px 8px;
          white-space: nowrap;
        }
        .opportunity-status-badge.due {
          color: #ff8d8d;
          border-color: #5a2626;
          background: #241212;
        }
        .opportunity-followup-date {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: right;
        }
        .review-section {
          padding: 0 40px 28px;
        }
        .review-shell {
          border: 1px solid #1a1a1a;
          background: #0e0e0e;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          padding: 18px 24px 16px;
          border-bottom: 1px solid #1a1a1a;
          flex-wrap: wrap;
        }
        .review-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(20px, 3vw, 28px);
          letter-spacing: 0.06em;
          color: #fff;
        }
        .review-subtitle {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .review-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1px;
          background: #141414;
        }
        .review-metric {
          background: #0e0e0e;
          padding: 16px 24px;
        }
        .review-metric-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 0.04em;
          color: #fff;
        }
        .review-metric-label {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 6px;
        }
        .review-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #141414;
        }
        .review-panel {
          background: #0e0e0e;
          padding: 18px 24px 20px;
        }
        .review-panel-title {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .review-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .review-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
          border-top: 1px solid #161616;
          padding-top: 10px;
        }
        .review-item:first-child {
          border-top: none;
          padding-top: 0;
        }
        .review-item-name {
          font-size: 12px;
          color: #fff;
          line-height: 1.5;
        }
        .review-item-meta {
          font-size: 10px;
          color: #666;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .review-empty {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
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

        @media (max-width: 900px) {
          .track-main {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .track-next {
            justify-self: start;
          }
          .track-controls {
            align-self: start;
          }
        }
        @media (max-width: 600px) {
          .header, .tracks, .review-section, .opportunities-section, .footer { padding-left: 20px; padding-right: 20px; }
          .track-header { grid-template-columns: 60px minmax(0, 1fr) 112px; gap: 12px; }
          .track-main { gap: 6px; }
          .track-next { font-size: 10px; }
          .track-controls { width: 112px; }
        }
        @media (max-width: 760px) {
          .review-metrics {
            grid-template-columns: 1fr;
          }
          .review-body {
            grid-template-columns: 1fr;
          }
          .opportunity-row {
            grid-template-columns: 1fr;
          }
          .opportunity-status {
            align-items: flex-start;
          }
          .opportunity-followup-date {
            text-align: left;
          }
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

                <div className="track-main">
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
                </div>

                <div className="track-controls">
                  {editMode && isOpen ? (
                    <select
                      className="urgency-select"
                      value={track.urgency}
                      style={{ background: urg.bg }}
                      onChange={e => updateTrack(track.id, "urgency", e.target.value)}
                      onClick={e => e.stopPropagation()}
                    >
                      {TRACK_URGENCY_OPTIONS.map(o => (
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

      <div className="review-section">
        <div className="review-shell">
          <div className="review-header">
            <div>
              <div className="review-title">Review Pulse</div>
              <div className="review-subtitle">What needs attention before momentum slips</div>
            </div>
          </div>

          <div className="review-metrics">
            <div className="review-metric">
              <div className="review-metric-value">{reviewSummary.activeOpportunityCount}</div>
              <div className="review-metric-label">
                {pluralize(
                  reviewSummary.activeOpportunityCount,
                  "active opportunity",
                  "active opportunities"
                )}
              </div>
            </div>
            <div className="review-metric">
              <div className="review-metric-value">{reviewSummary.dueFollowUpCount}</div>
              <div className="review-metric-label">
                {pluralize(reviewSummary.dueFollowUpCount, "follow-up due", "follow-ups due")}
              </div>
            </div>
            <div className="review-metric">
              <div className="review-metric-value">{reviewSummary.staleItemCount}</div>
              <div className="review-metric-label">
                {pluralize(reviewSummary.staleItemCount, "stale item")}
              </div>
            </div>
          </div>

          <div className="review-body">
            <div className="review-panel">
              <div className="review-panel-title">Stale Tracks</div>
              {reviewSummary.staleTracks.length > 0 ? (
                <div className="review-list">
                  {reviewSummary.staleTracks.map((track) => (
                    <div key={track.id} className="review-item">
                      <div className="review-item-name">{track.label}</div>
                      <div className="review-item-meta">Needs next action</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="review-empty">All active tracks have a next action.</div>
              )}
            </div>

            <div className="review-panel">
              <div className="review-panel-title">Attention Now</div>
              {reviewSummary.staleOpportunities.length > 0 ? (
                <div className="review-list">
                  {reviewSummary.staleOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="review-item">
                      <div className="review-item-name">{opportunity.company}</div>
                      <div className="review-item-meta">Due {opportunity.followUpBy}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="review-empty">No overdue follow-ups right now.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {openOpportunities.length > 0 && (
        <div className="opportunities-section">
          <div className="opportunities-shell">
            <div className="opportunities-header">
              <div>
                <div className="opportunities-title">Open Opportunities</div>
                <div className="opportunities-subtitle">
                  {openOpportunities.length} active conversation{openOpportunities.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="opportunity-list">
              {openOpportunities.map((opportunity) => {
                const isDue = dueFollowUpIds.has(opportunity.id);

                return (
                  <div key={opportunity.id} className="opportunity-row">
                    <div>
                      <div className="opportunity-company">{opportunity.company}</div>
                      {opportunity.role && (
                        <div className="opportunity-role">{opportunity.role}</div>
                      )}
                    </div>

                    <div>
                      <div className="opportunity-stage-label">Stage</div>
                      <div className="opportunity-stage-value">{opportunity.stage || "TBD"}</div>
                    </div>

                    <div>
                      <div className="opportunity-next-label">Next Action</div>
                      <div className="opportunity-next-value">
                        {opportunity.nextAction || "Define the next concrete step."}
                      </div>
                    </div>

                    <div className="opportunity-status">
                      {isDue ? (
                        <div className="opportunity-status-badge due">Follow-up Due</div>
                      ) : (
                        <div className="opportunity-status-badge">
                          {opportunity.status.replace("-", " ")}
                        </div>
                      )}
                      {opportunity.followUpBy && (
                        <div className="opportunity-followup-date">
                          Follow up by {opportunity.followUpBy}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        <div>ONE NEXT ACTION PER TRACK · WRITE WEEKLY</div>
        <div className="principle">
          The answer to "what do you want to do?" is "let me show you what I'm building."
        </div>
      </div>
    </div>
  );
}
