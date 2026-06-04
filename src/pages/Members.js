// import React, { useState, useEffect } from "react";
// import { db } from "../firebase";
// import { collection, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";
// import Papa from "papaparse";
// import * as XLSX from "xlsx";

// const FIELDS = ["name","level","location","phone","email","gender"];
// const LABELS = { name:"Full Name", level:"Level/Class", location:"Location", phone:"Phone", email:"Email", gender:"Gender" };
// const GENDER_COLOR = { male:["#4F6BFF","#EEF1FF"], female:["#E8812A","#FFF0EB"], other:["#0E9F72","#E8FBF4"] };

// function normalizeRow(row) {
//   const lower = {};
//   for (const k of Object.keys(row)) lower[k.toLowerCase().trim()] = row[k];
//   const result = {};
//   for (const f of FIELDS) {
//     result[f] = lower[f] ?? lower[f+"s"] ?? lower["mobile"] ?? lower["address"] ?? lower["class"] ?? lower["zone"] ?? "";
//     result[f] = result[f] ? String(result[f]).trim() : "";
//     // targeted fixes
//     if (f === "phone")    result[f] = lower["phone"] ?? lower["mobile"] ?? lower["tel"] ?? "";
//     if (f === "location") result[f] = lower["location"] ?? lower["address"] ?? lower["zone"] ?? lower["city"] ?? "";
//     if (f === "level")    result[f] = lower["level"] ?? lower["class"] ?? lower["year"] ?? "";
//     if (result[f]) result[f] = String(result[f]).trim();
//   }
//   return result;
// }

// const avatar = (name="") => {
//   const p = name.trim().split(/\s+/);
//   return p.length >= 2 ? p[0][0]+p[1][0] : (p[0]?.[0] ?? "?");
// };

// const Toast = ({ toast }) => toast ? (
//   <div style={{
//     position:"fixed", top:20, right:20, zIndex:9999,
//     background: toast.type==="success" ? "#0E9F72" : toast.type==="error" ? "#E53935" : "var(--orange)",
//     color:"#fff", padding:"11px 20px", borderRadius:10, fontWeight:600, fontSize:13,
//     boxShadow:"0 4px 20px rgba(0,0,0,0.2)", maxWidth:320
//   }}>{toast.msg}</div>
// ) : null;

// export default function Members({ orgId }) {
//   const [members,   setMembers]   = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [toast,     setToast]     = useState(null);
//   const [search,    setSearch]    = useState("");
//   const [showForm,  setShowForm]  = useState(false);
//   const [expanded,  setExpanded]  = useState(null);
//   const [newM,      setNewM]      = useState({ name:"", level:"", location:"", phone:"", email:"", gender:"" });

//   useEffect(() => { loadMembers(); }, [orgId]);

//   const loadMembers = async () => {
//     setLoading(true);
//     try {
//       const snap = await getDocs(collection(db, `organizations/${orgId}/members`));
//       setMembers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
//     } catch {}
//     setLoading(false);
//   };

//   const showToast = (msg, type="success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3500);
//   };

//   const handleFile = async (file) => {
//     if (!file) return;
//     setUploading(true);
//     try {
//       let rows = [];
//       if (file.name.endsWith(".csv")) {
//         const text = await file.text();
//         rows = Papa.parse(text, { header:true, skipEmptyLines:true }).data.map(normalizeRow);
//       } else {
//         const buffer = await file.arrayBuffer();
//         const wb = XLSX.read(buffer);
//         const ws = wb.Sheets[wb.SheetNames[0]];
//         rows = XLSX.utils.sheet_to_json(ws, { defval:"" }).map(normalizeRow);
//       }
//       const valid = rows.filter(r => r.name);
//       if (!valid.length) { showToast("No valid rows found — ensure a 'name' column exists","error"); setUploading(false); return; }
//       const batch = writeBatch(db);
//       valid.forEach(r => {
//         const ref = doc(collection(db, `organizations/${orgId}/members`));
//         batch.set(ref, { ...r, addedAt: new Date().toISOString() });
//       });
//       await batch.commit();
//       showToast(`✓ ${valid.length} members imported successfully`);
//       loadMembers();
//     } catch (e) { showToast("Error: " + e.message, "error"); }
//     setUploading(false);
//   };

