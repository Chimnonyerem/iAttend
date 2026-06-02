// import React, { useState, useEffect } from "react";
// import { db } from "../firebase";
// import { collection, getDocs } from "firebase/firestore";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

// export default function Analytics({ orgId }) {
//   const [data, setData] = useState([]);
//   const [members, setMembers] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [topAttendees, setTopAttendees] = useState([]);

//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       try {
//         const membersSnap = await getDocs(collection(db, `organizations/${orgId}/members`));
//         const memberList = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
//         setMembers(memberList.length);
//         const attendanceSnap = await getDocs(collection(db, `organizations/${orgId}/attendance`));
//         const sessions = attendanceSnap.docs.sort((a, b) => a.id.localeCompare(b.id));
//         const chartData = sessions.map(s => {
//           const records = s.data().records || [];
//           const [, m, day] = s.id.split("-");
//           return { date: `${day}/${m}`, present: records.length, absent: memberList.length - records.length, rate: memberList.length > 0 ? Math.round((records.length / memberList.length) * 100) : 0 };
//         });
//         setData(chartData.slice(-12));

//         // Top attendees
//         const countMap = {};
//         sessions.forEach(s => {
//           (s.data().records || []).forEach(r => {
//             countMap[r.name] = (countMap[r.name] || 0) + 1;
//           });
//         });
//         const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
//         setTopAttendees(sorted);
//       } catch {}
//       setLoading(false);
//     };
//     load();
//   }, [orgId]);

//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div style={{ background: "var(--text)", border: "1px solid rgba(79,107,255,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Barlow', sans-serif" }}>
//           <div style={{ color: "var(--text)", fontSize: 11, marginBottom: 4 }}>{label}</div>
//           {payload.map((p, i) => (
//             <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}{p.name === "Rate" ? "%" : ""}</div>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div>
//       <div style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", fontFamily: "'Cormorant Garamond', serif", marginBottom: 24 }}>Analytics</div>

//       {loading ? (
//         <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontFamily: "'Barlow', sans-serif" }}>Loading...</div>
//       ) : data.length === 0 ? (
//         <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 40, textAlign: "center" }}>
//           <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
//           <div style={{ color: "var(--muted)", fontFamily: "'Barlow', sans-serif" }}>No data yet. Start taking attendance to see analytics.</div>
//         </div>
//       ) : (
//         <div>
//           {/* Attendance count chart */}
//           <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
//             <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Attendance Per Session</div>
//             <ResponsiveContainer width="100%" height={200}>
//               <BarChart data={data}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
//                 <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Bar dataKey="present" name="Present" fill="var(--orange)" radius={[4,4,0,0]} />
//                 <Bar dataKey="absent" name="Absent" fill="rgba(139,0,0,0.4)" radius={[4,4,0,0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Attendance rate trend */}
//           <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
//             <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Attendance Rate (%)</div>
//             <ResponsiveContainer width="100%" height={180}>
//               <LineChart data={data}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Line type="monotone" dataKey="rate" name="Rate" stroke="var(--orange)" strokeWidth={2} dot={{ fill: "var(--orange)", r: 4 }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Top attendees */}
//           {topAttendees.length > 0 && (
//             <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
//               <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Top Attendees</div>
//               {topAttendees.map(([name, count], i) => (
//                 <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topAttendees.length - 1 ? "1px solid rgba(139,69,19,0.15)" : "none" }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                     <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "rgba(79,107,255,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--orange)" : "var(--muted)", fontFamily: "'Barlow', sans-serif" }}>{i + 1}</div>
//                     <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "'Barlow', sans-serif" }}>{name}</span>
//                   </div>
//                   <span style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)", fontFamily: "'Barlow', sans-serif" }}>{count} sessions</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export default function Analytics({ orgId }) {
  const [data, setData] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topAttendees, setTopAttendees] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const membersSnap = await getDocs(collection(db, `organizations/${orgId}/members`));
        const memberList = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMemberCount(memberList.length);
        const attendanceSnap = await getDocs(collection(db, `organizations/${orgId}/attendance`));
        const sessions = attendanceSnap.docs.sort((a, b) => a.id.localeCompare(b.id));
        const chartData = sessions.map(s => {
          const records = s.data().records || [];
          const [, m, day] = s.id.split("-");
          return { date: `${day}/${m}`, present: records.length, absent: memberList.length - records.length, rate: memberList.length > 0 ? Math.round((records.length / memberList.length) * 100) : 0 };
        });
        setData(chartData.slice(-12));

        // Top attendees
        const countMap = {};
        sessions.forEach(s => {
          (s.data().records || []).forEach(r => {
            countMap[r.name] = (countMap[r.name] || 0) + 1;
          });
        });
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        setTopAttendees(sorted);
      } catch {}
      setLoading(false);
    };
    load();
  }, [orgId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "var(--text)", border: "1px solid rgba(79,107,255,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "'Barlow', sans-serif" }}>
          <div style={{ color: "var(--text)", fontSize: 11, marginBottom: 4 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}{p.name === "Rate" ? "%" : ""}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", fontFamily: "'Cormorant Garamond', serif", marginBottom: 24 }}>Analytics</div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontFamily: "'Barlow', sans-serif" }}>Loading...</div>
      ) : data.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ color: "var(--muted)", fontFamily: "'Barlow', sans-serif" }}>No data yet. Start taking attendance to see analytics.</div>
        </div>
      ) : (
        <div>
          {/* Attendance count chart */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Attendance Per Session</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="present" name="Present" fill="var(--orange)" radius={[4,4,0,0]} />
                <Bar dataKey="absent" name="Absent" fill="rgba(139,0,0,0.4)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance rate trend */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Attendance Rate (%)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Barlow" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" name="Rate" stroke="var(--orange)" strokeWidth={2} dot={{ fill: "var(--orange)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top attendees */}
          {topAttendees.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Top Attendees</div>
              {topAttendees.map(([name, count], i) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topAttendees.length - 1 ? "1px solid rgba(139,69,19,0.15)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "rgba(79,107,255,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--orange)" : "var(--muted)", fontFamily: "'Barlow', sans-serif" }}>{i + 1}</div>
                    <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "'Barlow', sans-serif" }}>{name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)", fontFamily: "'Barlow', sans-serif" }}>{count} sessions</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}