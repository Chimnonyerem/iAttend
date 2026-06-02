import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import CheckIn from "./pages/CheckIn";
import Records from "./pages/Records";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

/* ─── Nav items ─── */
const NAV_MAIN = [
  { id: "dashboard", label: "Dashboard",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "checkin",   label: "Check In",   icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "members",   label: "Members",    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "records",   label: "Records",    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "analytics", label: "Analytics",  icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" },
];
const NAV_TOOLS = [
  { id: "settings",  label: "Settings",   icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

/* ─── Global theme ─── */
const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap');

  :root {
    --orange:      #FF6B35;
    --orange-soft: #FF8C5A;
    --orange-bg:   #FFF0EB;
    --orange-mid:  #FFDDD0;
    --bg:          #F7F8FC;
    --surface:     #FFFFFF;
    --sidebar-bg:  #FFFFFF;
    --text:        #1A1D2E;
    --muted:       #8A90A2;
    --border:      #ECEEF5;
    --shadow-sm:   0 1px 4px rgba(0,0,0,0.06);
    --shadow-md:   0 4px 20px rgba(255,107,53,0.10);
    --shadow-card: 0 2px 12px rgba(0,0,0,0.07);
    --sidebar-w:   230px;
    --radius:      14px;
    --font:        'Plus Jakarta Sans', sans-serif;
    --font-display:'Syne', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: var(--font); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
  input, button, select, textarea { font-family: inherit; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-in { animation: fadeSlide 0.22s ease both; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .loader {
    width: 28px; height: 28px;
    border: 3px solid var(--orange-mid);
    border-top-color: var(--orange);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Sidebar nav item */
  .nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500; color: var(--muted);
    cursor: pointer; transition: all 0.15s; border: none; background: transparent;
    width: 100%; text-align: left; white-space: nowrap;
  }
  .nav-item:hover { background: var(--orange-bg); color: var(--orange); }
  .nav-item.active { background: var(--orange); color: #fff; font-weight: 600; box-shadow: var(--shadow-md); }
  .nav-item.active svg { stroke: #fff; }
  .nav-item svg { flex-shrink: 0; transition: stroke 0.15s; }

  /* card hover */
  .hover-lift { transition: transform 0.15s, box-shadow 0.15s; }
  .hover-lift:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

  /* Orange btn */
  .btn-orange {
    background: var(--orange); color: #fff; border: none;
    border-radius: 9px; padding: 9px 18px; font-weight: 600;
    font-size: 13px; cursor: pointer; transition: opacity 0.15s;
    box-shadow: 0 3px 12px rgba(255,107,53,0.3);
  }
  .btn-orange:hover { opacity: 0.88; }
  .btn-orange:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent; color: var(--muted); border: 1px solid var(--border);
    border-radius: 9px; padding: 9px 18px; font-weight: 500;
    font-size: 13px; cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover { border-color: var(--orange); color: var(--orange); }

  /* form inputs */
  .inp {
    width: 100%; padding: 10px 13px; border-radius: 9px;
    border: 1.5px solid var(--border); background: var(--bg);
    color: var(--text); font-size: 13.5px; outline: none;
    transition: border-color 0.15s;
  }
  .inp:focus { border-color: var(--orange); }
  .inp::placeholder { color: var(--muted); }

  /* badge */
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700;
  }
`;

/* ─── SVG icon helper ─── */
function Icon({ d, size = 18, color = "currentColor", stroke = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
    </svg>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ page, setPage, orgName, onSignOut }) {
  const initials = orgName.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase() || "IA";

  return (
    <aside style={{
      width: "var(--sidebar-w)", flexShrink: 0,
      background: "var(--surface)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0, overflow: "hidden",
      boxShadow: "2px 0 16px rgba(0,0,0,0.04)"
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "var(--orange)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)",
            boxShadow: "0 3px 10px rgba(255,107,53,0.35)"
          }}>i</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: -0.5 }}>Attend</span>
        </div>
      </div>

      {/* Org profile */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: "var(--orange-bg)",
            border: "2px solid var(--orange-mid)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "var(--orange)", flexShrink: 0
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{orgName}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Organization</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", padding: "0 6px", marginBottom: 8 }}>General</div>
        {NAV_MAIN.map(n => (
          <button key={n.id} className={`nav-item${page === n.id ? " active" : ""}`} onClick={() => setPage(n.id)}>
            <Icon d={n.icon} size={17} color={page === n.id ? "#fff" : "var(--muted)"} />
            {n.label}
          </button>
        ))}

        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", padding: "0 6px", margin: "18px 0 8px" }}>Tools</div>
        {NAV_TOOLS.map(n => (
          <button key={n.id} className={`nav-item${page === n.id ? " active" : ""}`} onClick={() => setPage(n.id)}>
            <Icon d={n.icon} size={17} color={page === n.id ? "#fff" : "var(--muted)"} />
            {n.label}
          </button>
        ))}
        <button className="nav-item" onClick={onSignOut}>
          <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={17} color="var(--muted)" />
          Log Out
        </button>
      </nav>
    </aside>
  );
}

/* ─── Top header bar ─── */
function TopBar({ page }) {
  const labels = { dashboard:"Dashboard", checkin:"Check In", members:"Members", records:"Records", analytics:"Analytics", settings:"Settings" };
  return (
    <div style={{
      height: 60, background: "var(--surface)", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", flexShrink: 0, position: "sticky", top: 0, zIndex: 50
    }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>{labels[page]}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: "var(--orange)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={17} color="#fff" />
        </div>
      </div>
    </div>
  );
}

/* ─── App shell ─── */
export default function App() {
  const [user,        setUser]        = useState(null);
  const [orgName,     setOrgName]     = useState("");
  const [page,        setPage]        = useState("dashboard");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "organizations", u.uid));
        setOrgName(snap.data()?.orgName || "Organization");
        setUser(u);
      } else { setUser(null); }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const renderPage = () => {
    const props = { orgId: user?.uid };
    switch (page) {
      case "dashboard": return <Dashboard {...props} orgName={orgName} />;
      case "checkin":   return <CheckIn   {...props} />;
      case "members":   return <Members   {...props} />;
      case "records":   return <Records   {...props} />;
      case "analytics": return <Analytics {...props} />;
      case "settings":  return <Settings  {...props} orgName={orgName} onSignOut={() => setUser(null)} />;
      default:          return <Dashboard {...props} orgName={orgName} />;
    }
  };

  return (
    <>
      <style>{THEME}</style>

      {authLoading && (
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:32, fontWeight:800, color:"var(--orange)", fontFamily:"var(--font-display)", marginBottom:16 }}>iAttend</div>
            <div className="loader" style={{ margin:"0 auto" }} />
          </div>
        </div>
      )}

      {!authLoading && !user && <Landing onAuth={(uid, name) => { setUser({ uid }); setOrgName(name); }} />}

      {!authLoading && user && (
        <div style={{ display:"flex", minHeight:"100vh" }}>
          <Sidebar page={page} setPage={setPage} orgName={orgName} onSignOut={() => setUser(null)} />
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
            <TopBar page={page} />
            <main key={page} className="page-in" style={{ flex:1, padding:"24px", overflowY:"auto", background:"var(--bg)" }}>
              {renderPage()}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
