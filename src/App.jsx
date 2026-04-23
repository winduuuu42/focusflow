import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0f0f14", surface: "#16161f", card: "#1c1c28", border: "#2a2a3d",
  accent: "#7c6af7", accentSoft: "#7c6af722", green: "#4ade80",
  red: "#f87171", yellow: "#fbbf24", blue: "#60a5fa",
  text: "#e8e8f0", textMuted: "#7878a0", textFaint: "#3a3a55",
};

const CATEGORIES = {
  work:    { label: "Work",    color: "#60a5fa", emoji: "💼" },
  school:  { label: "School",  color: "#a78bfa", emoji: "📚" },
  family:  { label: "Family",  color: "#fb923c", emoji: "🏠" },
  church:  { label: "Church",  color: "#f9a8d4", emoji: "⛪" },
  health:  { label: "Health",  color: "#4ade80", emoji: "💪" },
  friends: { label: "Friends", color: "#facc15", emoji: "🎉" },
  love:    { label: "Love",    color: "#f87171", emoji: "❤️" },
};

const PRIORITY = {
  high:   { label: "High",   color: "#f87171" },
  medium: { label: "Medium", color: "#fbbf24" },
  low:    { label: "Low",    color: "#4ade80" },
};

const RECUR_OPTIONS = [
  { value: "none",    label: "Does not repeat" },
  { value: "daily",   label: "Every day" },
  { value: "weekly",  label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly",  label: "Every year" },
];

const DAYS_FULL  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS     = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SH  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function genId()     { return Math.random().toString(36).slice(2,9); }
function isSameDay(a,b) { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function formatTime(t) { if(!t)return""; const[h,m]=t.split(":").map(Number); return`${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }
function dateStr(d)  { return d.toISOString().slice(0,10); }

function occursOn(ev, d) {
  const base  = new Date(ev.date + "T00:00:00");
  const check = new Date(dateStr(d) + "T00:00:00");
  if (check < base) return false;
  if (!ev.recur || ev.recur==="none") return isSameDay(base, check);
  if (ev.recur==="daily")   return true;
  if (ev.recur==="weekly")  return base.getDay()===check.getDay();
  if (ev.recur==="monthly") return base.getDate()===check.getDate();
  if (ev.recur==="yearly")  return base.getMonth()===check.getMonth()&&base.getDate()===check.getDate();
  return false;
}

function eventsForDay(events, d) {
  return events.filter(ev=>occursOn(ev,d)).sort((a,b)=>a.time.localeCompare(b.time));
}

// Returns ms until the next occurrence of ev from now
function msUntil(ev) {
  const now = new Date();
  const todayStr = dateStr(now);
  // check today first
  for (let i=0; i<365; i++) {
    const d = new Date(now); d.setDate(now.getDate()+i);
    if (occursOn(ev, d)) {
      const dt = new Date(dateStr(d)+"T"+(ev.time||"00:00")+":00");
      if (dt > now) return dt - now;
      if (i>0) return dt - now; // future day, any time counts
    }
  }
  return Infinity;
}

/* ── Shared UI ── */
function Badge({ color, children }) {
  return <span style={{ background:color+"22",color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700 }}>{children}</span>;
}
function CatPill({ cat }) {
  const c=CATEGORIES[cat]; if(!c)return null;
  return <span style={{ background:c.color+"22",color:c.color,border:`1px solid ${c.color}44`,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700 }}>{c.emoji} {c.label}</span>;
}
function Modal({ open, onClose, title, children }) {
  if(!open)return null;
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"#00000099",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:16,padding:28,width:"100%",maxWidth:480,boxShadow:"0 24px 64px #00000088",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
          <span style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:COLORS.text,fontWeight:700 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:COLORS.textMuted,fontSize:22,cursor:"pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<div style={{ fontSize:11,color:COLORS.textMuted,marginBottom:6,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase" }}>{label}</div>}
      {children}
    </div>
  );
}
function Input({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} style={{ width:"100%",background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"9px 12px",color:COLORS.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",...props.style }}/>
    </Field>
  );
}
function Sel({ label, children, ...props }) {
  return (
    <Field label={label}>
      <select {...props} style={{ width:"100%",background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"9px 12px",color:COLORS.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}>{children}</select>
    </Field>
  );
}
function Btn({ children, onClick, variant="primary", style={} }) {
  const v={
    primary:{ background:COLORS.accent,color:"#fff",border:"none" },
    ghost:  { background:"transparent",color:COLORS.textMuted,border:`1px solid ${COLORS.border}` },
    danger: { background:COLORS.red+"22",color:COLORS.red,border:`1px solid ${COLORS.red}44` },
  };
  return <button onClick={onClick} style={{ borderRadius:8,padding:"9px 18px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",...v[variant],...style }}>{children}</button>;
}
function EventCard({ ev, onClick, onToggle }) {
  const cat=CATEGORIES[ev.category]||CATEGORIES.work;
  return (
    <div onClick={onClick} style={{ background:COLORS.card,border:`1px solid ${COLORS.border}`,borderLeft:`3px solid ${cat.color}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",opacity:ev.done?0.5:1,transition:"opacity 0.2s" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:9 }}>
        <div onClick={e=>{e.stopPropagation();onToggle(ev.id);}} style={{ width:16,height:16,borderRadius:4,border:`2px solid ${ev.done?COLORS.green:COLORS.border}`,background:ev.done?COLORS.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,cursor:"pointer" }}>
          {ev.done&&<span style={{ fontSize:10,color:"#fff" }}>✓</span>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:13,fontWeight:600,textDecoration:ev.done?"line-through":"none",color:ev.done?COLORS.textMuted:COLORS.text,marginBottom:4 }}>{ev.title}</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:5,alignItems:"center" }}>
            {ev.time&&<span style={{ fontSize:11,color:COLORS.textMuted }}>🕐 {formatTime(ev.time)}</span>}
            <CatPill cat={ev.category}/>
            {ev.recur&&ev.recur!=="none"&&<span style={{ fontSize:10,color:COLORS.textMuted }}>🔁 {RECUR_OPTIONS.find(r=>r.value===ev.recur)?.label}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Countdown hook ── */
function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); },[]);
  return now;
}