//   const addMember = async () => {
//     if (!newM.name.trim()) return;
//     const batch = writeBatch(db);
//     const ref = doc(collection(db, `organizations/${orgId}/members`));
//     batch.set(ref, { ...newM, name:newM.name.trim(), addedAt:new Date().toISOString() });
//     await batch.commit();
//     showToast(`Added ${newM.name.trim().split(" ")[0]}`);
//     setNewM({ name:"", level:"", location:"", phone:"", email:"", gender:"" });
//     setShowForm(false);
//     loadMembers();
//   };

//   const removeMember = async (id, e) => {
//     e.stopPropagation();
//     if (!window.confirm("Remove this member?")) return;
//     await deleteDoc(doc(db, `organizations/${orgId}/members`, id));
//     setMembers(prev => prev.filter(m => m.id !== id));
//     showToast("Member removed", "warn");
//   };

//   const filtered = members.filter(m =>
//     ["name","level","location"].some(f => (m[f]||"").toLowerCase().includes(search.toLowerCase()))
//   );

//   return (
//     <div>
//       <Toast toast={toast} />

//       {/* Header */}
//       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
//         <div>
//           <p style={{ fontSize:13, color:"var(--muted)" }}>{members.length} registered members</p>
//         </div>
//         <div style={{ display:"flex", gap:10 }}>
//           <button className="btn-ghost" onClick={() => document.getElementById("csvInp").click()}>
//             {uploading ? "Importing…" : "⬆ Upload CSV"}
//           </button>
//           <input id="csvInp" type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
//           <button className="btn-orange" onClick={() => setShowForm(!showForm)}>+ Add Member</button>
//         </div>
//       </div>

//       {/* CSV hint card */}
//       <div style={{
//         background:"var(--orange-bg)", border:"1px dashed var(--orange-soft)",
//         borderRadius:"var(--radius)", padding:"12px 18px", marginBottom:18,
//         display:"flex", alignItems:"center", gap:14
//       }}>
//         <span style={{ fontSize:22 }}>📂</span>
//         <div>
//           <div style={{ fontSize:13, fontWeight:600, color:"var(--orange)" }}>CSV / Excel Column Format</div>
//           <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
//             Required: <b>name</b> &nbsp;|&nbsp; Optional: level, location, phone, email, gender
//           </div>
//         </div>
//       </div>

//       {/* Manual add form */}
//       {showForm && (
//         <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:20, marginBottom:18, border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)" }}>
//           <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Add Member Manually</div>
//           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
//             {FIELDS.map(f => f === "gender" ? (
//               <select key={f} value={newM[f]} onChange={e => setNewM(p=>({...p,[f]:e.target.value}))} className="inp">
//                 <option value="">Gender</option>
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//                 <option value="other">Other</option>
//               </select>
//             ) : (
//               <input key={f} placeholder={LABELS[f]} value={newM[f]} className="inp"
//                 onChange={e => setNewM(p=>({...p,[f]:e.target.value}))}
//                 style={{ gridColumn: f==="name" ? "span 2" : undefined }} />
//             ))}
//           </div>
//           <div style={{ display:"flex", gap:8, marginTop:14 }}>
//             <button className="btn-orange" onClick={addMember}>Save</button>
//             <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
//           </div>
//         </div>
//       )}

//       {/* Search */}
//       <input className="inp" placeholder="🔍  Search by name, level, location…"
//         value={search} onChange={e => setSearch(e.target.value)}
//         style={{ marginBottom:16 }} />

