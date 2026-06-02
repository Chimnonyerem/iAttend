import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx";

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const obj    = new Date(Number(y), Number(m)-1, Number(day));
  return `${days[obj.getDay()]}, ${day} ${months[Number(m)-1]} ${y}`;
};

const avatar = (name = "") => {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? p[0][0] + p[1][0] : (p[0]?.[0] ?? "?");
};

export default function Records({ orgId }) {
  const [dates,        setDates]        = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [records,      setRecords]      = useState([]);
  const [members,      setMembers]      = useState([]);
  const [gates,        setGates]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const aSnap = await getDocs(collection(db, `organizations/${orgId}/attendance`));
        const d = aSnap.docs.map(d => d.id).sort((a,b) => b.localeCompare(a));
        setDates(d);
        if (d.length > 0) setSelectedDate(d[0]);
        const mSnap = await getDocs(collection(db, `organizations/${orgId}/members`));
        setMembers(mSnap.docs.map(d => ({ id:d.id, ...d.data() })));
      } catch {}
      setLoading(false);
    })();
  }, [orgId]);

  useEffect(() => {
    if (!selectedDate) return;
    const unsub = onSnapshot(doc(db, `organizations/${orgId}/attendance`, selectedDate), snap => {
      if (snap.exists()) {
        const r = snap.data().records || [];
        setRecords(r);
        setGates([...new Set(r.map(e => e.gate))]);
      } else setRecords([]);
    });
    return () => unsub();
  }, [selectedDate, orgId]);

  const downloadExcel = () => {
    const present = records.map(r => ({ Name:r.name, "Check-In Time":r.time, Gate:r.gate, Status:"Present" }));
    const absent  = members.filter(m => !records.find(r => r.memberId===m.id))
                           .map(m => ({ Name:m.name, "Check-In Time":"-", Gate:"-", Status:"Absent" }));
    const ws = XLSX.utils.json_to_sheet([...present, ...absent]);
    ws["!cols"] = [{ wch:30 },{ wch:15 },{ wch:12 },{ wch:10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `iAttend_${selectedDate}.xlsx`);
  };

  const absentMembers = members.filter(m => !records.find(r => r.memberId===m.id));
  const rate = members.length ? Math.round((records.length / members.length) * 100) : 0;

  return (
    <div>
      {loading ? (
        <div style={{ textAlign:"center", color:"var(--muted)", padding:60 }}>Loading…</div>
      ) : dates.length === 0 ? (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:48, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ color:"var(--muted)", fontSize:14 }}>No records yet. Start your first attendance session!</div>
        </div>
      ) : (
        <div>
          {/* Date selector — styled to match the theme */}
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              width:"100%", padding:"12px 16px", borderRadius:10,
              border:"1.5px solid var(--border)", background:"var(--surface)",
              color:"var(--text)", fontSize:14, outline:"none",
              marginBottom:20, cursor:"pointer", appearance:"auto",
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500
            }}
          >
            {dates.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
          </select>

          {/* Stats row — orange family only */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {[
              { label:"Present", value:records.length,      bg:"#FFF0EB", valColor:"var(--orange)", border:"#FFDDD0" },
              { label:"Absent",  value:absentMembers.length, bg:"#FFF0EB", valColor:"#C0392B", border:"#FFDDD0" },
              { label:"Rate",    value:`${rate}%`,           bg:"var(--orange-bg)", valColor:"var(--orange)", border:"var(--orange-mid)" },
            ].map(s => (
              <div key={s.label} style={{
                background:s.bg, border:`1px solid ${s.border}`,
                borderRadius:"var(--radius)", padding:"16px 14px", textAlign:"center"
              }}>
                <div style={{ fontSize:28, fontWeight:800, color:s.valColor, fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:1, marginTop:6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Gate breakdown */}
          {gates.length > 0 && (
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              {gates.map(g => (
                <div key={g} style={{
                  flex:1, background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius:10, padding:"10px 14px", textAlign:"center"
                }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"var(--orange)", fontFamily:"'Syne',sans-serif" }}>
                    {records.filter(r => r.gate===g).length}
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{g}</div>
                </div>
              ))}
            </div>
          )}

          {/* Download button */}
          <button onClick={downloadExcel} className="btn-orange" style={{
            width:"100%", padding:13, borderRadius:10, fontSize:13,
            letterSpacing:0.5, textTransform:"uppercase", fontWeight:700,
            marginBottom:22
          }}>
            ⬇ Download Excel (.xlsx)
          </button>

          {/* Present list */}
          {records.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--orange)", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>
                Present
              </div>
              {records.map((r, i) => (
                <div key={i} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"11px 14px", borderRadius:10,
                  background:"#FFF0EB", border:"1px solid #FFDDD0", marginBottom:6
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:32, height:32, borderRadius:"50%",
                      background:"#FFE8DC", display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, fontWeight:800, color:"var(--orange)"
                    }}>{avatar(r.name)}</div>
                    <span style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>{r.time} · {r.gate}</span>
                </div>
              ))}
            </div>
          )}

          {/* Absent list */}
          {absentMembers.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#C0392B", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>
                Absent
              </div>
              {absentMembers.map(m => (
                <div key={m.id} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"11px 14px", borderRadius:10,
                  background:"#FFF5F5", border:"1px solid #FFDDD0", marginBottom:6
                }}>
                  <div style={{
                    width:32, height:32, borderRadius:"50%",
                    background:"#FFE4E4", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:800, color:"#C0392B"
                  }}>{avatar(m.name)}</div>
                  <span style={{ fontSize:14, fontWeight:500, color:"var(--muted)" }}>{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}