function formatCountdown(ms) {
  if (ms<=0) return "Now";
  const totalSec = Math.floor(ms/1000);
  const d = Math.floor(totalSec/86400);
  const h = Math.floor((totalSec%86400)/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  if (d>0) return `${d}d ${h}h`;
  if (h>0) return `${h}h ${m}m`;
  if (m>0) return `${m}m ${s}s`;
  return `${s}s`;
}

/* ── Dashboard ── */
function Dashboard({ events, today, onEdit, onToggle, onAdd }) {
  const now = useNow();

  // Next upcoming event (any type, not done, soonest)
  const upcoming = events
    .filter(ev=>!ev.done)
    .map(ev=>({ ev, ms:msUntil(ev) }))
    .filter(({ms})=>ms<Infinity)
    .sort((a,b)=>a.ms-b.ms);

  const nextEvent = upcoming[0]?.ev || null;
  const nextEventMs = upcoming[0]?.ms || 0;

  // Next task specifically
  const nextTask = upcoming.find(({ev})=>ev.type==="task")?.ev || null;
  const nextTaskMs = upcoming.find(({ev})=>ev.type==="task")?.ms || 0;

  // Today's events
  const todayEvs = eventsForDay(events, today).sort((a,b)=>a.time.localeCompare(b.time));
  const todayPending = todayEvs.filter(ev=>!ev.done);
  const todayDone    = todayEvs.filter(ev=>ev.done);

  // Stats
  const allTasks     = events.filter(e=>e.type==="task");
  const doneTasks    = allTasks.filter(t=>t.done);
  const pendingTasks = allTasks.filter(t=>!t.done);
  const highPri      = pendingTasks.filter(t=>t.priority==="high");

  // Category breakdown for today
  const catCounts = {};
  todayEvs.forEach(ev=>{ catCounts[ev.category]=(catCounts[ev.category]||0)+1; });

  const greeting = ()=>{
    const h=now.getHours();
    if(h<12) return "Good morning";
    if(h<17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Hero greeting */}
      <div style={{ background:`linear-gradient(135deg, ${COLORS.accent}22 0%, ${COLORS.card} 60%)`, border:`1px solid ${COLORS.border}`, borderRadius:20, padding:"28px 28px 24px", marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:COLORS.accent+"15", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:10, right:10, width:60, height:60, borderRadius:"50%", background:COLORS.accent+"10", pointerEvents:"none" }}/>
        <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:4 }}>{DAYS_FULL[today.getDay()]}, {MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:6 }}>{greeting()} 👋</div>
        <div style={{ fontSize:14, color:COLORS.textMuted }}>
          You have <span style={{ color:COLORS.accent, fontWeight:700 }}>{todayPending.length}</span> item{todayPending.length!==1?"s":""} left today
          {highPri.length>0 && <> · <span style={{ color:COLORS.red, fontWeight:700 }}>{highPri.length} high priority</span></>}
        </div>
        <div style={{ marginTop:16 }}>
          <Btn onClick={onAdd} style={{ padding:"8px 18px", fontSize:13 }}>+ Quick Add</Btn>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"Today's Items",   value:todayEvs.length,    color:COLORS.accent, icon:"📅" },
          { label:"Pending Tasks",   value:pendingTasks.length, color:COLORS.yellow, icon:"⏳" },
          { label:"Completed",       value:doneTasks.length,    color:COLORS.green,  icon:"✅" },
          { label:"High Priority",   value:highPri.length,      color:COLORS.red,    icon:"🔴" },
        ].map(s=>(
          <div key={s.label} style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:14, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:s.color, fontWeight:700, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:COLORS.textMuted, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Spotlight: Next Up */}
      {nextEvent && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:COLORS.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>⚡ Next Up</div>
          <div onClick={()=>onEdit(nextEvent)} style={{ background:COLORS.card, border:`2px solid ${(CATEGORIES[nextEvent.category]||CATEGORIES.work).color}`, borderRadius:16, padding:"18px 20px", cursor:"pointer", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, right:0, width:80, height:80, borderRadius:"50%", background:(CATEGORIES[nextEvent.category]||CATEGORIES.work).color+"12", transform:"translate(20px,-20px)", pointerEvents:"none" }}/>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                  <CatPill cat={nextEvent.category}/>
                  <Badge color={PRIORITY[nextEvent.priority]?.color}>{PRIORITY[nextEvent.priority]?.label}</Badge>
                  {nextEvent.type==="task"&&<Badge color={COLORS.accent}>Task</Badge>}
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:4 }}>{nextEvent.title}</div>
                <div style={{ fontSize:13, color:COLORS.textMuted }}>
                  {isSameDay(new Date(nextEvent.date+"T00:00:00"), today) ? "Today" : new Date(nextEvent.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                  {nextEvent.time && ` · ${formatTime(nextEvent.time)}`}
                </div>
                {nextEvent.notes&&<div style={{ fontSize:12,color:COLORS.textMuted,marginTop:6 }}>{nextEvent.notes}</div>}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:(CATEGORIES[nextEvent.category]||CATEGORIES.work).color, fontWeight:700, lineHeight:1 }}>{formatCountdown(nextEventMs-((new Date())-now))}</div>
                <div style={{ fontSize:11, color:COLORS.textMuted, marginTop:2 }}>from now</div>
                <div onClick={e=>{e.stopPropagation();onToggle(nextEvent.id);}} style={{ marginTop:10, background:COLORS.green+"22", color:COLORS.green, border:`1px solid ${COLORS.green}44`, borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-block" }}>Mark done ✓</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Task (if different from next event) */}
      {nextTask && nextTask.id !== nextEvent?.id && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:COLORS.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📋 Next Task Due</div>
          <div onClick={()=>onEdit(nextTask)} style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderLeft:`4px solid ${(CATEGORIES[nextTask.category]||CATEGORIES.work).color}`, borderRadius:12, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div>
              <div style={{ fontWeight:600, marginBottom:5 }}>{nextTask.title}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <CatPill cat={nextTask.category}/>
                <Badge color={PRIORITY[nextTask.priority]?.color}>{PRIORITY[nextTask.priority]?.label}</Badge>
                <span style={{ fontSize:12, color:COLORS.textMuted }}>📅 {nextTask.date}{nextTask.time?` · ${formatTime(nextTask.time)}`:""}</span>
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:20, fontWeight:700, color:COLORS.yellow }}>{formatCountdown(nextTaskMs)}</div>
              <div style={{ fontSize:11, color:COLORS.textMuted }}>remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's full schedule */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:COLORS.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📅 Today's Schedule</div>
          {todayPending.length===0
            ? <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"20px", textAlign:"center", color:COLORS.textFaint, fontSize:13 }}>All clear! 🎉</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {todayPending.map(ev=><EventCard key={ev.id} ev={ev} onClick={()=>onEdit(ev)} onToggle={onToggle}/>)}
              </div>
          }
          {todayDone.length>0&&(
            <div style={{ marginTop:8, opacity:0.45 }}>
              <div style={{ fontSize:10, color:COLORS.textMuted, marginBottom:6 }}>Done today ({todayDone.length})</div>
              {todayDone.map(ev=><EventCard key={ev.id} ev={ev} onClick={()=>onEdit(ev)} onToggle={onToggle}/>)}
            </div>
          )}
        </div>

        {/* Upcoming next 5 */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:COLORS.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🔮 Coming Soon</div>
          {upcoming.slice(0,6).filter(({ev})=>!isSameDay(new Date(ev.date+"T00:00:00"),today)).slice(0,5).length===0
            ? <div style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"20px", textAlign:"center", color:COLORS.textFaint, fontSize:13 }}>Nothing upcoming</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {upcoming.filter(({ev})=>{ const d=new Date(); d.setHours(23,59,59); return new Date(ev.date+"T"+(ev.time||"00:00")+":00")>d||ev.recur!=="none"; }).slice(0,5).map(({ev,ms})=>{
                  const cat=CATEGORIES[ev.category]||CATEGORIES.work;
                  const evDate=new Date(ev.date+"T00:00:00");
                  const label=isSameDay(evDate,today)?"Later today":evDate.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                  return (
                    <div key={ev.id} onClick={()=>onEdit(ev)} style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderLeft:`3px solid ${cat.color}`, borderRadius:10, padding:"10px 13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <span style={{ fontSize:10, color:COLORS.textMuted }}>{label}</span>
                          <CatPill cat={ev.category}/>
                        </div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:cat.color, flexShrink:0 }}>{formatCountdown(ms)}</div>
                    </div>
                  );
                })}
              </div>
          }

          {/* Progress ring / summary */}
          {allTasks.length>0&&(
            <div style={{ marginTop:12, background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, color:COLORS.textMuted }}>Task completion</span>
                <span style={{ fontSize:13, fontWeight:700, color:COLORS.accent }}>{Math.round(doneTasks.length/allTasks.length*100)}%</span>
              </div>
              <div style={{ height:6, borderRadius:99, background:COLORS.border }}>
                <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${COLORS.accent},${COLORS.green})`, width:`${doneTasks.length/allTasks.length*100}%`, transition:"width 0.4s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontSize:11, color:COLORS.textMuted }}>{doneTasks.length} done</span>
                <span style={{ fontSize:11, color:COLORS.textMuted }}>{pendingTasks.length} left</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN APP ══════════════ */
export default function App() {
  const today = new Date();
  const [tab,       setTab]       = useState("dashboard");
  const [calView,   setCalView]   = useState("month");
  const [curMonth,  setCurMonth]  = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [selDay,    setSelDay]    = useState(today);
  const [filterCat, setFilterCat] = useState("all");
  const [modal,     setModal]     = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [toastMsg,  setToastMsg]  = useState(null);

  const blank = { title:"",date:dateStr(today),time:"",type:"task",priority:"medium",category:"work",recur:"none",notes:"" };
  const [form, setForm] = useState(blank);

  const [events, setEvents] = useState([
    { id:genId(),title:"Team standup",     date:dateStr(today),time:"09:00",type:"schedule",priority:"medium",category:"work",   recur:"daily",  done:false,notes:"" },
    { id:genId(),title:"Submit assignment", date:dateStr(today),time:"17:00",type:"task",    priority:"high",  category:"school", recur:"none",   done:false,notes:"" },
    { id:genId(),title:"Gym session",       date:dateStr(today),time:"07:00",type:"schedule",priority:"low",   category:"health", recur:"weekly", done:false,notes:"" },
    { id:genId(),title:"Sunday service",    date:dateStr(today),time:"10:00",type:"schedule",priority:"medium",category:"church", recur:"weekly", done:false,notes:"" },
    { id:genId(),title:"Family dinner",     date:dateStr(today),time:"19:00",type:"schedule",priority:"medium",category:"family", recur:"monthly",done:false,notes:"" },
  ]);

  useEffect(()=>{
    const t=setInterval(()=>{
      const now=new Date();
      const nowStr=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      events.forEach(ev=>{ if(occursOn(ev,now)&&ev.time===nowStr&&!ev.done) showToast(`⏰ ${ev.title}`); });
    },30000);
    return()=>clearInterval(t);
  },[events]);

  function showToast(msg){ setToastMsg(msg); setTimeout(()=>setToastMsg(null),4000); }
  function openAdd(date){ setEditItem(null); setForm({...blank,date:date||dateStr(selDay)}); setModal(true); }
  function openEdit(ev){ setEditItem(ev); setForm({title:ev.title,date:ev.date,time:ev.time,type:ev.type,priority:ev.priority,category:ev.category||"work",recur:ev.recur||"none",notes:ev.notes||""}); setModal(true); }
  function saveEvent(){ if(!form.title.trim()||!form.date)return; if(editItem){setEvents(e=>e.map(ev=>ev.id===editItem.id?{...ev,...form}:ev));showToast("✅ Updated!");}else{setEvents(e=>[...e,{id:genId(),...form,done:false}]);showToast("✅ Added!");} setModal(false); }
  function deleteEvent(id){ setEvents(e=>e.filter(ev=>ev.id!==id)); showToast("🗑️ Removed."); setModal(false); }
  function toggleDone(id){ setEvents(e=>e.map(ev=>ev.id===id?{...ev,done:!ev.done}:ev)); }
  function setF(k){ return e=>setForm(f=>({...f,[k]:e.target.value})); }

  const firstDay    = curMonth.getDay();
  const daysInMonth = new Date(curMonth.getFullYear(),curMonth.getMonth()+1,0).getDate();
  const calCells    = [...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const selStr      = dateStr(selDay);
  const selEvents   = eventsForDay(events,selDay).filter(ev=>filterCat==="all"||ev.category===filterCat);
  const agendaDays  = Array.from({length:30},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return d; })
    .map(d=>({ date:d, evs:eventsForDay(events,d).filter(ev=>filterCat==="all"||ev.category===filterCat) }))
    .filter(({evs})=>evs.length>0);
  const allTasks  = events.filter(e=>e.type==="task"&&(filterCat==="all"||e.category===filterCat)).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const pending   = allTasks.filter(t=>!t.done);
  const completed = allTasks.filter(t=>t.done);

  const navS = t=>({ padding:"7px 15px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?COLORS.accent:"transparent",color:tab===t?"#fff":COLORS.textMuted,border:"none",fontFamily:"inherit",transition:"all 0.18s" });
  const viewS= v=>({ padding:"5px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,background:calView===v?COLORS.accent+"33":"transparent",color:calView===v?COLORS.accent:COLORS.textMuted,border:`1px solid ${calView===v?COLORS.accent:COLORS.border}`,fontFamily:"inherit" });

  return (
    <div style={{ minHeight:"100vh",background:COLORS.bg,color:COLORS.text,fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      {toastMsg&&<div style={{ position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:COLORS.accent,color:"#fff",padding:"12px 24px",borderRadius:12,zIndex:200,fontSize:14,fontWeight:600,boxShadow:"0 8px 32px #0008",whiteSpace:"nowrap" }}>{toastMsg}</div>}

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${COLORS.border}`,padding:"0 20px" }}>
        <div style={{ maxWidth:980,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,gap:12 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,whiteSpace:"nowrap" }}><span style={{ color:COLORS.accent }}>◆</span> FocusFlow</div>
          <div style={{ display:"flex",gap:2 }}>
            <button onClick={()=>setTab("dashboard")} style={navS("dashboard")}>🏠 Dashboard</button>
            <button onClick={()=>setTab("calendar")}  style={navS("calendar")}>📅 Calendar</button>
            <button onClick={()=>setTab("tasks")}     style={navS("tasks")}>✅ Tasks</button>
          </div>
          <Btn onClick={()=>openAdd()} style={{ padding:"7px 14px",fontSize:13,whiteSpace:"nowrap" }}>+ Add</Btn>
        </div>
      </div>

      {/* Category filter (hidden on dashboard) */}
      {tab!=="dashboard"&&(
        <div style={{ borderBottom:`1px solid ${COLORS.border}`,padding:"8px 20px",overflowX:"auto" }}>
          <div style={{ maxWidth:980,margin:"0 auto",display:"flex",gap:6,alignItems:"center" }}>
            <button onClick={()=>setFilterCat("all")} style={{ padding:"4px 14px",borderRadius:20,border:`1px solid ${filterCat==="all"?COLORS.accent:COLORS.border}`,background:filterCat==="all"?COLORS.accent+"22":"transparent",color:filterCat==="all"?COLORS.accent:COLORS.textMuted,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit" }}>All</button>
            {Object.entries(CATEGORIES).map(([k,v])=>(
              <button key={k} onClick={()=>setFilterCat(filterCat===k?"all":k)} style={{ padding:"4px 12px",borderRadius:20,border:`1px solid ${filterCat===k?v.color:COLORS.border}`,background:filterCat===k?v.color+"22":"transparent",color:filterCat===k?v.color:COLORS.textMuted,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit" }}>{v.emoji} {v.label}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:980,margin:"0 auto",padding:"24px 20px" }}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <Dashboard events={events} today={today} onEdit={openEdit} onToggle={toggleDone} onAdd={()=>openAdd()}/>
        )}

        {/* ── CALENDAR ── */}
        {tab==="calendar"&&(
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22 }}>{MONTHS[curMonth.getMonth()]} <span style={{ color:COLORS.accent }}>{curMonth.getFullYear()}</span></div>
              <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                <button style={viewS("month")} onClick={()=>setCalView("month")}>Month</button>
                <button style={viewS("agenda")} onClick={()=>setCalView("agenda")}>Agenda</button>
                {calView==="month"&&<>
                  <div style={{ width:1,height:18,background:COLORS.border,margin:"0 2px" }}/>
                  <Btn variant="ghost" onClick={()=>setCurMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{ padding:"5px 10px" }}>‹</Btn>
                  <Btn variant="ghost" onClick={()=>{setCurMonth(new Date(today.getFullYear(),today.getMonth(),1));setSelDay(today);}} style={{ padding:"5px 10px",fontSize:12 }}>Today</Btn>
                  <Btn variant="ghost" onClick={()=>setCurMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{ padding:"5px 10px" }}>›</Btn>
                </>}
              </div>
            </div>

            {calView==="month"&&(
              <div style={{ display:"grid",gridTemplateColumns:"1fr 280px",gap:20 }}>
                <div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4 }}>
                    {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:"center",fontSize:10,fontWeight:700,color:COLORS.textMuted,letterSpacing:1,textTransform:"uppercase",padding:"4px 0" }}>{d}</div>)}
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2 }}>
                    {calCells.map((d,i)=>{
                      const cd=d?new Date(curMonth.getFullYear(),curMonth.getMonth(),d):null;
                      const isToday=cd&&isSameDay(cd,today);
                      const isSel=cd&&isSameDay(cd,selDay);
                      const evs=cd?eventsForDay(events,cd).filter(ev=>filterCat==="all"||ev.category===filterCat):[];
                      return (
                        <div key={i} onClick={()=>cd&&setSelDay(cd)} style={{ minHeight:68,borderRadius:10,padding:6,background:isSel?COLORS.accentSoft:d?COLORS.surface:"transparent",border:isSel?`1.5px solid ${COLORS.accent}`:isToday?`1.5px solid ${COLORS.accent}55`:`1px solid ${COLORS.border}`,cursor:d?"pointer":"default",transition:"all 0.15s" }}>
                          {d&&<>
                            <div style={{ fontSize:12,fontWeight:isToday?700:500,color:isToday?COLORS.accent:COLORS.text,marginBottom:3 }}>{d}</div>
                            <div style={{ display:"flex",flexWrap:"wrap",gap:2 }}>
                              {evs.slice(0,4).map(ev=>{ const cat=CATEGORIES[ev.category]||CATEGORIES.work; return <div key={ev.id} style={{ width:7,height:7,borderRadius:"50%",background:cat.color,opacity:ev.done?0.3:1 }}/>; })}
                              {evs.length>4&&<span style={{ fontSize:9,color:COLORS.textMuted }}>+{evs.length-4}</span>}
                            </div>
                          </>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:14,padding:18,marginBottom:12 }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                      <div>
                        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:17 }}>{DAYS_SHORT[selDay.getDay()]}</div>
                        <div style={{ fontSize:12,color:COLORS.textMuted }}>{MONTHS[selDay.getMonth()]} {selDay.getDate()}</div>
                      </div>
                      <Btn onClick={()=>openAdd(selStr)} style={{ padding:"5px 12px",fontSize:12 }}>+ Add</Btn>
                    </div>
                    {selEvents.length===0
                      ?<div style={{ textAlign:"center",color:COLORS.textFaint,fontSize:13,padding:"20px 0" }}>Nothing scheduled</div>
                      :<div style={{ display:"flex",flexDirection:"column",gap:7 }}>{selEvents.map(ev=><EventCard key={ev.id} ev={ev} onClick={()=>openEdit(ev)} onToggle={toggleDone}/>)}</div>
                    }
                  </div>
                  <div style={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:12,padding:14 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:COLORS.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Categories</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 8px" }}>
                      {Object.entries(CATEGORIES).map(([k,v])=>(
                        <div key={k} style={{ display:"flex",alignItems:"center",gap:6 }}>
                          <div style={{ width:8,height:8,borderRadius:"50%",background:v.color,flexShrink:0 }}/>
                          <span style={{ fontSize:11,color:COLORS.textMuted }}>{v.emoji} {v.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {calView==="agenda"&&(
              <div>
                <div style={{ fontSize:13,color:COLORS.textMuted,marginBottom:18 }}>Upcoming — next 30 days</div>
                {agendaDays.length===0
                  ?<div style={{ textAlign:"center",color:COLORS.textMuted,padding:"60px 0" }}>No upcoming events</div>
                  :agendaDays.map(({date,evs})=>{
                    const isT=isSameDay(date,today);
                    return (
                      <div key={dateStr(date)} style={{ display:"grid",gridTemplateColumns:"72px 1fr",gap:14,marginBottom:22 }}>
                        <div style={{ paddingTop:2 }}>
                          <div style={{ fontSize:10,fontWeight:700,color:isT?COLORS.accent:COLORS.textMuted,textTransform:"uppercase",letterSpacing:0.5 }}>{isT?"Today":DAYS_SHORT[date.getDay()]}</div>
                          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,lineHeight:1,color:isT?COLORS.accent:COLORS.text }}>{date.getDate()}</div>
                          <div style={{ fontSize:10,color:COLORS.textMuted }}>{MONTHS_SH[date.getMonth()]}</div>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                          {evs.map(ev=><EventCard key={ev.id+dateStr(date)} ev={ev} onClick={()=>openEdit(ev)} onToggle={toggleDone}/>)}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}

        {/* ── TASKS ── */}
        {tab==="tasks"&&(
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:24 }}>My Tasks <span style={{ color:COLORS.textMuted,fontSize:15 }}>({pending.length} pending)</span></div>
              <Btn onClick={()=>openAdd()}>+ New Task</Btn>
            </div>
            {allTasks.length>0&&(
              <div style={{ marginBottom:22,background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:12,padding:"14px 18px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
                  <span style={{ fontSize:13,color:COLORS.textMuted }}>Overall progress</span>
                  <span style={{ fontSize:13,fontWeight:700,color:COLORS.accent }}>{Math.round(completed.length/allTasks.length*100)}%</span>
                </div>
                <div style={{ height:6,borderRadius:99,background:COLORS.border }}>
                  <div style={{ height:"100%",borderRadius:99,background:`linear-gradient(90deg,${COLORS.accent},${COLORS.green})`,width:`${completed.length/allTasks.length*100}%`,transition:"width 0.4s" }}/>
                </div>
              </div>
            )}
            {allTasks.length===0&&<div style={{ textAlign:"center",color:COLORS.textMuted,padding:"60px 0" }}><div style={{ fontSize:36,marginBottom:10 }}>📋</div><div>No tasks yet!</div></div>}
            {pending.length>0&&(
              <div style={{ marginBottom:26 }}>
                <div style={{ fontSize:11,fontWeight:700,color:COLORS.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Pending</div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {pending.map(t=>{ const cat=CATEGORIES[t.category]||CATEGORIES.work; return (
                    <div key={t.id} style={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderLeft:`3px solid ${cat.color}`,borderRadius:10,padding:"13px 15px",display:"flex",alignItems:"flex-start",gap:11 }}>
                      <div onClick={()=>toggleDone(t.id)} style={{ width:18,height:18,borderRadius:5,border:`2px solid ${COLORS.border}`,background:"transparent",flexShrink:0,cursor:"pointer",marginTop:2 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600,marginBottom:5 }}>{t.title}</div>
                        <div style={{ display:"flex",flexWrap:"wrap",gap:6,alignItems:"center" }}>
                          <span style={{ fontSize:12,color:COLORS.textMuted }}>📅 {t.date}</span>
                          {t.time&&<span style={{ fontSize:12,color:COLORS.textMuted }}>🕐 {formatTime(t.time)}</span>}
                          <CatPill cat={t.category}/>
                          <Badge color={PRIORITY[t.priority]?.color}>{PRIORITY[t.priority]?.label}</Badge>
                          {t.recur&&t.recur!=="none"&&<span style={{ fontSize:10,color:COLORS.textMuted }}>🔁 {RECUR_OPTIONS.find(r=>r.value===t.recur)?.label}</span>}
                        </div>
                        {t.notes&&<div style={{ fontSize:12,color:COLORS.textMuted,marginTop:5 }}>{t.notes}</div>}
                      </div>
                      <Btn variant="ghost" onClick={()=>openEdit(t)} style={{ padding:"4px 10px",fontSize:12,flexShrink:0 }}>Edit</Btn>
                    </div>
                  );})}
                </div>
              </div>
            )}
            {completed.length>0&&(
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:COLORS.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Completed ✓</div>
                <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                  {completed.map(t=>(
                    <div key={t.id} style={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"11px 15px",display:"flex",alignItems:"center",gap:11,opacity:0.5 }}>
                      <div onClick={()=>toggleDone(t.id)} style={{ width:18,height:18,borderRadius:5,background:COLORS.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer" }}><span style={{ fontSize:11,color:"#fff" }}>✓</span></div>
                      <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                        <span style={{ textDecoration:"line-through",fontSize:14,color:COLORS.textMuted }}>{t.title}</span>
                        <CatPill cat={t.category}/>
                      </div>
                      <Btn variant="danger" onClick={()=>deleteEvent(t.id)} style={{ padding:"4px 10px",fontSize:12 }}>Delete</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editItem?"Edit Item":"Add New Item"}>
        <Input label="Title" value={form.title} onChange={setF("title")} placeholder="What's this about?"/>
        <Input label="Date" type="date" value={form.date} onChange={setF("date")}/>
        <Input label="Time (optional)" type="time" value={form.time} onChange={setF("time")}/>
        <Field label="Category">
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
            {Object.entries(CATEGORIES).map(([k,v])=>(
              <button key={k} onClick={()=>setForm(f=>({...f,category:k}))} style={{ padding:"8px 4px",borderRadius:8,border:`1.5px solid ${form.category===k?v.color:COLORS.border}`,background:form.category===k?v.color+"22":"transparent",color:form.category===k?v.color:COLORS.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"center",fontFamily:"inherit",lineHeight:1.4 }}>
                <div style={{ fontSize:16 }}>{v.emoji}</div>
                <div style={{ fontSize:10,marginTop:2 }}>{v.label}</div>
              </button>
            ))}
          </div>
        </Field>
        <Sel label="Type" value={form.type} onChange={setF("type")}>
          <option value="task">Task / To-Do</option>
          <option value="schedule">Scheduled Event</option>
        </Sel>
        <Sel label="Priority" value={form.priority} onChange={setF("priority")}>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </Sel>
        <Sel label="Repeat" value={form.recur} onChange={setF("recur")}>
          {RECUR_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
        </Sel>
        <Input label="Notes (optional)" value={form.notes} onChange={setF("notes")} placeholder="Any extra details..."/>
        <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:10 }}>
          {editItem&&<Btn variant="danger" onClick={()=>deleteEvent(editItem.id)}>Delete</Btn>}
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancel</Btn>
          <Btn onClick={saveEvent}>{editItem?"Save Changes":"Add Item"}</Btn>
        </div>
      </Modal>
    </div>
  );
}