//       {/* Table header */}
//       {!loading && filtered.length > 0 && (
//         <div style={{
//           display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",
//           padding:"8px 16px", background:"var(--border)", borderRadius:8,
//           fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase",
//           letterSpacing:0.8, marginBottom:8
//         }}>
//           <span>Name</span><span>Level</span><span>Location</span><span>Phone</span><span style={{ textAlign:"right" }}>Action</span>
//         </div>
//       )}

//       {/* Members */}
//       {loading ? (
//         <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>Loading…</div>
//       ) : filtered.length === 0 ? (
//         <div style={{ textAlign:"center", padding:60, color:"var(--muted)", fontSize:14 }}>
//           {members.length === 0 ? "No members yet — upload a CSV or add manually." : "No results."}
//         </div>
//       ) : (
//         <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
//           {filtered.map(m => {
//             const gc = GENDER_COLOR[(m.gender||"").toLowerCase()] || ["var(--muted)","var(--bg)"];
//             const open = expanded === m.id;
//             return (
//               <div key={m.id} onClick={() => setExpanded(open ? null : m.id)}
//                 style={{
//                   background:"var(--surface)", borderRadius:"var(--radius)",
//                   border: open ? `1.5px solid var(--orange-soft)` : "1px solid var(--border)",
//                   boxShadow: open ? "var(--shadow-md)" : "var(--shadow-sm)",
//                   overflow:"hidden", cursor:"pointer", transition:"all 0.15s"
//                 }}>

//                 {/* Row */}
//                 <div style={{
//                   display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",
//                   alignItems:"center", padding:"13px 16px", gap:8
//                 }}>
//                   {/* Name + avatar */}
//                   <div style={{ display:"flex", alignItems:"center", gap:11 }}>
//                     <div style={{
//                       width:36, height:36, borderRadius:"50%", flexShrink:0,
//                       background:gc[1], border:`2px solid ${gc[0]}33`,
//                       display:"flex", alignItems:"center", justifyContent:"center",
//                       fontSize:12, fontWeight:800, color:gc[0]
//                     }}>{avatar(m.name)}</div>
//                     <div>
//                       <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>{m.name}</div>
//                       {m.email && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{m.email}</div>}
//                     </div>
//                   </div>
//                   <span style={{ fontSize:13, color:"var(--text)" }}>{m.level || "—"}</span>
//                   <span style={{ fontSize:13, color:"var(--text)" }}>{m.location || "—"}</span>
//                   <span style={{ fontSize:13, color:"var(--text)" }}>{m.phone || "—"}</span>
//                   <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }}>
//                     {m.gender && (
//                       <span className="badge" style={{ background:gc[1], color:gc[0], textTransform:"capitalize" }}>{m.gender}</span>
//                     )}
//                     <button onClick={e => removeMember(m.id, e)} style={{
//                       padding:"4px 10px", borderRadius:7, border:"1px solid #FFCCCC",
//                       background:"transparent", color:"#E53935", fontSize:11, cursor:"pointer", fontWeight:600
//                     }}>✕</button>
//                   </div>
//                 </div>

//                 {/* Expanded row */}
//                 {open && (
//                   <div style={{ borderTop:"1px solid var(--border)", padding:"14px 16px", background:"#FAFBFF" }}>
//                     <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
//                       {[["📚","Level",m.level],["📍","Location",m.location],["📞","Phone",m.phone],["✉️","Email",m.email]].map(([icon,label,val]) => (
//                         <div key={label} style={{ background:"var(--surface)", borderRadius:9, padding:"10px 12px", border:"1px solid var(--border)" }}>
//                           <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>{icon} {label}</div>
//                           <div style={{ fontSize:13, color: val ? "var(--text)" : "var(--muted)", fontWeight:500 }}>{val || "—"}</div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, writeBatch, doc, deleteDoc, updateDoc } from "firebase/firestore";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const FIELDS = ["name","level","location","phone","email","gender"];
const GENDER_COLOR = { male:["#4F6BFF","#EEF1FF"], female:["#E8812A","#FFF0EB"] };

