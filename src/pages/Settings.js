import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function Settings({ orgId, orgName, onSignOut }) {
  const [gates, setGates] = useState(["Gate A", "Gate B", "Gate C"]);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [toast, setToast] = useState(null);
  const [orgData, setOrgData] = useState({});

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "organizations", orgId));
      if (snap.exists()) {
        setOrgData(snap.data());
        setGates(snap.data().gates || ["Gate A", "Gate B", "Gate C"]);
      }
    };
    load();
  }, [orgId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const saveGates = async (updated) => {
    setGates(updated);
    await updateDoc(doc(db, "organizations", orgId), { gates: updated });
    showToast("Gates updated");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onSignOut();
  };

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#2d6a4f", color: "var(--text)", padding: "10px 22px", borderRadius: 30, zIndex: 999, fontWeight: 600, fontSize: 13, fontFamily: "'Barlow', sans-serif" }}>{toast.msg}</div>
      )}

      <div style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", fontFamily: "'Cormorant Garamond', serif", marginBottom: 24 }}>Settings</div>

      {/* Org info */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Organization</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--orange)", fontFamily: "'Cormorant Garamond', serif" }}>{orgName}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", marginTop: 4 }}>{orgData.email}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'Barlow', sans-serif", marginTop: 4 }}>Member since {orgData.createdAt ? new Date(orgData.createdAt).toLocaleDateString() : "—"}</div>
      </div>

      {/* Gate names */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Gate / Line Names</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "'Barlow', sans-serif", marginBottom: 16 }}>Rename your 3 check-in gates</div>
        {gates.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {editIdx === i ? (
              <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                onBlur={() => { const u = [...gates]; u[i] = editVal.trim() || g; saveGates(u); setEditIdx(null); }}
                onKeyDown={e => { if (e.key === "Enter") { const u = [...gates]; u[i] = editVal.trim() || g; saveGates(u); setEditIdx(null); } }}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--orange)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none" }} />
            ) : (
              <div style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: "var(--bg)", border: "1px solid rgba(139,69,19,0.2)", fontSize: 13, color: "var(--text)", fontFamily: "'Barlow', sans-serif" }}>{g}</div>
            )}
            <button onClick={() => { setEditIdx(i); setEditVal(g); }} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(79,107,255,0.2)", background: "transparent", color: "var(--orange)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}>Rename</button>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut} style={{
        width: "100%", padding: 13, borderRadius: 10, border: "1px solid rgba(220,50,50,0.3)",
        background: "rgba(220,50,50,0.05)", color: "#ff6b6b", fontWeight: 600, fontSize: 14,
        cursor: "pointer", fontFamily: "'Barlow', sans-serif", letterSpacing: 1, textTransform: "uppercase"
      }}>Sign Out</button>
    </div>
  );
}
