import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, getDocs } from "firebase/firestore";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate  = (d) => {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const obj = new Date(Number(y),Number(m)-1,Number(day));
  return `${dNames[obj.getDay()]}, ${day} ${months[Number(m)-1]} ${y}`;
};
const avatar = (name="") => {
  const p = name.trim().split(/\s+/);
  return p.length>=2 ? p[0][0]+p[1][0] : (p[0]?.[0]??"?");
};

const Toast = ({ toast }) => toast ? (
  <div style={{
    position:"fixed", top:20, right:20, zIndex:9999,
    background: toast.type==="success" ? "#0E9F72" : toast.type==="error" ? "#E53935" : "var(--orange)",
    color:"#fff", padding:"11px 20px", borderRadius:10, fontWeight:600, fontSize:13,
    boxShadow:"0 4px 20px rgba(0,0,0,0.2)"
  }}>{toast.msg}</div>
) : null;

export default function CheckIn({ orgId }) {
  const [members,      setMembers]      = useState([]);
  const [gates,        setGates]        = useState(["Gate A","Gate B","Gate C"]);
  const [session,      setSession]      = useState(null);
  const [records,      setRecords]      = useState([]);
  const [search,       setSearch]       = useState("");
  const [newDate,      setNewDate]      = useState(todayStr());
  const [selectedGate, setSelectedGate] = useState(null);
  const [toast,        setToast]        = useState(null);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    (async () => {
      const snap    = await getDocs(collection(db, `organizations/${orgId}/members`));
      const orgSnap = await getDoc(doc(db, "organizations", orgId));
      setMembers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      if (orgSnap.exists()) setGates(orgSnap.data().gates || ["Gate A","Gate B","Gate C"]);
    })();
  }, [orgId]);

  useEffect(() => {
    if (!session) return;
    const unsub = onSnapshot(doc(db, `organizations/${orgId}/attendance`, session.date), snap => {
      setRecords(snap.exists() ? (snap.data().records||[]) : []);
    });
    return () => unsub();
  }, [session, orgId]);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const startSession = async () => {
    if (!newDate)      { showToast("Select a date","error"); return; }
    if (!selectedGate) { showToast("Select a gate","error"); return; }
    setLoading(true);
    const ref = doc(db, `organizations/${orgId}/attendance`, newDate);
    if (!(await getDoc(ref)).exists()) await setDoc(ref, { records:[], date:newDate });
    setSession({ date:newDate, gate:selectedGate });
    setSearch("");
    setLoading(false);
  };

  const markPresent = async (member) => {
    const ref = doc(db, `organizations/${orgId}/attendance`, session.date);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? (snap.data().records||[]) : [];
    if (existing.find(e => e.memberId===member.id)) { showToast(`${member.name.split(" ")[0]} already present!`,"warn"); return; }
    const entry = { memberId:member.id, name:member.name, time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}), gate:session.gate };
    await updateDoc(ref, { records:arrayUnion(entry) });
    showToast(`✓ ${member.name.split(" ")[0]} marked present`);
  };

  const undoPresent = async (member) => {
    const ref = doc(db, `organizations/${orgId}/attendance`, session.date);
    const snap = await getDoc(ref);
    const entry = (snap.data()?.records||[]).find(e => e.memberId===member.id);
    if (entry) { await updateDoc(ref, { records:arrayRemove(entry) }); showToast(`Removed ${member.name.split(" ")[0]}`,"warn"); }
  };

  const checkedIds = new Set(records.map(r => r.memberId));
  const filtered   = members.filter(m => (m.name||"").toLowerCase().includes(search.toLowerCase()));
  const presentCount = records.length;
  const pct = members.length ? Math.round((presentCount/members.length)*100) : 0;

  return (
    <div>
      <Toast toast={toast} />

      {!session ? (
        /* ── Setup ── */
        <div style={{ maxWidth:520 }}>
          <p style={{ fontSize:13, color:"var(--muted)", marginBottom:24 }}>Choose a date and your gate to begin marking attendance.</p>

          <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:24, border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)" }}>
            <label style={lbSt}>Session Date</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="inp" style={{ marginBottom:20 }} />

            <label style={lbSt}>Your Gate</label>
            <div style={{ display:"flex", gap:10, marginBottom:28, flexWrap:"wrap" }}>
              {gates.map(g => (
                <button key={g} onClick={() => setSelectedGate(g)} style={{
                  padding:"9px 22px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600,
                  border: selectedGate===g ? "2px solid var(--orange)" : "1.5px solid var(--border)",
                  background: selectedGate===g ? "var(--orange)" : "var(--surface)",
                  color: selectedGate===g ? "#fff" : "var(--muted)",
                  transition:"all 0.15s",
                  boxShadow: selectedGate===g ? "0 3px 12px rgba(255,107,53,0.3)" : "none"
                }}>{g}</button>
              ))}
            </div>

            <button className="btn-orange" onClick={startSession} disabled={loading} style={{ width:"100%", padding:13, fontSize:14, borderRadius:11 }}>
              {loading ? "Starting…" : "Begin Check-In →"}
            </button>
          </div>
        </div>

      ) : (
        /* ── Active session ── */
        <div>
          {/* Session bar */}
          <div style={{
            background:"var(--surface)", borderRadius:"var(--radius)", padding:"16px 20px",
            marginBottom:20, border:"1px solid var(--border)", display:"flex",
            justifyContent:"space-between", alignItems:"center", boxShadow:"var(--shadow-sm)"
          }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#0E9F72", display:"inline-block" }} />
                <span style={{ fontSize:12, fontWeight:700, color:"#0E9F72", textTransform:"uppercase", letterSpacing:1 }}>Live · {session.gate}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{fmtDate(session.date)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div>
                <span style={{ fontSize:32, fontWeight:800, color:"var(--orange)", fontFamily:"'Syne',sans-serif" }}>{presentCount}</span>
                <span style={{ fontSize:15, color:"var(--muted)" }}> / {members.length}</span>
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{pct}% present</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background:"var(--border)", borderRadius:99, height:6, marginBottom:20, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, background:"var(--orange)", height:"100%", borderRadius:99, transition:"width 0.4s ease" }} />
          </div>

          {/* Search */}
          <input className="inp" placeholder="🔍  Search member…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:14 }} />

          {/* Members grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
            {filtered.map(member => {
              const checked = checkedIds.has(member.id);
              const record  = records.find(r => r.memberId===member.id);
              return (
                <div key={member.id} style={{
                  background: checked ? "#EDFFF5" : "var(--surface)",
                  borderRadius:"var(--radius)",
                  border: checked ? "1.5px solid #A7F0C4" : "1px solid var(--border)",
                  padding:"14px 16px",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  boxShadow:"var(--shadow-sm)", transition:"all 0.15s"
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <div style={{
                      width:38, height:38, borderRadius:"50%", flexShrink:0,
                      background: checked ? "#D1FAE5" : "var(--orange-bg)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, fontWeight:800,
                      color: checked ? "#0E9F72" : "var(--orange)"
                    }}>{avatar(member.name)}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{member.name}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>
                        {checked ? `✓ ${record.time} · ${record.gate}` : [member.level,member.location].filter(Boolean).join(" · ") || ""}
                      </div>
                    </div>
                  </div>
                  {checked ? (
                    <button onClick={() => undoPresent(member)} className="btn-ghost" style={{ padding:"5px 11px", fontSize:11, flexShrink:0 }}>Undo</button>
                  ) : (
                    <button onClick={() => markPresent(member)} className="btn-orange" style={{ padding:"6px 14px", fontSize:11, flexShrink:0 }}>Present</button>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={() => { setSession(null); setRecords([]); }} style={{
            marginTop:24, padding:"10px 24px", borderRadius:9,
            border:"1px solid #FFCCCC", background:"transparent",
            color:"#E53935", fontWeight:600, fontSize:13, cursor:"pointer"
          }}>End Session</button>
        </div>
      )}
    </div>
  );
}

const lbSt = { display:"block", fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:8, letterSpacing:0.2 };