function normalizeRow(row) {
  const lower = {};
  for (const k of Object.keys(row)) lower[k.toLowerCase().trim()] = row[k];
  const result = {};
  for (const f of FIELDS) {
    result[f] = lower[f] ?? "";
    if (f === "phone")    result[f] = lower["phone"] ?? lower["mobile"] ?? lower["tel"] ?? "";
    if (f === "location") result[f] = lower["location"] ?? lower["address"] ?? lower["zone"] ?? lower["city"] ?? "";
    if (f === "level")    result[f] = lower["level"] ?? lower["class"] ?? lower["year"] ?? "";
    if (result[f]) result[f] = String(result[f]).trim();
  }
  return result;
}

const avatar = (name="") => {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? p[0][0]+p[1][0] : (p[0]?.[0] ?? "?");
};

const Toast = ({ toast }) => toast ? (
  <div style={{
    position:"fixed", top:20, right:20, zIndex:9999,
    background: toast.type==="success" ? "#0E9F72" : toast.type==="error" ? "#E53935" : "var(--orange)",
    color:"#fff", padding:"11px 20px", borderRadius:10, fontWeight:600, fontSize:13,
    boxShadow:"0 4px 20px rgba(0,0,0,0.2)", maxWidth:320
  }}>{toast.msg}</div>
) : null;

const validateMember = (m) => {
  if (!m.name.trim()) return "Name is required";
  if (m.phone && m.phone.replace(/\D/g,"").length !== 11) return "Phone must be exactly 11 digits";
  if (m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) return "Enter a valid email e.g. name@example.com";
  return null;
};

