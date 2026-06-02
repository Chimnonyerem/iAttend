import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const Card = ({ children, style={} }) => (
  <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:"20px", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", ...style }}>
    {children}
  </div>
);

/* All cards now use orange family — different opacities to distinguish, not different hues */
/* Neutral SVG icons — no emoji, no colour */
const ICONS = {
  members: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  chart:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  check:   "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

function NavIcon({ d, color="#1A1D2E", size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const StatCard = ({ iconKey, label, value, sub, loading, tint }) => {
  const filled = tint === "filled";
  return (
    <div style={{
      background: filled ? "#FF6B35" : "#fff",
      borderRadius:"var(--radius)", padding:"18px 20px",
      border: filled ? "transparent" : "1px solid var(--border)",
      boxShadow:"var(--shadow-sm)",
      display:"flex", alignItems:"center", gap:16
    }}>
      <div style={{
        width:44, height:44, borderRadius:11, flexShrink:0,
        background: filled ? "rgba(255,255,255,0.18)" : "#F2F4F8",
        display:"flex", alignItems:"center", justifyContent:"center"
      }}>
        <NavIcon d={ICONS[iconKey]} color={filled ? "#fff" : "#1A1D2E"} size={20} />
      </div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:4,
          color: filled ? "rgba(255,255,255,0.8)" : "var(--muted)" }}>{label}</div>
        <div style={{ fontSize:30, fontWeight:800, fontFamily:"'Syne',sans-serif", lineHeight:1,
          color: filled ? "#fff" : "var(--orange)" }}>
          {loading ? "—" : value}
        </div>
        {sub && <div style={{ fontSize:11, marginTop:4, color: filled ? "rgba(255,255,255,0.65)" : "var(--muted)" }}>{sub}</div>}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1A1D2E", borderRadius:9, padding:"8px 14px", fontSize:12, color:"#fff" }}>
      <div style={{ color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{label}</div>
      <div style={{ fontWeight:700, color:"#FF6B35" }}>{payload[0].value} present</div>
    </div>
  );
};

export default function Dashboard({ orgId, orgName }) {
  const [stats,   setStats]   = useState({ totalMembers:0, totalSessions:0, avgAttendance:0, todayCount:0 });
  const [chart,   setChart]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const mSnap    = await getDocs(collection(db, `organizations/${orgId}/members`));
        const total    = mSnap.size;
        const aSnap    = await getDocs(collection(db, `organizations/${orgId}/attendance`));
        const sessions = aSnap.docs;
        const today    = new Date().toISOString().split("T")[0];
        let todayCount = 0, totalPresent = 0;
        const chartData = sessions.map(s => {
          const rec = s.data().records || [];
          if (s.id === today) todayCount = rec.length;
          totalPresent += rec.length;
          return { date: s.id.slice(5), present: rec.length };
        }).sort((a,b) => a.date.localeCompare(b.date)).slice(-10);
        setStats({ totalMembers:total, totalSessions:sessions.length, avgAttendance: sessions.length ? Math.round(totalPresent/sessions.length):0, todayCount });
        setChart(chartData);
      } catch {}
      setLoading(false);
    })();
  }, [orgId]);

  const today = new Date().toLocaleDateString("en-GB",{ weekday:"long", day:"numeric", month:"long", year:"numeric" });

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text)", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>
          Hello, {orgName.split(" ")[0]} 👋
        </h2>
        <p style={{ fontSize:13, color:"var(--muted)" }}>{today}</p>
      </div>

      {/* Stat cards — first card filled orange, rest outlined */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard tint="filled"   iconKey="members"  label="Total Members"  value={stats.totalMembers}  loading={loading} />
        <StatCard tint="outlined" iconKey="calendar" label="Sessions Held"  value={stats.totalSessions} loading={loading} />
        <StatCard tint="outlined" iconKey="chart"    label="Avg Attendance" value={stats.avgAttendance} loading={loading} sub="per session" />
        <StatCard tint="outlined" iconKey="check"    label="Today Present"  value={stats.todayCount}    loading={loading} />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Attendance History</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Last {chart.length} sessions</div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart} barSize={20}>
                <XAxis dataKey="date" tick={{ fill:"#8A90A2", fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#8A90A2", fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"var(--orange-bg)" }} />
                <Bar dataKey="present" fill="#FF6B35" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:13 }}>
              {loading ? "Loading…" : "No sessions yet"}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Trend</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Attendance over time</div>
          {chart.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF6B35" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill:"#8A90A2", fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#8A90A2", fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="present" stroke="#FF6B35" strokeWidth={2.5} fill="url(#orangeGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:13 }}>
              {loading ? "Loading…" : "Need 2+ sessions to show trend"}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}