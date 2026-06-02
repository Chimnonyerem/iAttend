import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Landing({ onAuth }) {
  const [mode,    setMode]    = useState("login");
  const [form,    setForm]    = useState({ orgName:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handle = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    if (mode === "signup" && !form.orgName) { setError("Organization name is required"); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "organizations", cred.user.uid), {
          orgName: form.orgName, email: form.email,
          gates: ["Gate A","Gate B","Gate C"],
          createdAt: new Date().toISOString()
        });
        onAuth(cred.user.uid, form.orgName);
      } else {
        const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
        const snap = await getDoc(doc(db, "organizations", cred.user.uid));
        onAuth(cred.user.uid, snap.data()?.orgName || "Organization");
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ","").replace(/\(.*\)/,"").trim());
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", fontFamily:"'Plus Jakarta Sans',sans-serif",
      background:"linear-gradient(135deg, #FFF5F2 0%, #FFFFFF 60%, #FFF0EB 100%)"
    }}>
      {/* Left panel */}
      <div style={{
        flex:"0 0 46%", background:"var(--orange)", display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"60px 56px", position:"relative", overflow:"hidden"
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
        <div style={{ position:"absolute", bottom:-60, left:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:34, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif", marginBottom:8 }}>iAttend</div>
          <div style={{ width:40, height:3, background:"rgba(255,255,255,0.5)", borderRadius:2, marginBottom:32 }} />
          <h2 style={{ fontSize:40, fontWeight:700, color:"#fff", lineHeight:1.2, marginBottom:20, fontFamily:"'Syne',sans-serif" }}>
            Track your<br/>attendance<br/>with ease.
          </h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.75)", lineHeight:1.7 }}>
            Upload your member list, start a session,<br/>and mark attendance — all in one place.
          </p>

          <div style={{ marginTop:48, display:"flex", flexDirection:"column", gap:14 }}>
            {["📂  Upload CSV / Excel member lists","✅  Multi-gate check-in sessions","📊  Analytics & attendance trends","⬇️  Export records anytime"].map(f => (
              <div key={f} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:"rgba(255,255,255,0.85)", fontWeight:500 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 40px" }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:"var(--text)", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ fontSize:14, color:"var(--muted)", marginBottom:30 }}>
            {mode === "login" ? "Sign in to your organization" : "Register your organization"}
          </p>

          {/* Toggle */}
          <div style={{ display:"flex", background:"#F2F4F8", borderRadius:10, padding:4, marginBottom:26, width:"fit-content", gap:4 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                padding:"7px 22px", borderRadius:7, border:"none", cursor:"pointer",
                background: mode===m ? "#fff" : "transparent",
                color: mode===m ? "var(--orange)" : "var(--muted)",
                fontWeight: mode===m ? 700 : 500, fontSize:13,
                boxShadow: mode===m ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                transition:"all 0.15s"
              }}>{m==="login" ? "Sign In" : "Sign Up"}</button>
            ))}
          </div>

          {mode==="signup" && (
            <div style={{ marginBottom:14 }}>
              <label style={lbSt}>Organization Name</label>
              <input className="inp" placeholder="e.g. NIFES FUHSO, Rotary Club…"
                value={form.orgName} onChange={e => setForm({...form, orgName:e.target.value})} />
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={lbSt}>Email Address</label>
            <input className="inp" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={lbSt}>Password</label>
            <input className="inp" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password:e.target.value})}
              onKeyDown={e => e.key==="Enter" && handle()} />
          </div>

          {error && (
            <div style={{ background:"#FFF0EB", border:"1px solid #FFDDD0", borderRadius:9, padding:"10px 14px", color:"var(--orange)", fontSize:13, marginBottom:18, fontWeight:500 }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn-orange" disabled={loading} onClick={handle}
            style={{ width:"100%", padding:13, fontSize:14, borderRadius:11 }}>
            {loading ? "Please wait…" : mode==="login" ? "Sign In →" : "Create Account →"}
          </button>

          <p style={{ textAlign:"center", marginTop:18, fontSize:13, color:"var(--muted)" }}>
            {mode==="login" ? "No account? " : "Already have one? "}
            <span style={{ color:"var(--orange)", fontWeight:700, cursor:"pointer" }} onClick={() => { setMode(mode==="login"?"signup":"login"); setError(""); }}>
              {mode==="login" ? "Sign Up" : "Sign In"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const lbSt = { display:"block", fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:7, letterSpacing:0.2 };