/* ── Edit Modal ── */
function EditModal({ member, onSave, onClose }) {
  const [form, setForm] = useState({ ...member });
  const [err,  setErr]  = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setErr("");
    const e = validateMember(form);
    if (e) { setErr(e); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"var(--surface)", borderRadius:16, padding:28,
        width:"100%", maxWidth:480, boxShadow:"0 8px 40px rgba(0,0,0,0.18)"
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>Edit Member</div>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:20, cursor:"pointer", color:"var(--muted)" }}>×</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <input className="inp" placeholder="Full Name *" value={form.name}
            onChange={e => setForm(p=>({...p,name:e.target.value}))}
            style={{ gridColumn:"span 2" }} />
          <input className="inp" placeholder="Level / Class" value={form.level||""}
            onChange={e => setForm(p=>({...p,level:e.target.value}))} />
          <input className="inp" placeholder="Location" value={form.location||""}
            onChange={e => setForm(p=>({...p,location:e.target.value}))} />
          <input className="inp" placeholder="Phone (11 digits)" value={form.phone||""}
            maxLength={11}
            onChange={e => { const v=e.target.value.replace(/\D/g,""); setForm(p=>({...p,phone:v})); }} />
          <input className="inp" placeholder="Email" value={form.email||""}
            onChange={e => setForm(p=>({...p,email:e.target.value}))} />
          <select className="inp" value={form.gender||""} onChange={e => setForm(p=>({...p,gender:e.target.value}))}
            style={{ gridColumn:"span 2" }}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {err && (
          <div style={{ background:"#FFF0EB", border:"1px solid #FFDDD0", borderRadius:8, padding:"8px 12px", color:"var(--orange)", fontSize:12, fontWeight:600, marginTop:12 }}>
            ⚠ {err}
          </div>
        )}

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button className="btn-orange" onClick={handleSave} disabled={saving}
            style={{ flex:1, padding:11, fontSize:14 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="btn-ghost" onClick={onClose} style={{ padding:"11px 20px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function Members({ orgId }) {
  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [expanded,  setExpanded]  = useState(null);
  const [formErr,   setFormErr]   = useState("");
  const [editing,   setEditing]   = useState(null); // member being edited
  const [newM,      setNewM]      = useState({ name:"", level:"", location:"", phone:"", email:"", gender:"" });

  useEffect(() => { loadMembers(); }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMembers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `organizations/${orgId}/members`));
      setMembers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch {}
    setLoading(false);
  };

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      let rows = [];
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        rows = Papa.parse(text, { header:true, skipEmptyLines:true }).data.map(normalizeRow);
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval:"" }).map(normalizeRow);
      }
      const valid = rows.filter(r => r.name);
      if (!valid.length) { showToast("No valid rows — ensure a 'name' column exists","error"); setUploading(false); return; }
      const batch = writeBatch(db);
      valid.forEach(r => {
        if (r.gender) r.gender = r.gender.toLowerCase();
        const ref = doc(collection(db, `organizations/${orgId}/members`));
        batch.set(ref, { ...r, addedAt: new Date().toISOString() });
      });
      await batch.commit();
      showToast(`✓ ${valid.length} members imported`);
      loadMembers();
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setUploading(false);
  };

  const addMember = async () => {
    setFormErr("");
    const err = validateMember(newM);
    if (err) { setFormErr(err); return; }
    const batch = writeBatch(db);
    const ref = doc(collection(db, `organizations/${orgId}/members`));
    batch.set(ref, { ...newM, name:newM.name.trim(), addedAt:new Date().toISOString() });
    await batch.commit();
    showToast(`Added ${newM.name.trim().split(" ")[0]}`);
    setNewM({ name:"", level:"", location:"", phone:"", email:"", gender:"" });
    setFormErr("");
    setShowForm(false);
    loadMembers();
  };

  const saveMemberEdit = async (updated) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, `organizations/${orgId}/members`, id), data);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    setEditing(null);
    showToast(`✓ ${updated.name.split(" ")[0]} updated`);
  };

  const removeMember = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this member?")) return;
    await deleteDoc(doc(db, `organizations/${orgId}/members`, id));
    setMembers(prev => prev.filter(m => m.id !== id));
    showToast("Member removed", "warn");
  };

  const filtered = members.filter(m =>
    ["name","level","location"].some(f => (m[f]||"").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <Toast toast={toast} />

      {/* Edit modal */}
      {editing && (
        <EditModal
          member={editing}
          onSave={saveMemberEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <p style={{ fontSize:13, color:"var(--muted)" }}>{members.length} registered members</p>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-ghost" onClick={() => document.getElementById("csvInp").click()}>
            {uploading ? "Importing…" : "⬆ Upload CSV"}
          </button>
          <input id="csvInp" type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
          <button className="btn-orange" onClick={() => { setShowForm(!showForm); setFormErr(""); }}>+ Add Member</button>
        </div>
      </div>

      {/* CSV hint */}
      <div style={{
        background:"var(--orange-bg)", border:"1px dashed var(--orange-soft)",
        borderRadius:"var(--radius)", padding:"12px 18px", marginBottom:18,
        display:"flex", alignItems:"center", gap:14
      }}>
        <span style={{ fontSize:22 }}>📂</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--orange)" }}>CSV / Excel Column Format</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
            Required: <b>name</b> &nbsp;|&nbsp; Optional: level, location, phone (11 digits), email, gender (male/female)
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:20, marginBottom:18, border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)" }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Add Member Manually</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <input placeholder="Full Name *" value={newM.name} className="inp"
              onChange={e => setNewM(p=>({...p,name:e.target.value}))}
              style={{ gridColumn:"span 2" }} />
            <input placeholder="Level / Class" value={newM.level} className="inp"
              onChange={e => setNewM(p=>({...p,level:e.target.value}))} />
            <input placeholder="Location" value={newM.location} className="inp"
              onChange={e => setNewM(p=>({...p,location:e.target.value}))} />
            <input placeholder="Phone (11 digits)" value={newM.phone} className="inp"
              maxLength={11}
              onChange={e => { const v=e.target.value.replace(/\D/g,""); setNewM(p=>({...p,phone:v})); }} />
            <input placeholder="Email (e.g. name@example.com)" value={newM.email} className="inp"
              onChange={e => setNewM(p=>({...p,email:e.target.value}))} />
            <select value={newM.gender} onChange={e => setNewM(p=>({...p,gender:e.target.value}))} className="inp" style={{ gridColumn:"span 2" }}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          {formErr && (
            <div style={{ background:"#FFF0EB", border:"1px solid #FFDDD0", borderRadius:8, padding:"8px 12px", color:"var(--orange)", fontSize:12, fontWeight:600, marginTop:10 }}>
              ⚠ {formErr}
            </div>
          )}
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <button className="btn-orange" onClick={addMember}>Save</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setFormErr(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <input className="inp" placeholder="🔍  Search by name, level, location…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom:16 }} />

      {/* Table header */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 100px",
          padding:"8px 16px", background:"var(--border)", borderRadius:8,
          fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase",
          letterSpacing:0.8, marginBottom:8
        }}>
          <span>Name</span><span>Level</span><span>Location</span><span>Phone</span><span style={{ textAlign:"right" }}>Actions</span>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--muted)", fontSize:14 }}>
          {members.length === 0 ? "No members yet — upload a CSV or add manually." : "No results."}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {filtered.map(m => {
            const gc   = GENDER_COLOR[(m.gender||"").toLowerCase()] || ["var(--muted)","var(--bg)"];
            const open = expanded === m.id;
            return (
              <div key={m.id}
                style={{
                  background:"var(--surface)", borderRadius:"var(--radius)",
                  border: open ? "1.5px solid var(--orange-soft)" : "1px solid var(--border)",
                  boxShadow: open ? "var(--shadow-md)" : "var(--shadow-sm)",
                  overflow:"hidden", transition:"all 0.15s"
                }}>

                {/* Row */}
                <div style={{
                  display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 100px",
                  alignItems:"center", padding:"13px 16px", gap:8,
                  cursor:"pointer"
                }} onClick={() => setExpanded(open ? null : m.id)}>

                  <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                    <div style={{
                      width:36, height:36, borderRadius:"50%", flexShrink:0,
                      background:gc[1], border:`2px solid ${gc[0]}33`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, fontWeight:800, color:gc[0]
                    }}>{avatar(m.name)}</div>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text)" }}>{m.name}</div>
                      {m.email && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{m.email}</div>}
                    </div>
                  </div>
                  <span style={{ fontSize:13, color:"var(--text)" }}>{m.level || "—"}</span>
                  <span style={{ fontSize:13, color:"var(--text)" }}>{m.location || "—"}</span>
                  <span style={{ fontSize:13, color:"var(--text)" }}>{m.phone || "—"}</span>

                  {/* Action buttons */}
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setEditing(m)}
                      style={{
                        padding:"4px 10px", borderRadius:7,
                        border:"1px solid var(--border)", background:"transparent",
                        color:"var(--orange)", fontSize:11, cursor:"pointer", fontWeight:600
                      }}>✏ Edit</button>
                    <button
                      onClick={e => removeMember(m.id, e)}
                      style={{
                        padding:"4px 10px", borderRadius:7,
                        border:"1px solid #FFCCCC", background:"transparent",
                        color:"#E53935", fontSize:11, cursor:"pointer", fontWeight:600
                      }}>✕</button>
                  </div>
                </div>

                {/* Expanded details */}
                {open && (
                  <div style={{ borderTop:"1px solid var(--border)", padding:"14px 16px", background:"#FAFBFF" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                      {[["📚","Level",m.level],["📍","Location",m.location],["📞","Phone",m.phone],["✉️","Email",m.email]].map(([icon,label,val]) => (
                        <div key={label} style={{ background:"var(--surface)", borderRadius:9, padding:"10px 12px", border:"1px solid var(--border)" }}>
                          <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>{icon} {label}</div>
                          <div style={{ fontSize:13, color: val ? "var(--text)" : "var(--muted)", fontWeight:500 }}>{val || "—"}</div>
                        </div>
                      ))}
                    </div>
                    {m.gender && (
                      <span className="badge" style={{ background:gc[1], color:gc[0], textTransform:"capitalize" }}>{m.gender}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}